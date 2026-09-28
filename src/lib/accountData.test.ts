import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AccountDataStore, DataConflictError, equalData, mergeData, normalizeSnapshot, type PendingData, type UserDataSnapshot } from './accountData';

const snapshot = (): UserDataSnapshot => ({ schemaVersion: 1, recipes: [], favorites: [], mealPlan: [], shoppingList: [], deletedRecipeCount: 0 });
test('merge ignores key ordering from Firestore', () => {
  assert.ok(equalData({ name: 'رز', amount: 4 }, { amount: 4, name: 'رز' }));
});
test('simultaneous additions and independent fields survive', () => {
  const base = { recipes: [{ id: 'a', title: 'كبسة', cookTime: 20 }], favorites: ['a'] };
  const local = { recipes: [{ id: 'a', title: 'كبسة دجاج', cookTime: 20 }, { id: 'b', title: 'رز' }], favorites: [] };
  const remote = { recipes: [{ id: 'a', title: 'كبسة', cookTime: 30 }, { id: 'c', title: 'شوربة' }], favorites: ['a', 'c'] };
  const merged = mergeData(base, local, remote);
  assert.equal(merged.recipes.length, 3);
  assert.equal(merged.recipes[0].title, 'كبسة دجاج');
  assert.equal(merged.recipes[0].cookTime, 30);
  assert.deepEqual(merged.favorites, ['c']);
});
test('same-field conflict and delete-versus-edit never silently overwrite', () => {
  assert.throws(() => mergeData({ title: 'a' }, { title: 'b' }, { title: 'c' }), DataConflictError);
  assert.throws(() => mergeData([{ id: 'a', title: 'a' }], [], [{ id: 'a', title: 'changed' }]), DataConflictError);
});
test('explicit deletion does not delete another device addition', () => {
  assert.deepEqual(mergeData([{ id: 'a' }], [], [{ id: 'a' }, { id: 'b' }]), [{ id: 'b' }]);
});
test('invalid cloud data is blocked, not replaced with defaults', () => {
  assert.throws(() => normalizeSnapshot({}, snapshot()));
  assert.throws(() => normalizeSnapshot({ ...snapshot(), recipes: null }, snapshot()));
});
test('hydration alone never writes to cloud', async () => {
  let writes = 0;
  const store = new AccountDataStore(snapshot(), snapshot(), () => {}, async data => { writes++; return data.local; });
  await store.flush();
  assert.equal(writes, 0);
  store.dispose();
});
test('backup is synchronous before cloud save, and flush saves final edits', async () => {
  let backup: PendingData | undefined;
  let cloud = snapshot();
  const store = new AccountDataStore(cloud, cloud, pending => { backup = structuredClone(pending); }, async pending => { cloud = pending.local; return cloud; });
  store.change('favorites', ['recipe-1']);
  assert.deepEqual(backup?.local.favorites, ['recipe-1']);
  assert.deepEqual(cloud.favorites, []);
  await store.flush();
  assert.deepEqual(cloud.favorites, ['recipe-1']);
  assert.equal(store.status, 'synced');
  store.dispose();
});
test('offline failure retains pending edits; retry commits them', async () => {
  let online = false;
  let backup: PendingData | undefined;
  const store = new AccountDataStore(snapshot(), snapshot(), pending => { backup = structuredClone(pending); }, async pending => {
    if (!online) throw new Error('offline');
    return pending.local;
  });
  store.change('favorites', ['a']);
  await assert.rejects(store.flush());
  assert.equal(store.status, 'error');
  assert.equal(store.dirty, true);
  assert.deepEqual(backup?.local.favorites, ['a']);
  online = true;
  await store.flush();
  assert.equal(store.dirty, false);
  store.dispose();
});
test('edits during an in-flight save are saved in a subsequent transaction', async () => {
  let release: (() => void) | undefined;
  let writes = 0;
  let cloud = snapshot();
  const store = new AccountDataStore(cloud, cloud, () => {}, async pending => {
    if (++writes === 1) await new Promise<void>(resolve => { release = resolve; });
    cloud = mergeData(pending.base, pending.local, cloud);
    return cloud;
  });
  store.change('favorites', ['a']);
  const saving = store.flush();
  store.change('favorites', ['a', 'b']);
  release!();
  await saving;
  assert.equal(writes, 2);
  assert.deepEqual(cloud.favorites, ['a', 'b']);
  store.dispose();
});
test('pending edits can be recovered on a new session without replacing remote additions', () => {
  const base = snapshot();
  const pending = { ...base, favorites: ['offline'] };
  const remote = { ...base, favorites: ['other-device'] };
  assert.deepEqual(mergeData(base, pending, remote).favorites, ['other-device', 'offline']);
});

test('sign-out waits for the final cloud acknowledgement', async () => {
  let acknowledge: (() => void) | undefined;
  let signedOut = false;
  const store = new AccountDataStore(snapshot(), snapshot(), () => {}, async pending => {
    await new Promise<void>(resolve => { acknowledge = resolve; });
    return pending.local;
  });
  store.change('favorites', ['last-change']);
  const logout = async () => { await store.flush(); signedOut = true; };
  const leaving = logout();
  assert.equal(signedOut, false);
  acknowledge!();
  await leaving;
  assert.equal(signedOut, true);
  assert.equal(store.status, 'synced');
  store.dispose();
});

test('failed save prevents sign-out', async () => {
  let signedOut = false;
  const store = new AccountDataStore(snapshot(), snapshot(), () => {}, async () => { throw new Error('network'); });
  store.change('favorites', ['last-change']);
  const logout = async () => { await store.flush(); signedOut = true; };
  await assert.rejects(logout());
  assert.equal(signedOut, false);
  assert.equal(store.dirty, true);
  store.dispose();
});
