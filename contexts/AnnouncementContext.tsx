import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { fetchAnnouncement, saveAnnouncement } from '../services/geminiService';

interface AnnouncementContextType {
  announcement: string;
  updateAnnouncement: (text: string) => Promise<void>;
  isLoading: boolean;
}

const AnnouncementContext = createContext<AnnouncementContextType | undefined>(undefined);

const DEFAULT_ANNOUNCEMENT = '🎉 全館滿 NT$2000 免運費！新會員註冊即享9折優惠！';
const LOCAL_STORAGE_KEY = 'butchers_select_announcement';

const safeParse = (raw: string | null): string | null => {
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
};

const readCachedAnnouncement = (): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return safeParse(window.localStorage.getItem(LOCAL_STORAGE_KEY));
  } catch (error) {
    console.warn('Unable to read announcement from localStorage', error);
    return null;
  }
};

const writeCachedAnnouncement = (value: string) => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(value));
  } catch (error) {
    console.warn('Unable to persist announcement to localStorage', error);
  }
};

export const AnnouncementProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [announcement, setAnnouncement] = useState<string>(DEFAULT_ANNOUNCEMENT);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    const loadAnnouncement = async () => {
      try {
        const cached = readCachedAnnouncement();
        if (cached) {
          setAnnouncement(cached);
        }

        const message = await fetchAnnouncement();
        if (!isMounted) {
          return;
        }

        const nextMessage = message ?? cached ?? DEFAULT_ANNOUNCEMENT;
        setAnnouncement(nextMessage);
        writeCachedAnnouncement(nextMessage);
      } catch (error) {
        console.error('Failed to load announcement from Firestore', error);
        if (isMounted) {
          const fallback = readCachedAnnouncement() ?? DEFAULT_ANNOUNCEMENT;
          setAnnouncement(fallback);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadAnnouncement();

    return () => {
      isMounted = false;
    };
  }, []);

  const updateAnnouncement = useCallback(async (text: string) => {
    const previous = readCachedAnnouncement() ?? announcement;

    setAnnouncement(text);
    writeCachedAnnouncement(text);

    try {
      await saveAnnouncement(text);
    } catch (error) {
      console.error('Failed to save announcement to Firestore', error);
      setAnnouncement(previous);
      writeCachedAnnouncement(previous);
      throw error;
    }
  }, [announcement]);

  const value = useMemo(
    () => ({ announcement, updateAnnouncement, isLoading }),
    [announcement, updateAnnouncement, isLoading],
  );

  return <AnnouncementContext.Provider value={value}>{children}</AnnouncementContext.Provider>;
};

export const useAnnouncement = () => {
  const context = useContext(AnnouncementContext);
  if (context === undefined) {
    throw new Error('useAnnouncement must be used within an AnnouncementProvider');
  }
  return context;
};
