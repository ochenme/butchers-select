import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
// Fix: Use namespace import for firebase/auth to resolve module resolution issues.
import * as firebaseAuth from 'firebase/auth';
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
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const auth = firebaseAuth.getAuth();

const fetchProfile = async (firebaseUser: firebaseAuth.User): Promise<MemberProfile> => {
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
    const unsubscribe = firebaseAuth.onAuthStateChanged(auth, async (firebaseUser) => {
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

      const credential = await firebaseAuth.createUserWithEmailAndPassword(auth, normalizedEmail, password);
      await setDoc(doc(db, 'users', credential.user.uid), {
        email: normalizedEmail,
        ...profile,
      });
    },
    [normalizeEmail],
  );

  const login = useCallback(async (email: string, password: string) => {
    const normalizedEmail = normalizeEmail(email);
    await firebaseAuth.signInWithEmailAndPassword(auth, normalizedEmail, password);
  }, [normalizeEmail]);

  const logout = useCallback(async () => {
    await firebaseAuth.signOut(auth);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!auth.currentUser) {
      setUser(null);
      return;
    }

    const profile = await fetchProfile(auth.currentUser);
    setUser(profile);
  }, []);

  const contextValue = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      completeRegistration,
      login,
      logout,
      refreshProfile,
    }),
    [
      user,
      loading,
      completeRegistration,
      login,
      logout,
      refreshProfile,
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