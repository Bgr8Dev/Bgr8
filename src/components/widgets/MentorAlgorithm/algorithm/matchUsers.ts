import { firestore } from '../../../../firebase/firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { VerificationData } from '../../../../types/verification';

export type UserType = 'mentor' | 'mentee';
export const MENTOR = 'mentor';
export const MENTEE = 'mentee';

export interface MentorMenteeProfile {
  uid: string;
  userRef: string; // Reference back to the user document (users/{uid})
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  age: string;
  degree: string;
  educationLevel: string;
  county: string;
  profession: string;
  pastProfessions: string[];
  linkedin: string;
  calCom: string; // Cal.com URL for mentors
  hobbies: string[];
  ethnicity: string;
  religion: string;
  skills: string[];
  lookingFor: string[];
  industries: string[];
  isMentor: boolean;
  isMentee: boolean;
  isGenerated?: boolean; // Flag to identify generated profiles
  
  // Verification data (only for mentors)
  verification?: VerificationData;
  
  [key: string]: string | string[] | boolean | VerificationData | undefined;
}

export interface MatchResult {
  user: MentorMenteeProfile;
  score: number;
  percentage: number; // Add percentage field
  reasons: string[];
}

export function getName(profile: MentorMenteeProfile): string {
  return `${profile.firstName} ${profile.lastName}`;
}

export function getDisplayName(profile: MentorMenteeProfile | undefined, id: string): string {
  if (profile)
    return getName(profile);
  else 
    return `Mentor ${id.slice(0, 8)}`;
}

const educationLevelEncoding: { [level: string]: number } = {
  'GCSEs': 0,
  'A-Levels': 1,
  'BTEC': 1,
  'Foundation Degree': 2,
  "Bachelor's Degree": 3,
  "Master's Degree": 4,
  'Doctorate/PhD': 5,
  'NVQ/SVQ': 3,
  'Apprenticeship': 3,
  'Other': 1
};

const SCORE_WEIGHTINGS: { [feature: string]: number } = {
  'profession': 20,
  'skills': 15,
  'industries': 10,
  'educationLevel': 6,
  'hobbies': 4,
  'county': 4,
  'age': 6,
  'religion': 2
};

const ageReasonMenteeExpPref = {
  10: 'More experienced mentor',
  15: 'Notably more experienced mentor',
  20: 'Significantly more experienced mentor'
};

const ageReasonMenteeClosePref = { 
  5: 'Very close in age', 
  10: 'Moderately close in age'
};

export const educationLevelReasonIDs = ["education level"]
export const ageCloseReasonIDs = ["in age"]
export const ageExperiencedMentorReasonIDs = ["experienced mentor"];
export const ageReasonIDs = [...ageCloseReasonIDs, ...ageExperiencedMentorReasonIDs];
export const professionReasonIDs = ["profession matched"];
export const hobbiesReasonIDs = ["hobby/interests matched"];
export const industriesReasonIDs = ["industry matched", "industries matched"];
export const skillsReasonIDs = ["skill(s) matched"];
export const countyReasonIDs = ["county"];

export function checkReasonType(reasonIDs: string[], reason: string): boolean {
  return reasonIDs.some(id => reason.includes(id));
}

function lenIntersect<T>(a: T[], b: T[]): number {
  return a.filter(x => b.includes(x)).length;
}

// A weighted score for when currentUser and candidate match on a property key
function getSimpleScore(
  property: string, currentUser: MentorMenteeProfile,
  candidate: MentorMenteeProfile, reasons: string[], reason: string): number {
  let score = 0;
  if (currentUser[property] === candidate[property]) {
    score += SCORE_WEIGHTINGS[property];
  }
  if (score > 0) reasons.push(reason);
  return score;
}

function getEducationScore(
    currentUser: MentorMenteeProfile,
    candidate: MentorMenteeProfile,
    reasons: string[]): number {
  let score = 0;
  let eduAddScore = Math.round(0.5 * SCORE_WEIGHTINGS["educationLevel"] * (
    educationLevelEncoding[currentUser.educationLevel]
    - educationLevelEncoding[candidate.educationLevel]));
  if (eduAddScore < 0) {
    if (currentUser.isMentor)
      eduAddScore = 0
    else
      eduAddScore *= -1; // if a mentee has a lower education level it's good
  }
  if (eduAddScore > 0) {
    score += eduAddScore;
    reasons.push(`Higher mentor ${educationLevelReasonIDs[0]}`);
  }
  return score;
}

