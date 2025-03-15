import { collection, addDoc, getDocs, query, where, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { logAnalyticsEvent } from "../firebase/firebase";

export interface Tournament {
  id?: string;
  tournamentName: string;
  sportType: 'football' | 'badminton' | 'esports';
  startDate: string;
  endDate: string;
  location: string;
  description: string;
  maxTeams: number;
  teams: {
    name: string;
    players: number;
  }[];
  tournamentFormat: string;
  eliminationType?: 'single' | 'double';
  createdAt: Date;
  createdBy?: string;
}

export const createTournament = async (tournamentData: Omit<Tournament, 'id' | 'createdAt'>, userId?: string) => {
  try {
    const tournamentWithMeta = {
      ...tournamentData,
      createdAt: new Date(),
      createdBy: userId || 'anonymous'
    };
    
    const docRef = await addDoc(collection(db, "tournaments"), tournamentWithMeta);
    
    // Log analytics event
    logAnalyticsEvent('tournament_created', {
      tournament_id: docRef.id,
      sport_type: tournamentData.sportType,
      tournament_format: tournamentData.tournamentFormat
    });
    
    return { 
      id: docRef.id,
      ...tournamentWithMeta
    };
  } catch (error) {
    console.error("Error creating tournament:", error);
    throw error;
  }
};

export const getTournamentsBySport = async (sportType: string) => {
  try {
    const tournamentsRef = collection(db, "tournaments");
    const q = query(tournamentsRef, where("sportType", "==", sportType));
    const querySnapshot = await getDocs(q);
    
    const tournaments: Tournament[] = [];
    querySnapshot.forEach((doc) => {
      tournaments.push({ 
        id: doc.id, 
        ...doc.data() as Omit<Tournament, 'id'>
      });
    });
    
    return tournaments;
  } catch (error) {
    console.error("Error getting tournaments:", error);
    throw error;
  }
};

export const getAllTournaments = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "tournaments"));
    
    const tournaments: Tournament[] = [];
    querySnapshot.forEach((doc) => {
      tournaments.push({ 
        id: doc.id, 
        ...doc.data() as Omit<Tournament, 'id'>
      });
    });
    
    return tournaments;
  } catch (error) {
    console.error("Error getting all tournaments:", error);
    throw error;
  }
};

export const updateTournament = async (tournamentId: string, tournamentData: Partial<Tournament>) => {
  try {
    const tournamentRef = doc(db, "tournaments", tournamentId);
    await updateDoc(tournamentRef, tournamentData);
    
    // Log analytics event
    logAnalyticsEvent('tournament_updated', {
      tournament_id: tournamentId
    });
    
    return { id: tournamentId, ...tournamentData };
  } catch (error) {
    console.error("Error updating tournament:", error);
    throw error;
  }
};

export const deleteTournament = async (tournamentId: string) => {
  try {
    await deleteDoc(doc(db, "tournaments", tournamentId));
    
    // Log analytics event
    logAnalyticsEvent('tournament_deleted', {
      tournament_id: tournamentId
    });
    
    return tournamentId;
  } catch (error) {
    console.error("Error deleting tournament:", error);
    throw error;
  }
};