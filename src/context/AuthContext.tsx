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
            const snap = await getDoc(userRef);
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
              await setDoc(userRef, {
                uid: fbUser.uid,
                email: fbUser.email,
                displayName: userDocData.displayName,
                preferences: DEFAULT_PREFERENCES,
                photoURL: userDocData.photoURL,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              });
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
      setIsLoading(true);
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error('Google Sign-in error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    try {
      setIsLoading(true);
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (err: any) {
      console.error('Email sign-in error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const registerWithEmail = async (name: string, email: string, pass: string) => {
    try {
      setIsLoading(true);
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      if (cred.user) {
        await updateProfile(cred.user, { displayName: name });
        if (db) {
          const userRef = doc(db, 'users', cred.user.uid);
          await setDoc(userRef, {
            uid: cred.user.uid,
            email,
            displayName: name,
            preferences: DEFAULT_PREFERENCES,
            photoURL: cred.user.photoURL,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      throw err;
    } finally {
      setIsLoading(false);
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
