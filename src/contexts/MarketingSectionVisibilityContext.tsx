import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { useAuth } from './AuthContext';

// Define the marketing sections
export interface MarketingSectionVisibilityState {
  hero: boolean;
  headerVideo: boolean;
  introAbout: boolean;
  gallery: boolean;
  companies: boolean;
  services: boolean;
  software: boolean;
  pricing: boolean;
  social: boolean;
  contact: boolean;
}

interface MarketingSectionVisibilityContextType {
  sectionVisibility: MarketingSectionVisibilityState;
  isAdminOrDeveloper: boolean;
  updateSectionVisibility: (section: keyof MarketingSectionVisibilityState, isVisible: boolean) => Promise<void>;
  isLoading: boolean;
}

const MarketingSectionVisibilityContext = createContext<MarketingSectionVisibilityContextType>({
  sectionVisibility: {
    hero: false,
    headerVideo: false,
    introAbout: false,
    gallery: false,
    companies: false,
    services: false,
    software: false,
    pricing: false,
    social: false,
    contact: false
  },
  isAdminOrDeveloper: false,
  updateSectionVisibility: async () => {},
  isLoading: true
});

export const useMarketingSectionVisibility = () => useContext(MarketingSectionVisibilityContext);

export function MarketingSectionVisibilityProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [sectionVisibility, setSectionVisibility] = useState<MarketingSectionVisibilityState>({
    hero: false,
    headerVideo: false,
    introAbout: false,
    gallery: false,
    companies: false,
    services: false,
    software: false,
    pricing: false,
    social: false,
    contact: false
  });

  const { userProfile } = useAuth();
  const isAdminOrDeveloper = Boolean(userProfile?.admin || userProfile?.developer);

  useEffect(() => {
    const fetchVisibilitySettings = async () => {
      try {
        setIsLoading(true);
        const docRef = doc(db, 'settings', 'marketingSections');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setSectionVisibility(docSnap.data() as MarketingSectionVisibilityState);
        } else {
          // Create default settings if they don't exist
          const defaultSettings: MarketingSectionVisibilityState = {
            hero: false,
            headerVideo: false,
            introAbout: false,
            gallery: false,
            companies: false,
            services: false,
            software: false,
            pricing: false,
            social: false,
            contact: false
          };
          
          await setDoc(docRef, defaultSettings);
          setSectionVisibility(defaultSettings);
        }
      } catch (error) {
        console.error("Error fetching marketing section visibility settings:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVisibilitySettings();
  }, []);

  const updateSectionVisibility = async (section: keyof MarketingSectionVisibilityState, isVisible: boolean) => {
    if (!isAdminOrDeveloper) return;

    try {
      // Update local state
      setSectionVisibility(prev => ({
        ...prev,
        [section]: isVisible
      }));

      // Update Firestore
      const docRef = doc(db, 'settings', 'marketingSections');
      await setDoc(docRef, {
        ...sectionVisibility,
        [section]: isVisible
      }, { merge: true });
    } catch (error) {
      console.error("Error updating section visibility:", error);
      // Revert state if update fails
      setSectionVisibility(prev => ({
        ...prev,
        [section]: !isVisible
      }));
    }
  };

  return (
    <MarketingSectionVisibilityContext.Provider value={{
      sectionVisibility,
      isAdminOrDeveloper,
      updateSectionVisibility,
      isLoading
    }}>
      {children}
    </MarketingSectionVisibilityContext.Provider>
  );
}