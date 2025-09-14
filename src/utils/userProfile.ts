import { doc, setDoc, getDoc } from "firebase/firestore";
import { firestore } from "../firebase/firebase";

export interface UserProfile {
  // Basic Info
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  photoURL?: string;
  phoneNumber?: string;
  dateCreated: Date;
  lastUpdated: Date;
  // Role-based access control
  roles: {
    admin: boolean;
    developer: boolean;
    committee: boolean;
    audit: boolean;
    marketing: boolean;
    'vetting-officer': boolean;
    'social-media': boolean;
    outreach: boolean;
    events: boolean;
    ambassador: boolean;
  };

  // Mentor/Mentee Profile References
  mentorProfileRef?: string; // Reference to users/{uid}/mentorProgram/profile
  menteeProfileRef?: string; // Reference to users/{uid}/mentorProgram/profile

  // Demographic Info
  ethnicity?: string;
  nationality?: string;
  secondNationality?: string;
  countryOfOrigin?: string;

  // Additional Personal Info
  dateOfBirth?: string;
  gender?: string;
  location?: {
    address?: string;
    city?: string;
    country?: string;
    postcode?: string;
  };

  // Social Media
  socialMedia?: {
    instagram?: string;
    linkedin?: string;
    twitter?: string;
    youtube?: string;
  };

  // Education Info
  education?: {
    isStudent?: boolean;
    school?: string;
    householdIncome?: string;
    qualifications?: string[];
  };

  // Career Info
  career?: {
    currentPosition?: string;
    company?: string;
    industry?: string;
    experience?: string;
    skills?: string[];
    cv?: string; // URL to stored CV
    professionalWebsite?: string;
  };

  // Car Club Info
  carClub?: {
    carMake?: string;
    carModel?: string;
    numberPlate?: string;
    membershipType?: string;
    joinDate?: Date;
  };

  // Activity Tracking
  activityLog?: {
    lastLogin: Date;
    loginCount: number;
    eventsAttended?: string[];
    purchaseHistory?: {
      orderId: string;
      date: Date;
      items: string[];
      total: number;
    }[];
  };
}

// Legacy user profile type for backward compatibility
interface LegacyUserProfile {
  admin?: boolean;
  developer?: boolean;
}

// Role checking utility functions
export const hasRole = (userProfile: UserProfile | null, role: keyof UserProfile['roles']): boolean => {
  if (!userProfile) return false;
  
  // Check new roles object first
  if (userProfile.roles?.[role] === true) return true;
  
  // Backward compatibility: check old admin/developer fields
  const legacyProfile = userProfile as UserProfile & LegacyUserProfile;
  if (role === 'admin' && legacyProfile.admin === true) return true;
  if (role === 'developer' && legacyProfile.developer === true) return true;
  
  return false;
};

export const hasAnyRole = (userProfile: UserProfile | null, roles: (keyof UserProfile['roles'])[]): boolean => {
  if (!userProfile) return false;
  
  // Check if any of the requested roles are present
  return roles.some(role => hasRole(userProfile, role));
};

export const hasAllRoles = (userProfile: UserProfile | null, roles: (keyof UserProfile['roles'])[]): boolean => {
  if (!userProfile) return false;
  return roles.every(role => hasRole(userProfile, role));
};

export const getUserRoles = (userProfile: UserProfile | null): (keyof UserProfile['roles'])[] => {
  if (!userProfile?.roles) return [];
  return Object.entries(userProfile.roles)
    .filter(([, hasRole]) => hasRole)
    .map(([role]) => role as keyof UserProfile['roles']);
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const userRef = doc(firestore, 'users', uid);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      return userDoc.data() as UserProfile;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
};

export const createUserProfile = async (
  uid: string,
  email: string,
  firstName: string,
  lastName: string,
  additionalData: Partial<UserProfile> = {}
) => {
  const userRef = doc(firestore, 'users', uid);
  
  const baseProfile: UserProfile = {
    uid,
    email,
    firstName,
    lastName,
    displayName: `${firstName} ${lastName}`,
    dateCreated: new Date(),
    lastUpdated: new Date(),
    roles: {
      admin: false,
      developer: false,
      committee: false,
      audit: false,
      marketing: false,
      'vetting-officer': false,
      'social-media': false,
      outreach: false,
      events: false
    },
    ethnicity: 'N/A',
    nationality: 'N/A',
    activityLog: {
      lastLogin: new Date(),
      loginCount: 1
    }
  };

  // Remove any undefined values from additionalData
  const cleanAdditionalData = Object.entries(additionalData).reduce((acc, [key, value]) => {
    if (value !== undefined) {
      acc[key] = value;
    }
    return acc;
  }, {} as Record<string, unknown>);

  // Merge base profile with cleaned additional data
  const fullProfile = {
    ...baseProfile,
    ...cleanAdditionalData
  };

  try {
    await setDoc(userRef, fullProfile);
    return fullProfile;
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
}; 