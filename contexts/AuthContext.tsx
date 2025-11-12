import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
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
  sendVerificationCode: (email: string) => Promise<string>;
  confirmVerificationCode: (email: string, code: string) => Promise<void>;
  completeRegistration: (
    email: string,
    password: string,
    profile: Omit<MemberProfile, 'uid' | 'email'>,
  ) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

interface VerificationRecord {
  code: string;
  expiresAt: number;
  verified: boolean;
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
  const [verificationMap, setVerificationMap] = useState<Record<string, VerificationRecord>>({});

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

  const sendVerificationCode = useCallback(async (email: string) => {
    const normalizedEmail = normalizeEmail(email);
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    setVerificationMap((prev) => ({
      ...prev,
      [normalizedEmail]: {
        code,
        expiresAt,
        verified: false,
      },
    }));

    console.info(`會員註冊驗證碼 (${normalizedEmail}): ${code}`);

    return code;
  }, [normalizeEmail]);

  const confirmVerificationCode = useCallback(
    async (email: string, code: string) => {
      const normalizedEmail = normalizeEmail(email);
      const record = verificationMap[normalizedEmail];

      if (!record) {
        throw new Error('請先取得驗證碼');
      }

      if (record.expiresAt < Date.now()) {
        throw new Error('驗證碼已過期，請重新取得');
      }

      if (record.code !== code.trim()) {
        throw new Error('驗證碼不正確，請重新輸入');
      }

      setVerificationMap((prev) => ({
        ...prev,
        [normalizedEmail]: {
          ...prev[normalizedEmail],
          verified: true,
        },
      }));
    },
    [normalizeEmail, verificationMap],
  );

  const completeRegistration = useCallback(
    async (
      email: string,
      password: string,
      profile: Omit<MemberProfile, 'uid' | 'email'>,
    ) => {
      const normalizedEmail = normalizeEmail(email);
      const record = verificationMap[normalizedEmail];

      if (!record || !record.verified) {
        throw new Error('請先完成 Email 驗證');
      }

      const credential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
      await setDoc(doc(db, 'users', credential.user.uid), {
        email: normalizedEmail,
        ...profile,
      });

      setVerificationMap((prev) => {
        const { [normalizedEmail]: _discarded, ...rest } = prev;
        return rest;
      });
    },
    [normalizeEmail, verificationMap],
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

  const contextValue = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      sendVerificationCode,
      confirmVerificationCode,
      completeRegistration,
      login,
      logout,
      refreshProfile,
    }),
    [
      user,
      loading,
      sendVerificationCode,
      confirmVerificationCode,
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