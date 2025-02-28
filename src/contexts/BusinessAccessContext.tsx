import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { UserProfile } from '../types/user';

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
  education: boolean;
  careers: boolean;
  bgr8: boolean;
  [key: string]: boolean;
}

interface BusinessAccessContextType {
  businessAccess: BusinessAccessibility;
  comingSoon: BusinessComingSoon;
  loading: boolean;
  refreshBusinessAccess: () => Promise<void>;
  refreshComingSoonStatus: () => Promise<void>;
  isBusinessAccessible: (businessId: string) => boolean;
  isBusinessComingSoon: (businessId: string) => boolean;
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
  education: true,
  careers: true,
  bgr8: true
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

  useEffect(() => {
    Promise.all([fetchBusinessAccess(), fetchComingSoonStatus()]);
  }, []);

  const refreshBusinessAccess = async () => {
    await fetchBusinessAccess();
  };

  const refreshComingSoonStatus = async () => {
    await fetchComingSoonStatus();
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

  const value = {
    businessAccess,
    comingSoon,
    loading,
    refreshBusinessAccess,
    refreshComingSoonStatus,
    isBusinessAccessible,
    isBusinessComingSoon
  };

  return (
    <BusinessAccessContext.Provider value={value}>
      {children}
    </BusinessAccessContext.Provider>
  );
} 