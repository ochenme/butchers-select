import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface AnnouncementContextType {
  announcement: string;
  updateAnnouncement: (text: string) => void;
}

const AnnouncementContext = createContext<AnnouncementContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'butchers_select_announcement';

export const AnnouncementProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [announcement, setAnnouncement] = useState<string>('');

  useEffect(() => {
    try {
      const storedAnnouncement = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedAnnouncement) {
        setAnnouncement(JSON.parse(storedAnnouncement));
      } else {
        // Set a default announcement for the first time
        const defaultAnnouncement = '🎉 全館滿 NT$2000 免運費！新會員註冊即享9折優惠！';
        setAnnouncement(defaultAnnouncement);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(defaultAnnouncement));
      }
    } catch (error) {
      console.error("Failed to parse announcement from localStorage", error);
      setAnnouncement('歡迎光臨豐鈺食品！');
    }
  }, []);

  const updateAnnouncement = (text: string) => {
    setAnnouncement(text);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(text));
  };

  return (
    <AnnouncementContext.Provider value={{ announcement, updateAnnouncement }}>
      {children}
    </AnnouncementContext.Provider>
  );
};

export const useAnnouncement = () => {
  const context = useContext(AnnouncementContext);
  if (context === undefined) {
    throw new Error('useAnnouncement must be used within an AnnouncementProvider');
  }
  return context;
};
