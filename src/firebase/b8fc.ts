import { db } from './firebase';
import { collection, doc, setDoc, getDoc, getDocs, query, where, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { User } from 'firebase/auth';

// Types
interface TeamMember {
  uid: string;
  role: 'captain' | 'player';
  joinedAt: any; // Firebase Timestamp
  name: string;
  position?: string;
}

interface Team {
  id: string;
  name: string;
  captain: string; // UID of captain
  members: TeamMember[];
  createdAt: any; // Firebase Timestamp
  isPreset: boolean;
}

interface Match {
  id: string;
  homeTeam: string; // Team ID
  awayTeam: string; // Team ID
  date: any; // Firebase Timestamp
  location: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  score?: {
    home: number;
    away: number;
  };
}

// Collection References
const B8FC_COLLECTION = 'B8League/B8FC';
const teamsRef = collection(db, `${B8FC_COLLECTION}/teams`);
const matchesRef = collection(db, `${B8FC_COLLECTION}/matches`);
const playersRef = collection(db, `${B8FC_COLLECTION}/players`);

// Team Functions
export const joinTeam = async (teamId: string, user: User) => {
  const teamDoc = doc(teamsRef, teamId);
  const teamData = (await getDoc(teamDoc)).data() as Team;

  if (!teamData) {
    throw new Error('Team not found');
  }

  // Check if user is already in team
  if (teamData.members.some(member => member.uid === user.uid)) {
    throw new Error('You are already a member of this team');
  }

  const newMember: TeamMember = {
    uid: user.uid,
    role: 'player',
    joinedAt: serverTimestamp(),
    name: user.displayName || 'Anonymous Player'
  };

  await updateDoc(teamDoc, {
    members: [...teamData.members, newMember]
  });

  // Update player record
  await setDoc(doc(playersRef, user.uid), {
    teamId,
    name: user.displayName,
    joinedAt: serverTimestamp(),
    role: 'player'
  }, { merge: true });
};

export const createTeam = async (teamData: any, user: any) => {
  if (!user) {
    throw new Error('Must be signed in to create a team');
  }

  const teamsRef = collection(db, 'B8League/B8FC/teams');
  return addDoc(teamsRef, {
    ...teamData,
    createdAt: serverTimestamp() // This is fine as it's not in an array
  });
};

export const scheduleMatch = async (matchData: Omit<Match, 'id' | 'status'>) => {
  const newMatch = {
    ...matchData,
    status: 'scheduled' as const,
    createdAt: serverTimestamp()
  };

  return await addDoc(matchesRef, newMatch);
};

// Fetch Functions
export const getTeams = async () => {
  const teamsSnapshot = await getDocs(teamsRef);
  return teamsSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Team[];
};

export const getPlayerTeam = async (userId: string) => {
  const playerDoc = await getDoc(doc(playersRef, userId));
  if (!playerDoc.exists()) return null;

  const playerData = playerDoc.data();
  if (!playerData.teamId) return null;

  const teamDoc = await getDoc(doc(teamsRef, playerData.teamId));
  return teamDoc.exists() ? { id: teamDoc.id, ...teamDoc.data() } as Team : null;
};

export const getMatches = async (teamId?: string) => {
  let matchQuery = matchesRef;
  if (teamId) {
    matchQuery = query(
      matchesRef,
      where('homeTeam', '==', teamId || where('awayTeam', '==', teamId))
    );
  }

  const matchesSnapshot = await getDocs(matchQuery);
  return matchesSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Match[];
}; 