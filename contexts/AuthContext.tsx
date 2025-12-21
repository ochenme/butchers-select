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
import { FirebaseError } from 'firebase/app';
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
  authError: string | null;
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
const defaultTrustedHosts = [
  'butchers-select.com',
  'www.butchers-select.com',
  'localhost',
  '127.0.0.1',
  // Google AI Studio preview URLs resolve to googleusercontent.com
  'googleusercontent.com',
  'aistudio.google.com',
];

const trustedHosts = (() => {
  const envHosts =
    typeof import.meta !== 'undefined'
      ? ((import.meta as unknown as { env?: Record<string, string | undefined> })?.env?.VITE_TRUSTED_HOSTS
          ?.split(',')
          .map((host) => host.trim())
          .filter(Boolean))
      : undefined;

  return [...defaultTrustedHosts, ...(envHosts ?? [])];
})();

const isTrustedHost = (host: string) => {
  const normalizedHost = host.toLowerCase().replace(/https?$/, '');

  if (normalizedHost.includes('usercontent.goog')) {
    return true;
  }

  return trustedHosts.some((allowedHost) =>
    normalizedHost === allowedHost || normalizedHost.endsWith(`.${allowedHost}`),
  );
};

const formatAuthInitError = (error: unknown) => {
  if (error instanceof FirebaseError) {
    if (
      error.code === 'auth/invalid-api-key' ||
      error.code === 'auth/invalid-configuration' ||
      error.code === 'auth/unauthorized-domain'
    ) {
      const host = typeof window !== 'undefined' ? window.location.host : '預覽網域';
      return `此預覽網域（${host}）未被 Firebase 授權，暫時無法使用會員功能。請改用正式網址 https://butchers-select.com 或將該網域加入 Firebase 授權清單。`;
    }

    if (error.code === 'auth/network-request-failed') {
      return '目前無法連線至登入服務，請檢查網路後再試。';
    }
  }

  return error instanceof Error ? error.message : '會員系統目前無法使用，請稍後再試。';
};

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
        ['7-11storeCity']: '',
        ['7-11storeName']: '',
        familystoreCity: '',
        familystoreName: '',
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
  const [authError, setAuthError] = useState<string | null>(null);

  const normalizeEmail = useCallback((email: string) => email.trim().toLowerCase(), []);

  useEffect(() => {
    const host = typeof window !== 'undefined' ? window.location.hostname : '';

    if (host && !isTrustedHost(host)) {
      setAuthError(
        `此預覽網域（${host}）未被 Firebase 授權，無法使用會員登入。請改用正式網址 https://butchers-select.com 或將此網域加` +
          '入 Firebase 授權清單後再試。',
      );
      setUser(null);
      setLoading(false);
      return () => undefined;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        setAuthError(null);
        if (firebaseUser) {
          const profile = await fetchProfile(firebaseUser);
          setUser(profile);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Error retrieving user data:', error);
        setAuthError(formatAuthInitError(error));
        setUser(null);
      } finally {
        setLoading(false);
      }
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

    try {
      const profile = await fetchProfile(auth.currentUser);
      setAuthError(null);
      setUser(profile);
    } catch (error) {
      console.error('Error refreshing user profile:', error);
      setAuthError(formatAuthInitError(error));
      setUser(null);
    }
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
      authError,
      completeRegistration,
      login,
      logout,
      refreshProfile,
      updateProfile,
    }),
    [
      user,
      loading,
      authError,
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