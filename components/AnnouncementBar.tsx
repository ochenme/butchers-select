import React, { useState, useEffect } from 'react';
import { useAnnouncement } from '../contexts/AnnouncementContext';

const XIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const AnnouncementBar: React.FC = () => {
  const { announcement } = useAnnouncement();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const isDismissed = sessionStorage.getItem('announcementDismissed');
    if (announcement && isDismissed !== 'true') {
      setIsVisible(true);
    }
  }, [announcement]);

  const handleDismiss = () => {
    sessionStorage.setItem('announcementDismissed', 'true');
    setIsVisible(false);
  };

  if (!isVisible || !announcement) {
    return null;
  }

  return (
    <div className="bg-amber-500 text-zinc-900 text-sm font-semibold relative z-50">
      <div className="container mx-auto px-4 py-2.5 text-center flex items-center justify-center">
        <p>{announcement}</p>
        <button 
          onClick={handleDismiss} 
          className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-black/10 transition-colors"
          aria-label="Dismiss announcement"
        >
          <XIcon />
        </button>
      </div>
    </div>
  );
};

export default AnnouncementBar;
