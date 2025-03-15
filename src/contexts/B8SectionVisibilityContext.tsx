import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { useAuth } from './AuthContext';

// Interface for B8 League section visibility settings
interface B8SectionVisibility {
  showHero: boolean;
  showSportNavigation: boolean;
  showFootball: boolean;
  showBadminton: boolean;
  showEsports: boolean;
  showTournaments: boolean;
  showTournamentCreator: boolean;
  showContact: boolean;
  youtubeLink: string;
}

// Context interface
interface B8SectionVisibilityContextType {
  sectionVisibility: B8SectionVisibility;
  loading: boolean;
  error: string | null;
  isAdminOrDeveloper: boolean;
  shouldShowSection: (section: keyof B8SectionVisibility) => boolean;
  getYoutubeLink: () => string;
}

// Default visibility settings
const defaultVisibility: B8SectionVisibility = {
  showHero: true,
  showSportNavigation: true,
  showFootball: true,
  showBadminton: true,
  showEsports: true,
  showTournaments: true,
  showTournamentCreator: true,
  showContact: true,
  youtubeLink: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
};

// Create the context
const B8SectionVisibilityContext = createContext<B8SectionVisibilityContextType | undefined>(undefined);

// Provider component
export function B8SectionVisibilityProvider({ children }: { children: ReactNode }) {
  const [sectionVisibility, setSectionVisibility] = useState<B8SectionVisibility>(defaultVisibility);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { userProfile } = useAuth();
  // Use !! to ensure we always have a boolean
  const isAdminOrDeveloper = !!(userProfile?.admin || (userProfile && 'developer' in userProfile));

  useEffect(() => {
    const settingsRef = doc(db, 'settings', 'b8League');
    
    const unsubscribe = onSnapshot(
      settingsRef,
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data() as Partial<B8SectionVisibility>;
          // Merge with default values to ensure all properties exist
          setSectionVisibility({ ...defaultVisibility, ...data });
        } else {
          // If document doesn't exist, use default settings
          setSectionVisibility(defaultVisibility);
        }
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching B8 League settings:', err);
        setError('Failed to load section visibility settings');
        setLoading(false);
      }
    );
    
    return () => unsubscribe();
  }, []);

  // Function to determine if a section should be shown based on visibility settings and user role
  const shouldShowSection = (section: keyof B8SectionVisibility): boolean => {
    // Admins and developers can see all sections regardless of visibility settings
    if (isAdminOrDeveloper) {
      return true;
    }
    
    // For regular users, respect the visibility settings
    return section === 'youtubeLink' ? true : sectionVisibility[section];
  };

  // Function to get the current YouTube link
  const getYoutubeLink = (): string => {
    return sectionVisibility.youtubeLink || defaultVisibility.youtubeLink;
  };

  const value: B8SectionVisibilityContextType = {
    sectionVisibility,
    loading,
    error,
    isAdminOrDeveloper,
    shouldShowSection,
    getYoutubeLink
  };

  return (
    <B8SectionVisibilityContext.Provider value={value}>
      {children}
    </B8SectionVisibilityContext.Provider>
  );
}

// Custom hook for using the context
export function useB8SectionVisibility() {
  const context = useContext(B8SectionVisibilityContext);
  if (context === undefined) {
    throw new Error('useB8SectionVisibility must be used within a B8SectionVisibilityProvider');
  }
  return context;
} 