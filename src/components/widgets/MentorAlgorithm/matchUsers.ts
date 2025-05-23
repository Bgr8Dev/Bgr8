import { db } from '../../../firebase/firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';

export interface MentorMenteeProfile {
  name: string;
  email: string;
  phone: string;
  age: string;
  degree: string;
  educationLevel: string;
  country: string;
  currentProfession: string;
  pastProfessions: string[];
  linkedin: string;
  hobbies: string[];
  ethnicity: string;
  religion: string;
  skills: string[];
  lookingFor: string[];
  type: 'mentor' | 'mentee';
}

export interface MatchResult {
  user: MentorMenteeProfile;
  score: number;
  reasons: string[];
}

// Helper: calculate intersection length
function intersection<T>(a: T[], b: T[]): number {
  return a.filter(x => b.includes(x)).length;
}

// Main matching function
export async function getBestMatchesForUser(uid: string): Promise<MatchResult[]> {
  // Get current user's profile
  const userDoc = await getDoc(doc(db, 'mentorProgram', uid));
  if (!userDoc.exists()) throw new Error('User profile not found');
  const currentUser = userDoc.data() as MentorMenteeProfile;

  // Get all mentorProgram users
  const allDocs = await getDocs(collection(db, 'mentorProgram'));
  const allUsers: MentorMenteeProfile[] = [];
  allDocs.forEach(docSnap => {
    if (docSnap.id !== uid) {
      allUsers.push(docSnap.data() as MentorMenteeProfile);
    }
  });

  // Determine who to match with
  const targetType = currentUser.type === 'mentor' ? 'mentee' : 'mentor';
  const candidates = allUsers.filter(u => u.type === targetType);

  // Scoring
  const results: MatchResult[] = candidates.map(candidate => {
    let score = 0;
    const reasons: string[] = [];

    // Skills match
    const skillMatches = currentUser.type === 'mentor'
      ? intersection(currentUser.skills, candidate.lookingFor)
      : intersection(currentUser.lookingFor, candidate.skills);
    score += skillMatches * 10;
    if (skillMatches > 0) reasons.push(`${skillMatches} skill(s) matched`);

    // Education level
    if (currentUser.educationLevel === candidate.educationLevel) {
      score += 3;
      reasons.push('Same education level');
    }

    // Country
    if (currentUser.country === candidate.country) {
      score += 2;
      reasons.push('Same country');
    }

    // Hobbies/interests
    const hobbyMatches = intersection(currentUser.hobbies, candidate.hobbies);
    score += hobbyMatches * 1;
    if (hobbyMatches > 0) reasons.push(`${hobbyMatches} hobby/interests matched`);

    // Profession
    if (currentUser.currentProfession === candidate.currentProfession) {
      score += 1;
      reasons.push('Same profession');
    }

    return { user: candidate, score, reasons };
  });

  // Sort by score descending
  results.sort((a, b) => b.score - a.score);
  return results;
} 