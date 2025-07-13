import { createContext } from 'react';
import type { User } from 'firebase/auth';
import type { UserProfile } from '../utils/userProfile';

export interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  userProfile: null,
  loading: true,
  changePassword: async () => {},
  resetPassword: async () => {}
}); 