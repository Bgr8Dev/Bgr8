import { createContext, useState, useEffect, ReactNode } from 'react';
import { auth, db, logAnalyticsEvent } from '../firebase/firebase';
import { onAuthStateChanged, User, updatePassword, EmailAuthProvider, reauthenticateWithCredential, sendPasswordResetEmail } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { UserProfile } from '../utils/userProfile';

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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        // Log sign in event
        logAnalyticsEvent('user_login', {
          userId: user.uid,
          method: user.providerData[0]?.providerId
        });
        
        // Fetch user profile from Firestore
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUserProfile(userDoc.data() as UserProfile);
        }
      } else {
        setUserProfile(null);
        // Log sign out event
        logAnalyticsEvent('user_logout');
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Function to change user password
  const changePassword = async (currentPassword: string, newPassword: string) => {
    if (!currentUser || !currentUser.email) {
      throw new Error('No authenticated user found');
    }

    try {
      // Create credential with current password
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        currentPassword
      );

      // Re-authenticate user
      await reauthenticateWithCredential(currentUser, credential);
      
      // Update password
      await updatePassword(currentUser, newPassword);
      
      // Log password change event
      logAnalyticsEvent('password_changed', {
        userId: currentUser.uid
      });
    } catch (error: unknown) {
      // Rethrow with more descriptive messages based on error code
      if (error && typeof error === 'object' && 'code' in error) {
        const firebaseError = error as { code: string, message?: string };
        
        if (firebaseError.code === 'auth/wrong-password') {
          throw new Error('Current password is incorrect');
        } else if (firebaseError.code === 'auth/weak-password') {
          throw new Error('New password is too weak');
        } else if (firebaseError.code === 'auth/requires-recent-login') {
          throw new Error('Please sign in again before changing your password');
        } else {
          throw new Error(`Failed to change password: ${firebaseError.message || 'Unknown error'}`);
        }
      } else {
        throw new Error('Failed to change password: Unknown error');
      }
    }
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
    logAnalyticsEvent('password_reset_email_sent', { email });
  };

  const value = {
    currentUser,
    userProfile,
    loading,
    changePassword,
    resetPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
} 