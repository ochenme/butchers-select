import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
// Fix: Use modular imports for Firebase Auth to resolve module resolution issues.
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import type { MemberProfile } from '../types';

interface AuthContextValue {
  user: MemberProfile | null;
  loading: boolean;
  completeRegistration: (
    email: string,
    password: string,
    profile: Omit<MemberProfile, 'uid' | 'email'>,
  ) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (profileData: Partial<Omit<MemberProfile, 'uid' | 'email'>>) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const auth = getAuth();

const fetchProfile = async (firebaseUser: User): Promise<MemberProfile> => {
  const profileRef = doc(db, 'users', firebaseUser.uid);
  const snapshot = await getDoc(profileRef);
  const profileData = snapshot.exists()
    ? (snapshot.data() as Omit<MemberProfile, 'uid'>)
    : {
        email: firebaseUser.email ?? '',
        name: '',
        phone: '',
        address: '',
      };

  if (!snapshot.exists()) {
    await setDoc(profileRef, profileData, { merge: true });
  }

  return {
    uid: firebaseUser.uid,
    ...profileData,
  };
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<MemberProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const normalizeEmail = useCallback((email: string) => email.trim().toLowerCase(), []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const profile = await fetchProfile(firebaseUser);
        setUser(profile);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const completeRegistration = useCallback(
    async (
      email: string,
      password: string,
      profile: Omit<MemberProfile, 'uid' | 'email'>,
    ) => {
      const normalizedEmail = normalizeEmail(email);

      const credential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
      await setDoc(doc(db, 'users', credential.user.uid), {
        email: normalizedEmail,
        ...profile,
      });
    },
    [normalizeEmail],
  );

  const login = useCallback(async (email: string, password: string) => {
    const normalizedEmail = normalizeEmail(email);
    await signInWithEmailAndPassword(auth, normalizedEmail, password);
  }, [normalizeEmail]);

  const logout = useCallback(async () => {
    await signOut(auth);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!auth.currentUser) {
      setUser(null);
      return;
    }

    const profile = await fetchProfile(auth.currentUser);
    setUser(profile);
  }, []);
  
  const updateProfile = useCallback(async (profileData: Partial<Omit<MemberProfile, 'uid' | 'email'>>) => {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) {
        throw new Error("使用者未登入，無法更新資料");
    }
    const profileRef = doc(db, 'users', firebaseUser.uid);
    await setDoc(profileRef, profileData, { merge: true });
    await refreshProfile(); // Refresh context state from Firestore
  }, [refreshProfile]);


  const contextValue = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      completeRegistration,
      login,
      logout,
      refreshProfile,
      updateProfile,
    }),
    [
      user,
      loading,
      completeRegistration,
      login,
      logout,
      refreshProfile,
      updateProfile,
    ],
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {!loading ? children : <div className="py-20 text-center text-gray-500">載入中...</div>}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth 必須與 AuthProvider 一起使用');
  }

  return context;
};