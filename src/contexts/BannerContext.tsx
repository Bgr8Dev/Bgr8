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

export interface VisibilitySettings {
  hiddenSections: string[];
}

interface BannerContextType {
  bannerSettings: BannerSettings;
  updateBannerSettings: (settings: Partial<BannerSettings>) => Promise<void>;
  shouldShowBanner: (bannerType: 'inDevelopment' | 'comingSoon', pagePath: string) => boolean;
  visibilitySettings: VisibilitySettings;
  updateVisibilitySettings: (settings: VisibilitySettings) => Promise<void>;
  isVisible: (sectionId: string) => boolean;
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

const defaultVisibilitySettings: VisibilitySettings = {
  hiddenSections: []
};

export const BannerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { userProfile } = useAuth();
  const [bannerSettings, setBannerSettings] = useState<BannerSettings>(defaultBannerSettings);
  const [visibilitySettings, setVisibilitySettings] = useState<VisibilitySettings>(defaultVisibilitySettings);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Subscribe to banner settings
    const unsubscribeBanner = onSnapshot(
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

    // Subscribe to visibility settings
    const unsubscribeVisibility = onSnapshot(
      doc(firestore, 'adminSettings', 'visibilitySettings'),
      async (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data() as VisibilitySettings;
          setVisibilitySettings(data);
        } else {
          // Initialize with default settings if document doesn't exist
          try {
            await setDoc(doc(firestore, 'adminSettings', 'visibilitySettings'), defaultVisibilitySettings);
            setVisibilitySettings(defaultVisibilitySettings);
          } catch (error) {
            console.error('Error creating visibility settings document:', error);
            // Still set default settings locally even if Firebase fails
            setVisibilitySettings(defaultVisibilitySettings);
          }
        }
      },
      (error) => {
        console.error('Error fetching visibility settings:', error);
        // Set default settings on error
        setVisibilitySettings(defaultVisibilitySettings);
      }
    );

    return () => {
      unsubscribeBanner();
      unsubscribeVisibility();
    };
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

  const updateVisibilitySettings = async (settings: VisibilitySettings) => {
    try {
      await setDoc(doc(firestore, 'adminSettings', 'visibilitySettings'), settings);
      setVisibilitySettings(settings);
    } catch (error) {
      console.error('Error updating visibility settings:', error);
      // Still update local state even if Firebase fails
      setVisibilitySettings(settings);
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

  const isVisible = (sectionId: string): boolean => {
    // Developers can always see everything
    if (hasRole(userProfile, 'developer')) {
      return true;
    }
    
    // Check if the section is in the hidden sections array
    return !visibilitySettings.hiddenSections.includes(sectionId);
  };

  return (
    <BannerContext.Provider value={{
      bannerSettings,
      updateBannerSettings,
      shouldShowBanner,
      visibilitySettings,
      updateVisibilitySettings,
      isVisible,
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
