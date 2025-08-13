export interface UserProfile {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  photoURL?: string;
  phoneNumber?: string;
  dateCreated: Date;
  lastUpdated: Date;
  admin: boolean;
  developer: boolean;
  
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
    city: string;
    country: string;
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
  
  activityLog: {
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

export const createUserProfile = async (
  uid: string,
  email: string,
  firstName: string,
  lastName: string,
  additionalData: Partial<UserProfile> = {}
): Promise<UserProfile> => {
  const baseProfile: UserProfile = {
    uid,
    email,
    firstName,
    lastName,
    displayName: `${firstName} ${lastName}`,
    dateCreated: new Date(),
    lastUpdated: new Date(),
    admin: false,
    developer: false,
    ethnicity: 'N/A',
    nationality: 'N/A',
    activityLog: {
      lastLogin: new Date(),
      loginCount: 1
    }
  };

  const cleanAdditionalData = Object.entries(additionalData).reduce((acc, [key, value]) => {
    if (value !== undefined) {
      acc[key] = value;
    }
    return acc;
  }, {} as Record<string, unknown>);

  return {
    ...baseProfile,
    ...cleanAdditionalData
  };
} 