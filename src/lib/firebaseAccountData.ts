import { doc, getDocFromServer, runTransaction, serverTimestamp, type Firestore } from 'firebase/firestore';
import { equalData, mergeData, normalizeSnapshot, type PendingData, type UserDataSnapshot } from './accountData';

export async function loadAccountSnapshot(firestore: Firestore, uid: string, defaults: UserDataSnapshot) {
  const remote = await getDocFromServer(doc(firestore, 'userData', uid));
  if (remote.exists()) return normalizeSnapshot(remote.data(), defaults);
  const legacy = await Promise.all(['favorites', 'mealPlans', 'shoppingList'].map(path => getDocFromServer(doc(firestore, path, uid))));
  return normalizeSnapshot({ ...defaults,
    favorites: legacy[0].exists() ? legacy[0].data().ids ?? [] : [],
    mealPlan: legacy[1].exists() ? legacy[1].data().plan ?? defaults.mealPlan : defaults.mealPlan,
    shoppingList: legacy[2].exists() ? legacy[2].data().items ?? [] : [],
  }, defaults);
}

export async function commitAccountData(firestore: Firestore, uid: string, pending: PendingData, initial: UserDataSnapshot) {
  const ref = doc(firestore, 'userData', uid);
  return runTransaction(firestore, async tx => {
    const latest = await tx.get(ref);
    const current = latest.exists() ? normalizeSnapshot(latest.data(), initial) : initial;
    const merged = mergeData(pending.base, pending.local, current) as UserDataSnapshot;
    if (new TextEncoder().encode(JSON.stringify(merged)).byteLength > 900_000) throw new Error('account-size-limit');
    if (!equalData(current, merged) || !latest.exists()) tx.set(ref, { ...merged, updatedAt: serverTimestamp() });
    return merged;
  });
}
