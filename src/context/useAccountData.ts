import { useEffect, useRef, useState } from 'react';
import { auth, db } from '../lib/firebase';
import { withTimeout } from '../lib/async';
import { AccountDataStore, mergeData, normalizeSnapshot, type PendingData, type UserDataSnapshot } from '../lib/accountData';
import { loadAccountSnapshot, commitAccountData } from '../lib/firebaseAccountData';
import { INITIAL_RECIPES } from '../data/seedRecipes';

export const emptyAccount = (): UserDataSnapshot => ({
  schemaVersion: 1, recipes: INITIAL_RECIPES, favorites: [], shoppingList: [], deletedRecipeCount: 0,
  mealPlan: ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'].map(day => ({ day, meals: {} })),
});

export function useAccountData(uid?: string) {
  const store = useRef<AccountDataStore | null>(null);
  const [view, setView] = useState({ uid: '', data: emptyAccount(), status: 'local' as 'local' | 'syncing' | 'synced' | 'error', error: '' });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let cancelled = false;
    store.current?.dispose();
    store.current = null;
    setLoading(!!uid);
    setLoadError('');
    setView({ uid: '', data: emptyAccount(), status: 'local', error: '' });
    if (!uid) return;
    const key = `tabkhat_pending_v1_${uid}`;
    const hydrate = async () => {
      try {
        const firestore = db;
        if (!firestore) throw new Error('خدمة حفظ البيانات غير متاحة.');
        // Never interpret an offline/cache miss or a failed read as an empty account.
        const remote = await withTimeout(loadAccountSnapshot(firestore, uid, emptyAccount()), 12000);
        let local = remote;
        // Only our explicit outbox contains a trustworthy merge baseline.
        // Old global/device caches are preserved but never assigned to a new account.
        const raw = localStorage.getItem(key);
        if (raw) {
          const pending = JSON.parse(raw) as PendingData;
          local = mergeData(normalizeSnapshot(pending.base, emptyAccount()), normalizeSnapshot(pending.local, emptyAccount()), remote);
        }
        if (cancelled) return;
        const session = new AccountDataStore(remote, local,
          pending => localStorage.setItem(key, JSON.stringify(pending)),
          async pending => {
            if (auth.currentUser?.uid !== uid) throw new Error('تغير الحساب؛ لم نحفظ البيانات في حساب آخر.');
            return commitAccountData(firestore, uid, pending, remote);
          });
        session.onChange = () => { if (!cancelled) setView({ uid, data: session.data, status: session.status, error: session.error }); };
        store.current = session;
        session.onChange();
        setLoading(false);
        if (session.dirty) void session.flush().catch(() => {});
      } catch (error) {
        if (cancelled) return;
        setLoadError(error instanceof Error && error.name !== 'FirebaseError' ? error.message : 'تعذر تحميل بيانات حسابك من السحابة. لم نمسح أو نستبدل أي بيانات. تحقق من الإنترنت وأعد المحاولة.');
        setLoading(false);
      }
    };
    void hydrate();
    return () => { cancelled = true; store.current?.dispose(); store.current = null; };
  }, [uid, retry]);

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (store.current?.dirty) { event.preventDefault(); event.returnValue = ''; } };
    const resume = () => { if (store.current?.dirty) void store.current.flush().catch(() => {}); };
    window.addEventListener('beforeunload', warn);
    window.addEventListener('online', resume);
    return () => { window.removeEventListener('beforeunload', warn); window.removeEventListener('online', resume); };
  }, []);

  function setter<K extends keyof UserDataSnapshot>(key: K) {
    return (action: UserDataSnapshot[K] | ((previous: UserDataSnapshot[K]) => UserDataSnapshot[K])) => {
      if (!store.current || auth.currentUser?.uid !== uid) throw new Error('انتظر تحميل بيانات حسابك قبل التعديل.');
      store.current.change(key, action);
    };
  }
  const exportBackup = () => {
    const pending = store.current ? { base: store.current.base, local: store.current.data } : JSON.parse(localStorage.getItem(`tabkhat_pending_v1_${uid}`) || 'null');
    const blob = new Blob([JSON.stringify({ accountId: uid, exportedAt: new Date().toISOString(), pending }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a'); link.href = url; link.download = 'tabkhat-account-backup.json'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return {
    data: view.uid === uid ? view.data : emptyAccount(),
    dataSyncStatus: view.status, dataSyncError: view.error,
    isUserDataLoading: loading || (!!uid && view.uid !== uid && !loadError), userDataError: loadError,
    retryUserData: () => setRetry(v => v + 1), exportBackup,
    flushPendingChanges: async () => { if (!store.current) throw new Error('بيانات الحساب غير جاهزة.'); await withTimeout(store.current.flush(), 20000); },
    setRecipes: setter('recipes'), setFavorites: setter('favorites'), setMealPlan: setter('mealPlan'),
    setShoppingList: setter('shoppingList'), setDeletedRecipeCount: setter('deletedRecipeCount'),
  };
}
