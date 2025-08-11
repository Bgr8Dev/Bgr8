import { doc, setDoc } from "firebase/firestore";
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
  admin: boolean;

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

  // Preferences
  preferences: {
    marketingEmails: boolean;
    notifications: boolean;
    orderUpdates: boolean;
    newProductAlerts: boolean;
    theme: 'light' | 'dark' | 'system';
    fontSize: 'small' | 'medium' | 'large';
    colorScheme: 'default' | 'high-contrast' | 'colorful';
    language: string;
    currency: string;
    timezone: string;
  };

  // bgr8 Platform Specific
  bgr8Memberships?: {
    marketing?: boolean;
    carClub?: boolean;
    clothing?: boolean;
    league?: boolean;
    charity?: boolean;
    education?: boolean;
    careers?: boolean;
    world?: boolean;
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

  // Security Settings
  security?: {
    twoFactorEnabled: boolean;
    lastPasswordChange?: Date;
    loginDevices?: string[];
  };

  // Privacy Settings
  privacy: {
    showProfile: boolean;
    activityStatus: boolean;
    dataCollection: boolean;
  };
}

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
    admin: false,
    ethnicity: 'N/A',
    nationality: 'N/A',
    preferences: {
      marketingEmails: true,
      notifications: true,
      orderUpdates: true,
      newProductAlerts: false,
      theme: 'dark',
      fontSize: 'medium',
      colorScheme: 'default',
      language: 'en',
      currency: 'GBP',
      timezone: 'UTC'
    },
    bgr8Memberships: {
      marketing: false,
      carClub: false,
      clothing: false,
      league: false,
      charity: false,
      education: false,
      careers: false,
      world: false
    },
    security: {
      twoFactorEnabled: false
    },
    privacy: {
      showProfile: true,
      activityStatus: true,
      dataCollection: true
    },
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