// The maximum score contribution is SCORE_WEIGHTINGS['age']
function getAgeScore(
  currentUser: MentorMenteeProfile,
  candidate: MentorMenteeProfile,
  olderMentorPref: boolean,
  reasons: string[]): number {
  let score = 0;
  const maxScore = SCORE_WEIGHTINGS['age'];
  const ageDiffPure = Number(currentUser.age) - Number(candidate.age);
  const ageDiff = Math.abs(ageDiffPure);
  const softAgeDiffLimit = 25;
  if (olderMentorPref) {
    if ((currentUser.age > candidate.age && currentUser.isMentee)
      || (currentUser.age < candidate.age && currentUser.isMentor)) {
      return 0; // if the mentor is younger, return 0. Unlikely, but...
    }
    const ageReason = ageReasonMenteeExpPref;
    for (const ageString in ageReason) {
      const age = Number(ageString);
      if (age > ageDiff) {
        reasons.push(ageReason[age as keyof typeof ageReason]);
        break;
      }
    }
    score = Math.min(maxScore, Math.ceil(maxScore * (ageDiff / softAgeDiffLimit)));
  } else {
    if (ageDiff < softAgeDiffLimit) {
      score = Math.max(
        Math.ceil(maxScore - ((ageDiff * maxScore) / softAgeDiffLimit)), 0);
      const ageReason = ageReasonMenteeClosePref;
      for (const age in ageReason) {
        if (Number(age) < ageDiff) {
          reasons.push(ageReason[Number(age) as keyof typeof ageReason]);
          break;
        }
      }
    }
  }
  return score;
}

function getProfessionalScore(
  currentUser: MentorMenteeProfile,
  candidate: MentorMenteeProfile,
  reasons: string[]): number{
  let score = 0;
  const professionWeight = SCORE_WEIGHTINGS['profession'];

  const userPast = currentUser.pastProfessions || [];
  const candidatePast = candidate.pastProfessions || [];
  const userCurrent = currentUser.profession || '';
  const candidateCurrent = candidate.profession || '';

  const fullMatch =
    userPast.includes(candidateCurrent) ||
    candidatePast.includes(userCurrent) ||
    currentUser.profession === candidate.profession ||
    lenIntersect(userPast, candidatePast) > 0;

  if (fullMatch) {
    score += professionWeight;
    reasons.push(`Desired ${professionReasonIDs[0]}`);
  } else {
    const tokenize = (text: string): string[] =>
      text.toLowerCase().split(/\s+/).filter(Boolean);

    const currentWordsUser = tokenize(userCurrent);
    const currentWordsCandidate = tokenize(candidateCurrent);
    const pastWordsUser = tokenize(userPast.join(' '));
    const pastWordsCandidate = tokenize(candidatePast.join(' '));

    const intersects = (a: string[], b: string[]) =>
      a.some(word => b.includes(word));

    const hasPartialMatch =
      intersects(currentWordsUser, pastWordsCandidate) ||
      intersects(currentWordsCandidate, pastWordsUser) ||
      intersects(currentWordsUser, currentWordsCandidate);

    if (hasPartialMatch) {
      score += Math.floor(0.5 * professionWeight);
      if (score > 0)
        reasons.push(`Potentially desired ${professionReasonIDs[0]}`);
    }
  }
  return score;
}

