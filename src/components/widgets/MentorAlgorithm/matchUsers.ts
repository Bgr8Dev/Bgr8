import { db } from '../../../firebase/firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';

export const MENTOR = 'mentor';
export const MENTEE = 'mentee';

export interface MentorMenteeProfile {
  name: string;
  email: string;
  phone: string;
  age: string;
  degree: string;
  educationLevel: string;
  county: string;
  currentProfession: string;
  pastProfessions: string[];
  linkedin: string;
  hobbies: string[];
  ethnicity: string;
  religion: string;
  skills: string[];
  lookingFor: string[];
  industries: string[];
  type: 'mentor' | 'mentee';
  [key: string]: string | string[];
}

export interface MatchResult {
  user: MentorMenteeProfile;
  score: number;
  reasons: string[];
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
  'skills': 9,
  'educationLevel': 3,
  'currentProfession': 3,
  'hobbies': 2,
  'county': 2,
  'age': 3,
  'religion': 1
};

const ageReasonMentee = {
  10: 'More experienced mentor',
  15: 'Notably more experienced mentor',
  20: 'Significantly more experienced mentor'
};

const ageReasonMentor = ageReasonMentee;

function lenIntersect<T>(a: T[], b: T[]): number {
  return a.filter(x => b.includes(x)).length;
}

// A weighted score for when currentUser and candidate match on a property key
function getSimpleScore(
  property: string, currentUser: MentorMenteeProfile,
  candidate: MentorMenteeProfile, reasons: string[], reason: string) {
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
    reasons: string[]) {
  let score = 0;
  let eduAddScore = Math.round(0.5 * SCORE_WEIGHTINGS["educationLevel"] * (
    educationLevelEncoding[currentUser.educationLevel]
    - educationLevelEncoding[candidate.educationLevel]));
  if (eduAddScore < 0) {
    if (currentUser.type === MENTOR)
      eduAddScore = 0
    else
      eduAddScore *= -1; // if a mentee has a lower education level it's good
  }
  if (eduAddScore > 0) {
    score += eduAddScore;
    reasons.push('Higher mentor education level');
  }
  return score;
}

// The maximum score contribution is SCORE_WEIGHTINGS['age']
function getAgeScore(
  currentUser: MentorMenteeProfile,
  candidate: MentorMenteeProfile,
  olderMentorPref: boolean,
  reasons: string[]) {
  let score = 0;
  const maxScore = SCORE_WEIGHTINGS['age'];
  const ageDiffPure = Number(currentUser.age) - Number(candidate.age);
  const ageDiff = Math.abs(ageDiffPure);
  const softAgeDiffLimit = 25;
  if (olderMentorPref) {
    if ((currentUser.age > candidate.age && currentUser.type == MENTEE)
      || (currentUser.age < candidate.age && currentUser.type == MENTOR)) {
      return 0; // if the mentor is younger, return 0. Unlikely, but...
    }
    let ageReason = currentUser.type == MENTOR ? ageReasonMentor : ageReasonMentee;
    for (const ageString in ageReason) {
      let age = Number(ageString);
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
      let ageReason = { 5: 'Very close in age', 10: 'Moderately close in age' };
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
  reasons: string[]) {
  let score = 0;
  const professionWeight = SCORE_WEIGHTINGS['currentProfession'];

  const userPast = currentUser.pastProfessions || [];
  const candidatePast = candidate.pastProfessions || [];
  const userCurrent = currentUser.currentProfession || '';
  const candidateCurrent = candidate.currentProfession || '';

  const fullMatch =
    userPast.includes(candidateCurrent) ||
    candidatePast.includes(userCurrent) ||
    lenIntersect(userPast, candidatePast) > 0;

  if (fullMatch) {
    score += professionWeight;
    reasons.push('Similar professional history');
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
      intersects(currentWordsCandidate, pastWordsUser);

    if (hasPartialMatch) {
      score += Math.floor(0.5 * professionWeight);
      if (score > 0)
        reasons.push('Potentially similar professional history');
    }
  }
  return score;
}

// Main matching function
export async function getBestMatchesForUser(uid: string): Promise<MatchResult[]> {
  // Get current user's profile
  const collectionName = 'mentorProgram';
  const userDoc = await getDoc(doc(db, collectionName, uid));
  if (!userDoc.exists()) throw new Error('User profile not found');
  const currentUser = userDoc.data() as MentorMenteeProfile;

  // Get all mentorProgram users
  const allDocs = await getDocs(collection(db, collectionName));
  const allUsers: MentorMenteeProfile[] = [];
  allDocs.forEach(docSnap => {
    if (docSnap.id !== uid) {
      allUsers.push(docSnap.data() as MentorMenteeProfile);
    }
  });

  // Determine who to match with
  const targetType = currentUser.type === MENTOR ? MENTEE : MENTOR;
  const candidates = allUsers.filter(u => u.type === targetType);

  // Scoring
  const results: MatchResult[] = candidates.map(candidate => {
    let score = 0;
    const reasons: string[] = [];

    // Education level
    score += getEducationScore(currentUser, candidate, reasons);

    // County (location)
    score += getSimpleScore(
      'county', currentUser, candidate, reasons, 'Same county');

    // Profession / Professional History
    score += getProfessionalScore(currentUser, candidate, reasons);

    // Age
    let olderMentorPreferred = true; // TODO: this should be decided on the website maybe under "YoE"
    score += getAgeScore(currentUser, candidate, olderMentorPreferred, reasons);

    // Religion [HIDDEN]
    if (currentUser.religion === candidate.religion)
      score += SCORE_WEIGHTINGS['religion'];

    // Hobbies/interests
    const hobbyMatches = lenIntersect(currentUser.hobbies, candidate.hobbies);
    score += hobbyMatches * SCORE_WEIGHTINGS['hobbies'];
    if (hobbyMatches > 0) reasons.push(`${hobbyMatches} hobby/interests matched`);

    // Skills match
    const skillMatches = currentUser.type === MENTOR
      ? lenIntersect(currentUser.skills, candidate.lookingFor)
      : lenIntersect(currentUser.lookingFor, candidate.skills);
    score += skillMatches * SCORE_WEIGHTINGS['skills'];
    if (skillMatches > 0) reasons.push(`${skillMatches} skill(s) matched`);

    return { user: candidate, score: score, reasons };
  });

  // Sort by score descending
  results.sort((a, b) => b.score - a.score);
  return results;
} 