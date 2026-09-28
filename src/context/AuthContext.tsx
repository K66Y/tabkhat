import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, signOut, sendPasswordResetEmail } from 'firebase/auth';
import { doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase';
import { withTimeout } from '../lib/async';
import { UserProfile, UserPreferences } from '../types/recipe';

type ProfileChanges = Partial<Pick<UserProfile, 'displayName' | 'photoURL'>> & { preferences?: Partial<UserPreferences> };
interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: User | null;
  isLoading: boolean;
  isGuest: boolean;
  profileError: string;
  retryProfile: () => void;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (name: string, email: string, pass: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  updatePreferences: (prefs: Partial<UserPreferences>) => Promise<void>;
  updateProfileName: (name: string) => Promise<void>;
  updateProfilePhoto: (photoURL: string) => Promise<void>;
  updateProfileDetails: (changes: ProfileChanges) => Promise<void>;
  clearDietaryPreferences: () => Promise<void>;
  deleteAccountDetails: () => Promise<void>;
}
const DEFAULT_PREFERENCES: UserPreferences = { dietary: [], favoriteCuisines: ['سعودي', 'خليجي', 'شامي'], defaultServings: 4 };
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profileError, setProfileError] = useState('');
  const [retry, setRetry] = useState(0);
  const registration = useRef<{ email: string; name: string } | null>(null);

  useEffect(() => {
    let generation = 0;
    const unsubscribe = onAuthStateChanged(auth, async fbUser => {
      const current = ++generation;
      setFirebaseUser(fbUser);
      setUser(null);
      setProfileError('');
      setIsLoading(!!fbUser);
      if (!fbUser) { setIsLoading(false); return; }
      try {
        const firestore = db;
        if (!firestore) throw new Error('Firestore unavailable');
        const ref = doc(firestore, 'users', fbUser.uid);
        const requestedName = registration.current?.email === fbUser.email ? registration.current.name : fbUser.displayName;
        const profile = await withTimeout(runTransaction(firestore, async tx => {
          const snap = await tx.get(ref);
          const initial: UserProfile = {
            uid: fbUser.uid, email: fbUser.email,
            displayName: requestedName || fbUser.displayName || 'طاهٍ مبدع',
            photoURL: fbUser.photoURL, isGuest: false, preferences: DEFAULT_PREFERENCES,
          };
          if (!snap.exists()) {
            tx.set(ref, { ...initial, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
            return initial;
          }
          const data = snap.data();
          return {
            ...initial,
            displayName: data.displayName || initial.displayName,
            photoURL: data.photoURL === undefined ? initial.photoURL : data.photoURL,
            preferences: { ...DEFAULT_PREFERENCES, ...data.preferences },
          };
        }), 12000);
        if (current === generation && auth.currentUser?.uid === fbUser.uid) setUser(profile);
      } catch {
        if (current === generation) setProfileError('تعذر تحميل ملف الحساب من السحابة. بياناتك لم تتغير؛ تحقق من الاتصال ثم أعد المحاولة.');
      } finally {
        if (current === generation) setIsLoading(false);
      }
    });
    return () => { generation++; unsubscribe(); };
  }, [retry]);

  const loginWithGoogle = async () => {
    // Opening the popup directly in the click event keeps Safari's user gesture.
    await withTimeout(signInWithPopup(auth, googleProvider), 45000);
  };
  const loginWithEmail = async (email: string, pass: string) => {
    await withTimeout(signInWithEmailAndPassword(auth, email.trim().toLowerCase(), pass), 15000);
  };
  const registerWithEmail = async (name: string, email: string, pass: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    if (!cleanName) throw new Error('اكتب اسم المستخدم.');
    registration.current = { email: cleanEmail, name: cleanName };
    try {
      const credential = await withTimeout(createUserWithEmailAndPassword(auth, cleanEmail, pass), 15000);
      // The listener creates the profile transactionally. Auth displayName is
      // secondary; a failure here must not report an already-created account as failed.
      await withTimeout(updateProfile(credential.user, { displayName: cleanName }), 10000).catch(() => {});
    } finally { registration.current = null; }
  };
  const resetPassword = async (email: string) => {
    await withTimeout(sendPasswordResetEmail(auth, email.trim().toLowerCase()), 15000);
  };
  const logout = async () => { await signOut(auth); };

  const updateProfileDetails = async (changes: ProfileChanges) => {
    const account = auth.currentUser;
    const firestore = db;
    if (!account || !firestore || user?.uid !== account.uid) throw new Error('سجّل الدخول قبل حفظ الملف.');
    const profileRef = doc(firestore, 'users', account.uid);
    const saved = await withTimeout(runTransaction(firestore, async tx => {
      const current = await tx.get(profileRef);
      if (!current.exists()) throw new Error('ملف الحساب غير جاهز؛ أعد تحميل الصفحة.');
      const data = current.data();
      const patch = {
        ...changes,
        ...(changes.preferences ? { preferences: { ...DEFAULT_PREFERENCES, ...data.preferences, ...changes.preferences } } : {}),
      };
      tx.update(profileRef, { ...patch, updatedAt: serverTimestamp() });
      return patch;
    }), 12000);
    setUser(previous => previous?.uid === account.uid ? { ...previous, ...saved } as UserProfile : previous);
    const authPatch: { displayName?: string; photoURL?: string } = {};
    if (changes.displayName !== undefined) authPatch.displayName = changes.displayName || '';
    if (changes.photoURL !== undefined && !changes.photoURL?.startsWith('data:')) authPatch.photoURL = changes.photoURL || '';
    if (Object.keys(authPatch).length) void updateProfile(account, authPatch).catch(() => {});
  };

  return <AuthContext.Provider value={{
    user, firebaseUser, isLoading, isGuest: !firebaseUser, profileError, retryProfile: () => setRetry(v => v + 1),
    loginWithGoogle, loginWithEmail, registerWithEmail, resetPassword, logout, updateProfileDetails,
    updatePreferences: preferences => updateProfileDetails({ preferences }),
    updateProfileName: displayName => updateProfileDetails({ displayName }),
    updateProfilePhoto: photoURL => updateProfileDetails({ photoURL }),
    clearDietaryPreferences: () => updateProfileDetails({ preferences: { dietary: [] } }),
    deleteAccountDetails: () => updateProfileDetails({ displayName: 'مستخدم جديد', photoURL: null, preferences: { dietary: [], favoriteCuisines: [], defaultServings: 4 } }),
  }}>{children}</AuthContext.Provider>;
};
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
