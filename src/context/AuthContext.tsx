import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase';
import { withTimeout } from '../lib/async';
import { UserProfile, UserPreferences } from '../types/recipe';

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: User | null;
  isLoading: boolean;
  isGuest: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (name: string, email: string, pass: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  continueAsGuest: () => void;
  logout: () => Promise<void>;
  updatePreferences: (prefs: Partial<UserPreferences>) => Promise<void>;
  updateProfileName: (name: string) => Promise<void>;
  updateProfilePhoto: (photoURL: string) => Promise<void>;
  resetAccountDetails: () => Promise<void>;
  clearDietaryPreferences: () => Promise<void>;
  deleteAccountDetails: () => Promise<void>;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  dietary: [],
  favoriteCuisines: ['سعودي', 'خليجي', 'شامي'],
  defaultServings: 4,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  // Initialize guest profile from localStorage if any
  useEffect(() => {
    const savedGuest = localStorage.getItem('tabkhat_guest_user');
    const guestFlag = localStorage.getItem('tabkhat_is_guest');
    if (guestFlag === 'true' && savedGuest) {
      try {
        setUser(JSON.parse(savedGuest));
        setIsGuest(true);
      } catch {
        // Safe ignore
      }
    }
  }, []);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        setIsGuest(false);
        localStorage.removeItem('tabkhat_is_guest');
        // Fetch or create user doc in Firestore
        let userDocData: UserProfile = {
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: fbUser.displayName || 'طاهٍ مبدع',
          photoURL: fbUser.photoURL,
          isGuest: false,
          preferences: DEFAULT_PREFERENCES,
        };

        if (db) {
          try {
            const userRef = doc(db, 'users', fbUser.uid);
            const snap = await withTimeout(getDoc(userRef), 8000);
            if (snap.exists()) {
              const data = snap.data();
              userDocData = {
                ...userDocData,
                email: data.email || userDocData.email,
                displayName: data.displayName || userDocData.displayName,
                photoURL: data.photoURL || userDocData.photoURL,
                preferences: { ...DEFAULT_PREFERENCES, ...data.preferences },
              };
            } else {
              await withTimeout(setDoc(userRef, {
                uid: fbUser.uid,
                email: fbUser.email,
                displayName: userDocData.displayName,
                preferences: DEFAULT_PREFERENCES,
                photoURL: userDocData.photoURL,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              }), 8000);
            }
          } catch (err) {
            console.warn('Could not sync user profile with Firestore:', err);
          }
        }
        setUser(userDocData);
      } else {
        // If guest mode was previously selected, keep guest user, else set null or fallback guest
        const savedGuest = localStorage.getItem('tabkhat_guest_user');
        const guestFlag = localStorage.getItem('tabkhat_is_guest');
        if (guestFlag === 'true' && savedGuest) {
          try {
            setUser(JSON.parse(savedGuest));
            setIsGuest(true);
          } catch {
            createFallbackGuest();
          }
        } else {
          createFallbackGuest();
        }
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const createFallbackGuest = () => {
    const savedGuest = localStorage.getItem('tabkhat_guest_user');
    if (savedGuest) {
      try {
        const parsed = JSON.parse(savedGuest) as UserProfile;
        if (parsed.uid?.startsWith('guest-')) {
          setUser(parsed);
          setIsGuest(true);
          localStorage.setItem('tabkhat_is_guest', 'true');
          return;
        }
      } catch {
        localStorage.removeItem('tabkhat_guest_user');
      }
    }

    const guestUser: UserProfile = {
      uid: 'guest-' + Math.random().toString(36).substring(2, 9),
      displayName: 'زائر طبخات',
      email: null,
      photoURL: null,
      isGuest: true,
      preferences: DEFAULT_PREFERENCES,
    };
    setUser(guestUser);
    setIsGuest(true);
    localStorage.setItem('tabkhat_is_guest', 'true');
    localStorage.setItem('tabkhat_guest_user', JSON.stringify(guestUser));
  };

  const loginWithGoogle = async () => {
    try {
      await withTimeout(signInWithPopup(auth, googleProvider), 30000);
    } catch (err: any) {
      console.error('Google Sign-in error:', err);
      throw err;
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const credential = await withTimeout(
        signInWithEmailAndPassword(auth, normalizedEmail, pass),
        15000
      );
      await withTimeout(credential.user.getIdToken(true), 10000);
    } catch (err: any) {
      console.error('Email sign-in error:', err);
      throw err;
    }
  };

  const registerWithEmail = async (name: string, email: string, pass: string) => {
    try {
      const normalizedName = name.trim();
      const normalizedEmail = email.trim().toLowerCase();
      const cred = await withTimeout(
        createUserWithEmailAndPassword(auth, normalizedEmail, pass),
        15000
      );
      if (cred.user) {
        await withTimeout(updateProfile(cred.user, { displayName: normalizedName }), 10000);
        await withTimeout(cred.user.getIdToken(true), 10000);

        const registeredProfile: UserProfile = {
          uid: cred.user.uid,
          email: normalizedEmail,
          displayName: normalizedName,
          photoURL: cred.user.photoURL,
          isGuest: false,
          preferences: DEFAULT_PREFERENCES,
        };
        setFirebaseUser(cred.user);
        setUser(registeredProfile);
        setIsGuest(false);
        localStorage.removeItem('tabkhat_is_guest');

        if (db) {
          try {
            const userRef = doc(db, 'users', cred.user.uid);
            await withTimeout(setDoc(userRef, {
              uid: cred.user.uid,
              email: normalizedEmail,
              displayName: normalizedName,
              preferences: DEFAULT_PREFERENCES,
              photoURL: cred.user.photoURL,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            }, { merge: true }), 8000);
          } catch (firestoreError) {
            // The Auth account is already valid. A temporary profile-sync error
            // must not send the user back to the login screen.
            console.warn('Account created; profile sync will retry later:', firestoreError);
          }
        }
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      throw err;
    }
  };

  const resetPassword = async (email: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      throw new Error('يرجى كتابة البريد الإلكتروني أولاً');
    }
    await sendPasswordResetEmail(auth, normalizedEmail);
  };

  const continueAsGuest = () => {
    createFallbackGuest();
  };

  const logout = async () => {
    try {
      await signOut(auth);
      createFallbackGuest();
    } catch (err) {
      console.error('Sign-out error:', err);
    }
  };

  const updatePreferences = async (newPrefs: Partial<UserPreferences>) => {
    if (!user) return;
    const updated = {
      ...user,
      preferences: {
        ...user.preferences,
        ...newPrefs,
      },
    };
    setUser(updated);

    if (user.isGuest) {
      localStorage.setItem('tabkhat_guest_user', JSON.stringify(updated));
    } else if (db && firebaseUser) {
      try {
        const userRef = doc(db, 'users', firebaseUser.uid);
        await setDoc(userRef, {
          preferences: updated.preferences,
          updatedAt: serverTimestamp(),
        }, { merge: true });
      } catch (err) {
        console.warn('Error updating preferences in Firestore:', err);
      }
    }
  };

  const updateProfileName = async (name: string) => {
    if (!user) return;
    const updated = { ...user, displayName: name };
    setUser(updated);

    if (user.isGuest) {
      localStorage.setItem('tabkhat_guest_user', JSON.stringify(updated));
    } else if (firebaseUser) {
      try {
        await updateProfile(firebaseUser, { displayName: name });
        if (db) {
          const userRef = doc(db, 'users', firebaseUser.uid);
          await setDoc(userRef, { displayName: name, updatedAt: serverTimestamp() }, { merge: true });
        }
      } catch (err) {
        console.warn('Error updating name:', err);
      }
    }
  };

  const updateProfilePhoto = async (photoURL: string) => {
    if (!user) return;
    const updated = { ...user, photoURL };
    setUser(updated);

    if (user.isGuest) {
      localStorage.setItem('tabkhat_guest_user', JSON.stringify(updated));
    } else if (firebaseUser) {
      try {
        await updateProfile(firebaseUser, { photoURL });
        if (db) {
          const userRef = doc(db, 'users', firebaseUser.uid);
          await setDoc(userRef, { photoURL, updatedAt: serverTimestamp() }, { merge: true });
        }
      } catch (err) {
        console.warn('Error updating photo:', err);
      }
    }
  };

  const resetAccountDetails = async () => {
    if (!user) return;
    const defaultName = 'طاهٍ مبدع';
    const defaultPrefs: UserPreferences = {
      dietary: [],
      favoriteCuisines: ['سعودي', 'خليجي', 'شامي'],
      defaultServings: 4,
    };
    const updated: UserProfile = {
      ...user,
      displayName: defaultName,
      preferences: defaultPrefs,
    };
    setUser(updated);

    if (user.isGuest) {
      localStorage.setItem('tabkhat_guest_user', JSON.stringify(updated));
    } else if (firebaseUser) {
      try {
        await updateProfile(firebaseUser, { displayName: defaultName });
        if (db) {
          const userRef = doc(db, 'users', firebaseUser.uid);
          await setDoc(userRef, { displayName: defaultName, preferences: defaultPrefs, updatedAt: serverTimestamp() }, { merge: true });
        }
      } catch (err) {
        console.warn('Error resetting profile details:', err);
      }
    }
  };

  const clearDietaryPreferences = async () => {
    if (!user) return;
    await updatePreferences({ dietary: [] });
  };

  const deleteAccountDetails = async () => {
    if (!user) return;
    const cleanPrefs: UserPreferences = {
      dietary: [],
      favoriteCuisines: [],
      defaultServings: 4,
    };
    const updated: UserProfile = {
      ...user,
      displayName: 'مستخدم جديد',
      photoURL: null,
      preferences: cleanPrefs,
    };
    setUser(updated);

    if (user.isGuest) {
      localStorage.setItem('tabkhat_guest_user', JSON.stringify(updated));
    } else if (firebaseUser) {
      try {
        await updateProfile(firebaseUser, { displayName: 'مستخدم جديد', photoURL: '' });
        if (db) {
          const userRef = doc(db, 'users', firebaseUser.uid);
          await setDoc(userRef, { displayName: 'مستخدم جديد', photoURL: null, preferences: cleanPrefs, updatedAt: serverTimestamp() }, { merge: true });
        }
      } catch (err) {
        console.warn('Error deleting account details in Firestore:', err);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        isLoading,
        isGuest,
        loginWithGoogle,
        loginWithEmail,
        registerWithEmail,
        resetPassword,
        continueAsGuest,
        logout,
        updatePreferences,
        updateProfileName,
        updateProfilePhoto,
        resetAccountDetails,
        clearDietaryPreferences,
        deleteAccountDetails,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
