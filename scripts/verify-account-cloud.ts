// Explicit, disposable test accounts only. Never reads or changes real users.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, deleteUser } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, deleteDoc, setDoc, terminate } from 'firebase/firestore';
import config from '../firebase-applet-config.json';
import { commitAccountData, loadAccountSnapshot } from '../src/lib/firebaseAccountData';
import { DataConflictError, type UserDataSnapshot } from '../src/lib/accountData';
import { verifyAccount } from '../server/verifyAccount';

if (process.env.TABKHAT_LIVE_TEST !== '1') throw new Error('Set TABKHAT_LIVE_TEST=1 to create disposable test accounts.');
const apps = [0, 1, 2].map(i => initializeApp(config, `verify-${randomUUID()}-${i}`));
const auths = apps.map(getAuth);
const databases = apps.map(app => getFirestore(app, config.firestoreDatabaseId));
const emailA = `tabkhat-test-${randomUUID()}@example.com`;
const emailB = `tabkhat-test-${randomUUID()}@example.com`;
const password = randomUUID() + 'aA9!';
const testUids: string[] = [];
const base: UserDataSnapshot = { schemaVersion: 1, recipes: [], favorites: [], shoppingList: [], mealPlan: [], deletedRecipeCount: 0 };
try {
  const a = await createUserWithEmailAndPassword(auths[0], emailA, password);
  testUids.push(a.user.uid);
  await setDoc(doc(databases[0], 'users', a.user.uid), { uid: a.user.uid, displayName: 'اختبار حفظ طبخات' });
  console.log('PASS email registration');
  const token = await a.user.getIdToken();
  assert.equal(await verifyAccount(`Bearer ${token}`), a.user.uid);
  assert.equal(await verifyAccount('Bearer not-a-valid-token'), null);
  console.log('PASS API accepts a valid Firebase session and rejects a forged token');
  if (process.env.TABKHAT_TEST_API === '1') {
    const denied = await fetch('https://tabkhat.vercel.app/api/parse-recipe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: '3 كاسات ماء' }) });
    assert.equal(denied.status, 401);
    const response = await fetch('https://tabkhat.vercel.app/api/parse-recipe', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ text: 'طبخت كبسة دجاج حطيت ثلاث كاسات موية على أربع كاسات رز حطيت ربع ملعقة ملح وحطيت حبة فلفل رومي' }),
      signal: AbortSignal.timeout(30000),
    });
    assert.equal(response.status, 200);
    const result = await response.json();
    assert.equal(result.success, true);
    assert.equal(result.recipe.ingredients.length, 4);
    console.log(`PASS deployed voice API: authenticated request, four ingredients, analysis mode=${result.recipe.analysisMode}`);
  }
  const local = { ...base, favorites: ['test-recipe'], shoppingList: [{ id: 'test-item', name: 'أرز اختبار', category: 'أخرى' as const, completed: false, addedAt: 1 }] };
  await commitAccountData(databases[0], a.user.uid, { base, local }, base);
  await signOut(auths[0]);
  await signInWithEmailAndPassword(auths[1], emailA, password);
  const restored = await loadAccountSnapshot(databases[1], a.user.uid, base);
  assert.deepEqual(restored, local);
  assert.equal((await getDocFromServer(doc(databases[1], 'users', a.user.uid))).data()?.displayName, 'اختبار حفظ طبخات');
  console.log('PASS email login and data restored in an independent client with no device cache');
  await signInWithEmailAndPassword(auths[0], emailA, password);
  await Promise.all([
    commitAccountData(databases[0], a.user.uid, { base: local, local: { ...local, favorites: [...local.favorites, 'device-a'] } }, base),
    commitAccountData(databases[1], a.user.uid, { base: local, local: { ...local, favorites: [...local.favorites, 'device-b'] } }, base),
  ]);
  const merged = await loadAccountSnapshot(databases[1], a.user.uid, base);
  assert.ok(merged.favorites.includes('device-a') && merged.favorites.includes('device-b'));
  console.log('PASS concurrent changes from two clients retained');
  const edited = { ...merged, shoppingList: [{ ...merged.shoppingList[0], name: 'first edit' }] };
  await commitAccountData(databases[0], a.user.uid, { base: merged, local: edited }, base);
  await assert.rejects(commitAccountData(databases[1], a.user.uid, { base: merged, local: { ...merged, shoppingList: [{ ...merged.shoppingList[0], name: 'conflicting edit' }] } }, base), DataConflictError);
  assert.equal((await loadAccountSnapshot(databases[0], a.user.uid, base)).shoppingList[0].name, 'first edit');
  console.log('PASS conflicting stale client cannot overwrite saved data');
  const b = await createUserWithEmailAndPassword(auths[2], emailB, password);
  testUids.push(b.user.uid);
  await assert.rejects(getDocFromServer(doc(databases[2], 'userData', a.user.uid)), (e: any) => e.code === 'permission-denied');
  await assert.rejects(setDoc(doc(databases[2], 'userData', a.user.uid), base), (e: any) => e.code === 'permission-denied');
  assert.deepEqual(await loadAccountSnapshot(databases[2], b.user.uid, base), base);
  console.log('PASS second account isolated; cross-account read and write denied by deployed rules');
} finally {
  // Delete only documents belonging to accounts created by this exact run.
  for (const index of [0, 2]) {
    const account = auths[index].currentUser;
    if (account && testUids.includes(account.uid)) {
      for (const collection of ['userData', 'users']) await deleteDoc(doc(databases[index], collection, account.uid));
      await deleteUser(account);
    }
  }
  await Promise.all(databases.map(terminate));
  await Promise.all(apps.map(deleteApp));
  console.log('Disposable test accounts and their test data cleaned up.');
}
