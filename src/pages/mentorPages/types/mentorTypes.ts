import { MentorMenteeProfile, UserType, MENTOR, MENTEE, MatchResult, getName } from '../../../components/widgets/MentorAlgorithm/algorithm/matchUsers';
import { VerificationData } from '../../../types/verification';

export const MENTEE_MIN_AGE = 15;
export const MENTEE_MAX_AGE = 19;

export interface ProfileFormData {
  type?: UserType;
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
  calCom: string;
  hobbies: string[];
  ethnicity: string;
  religion: string;
  skills: string[];
  lookingFor: string[];
  industries: string[];
  userRef?: string;
  isMentor?: boolean;
  isMentee?: boolean;
  
  // Verification data (only for mentors)
  verification?: VerificationData;
}

export interface MentorAvailability {
  [key: string]: {
    available: boolean;
    nextSlot?: string;
  };
}

export interface EnhancedAvailability {
  [key: string]: {
    timeSlots: Array<{
      date: string;
      startTime: string;
      endTime: string;
      isAvailable: boolean;
    }>;
  };
}

export interface MentorBooking {
  id: string;
  menteeName: string;
  sessionDate: string;
  startTime: string;
  status: string;
}

export interface MentorBookings {
  [key: string]: MentorBooking[];
}

export interface ValidationErrors {
  [key: string]: string;
}

export interface SectionStatus {
  [key: string]: {
    completed: boolean;
    total: number;
  };
}

export interface FormProgress {
  completedFields: number;
  totalFields: number;
}

export type { MentorMenteeProfile, UserType, MatchResult };
export { MENTOR, MENTEE, getName };