// Main matching function
export async function getBestMatchesForUser(uid: string, olderMentorPreferred: boolean = true): Promise<MatchResult[]> {
  console.log('Algorithm: Starting matching process for user:', uid);
  
  // Get current user's profile from subcollection
  const userDoc = await getDoc(doc(firestore, 'users', uid, 'mentorProgram', 'profile'));
  if (!userDoc.exists()) throw new Error('User profile not found');
  const currentUser = userDoc.data() as MentorMenteeProfile;
  
  console.log('Algorithm: Current user profile:', currentUser);
  console.log('Algorithm: Current user isMentor:', currentUser.isMentor, 'isMentee:', currentUser.isMentee);

  // Get all users and check their mentorProgram subcollections
  const allUsersDocs = await getDocs(collection(firestore, 'users'));
  const allUsers: MentorMenteeProfile[] = [];
  
  for (const userDoc of allUsersDocs.docs) {
    if (userDoc.id !== uid) {
      try {
        const mentorProgramDoc = await getDoc(doc(firestore, 'users', userDoc.id, 'mentorProgram', 'profile'));
        if (mentorProgramDoc.exists()) {
          const data = mentorProgramDoc.data() as MentorMenteeProfile;
          allUsers.push({ ...data, uid: userDoc.id });
        }
      } catch (error) {
        console.error(`Error fetching mentor program for user ${userDoc.id}:`, error);
      }
    }
  }

  console.log('Algorithm: Found', allUsers.length, 'total users with profiles');

  // Determine who to match with
  const candidates = allUsers.filter(u => u.isMentor === !currentUser.isMentor);
  
  console.log('Algorithm: Found', candidates.length, 'candidates for matching');
  console.log('Algorithm: Candidates:', candidates.map(c => ({ 
    uid: c.uid, 
    name: `${c.firstName} ${c.lastName}`, 
    isMentor: c.isMentor, 
    isMentee: c.isMentee 
  })));

  // Calculate match scores for all candidates
  const results: MatchResult[] = [];
  for (const candidate of candidates) {
    const matchResult = await calculateMatchScore(currentUser, candidate, olderMentorPreferred);
    results.push(matchResult);
  }

  // Sort by percentage descending (highest match first)
  results.sort((a, b) => b.percentage - a.percentage);
  
  // Filter out very low matches (below 10%) to avoid showing irrelevant results
  const filteredResults = results.filter(result => result.percentage >= 10);
  
  console.log('Algorithm: Final results with percentages:', filteredResults.map(r => ({ 
    name: `${r.user.firstName} ${r.user.lastName}`, 
    score: r.score,
    percentage: r.percentage,
    reasons: r.reasons 
  })));
  
  return filteredResults;
}

// Function to calculate match score for a single profile
export async function calculateMatchScore(
  currentUser: MentorMenteeProfile, 
  candidate: MentorMenteeProfile, 
  olderMentorPreferred: boolean = true
): Promise<MatchResult> {
  let score = 0;
  const reasons: string[] = [];

  // Education level
  score += getEducationScore(currentUser, candidate, reasons);

  // County (location)
  score += getSimpleScore(
    'county', currentUser, candidate, reasons, `Same ${countyReasonIDs[0]}`);

  // Profession / Professional History
  score += getProfessionalScore(currentUser, candidate, reasons);

  // Age
  score += getAgeScore(currentUser, candidate, olderMentorPreferred, reasons);

  // Religion [HIDDEN]
  if (currentUser.religion === candidate.religion)
    score += SCORE_WEIGHTINGS['religion'];

  // Hobbies/interests
  const hobbyMatches = lenIntersect(currentUser.hobbies, candidate.hobbies);
  score += hobbyMatches * SCORE_WEIGHTINGS['hobbies'];
  if (hobbyMatches > 0) reasons.push(`${hobbyMatches} ${hobbiesReasonIDs[0]}`);

  // Skills match
  const skillMatches = currentUser.isMentor
    ? lenIntersect(currentUser.skills, candidate.lookingFor)
    : lenIntersect(currentUser.lookingFor, candidate.skills);
  score += skillMatches * SCORE_WEIGHTINGS['skills'];
  if (skillMatches > 0) reasons.push(`${skillMatches} ${skillsReasonIDs[0]}`);

  // Industries match
  const industryMatches = lenIntersect(currentUser.industries, candidate.industries);
  if (industryMatches == 1)
    reasons.push(`1 ${industriesReasonIDs[0]}`);
  else if (industryMatches > 1)
    reasons.push(`${industryMatches} ${industriesReasonIDs[1]}`);
  score += industryMatches * SCORE_WEIGHTINGS['industries'];

  console.log(`Algorithm: Candidate ${candidate.firstName} ${candidate.lastName} scored ${score} with reasons:`, reasons);

  // Calculate maximum possible score for percentage calculation
  const maxPossibleScore = Object.values(SCORE_WEIGHTINGS).reduce((sum, weight) => sum + weight, 0);
  
  // Calculate percentage
  const percentage = Math.max(0, Math.min(100, Math.round((score / maxPossibleScore) * 100)));

  return { 
    user: candidate, 
    score: score, 
    percentage: percentage, 
    reasons: reasons 
  };
} 