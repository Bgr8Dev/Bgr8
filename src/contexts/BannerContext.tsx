import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { firestore } from '../firebase/firebase';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth';
import { hasRole } from '../utils/userProfile';

export interface BannerSettings {
  inDevelopment: {
    enabled: boolean;
    message: string;
    pages: string[];
    showIcon: boolean;
  };
  comingSoon: {
    enabled: boolean;
    message: string;
    pages: string[];
    showIcon: boolean;
  };
}

interface BannerContextType {
  bannerSettings: BannerSettings;
  updateBannerSettings: (settings: Partial<BannerSettings>) => Promise<void>;
  shouldShowBanner: (bannerType: 'inDevelopment' | 'comingSoon', pagePath: string) => boolean;
  isLoading: boolean;
}

const BannerContext = createContext<BannerContextType | undefined>(undefined);

const defaultBannerSettings: BannerSettings = {
  inDevelopment: {
    enabled: false,
    message: "This feature is currently in development and may not work as expected.",
    pages: [],
    showIcon: true
  },
  comingSoon: {
    enabled: false,
    message: "This feature is coming soon! Stay tuned for updates.",
    pages: [],
    showIcon: true
  }
};

export const BannerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { userProfile } = useAuth();
  const [bannerSettings, setBannerSettings] = useState<BannerSettings>(defaultBannerSettings);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(firestore, 'adminSettings', 'bannerSettings'),
      async (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data() as BannerSettings;
          setBannerSettings(data);
        } else {
          // Initialize with default settings if document doesn't exist
          try {
            await setDoc(doc(firestore, 'adminSettings', 'bannerSettings'), defaultBannerSettings);
            setBannerSettings(defaultBannerSettings);
          } catch (error) {
            console.error('Error creating banner settings document:', error);
            // Still set default settings locally even if Firebase fails
            setBannerSettings(defaultBannerSettings);
          }
        }
        setIsLoading(false);
      },
      (error) => {
        console.error('Error fetching banner settings:', error);
        // Set default settings on error
        setBannerSettings(defaultBannerSettings);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const updateBannerSettings = async (settings: Partial<BannerSettings>) => {
    try {
      const updatedSettings = { ...bannerSettings, ...settings };
      await setDoc(doc(firestore, 'adminSettings', 'bannerSettings'), updatedSettings);
      setBannerSettings(updatedSettings);
    } catch (error) {
      console.error('Error updating banner settings:', error);
      // Still update local state even if Firebase fails
      setBannerSettings(prev => ({ ...prev, ...settings }));
      throw error;
    }
  };

  const shouldShowBanner = (bannerType: 'inDevelopment' | 'comingSoon', pagePath: string): boolean => {
    const banner = bannerSettings[bannerType];
    
    // Return false if banner settings are not properly initialized
    if (!banner || typeof banner.enabled !== 'boolean') return false;
    
    if (!banner.enabled) return false;
    
    // Hide development banner for developers
    if (bannerType === 'inDevelopment' && hasRole(userProfile, 'developer')) {
      return false;
    }
    
    // Check if the current page is in the pages array
    return banner.pages.includes(pagePath) || banner.pages.includes('*'); // '*' means show on all pages
  };

  return (
    <BannerContext.Provider value={{
      bannerSettings,
      updateBannerSettings,
      shouldShowBanner,
      isLoading
    }}>
      {children}
    </BannerContext.Provider>
  );
};

export const useBanner = () => {
  const context = useContext(BannerContext);
  if (context === undefined) {
    throw new Error('useBanner must be used within a BannerProvider');
  }
  return context;
};
