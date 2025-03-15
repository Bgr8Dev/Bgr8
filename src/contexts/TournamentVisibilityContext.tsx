import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { db } from '../firebase/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from './AuthContext';

interface TournamentVisibilityContextType {
  showTournaments: boolean;
  loading: boolean;
  refreshTournamentVisibility: () => Promise<void>;
}

const TournamentVisibilityContext = createContext<TournamentVisibilityContextType | undefined>(undefined);

export function useTournamentVisibility() {
  const context = useContext(TournamentVisibilityContext);
  if (context === undefined) {
    throw new Error('useTournamentVisibility must be used within a TournamentVisibilityProvider');
  }
  return context;
}

interface TournamentVisibilityProviderProps {
  children: ReactNode;
}

export function TournamentVisibilityProvider({ children }: TournamentVisibilityProviderProps) {
  const [showTournaments, setShowTournaments] = useState(true); // Default to showing tournaments
  const [loading, setLoading] = useState(true);
  const { userProfile } = useAuth();

  const fetchTournamentVisibility = async () => {
    try {
      setLoading(true);
      const settingsRef = doc(db, 'settings', 'b8League');
      const settingsDoc = await getDoc(settingsRef);
      
      if (settingsDoc.exists() && settingsDoc.data().showTournaments !== undefined) {
        // If the user is an admin or developer, always show tournaments regardless of settings
        if (userProfile?.admin || (userProfile && 'developer' in userProfile)) {
          setShowTournaments(true);
        } else {
          // For regular users, respect the setting
          setShowTournaments(settingsDoc.data().showTournaments);
        }
      } else {
        // Default to showing tournaments if the setting doesn't exist
        setShowTournaments(true);
      }
    } catch (error) {
      console.error('Error fetching tournament visibility settings:', error);
      // Default to showing tournaments on error
      setShowTournaments(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTournamentVisibility();
  }, [userProfile]);

  const refreshTournamentVisibility = async () => {
    await fetchTournamentVisibility();
  };

  const value = {
    showTournaments,
    loading,
    refreshTournamentVisibility
  };

  return (
    <TournamentVisibilityContext.Provider value={value}>
      {children}
    </TournamentVisibilityContext.Provider>
  );
} 