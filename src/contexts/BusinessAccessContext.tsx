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
  podcast: boolean;
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
  podcast: boolean;
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
  podcast: boolean;
  [key: string]: boolean;
}

// New interface for password protected pages
interface BusinessPasswordProtected {
  marketing: boolean;
  carClub: boolean;
  clothing: boolean;
  league: boolean;
  world: boolean;
  education: boolean;
  careers: boolean;
  bgr8: boolean;
  podcast: boolean;
  [key: string]: boolean;
}

// New interface for business passwords
interface BusinessPasswords {
  marketing: string;
  carClub: string;
  clothing: string;
  league: string;
  world: string;
  education: string;
  careers: string;
  bgr8: string;
  podcast: string;
  [key: string]: string;
}

interface BusinessAccessContextType {
  businessAccess: BusinessAccessibility;
  comingSoon: BusinessComingSoon;
  grayedOut: BusinessGrayedOut;
  passwordProtected: BusinessPasswordProtected;
  businessPasswords: BusinessPasswords;
  loading: boolean;
  refreshBusinessAccess: () => Promise<void>;
  refreshComingSoonStatus: () => Promise<void>;
  refreshGrayedOutStatus: () => Promise<void>;
  refreshPasswordProtectionStatus: () => Promise<void>;
  isBusinessAccessible: (businessId: string) => boolean;
  isBusinessComingSoon: (businessId: string) => boolean;
  isBusinessGrayedOut: (businessId: string) => boolean;
  isBusinessPasswordProtected: (businessId: string) => boolean;
  getBusinessPassword: (businessId: string) => string;
  validateBusinessPassword: (businessId: string, password: string) => boolean;
}

const defaultBusinessAccess: BusinessAccessibility = {
  marketing: true,
  carClub: true,
  clothing: true,
  league: true,
  world: true,
  education: true,
  careers: true,
  bgr8: true,
  podcast: true
};

const defaultComingSoon: BusinessComingSoon = {
  marketing: false,
  carClub: true,
  clothing: true,
  league: true,
  world: true,
  bgr8r: true,
  careers: true,
  bgr8: true,
  podcast: true
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
  bgr8: false,
  podcast: false
};

// Default values for password protection
const defaultPasswordProtected: BusinessPasswordProtected = {
  marketing: false,
  carClub: false,
  clothing: false,
  league: false,
  world: false,
  education: false,
  careers: false,
  bgr8: false,
  podcast: false
};

// Default values for business passwords
const defaultBusinessPasswords: BusinessPasswords = {
  marketing: '',
  carClub: '',
  clothing: '',
  league: '',
  world: '',
  education: '',
  careers: '',
  bgr8: '',
  podcast: ''
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
  const [grayedOut, setGrayedOut] = useState<BusinessGrayedOut>(defaultGrayedOut);
  const [passwordProtected, setPasswordProtected] = useState<BusinessPasswordProtected>(defaultPasswordProtected);
  const [businessPasswords, setBusinessPasswords] = useState<BusinessPasswords>(defaultBusinessPasswords);
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

  const fetchPasswordProtectionStatus = async () => {
    try {
      const passwordProtectedRef = doc(db, 'settings', 'passwordProtected');
      const passwordProtectedDoc = await getDoc(passwordProtectedRef);
      
      if (passwordProtectedDoc.exists()) {
        const data = passwordProtectedDoc.data();
        setPasswordProtected(data.passwordProtected || defaultPasswordProtected);
        setBusinessPasswords(data.businessPasswords || defaultBusinessPasswords);
      }
    } catch (error) {
      console.error('Error fetching password protection settings:', error);
    }
  };

  useEffect(() => {
    Promise.all([
      fetchBusinessAccess(), 
      fetchComingSoonStatus(), 
      fetchGrayedOutStatus(),
      fetchPasswordProtectionStatus()
    ]);
  }, []);

  const refreshBusinessAccess = async () => {
    await fetchBusinessAccess();
  };

  const refreshComingSoonStatus = async () => {
    await fetchComingSoonStatus();
  };

  const refreshGrayedOutStatus = async () => {
    await fetchGrayedOutStatus();
  };

  const refreshPasswordProtectionStatus = async () => {
    await fetchPasswordProtectionStatus();
  };

  const isBusinessAccessible = (businessId: string): boolean => {
    if (userProfile?.admin) {
      return true;
    }
    
    if (userProfile && 'developer' in userProfile && (userProfile as Record<string, unknown>).developer) {
      return true;
    }
    
    return businessAccess[businessId] ?? true;
  };

  const isBusinessComingSoon = (businessId: string): boolean => {
    return comingSoon[businessId] ?? false;
  };

  const isBusinessGrayedOut = (businessId: string): boolean => {
    return grayedOut[businessId] ?? false;
  };

  const isBusinessPasswordProtected = (businessId: string): boolean => {
    return passwordProtected[businessId] ?? false;
  };

  const getBusinessPassword = (businessId: string): string => {
    return businessPasswords[businessId] ?? '';
  };

  const validateBusinessPassword = (businessId: string, password: string): boolean => {
    if (!isBusinessPasswordProtected(businessId)) {
      return true;
    }
    
    return password === getBusinessPassword(businessId);
  };

  const value = {
    businessAccess,
    comingSoon,
    grayedOut,
    passwordProtected,
    businessPasswords,
    loading,
    refreshBusinessAccess,
    refreshComingSoonStatus,
    refreshGrayedOutStatus,
    refreshPasswordProtectionStatus,
    isBusinessAccessible,
    isBusinessComingSoon,
    isBusinessGrayedOut,
    isBusinessPasswordProtected,
    getBusinessPassword,
    validateBusinessPassword
  };

  return (
    <BusinessAccessContext.Provider value={value}>
      {children}
    </BusinessAccessContext.Provider>
  );
} 