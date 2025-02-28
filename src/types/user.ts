export interface UserPreferences {
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
}

export interface UserSecurity {
  twoFactorEnabled: boolean;
}

export interface UserPrivacy {
  showProfile: boolean;
  activityStatus: boolean;
  dataCollection: boolean;
}

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
  
  preferences: UserPreferences;
  security: UserSecurity;
  privacy: UserPrivacy;
  
  b8Memberships: {
    marketing: boolean;
    carClub: boolean;
    clothing: boolean;
    league: boolean;
    world: boolean;
    education: boolean;
    careers: boolean;
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
  
  location?: {
    city: string;
    country: string;
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
    privacy: {
      showProfile: false,
      activityStatus: false,
      dataCollection: false
    },
    displayName: `${firstName} ${lastName}`,
    dateCreated: new Date(),
    lastUpdated: new Date(),
    admin: false,
    developer: false,
    preferences: {
      marketingEmails: true,
      notifications: true,
      theme: 'dark',
      language: 'en',
      timezone: 'UTC',
      currency: 'USD',
      orderUpdates: true,
      newProductAlerts: true,
      fontSize: 'medium',
      colorScheme: 'default'
    },
    b8Memberships: {
      marketing: false,
      carClub: false,
      clothing: false,
      league: false,
      world: false,
      education: false,
      careers: false
    },
    security: {
      twoFactorEnabled: false
    },
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