import { auth } from './firebase';

export async function apiHeaders() {
  const account = auth.currentUser;
  if (!account) throw new Error('سجّل الدخول لاستخدام هذه الميزة.');
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${await account.getIdToken()}` };
}
