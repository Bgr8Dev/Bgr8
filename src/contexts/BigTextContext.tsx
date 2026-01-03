import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { firestore } from '../firebase/firebase';

interface BigTextContextType {
  fontSize: number;
  setFontSize: (size: number) => void;
  isBigTextEnabled: boolean;
  toggleBigText: () => void;
  loading: boolean;
}

const BigTextContext = createContext<BigTextContextType | undefined>(undefined);

interface BigTextProviderProps {
  children: ReactNode;
}

export function BigTextProvider({ children }: BigTextProviderProps) {
  const [fontSize, setFontSizeState] = useState(16); // Default to 16px
  const [isBigTextEnabled, setIsBigTextEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  // Load preferences from localStorage on mount
  useEffect(() => {
    const savedFontSize = localStorage.getItem('fontSize');
    const savedBigTextEnabled = localStorage.getItem('bigTextEnabled');
    
    if (savedFontSize !== null) {
      setFontSizeState(parseInt(savedFontSize));
    }
    if (savedBigTextEnabled !== null) {
      setIsBigTextEnabled(JSON.parse(savedBigTextEnabled));
    }
    setLoading(false);
  }, []);

  const loadUserPreference = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      const userDoc = doc(firestore, 'users', currentUser.uid);
      const userSnap = await getDoc(userDoc);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        const firebaseFontSize = userData.fontSize;
        const firebaseBigTextEnabled = userData.bigTextEnabled;
        
        if (firebaseFontSize !== undefined) {
          setFontSizeState(firebaseFontSize);
          localStorage.setItem('fontSize', firebaseFontSize.toString());
        }
        if (firebaseBigTextEnabled !== undefined) {
          setIsBigTextEnabled(firebaseBigTextEnabled);
          localStorage.setItem('bigTextEnabled', JSON.stringify(firebaseBigTextEnabled));
        }
      }
    } catch (error) {
      console.error('Error loading user preferences:', error);
    }
  }, [currentUser]);

  // Load preference from Firebase when user is logged in
  useEffect(() => {
    if (currentUser) {
      loadUserPreference();
    }
  }, [currentUser, loadUserPreference]);

  const setFontSize = async (newFontSize: number) => {
    setFontSizeState(newFontSize);
    
    // Save to localStorage immediately
    localStorage.setItem('fontSize', newFontSize.toString());
    
    // Save to Firebase if user is logged in
    if (currentUser) {
      try {
        const userDoc = doc(firestore, 'users', currentUser.uid);
        await setDoc(userDoc, { fontSize: newFontSize }, { merge: true });
      } catch (error) {
        console.error('Error saving font size preference:', error);
      }
    }
  };

  const toggleBigText = async () => {
    const newValue = !isBigTextEnabled;
    setIsBigTextEnabled(newValue);
    
    // Save to localStorage immediately
    localStorage.setItem('bigTextEnabled', JSON.stringify(newValue));
    
    // Save to Firebase if user is logged in
    if (currentUser) {
      try {
        const userDoc = doc(firestore, 'users', currentUser.uid);
        await setDoc(userDoc, { bigTextEnabled: newValue }, { merge: true });
      } catch (error) {
        console.error('Error saving big text preference:', error);
      }
    }
  };

  const value = {
    fontSize,
    setFontSize,
    isBigTextEnabled,
    toggleBigText,
    loading
  };

  return (
    <BigTextContext.Provider value={value}>
      {children}
    </BigTextContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useBigText() {
  const context = useContext(BigTextContext);
  if (context === undefined) {
    throw new Error('useBigText must be used within a BigTextProvider');
  }
  return context;
}
