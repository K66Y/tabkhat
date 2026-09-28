import type { Recipe, ShoppingItem, DayMealPlan } from '../types/recipe';

export interface UserDataSnapshot {
  schemaVersion: number;
  recipes: Recipe[];
  favorites: string[];
  mealPlan: DayMealPlan[];
  shoppingList: ShoppingItem[];
  deletedRecipeCount: number;
}

export const equalData = (a: unknown, b: unknown): boolean => {
  if (a === b) return true;
  if (!a || !b || typeof a !== 'object' || typeof b !== 'object') return false;
  const keys = Object.keys(a);
  return keys.length === Object.keys(b).length && keys.every(k => equalData((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]));
};

export class DataConflictError extends Error {
  constructor() {
    super('يوجد تعديل مختلف من جهاز آخر على نفس البيانات. احتفظنا بتعديلاتك؛ نزّل نسخة احتياطية قبل معالجة التعارض. لم نكتب فوق بيانات الحساب.');
  }
}

// Three-way merge: only fields actually changed by this device are applied.
// Concurrent edits to the same field stop the write instead of losing either edit.
export function mergeData(base: any, local: any, remote: any): any {
  if (equalData(local, base)) return remote;
  if (equalData(remote, base) || equalData(local, remote)) return local;
  if (Array.isArray(base) && Array.isArray(local) && Array.isArray(remote)) {
    const all = [...base, ...local, ...remote];
    if (all.every(v => typeof v === 'string')) {
      const removed = new Set(base.filter(v => !local.includes(v)));
      return [...new Set([...remote.filter(v => !removed.has(v)), ...local.filter(v => !base.includes(v))])];
    }
    const key = all.every(v => v && typeof v.id === 'string') ? 'id'
      : all.every(v => v && typeof v.day === 'string') ? 'day' : null;
    if (key) {
      const index = (values: any[]) => Object.fromEntries(values.map(v => [v[key], v]));
      const merged = mergeData(index(base), index(local), index(remote));
      return [...new Set([...local, ...remote].map(v => v[key]))]
        .filter(id => merged[id] !== undefined).map(id => merged[id]);
    }
  }
  const record = (v: any) => v !== null && typeof v === 'object' && !Array.isArray(v);
  if (record(base) && record(local) && record(remote)) {
    const result: Record<string, unknown> = Object.create(null);
    for (const key of new Set([...Object.keys(base), ...Object.keys(local), ...Object.keys(remote)])) {
      const value = mergeData(base[key], local[key], remote[key]);
      if (value !== undefined) result[key] = value;
    }
    return result;
  }
  throw new DataConflictError();
}

export function normalizeSnapshot(raw: unknown, defaults: UserDataSnapshot): UserDataSnapshot {
  if (!raw || typeof raw !== 'object') throw new Error('بيانات الحساب غير قابلة للقراءة. لم نغيّرها.');
  const data = raw as Partial<UserDataSnapshot>;
  for (const key of ['recipes', 'favorites', 'mealPlan', 'shoppingList'] as const) {
    if (!Array.isArray(data[key])) throw new Error('بيانات الحساب ناقصة. أوقفنا الحفظ لحمايتها.');
  }
  return {
    schemaVersion: 1,
    recipes: data.recipes!, favorites: data.favorites!, mealPlan: data.mealPlan!, shoppingList: data.shoppingList!,
    deletedRecipeCount: typeof data.deletedRecipeCount === 'number' ? data.deletedRecipeCount : defaults.deletedRecipeCount,
  };
}

export interface PendingData { base: UserDataSnapshot; local: UserDataSnapshot }
type Status = 'synced' | 'syncing' | 'error';

// The backup is account-scoped and written synchronously on each edit, before
// any debounce. Firestore remains authoritative; backups are never blind uploads.
export class AccountDataStore {
  data: UserDataSnapshot;
  base: UserDataSnapshot;
  status: Status = 'synced';
  error = '';
  private active: Promise<void> | null = null;
  private timer: ReturnType<typeof setTimeout> | undefined;
  onChange = () => {};
  constructor(
    base: UserDataSnapshot,
    local: UserDataSnapshot,
    private persistBackup: (pending: PendingData) => void,
    private commit: (pending: PendingData) => Promise<UserDataSnapshot>,
  ) {
    this.base = base;
    this.data = local;
    if (!equalData(base, local)) this.status = 'syncing';
  }
  get dirty() { return !equalData(this.data, this.base); }
  private backup() {
    try { this.persistBackup({ base: this.base, local: this.data }); }
    catch { this.error = 'تعذر إنشاء النسخة الاحتياطية على هذا المتصفح. لا تغلق الصفحة حتى يؤكد الحفظ السحابي.'; }
  }
  change<K extends keyof UserDataSnapshot>(key: K, action: UserDataSnapshot[K] | ((previous: UserDataSnapshot[K]) => UserDataSnapshot[K])) {
    const value = typeof action === 'function' ? action(this.data[key]) : action;
    this.data = JSON.parse(JSON.stringify({ ...this.data, [key]: value }));
    this.status = 'syncing';
    this.error = '';
    this.backup();
    this.onChange();
    clearTimeout(this.timer);
    this.timer = setTimeout(() => { void this.flush().catch(() => {}); }, 350);
  }
  flush(): Promise<void> {
    clearTimeout(this.timer);
    if (this.active) return this.active;
    this.active = this.save().finally(() => { this.active = null; });
    return this.active;
  }
  private async save() {
    try {
      while (this.dirty) {
        this.status = 'syncing';
        this.onChange();
        const sent = { base: this.base, local: this.data };
        const saved = await this.commit(sent);
        // Preserve edits made while a previous transaction was in flight.
        const rebased = mergeData(sent.local, this.data, saved);
        this.base = saved;
        this.data = rebased;
        this.backup();
      }
      this.status = 'synced';
      this.error = '';
      this.onChange();
    } catch (error) {
      this.status = 'error';
      this.error = error instanceof DataConflictError ? error.message
        : error instanceof Error && error.message === 'account-size-limit'
          ? 'حجم صور ووصفات الحساب تجاوز حد التخزين الحالي. لم نمسح بياناتك؛ نزّل نسخة احتياطية وخفّض حجم الصور قبل إعادة الحفظ.'
          : 'لم يكتمل الحفظ السحابي. لا تسجل الخروج أو تغلق الصفحة قبل إعادة المحاولة أو تنزيل نسخة احتياطية.';
      this.backup();
      this.onChange();
      throw error;
    }
  }
  dispose() { clearTimeout(this.timer); this.onChange = () => {}; }
}
