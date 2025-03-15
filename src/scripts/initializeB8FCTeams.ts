import { db } from '../firebase/firebase';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';

const B8FC_COLLECTION = 'B8League/B8FC';
const teamsRef = collection(db, `${B8FC_COLLECTION}/teams`);

const presetTeams = [
  {
    id: 'rahul-fc',
    name: 'Rahul FC',
    isPreset: true,
    members: [],
    createdAt: serverTimestamp()
  },
  {
    id: 'mallusoc',
    name: 'MalluSoc',
    isPreset: true,
    members: [],
    createdAt: serverTimestamp()
  },
  {
    id: 'redshaw',
    name: 'RedShaw',
    isPreset: true,
    members: [],
    createdAt: serverTimestamp()
  },
  {
    id: 'muslamics',
    name: 'Muslamics',
    isPreset: true,
    members: [],
    createdAt: serverTimestamp()
  }
];

export const initializeB8FCTeams = async () => {
  try {
    console.log('Initializing B8FC preset teams...');
    
    // Create each preset team
    for (const team of presetTeams) {
      await setDoc(doc(teamsRef, team.id), team, { merge: true });
      console.log(`Created/updated team: ${team.name}`);
    }
    
    console.log('B8FC preset teams initialized successfully!');
  } catch (error) {
    console.error('Error initializing B8FC preset teams:', error);
    throw error;
  }
};

// Run the initialization if this script is executed directly
if (typeof window !== 'undefined') {
  initializeB8FCTeams();
} 