import { doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove, serverTimestamp, FieldValue } from 'firebase/firestore';
import { firestore } from '../firebase/firebase';
import { Timestamp } from 'firebase/firestore';
import { logAnalyticsEvent } from '../firebase/firebase';

export interface PasswordHistoryEntry {
  passwordHash: string;
  createdAt: Date;
  createdAtTimestamp: Timestamp | FieldValue; // Firestore timestamp
}

export interface PasswordHistoryDocument {
  userId: string;
  passwordHistory: PasswordHistoryEntry[];
  lastPasswordChange: Date;
  maxHistorySize: number;
}

export class PasswordHistoryService {
  private static readonly MAX_HISTORY_SIZE = 5; // Keep last 5 passwords
  private static readonly COLLECTION_NAME = 'passwordHistory';

  /**
   * Hash password using a simple hash function
   * Note: In production, use a proper cryptographic hash like bcrypt
   */
  private static async hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + 'bgr8_salt'); // Add salt
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Check if a password has been used recently
   */
  static async isPasswordRecentlyUsed(userId: string, newPassword: string): Promise<boolean> {
    try {
      const historyDoc = await this.getPasswordHistory(userId);
      if (!historyDoc) return false;

      const newPasswordHash = await this.hashPassword(newPassword);
      
      // Check if the new password hash exists in history
      return historyDoc.passwordHistory.some(entry => entry.passwordHash === newPasswordHash);
    } catch (error) {
      console.error('Error checking password history:', error);
      return false;
    }
  }

  /**
   * Get password history for a user
   */
  static async getPasswordHistory(userId: string): Promise<PasswordHistoryDocument | null> {
    try {
      const docRef = doc(firestore, this.COLLECTION_NAME, userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          ...data,
          passwordHistory: data.passwordHistory.map((entry: PasswordHistoryEntry & { createdAt: Timestamp }) => ({
            ...entry,
            createdAt: entry.createdAt.toDate()
          }))
        } as PasswordHistoryDocument;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting password history:', error);
      return null;
    }
  }

  /**
   * Add a new password to history
   */
  static async addPasswordToHistory(userId: string, newPassword: string): Promise<void> {
    try {
      const newPasswordHash = await this.hashPassword(newPassword);
      const now = new Date();
      
      // Get current history
      const currentHistory = await this.getPasswordHistory(userId);
      
      // Create new entry
      // Note: Cannot use serverTimestamp() inside arrays, so we use Timestamp.now()
      const newEntry: PasswordHistoryEntry = {
        passwordHash: newPasswordHash,
        createdAt: now,
        createdAtTimestamp: Timestamp.now()
      };

      if (currentHistory) {
        // Update existing document
        const docRef = doc(firestore, this.COLLECTION_NAME, userId);
        
        // Add new password to history
        await updateDoc(docRef, {
          passwordHistory: arrayUnion(newEntry),
          lastPasswordChange: now,
          lastPasswordChangeTimestamp: serverTimestamp()
        });

        // Check if we need to remove old entries
        const updatedHistory = await this.getPasswordHistory(userId);
        if (updatedHistory && updatedHistory.passwordHistory.length > this.MAX_HISTORY_SIZE) {
          // Remove oldest entries
          const sortedHistory = updatedHistory.passwordHistory.sort(
            (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
          );
          
          const entriesToRemove = sortedHistory.slice(0, updatedHistory.passwordHistory.length - this.MAX_HISTORY_SIZE);
          
          for (const entryToRemove of entriesToRemove) {
            await updateDoc(docRef, {
              passwordHistory: arrayRemove(entryToRemove)
            });
          }
        }
      } else {
        // Create new document
        const docRef = doc(firestore, this.COLLECTION_NAME, userId);
        const newHistoryDoc: PasswordHistoryDocument = {
          userId,
          passwordHistory: [newEntry],
          lastPasswordChange: now,
          maxHistorySize: this.MAX_HISTORY_SIZE
        };

        // Use Timestamp.now() for array entries (serverTimestamp() not supported in arrays)
        await setDoc(docRef, {
          ...newHistoryDoc,
          lastPasswordChangeTimestamp: serverTimestamp(),
          passwordHistory: [newEntry] // newEntry already has Timestamp.now() for createdAtTimestamp
        });
      }

      // Log analytics event
      logAnalyticsEvent('password_added_to_history', {
        userId,
        historySize: currentHistory ? currentHistory.passwordHistory.length + 1 : 1
      });

    } catch (error) {
      console.error('Error adding password to history:', error);
      throw new Error('Failed to update password history');
    }
  }

  /**
   * Clear password history for a user (for account deletion or security reset)
   */
  static async clearPasswordHistory(userId: string): Promise<void> {
    try {
      const docRef = doc(firestore, this.COLLECTION_NAME, userId);
      await setDoc(docRef, {
        userId,
        passwordHistory: [],
        lastPasswordChange: null,
        lastPasswordChangeTimestamp: null,
        maxHistorySize: this.MAX_HISTORY_SIZE,
        clearedAt: serverTimestamp()
      });

      logAnalyticsEvent('password_history_cleared', { userId });
    } catch (error) {
      console.error('Error clearing password history:', error);
      throw new Error('Failed to clear password history');
    }
  }

  /**
   * Get password history summary for admin purposes
   */
  static async getPasswordHistorySummary(userId: string): Promise<{
    totalPasswords: number;
    lastPasswordChange: Date | null;
    oldestPassword: Date | null;
  }> {
    try {
      const history = await this.getPasswordHistory(userId);
      
      if (!history || history.passwordHistory.length === 0) {
        return {
          totalPasswords: 0,
          lastPasswordChange: null,
          oldestPassword: null
        };
      }

      const sortedHistory = history.passwordHistory.sort(
        (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
      );

      return {
        totalPasswords: history.passwordHistory.length,
        lastPasswordChange: history.lastPasswordChange,
        oldestPassword: sortedHistory[0].createdAt
      };
    } catch (error) {
      console.error('Error getting password history summary:', error);
      return {
        totalPasswords: 0,
        lastPasswordChange: null,
        oldestPassword: null
      };
    }
  }

  /**
   * Validate that a new password meets history requirements
   */
  static async validateNewPassword(userId: string, newPassword: string): Promise<{
    isValid: boolean;
    reason?: string;
  }> {
    try {
      // Check if password is recently used
      const isRecentlyUsed = await this.isPasswordRecentlyUsed(userId, newPassword);
      
      if (isRecentlyUsed) {
        return {
          isValid: false,
          reason: 'You cannot reuse a recently used password. Please choose a different password.'
        };
      }

      return { isValid: true };
    } catch (error) {
      console.error('Error validating new password:', error);
      return {
        isValid: false,
        reason: 'Unable to validate password history. Please try again.'
      };
    }
  }
}
