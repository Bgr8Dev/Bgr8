import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { db } from '../firebase/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from './AuthContext';

interface BusinessAccessibility {
  bgr8: boolean;
  [key: string]: boolean;
}

interface BusinessComingSoon {
  bgr8: boolean;
  [key: string]: boolean;
}

// New interface for grayed out pages
interface BusinessGrayedOut {
  bgr8: boolean;
  [key: string]: boolean;
}

// New interface for password protected pages
interface BusinessPasswordProtected {
  bgr8: boolean;
  bgr8r: boolean;
  [key: string]: boolean;
}

// New interface for business passwords
interface BusinessPasswords {
  bgr8: string;
  bgr8r: string;
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
  bgr8: true
};

const defaultComingSoon: BusinessComingSoon = {
  bgr8: true
};

// Default values for grayed out setting
const defaultGrayedOut: BusinessGrayedOut = {
  bgr8: false
};

// Default values for password protection
const defaultPasswordProtected: BusinessPasswordProtected = {
  bgr8: false,
  bgr8r: false
};

// Default values for business passwords
const defaultBusinessPasswords: BusinessPasswords = {
  bgr8: '',
  bgr8r: ''
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
      console.error('Error fetching coming soon status:', error);
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
      console.error('Error fetching grayed out status:', error);
    }
  };

  const fetchPasswordProtectionStatus = async () => {
    try {
      const passwordProtectedRef = doc(db, 'settings', 'passwordProtected');
      const passwordProtectedDoc = await getDoc(passwordProtectedRef);
      
      if (passwordProtectedDoc.exists()) {
        setPasswordProtected(passwordProtectedDoc.data() as BusinessPasswordProtected);
      }
      
      const passwordsRef = doc(db, 'settings', 'businessPasswords');
      const passwordsDoc = await getDoc(passwordsRef);
      
      if (passwordsDoc.exists()) {
        setBusinessPasswords(passwordsDoc.data() as BusinessPasswords);
      }
    } catch (error) {
      console.error('Error fetching password protection status:', error);
    }
  };

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
    if (!userProfile?.admin && businessAccess[businessId] === false) {
      return false;
    }
    return true;
  };

  const isBusinessComingSoon = (businessId: string): boolean => {
    return comingSoon[businessId] || false;
  };

  const isBusinessGrayedOut = (businessId: string): boolean => {
    return grayedOut[businessId] || false;
  };

  const isBusinessPasswordProtected = (businessId: string): boolean => {
    return passwordProtected[businessId] || false;
  };

  const getBusinessPassword = (businessId: string): string => {
    return businessPasswords[businessId] || '';
  };

  const validateBusinessPassword = (businessId: string, password: string): boolean => {
    const correctPassword = getBusinessPassword(businessId);
    return password === correctPassword;
  };

  useEffect(() => {
    fetchBusinessAccess();
    fetchComingSoonStatus();
    fetchGrayedOutStatus();
    fetchPasswordProtectionStatus();
  }, []);

  const value: BusinessAccessContextType = {
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