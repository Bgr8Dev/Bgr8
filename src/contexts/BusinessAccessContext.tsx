import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from './AuthContext';

interface BusinessAccessibility {
  marketing: boolean;
  carClub: boolean;
  clothing: boolean;
  league: boolean;
  world: boolean;
  education: boolean;
  careers: boolean;
  bgr8: boolean;
  [key: string]: boolean;
}

interface BusinessComingSoon {
  marketing: boolean;
  carClub: boolean;
  clothing: boolean;
  league: boolean;
  world: boolean;
  bgr8r: boolean;
  careers: boolean;
  bgr8: boolean;
  [key: string]: boolean;
}

// New interface for grayed out pages
interface BusinessGrayedOut {
  marketing: boolean;
  carClub: boolean;
  clothing: boolean;
  league: boolean;
  world: boolean;
  education: boolean;
  careers: boolean;
  bgr8: boolean;
  [key: string]: boolean;
}

interface BusinessAccessContextType {
  businessAccess: BusinessAccessibility;
  comingSoon: BusinessComingSoon;
  grayedOut: BusinessGrayedOut; // New property
  loading: boolean;
  refreshBusinessAccess: () => Promise<void>;
  refreshComingSoonStatus: () => Promise<void>;
  refreshGrayedOutStatus: () => Promise<void>; // New method
  isBusinessAccessible: (businessId: string) => boolean;
  isBusinessComingSoon: (businessId: string) => boolean;
  isBusinessGrayedOut: (businessId: string) => boolean; // New method
}

const defaultBusinessAccess: BusinessAccessibility = {
  marketing: true,
  carClub: true,
  clothing: true,
  league: true,
  world: true,
  education: true,
  careers: true,
  bgr8: true
};

const defaultComingSoon: BusinessComingSoon = {
  marketing: false,
  carClub: true,
  clothing: true,
  league: true,
  world: true,
  bgr8r: true,
  careers: true,
  bgr8: true
};

// Default values for grayed out setting
const defaultGrayedOut: BusinessGrayedOut = {
  marketing: false,
  carClub: false,
  clothing: false,
  league: false,
  world: false,
  education: false,
  careers: false,
  bgr8: false
};

const BusinessAccessContext = createContext<BusinessAccessContextType | undefined>(undefined);

export function useBusinessAccess() {
  const context = useContext(BusinessAccessContext);
  if (context === undefined) {
    throw new Error('useBusinessAccess must be used within a BusinessAccessProvider');
  }
  return context;
}

interface BusinessAccessProviderProps {
  children: ReactNode;
}

export function BusinessAccessProvider({ children }: BusinessAccessProviderProps) {
  const [businessAccess, setBusinessAccess] = useState<BusinessAccessibility>(defaultBusinessAccess);
  const [comingSoon, setComingSoon] = useState<BusinessComingSoon>(defaultComingSoon);
  const [grayedOut, setGrayedOut] = useState<BusinessGrayedOut>(defaultGrayedOut); // New state
  const [loading, setLoading] = useState(true);
  const { userProfile } = useAuth();

  const fetchBusinessAccess = async () => {
    try {
      setLoading(true);
      const settingsRef = doc(db, 'settings', 'businessAccess');
      const settingsDoc = await getDoc(settingsRef);
      
      if (settingsDoc.exists()) {
        setBusinessAccess(settingsDoc.data() as BusinessAccessibility);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching business access settings:', error);
      setLoading(false);
    }
  };

  const fetchComingSoonStatus = async () => {
    try {
      const comingSoonRef = doc(db, 'settings', 'comingSoon');
      const comingSoonDoc = await getDoc(comingSoonRef);
      
      if (comingSoonDoc.exists()) {
        setComingSoon(comingSoonDoc.data() as BusinessComingSoon);
      }
    } catch (error) {
      console.error('Error fetching coming soon settings:', error);
    }
  };

  // New method to fetch the grayed out settings
  const fetchGrayedOutStatus = async () => {
    try {
      const grayedOutRef = doc(db, 'settings', 'grayedOut');
      const grayedOutDoc = await getDoc(grayedOutRef);
      
      if (grayedOutDoc.exists()) {
        setGrayedOut(grayedOutDoc.data() as BusinessGrayedOut);
      }
    } catch (error) {
      console.error('Error fetching grayed out settings:', error);
    }
  };

  useEffect(() => {
    Promise.all([fetchBusinessAccess(), fetchComingSoonStatus(), fetchGrayedOutStatus()]);
  }, []);

  const refreshBusinessAccess = async () => {
    await fetchBusinessAccess();
  };

  const refreshComingSoonStatus = async () => {
    await fetchComingSoonStatus();
  };

  // New refresh method
  const refreshGrayedOutStatus = async () => {
    await fetchGrayedOutStatus();
  };

  const isBusinessAccessible = (businessId: string): boolean => {
    // Check if user is admin
    if (userProfile?.admin) {
      return true;
    }
    
    // Check if user is developer (safely handle potential missing property)
    if (userProfile && 'developer' in userProfile && (userProfile as Record<string, unknown>).developer) {
      return true;
    }
    
    // Otherwise, check the business access settings
    return businessAccess[businessId] ?? true; // Default to true if not found
  };

  const isBusinessComingSoon = (businessId: string): boolean => {
    // Check if the business is marked as "coming soon"
    return comingSoon[businessId] ?? false; // Default to false if not found
  };

  // New method to check if a business is grayed out
  const isBusinessGrayedOut = (businessId: string): boolean => {
    // Admin and developer users still see the grayed out indication, but
    // it should be clear to them that normal users will see a "coming soon" overlay
    return grayedOut[businessId] ?? false; // Default to false if not found
  };

  const value = {
    businessAccess,
    comingSoon,
    grayedOut,
    loading,
    refreshBusinessAccess,
    refreshComingSoonStatus,
    refreshGrayedOutStatus,
    isBusinessAccessible,
    isBusinessComingSoon,
    isBusinessGrayedOut
  };

  return (
    <BusinessAccessContext.Provider value={value}>
      {children}
    </BusinessAccessContext.Provider>
  );
} 