import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';

// Interface for bgr8 League section visibility settings
interface Bgr8SectionVisibility {
  marketing: boolean;
  carClub: boolean;
  clothing: boolean;
  league: boolean;
  world: boolean;
  bgr8r: boolean;
  podcast: boolean;
  bgr8: boolean;
}

interface Bgr8SectionVisibilityContextType {
  sectionVisibility: Bgr8SectionVisibility;
  loading: boolean;
  error: string | null;
  shouldShowSection: (section: keyof Bgr8SectionVisibility) => boolean;
}

const defaultVisibility: Bgr8SectionVisibility = {
  marketing: true,
  carClub: true,
  clothing: true,
  league: true,
  world: true,
  bgr8r: true,
  podcast: true,
  bgr8: true
};

const Bgr8SectionVisibilityContext = createContext<Bgr8SectionVisibilityContextType | undefined>(undefined);

export function Bgr8SectionVisibilityProvider({ children }: { children: ReactNode }) {
  const [sectionVisibility, setSectionVisibility] = useState<Bgr8SectionVisibility>(defaultVisibility);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVisibilitySettings = async () => {
      try {
        setLoading(true);
        const settingsRef = doc(db, 'settings', 'bgr8League');
        const docSnapshot = await getDoc(settingsRef);

        if (docSnapshot.exists()) {
          const data = docSnapshot.data() as Partial<Bgr8SectionVisibility>;
          setSectionVisibility(prev => ({
            ...prev,
            ...data
          }));
        }
      } catch (err) {
        console.error('Error fetching bgr8 League settings:', err);
        setError('Failed to load section visibility settings');
      } finally {
        setLoading(false);
      }
    };

    fetchVisibilitySettings();
  }, []);

  const shouldShowSection = (section: keyof Bgr8SectionVisibility): boolean => {
    if (loading) {
      return false; // Don't show sections while loading
    }
    
    if (error) {
      return defaultVisibility[section]; // Fall back to default visibility
    }
    
    return sectionVisibility[section];
  };

  const value: Bgr8SectionVisibilityContextType = {
    sectionVisibility,
    loading,
    error,
    shouldShowSection
  };

  return (
    <Bgr8SectionVisibilityContext.Provider value={value}>
      {children}
    </Bgr8SectionVisibilityContext.Provider>
  );
}

export function useBgr8SectionVisibility() {
  const context = useContext(Bgr8SectionVisibilityContext);
  if (context === undefined) {
    throw new Error('useBgr8SectionVisibility must be used within a Bgr8SectionVisibilityProvider');
  }
  return context;
} 