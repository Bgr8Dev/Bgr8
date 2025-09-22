import { doc, getDoc, setDoc, updateDoc, serverTimestamp, increment, Timestamp } from 'firebase/firestore';
import { firestore } from '../firebase/firebase';
import { logAnalyticsEvent } from '../firebase/firebase';

export interface LockoutEntry {
  userId: string;
  email: string;
  failedAttempts: number;
  firstFailedAttempt: Date;
  lastFailedAttempt: Date;
  isLocked: boolean;
  lockoutExpiresAt: Date | null;
  lockoutReason: string | null;
  ipAddress?: string;
  userAgent?: string;
  unlockToken?: string;
  permanentLockout: boolean;
  totalLockouts: number;
  createdAt: Date;
  lastUpdated: Date;
  lastFailedAttemptTimestamp?: Timestamp;
  lastUpdatedTimestamp?: Timestamp;
}

export interface LockoutPolicy {
  maxAttempts: number;
  lockoutDuration: number; // in minutes
  progressiveLockout: boolean;
  maxLockoutDuration: number; // in minutes
  permanentLockoutThreshold: number; // number of lockouts before permanent
  ipBasedLockout: boolean;
  deviceBasedLockout: boolean;
}

export class AccountLockoutService {
  private static readonly COLLECTION_NAME = 'accountLockouts';
  private static readonly DEFAULT_POLICY: LockoutPolicy = {
    maxAttempts: 5,
    lockoutDuration: 15, // 15 minutes
    progressiveLockout: true,
    maxLockoutDuration: 1440, // 24 hours
    permanentLockoutThreshold: 10, // 10 lockouts
    ipBasedLockout: true,
    deviceBasedLockout: false
  };

  /**
   * Generate a unique unlock token
   */
  private static generateUnlockToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Get client information for tracking
   */
  private static getClientInfo(): { ipAddress?: string; userAgent?: string } {
    return {
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      // Note: In a real application, you'd get IP from server-side
      // This is just a placeholder for client-side tracking
      ipAddress: undefined
    };
  }

  /**
   * Record a failed login attempt
   */
  static async recordFailedAttempt(
    userId: string, 
    email: string, 
    reason: string = 'invalid_credentials'
  ): Promise<{ isLocked: boolean; lockoutExpiresAt: Date | null; attemptsRemaining: number }> {
    try {
      const docRef = doc(firestore, this.COLLECTION_NAME, userId);
      const docSnap = await getDoc(docRef);
      
      const now = new Date();
      const clientInfo = this.getClientInfo();
      
      if (docSnap.exists()) {
        // Update existing lockout entry
        const existingData = docSnap.data() as LockoutEntry;
        const newFailedAttempts = existingData.failedAttempts + 1;
        
        // Check if account is already locked
        if (existingData.isLocked && existingData.lockoutExpiresAt) {
          const lockoutExpired = now > existingData.lockoutExpiresAt;
          if (!lockoutExpired) {
            return {
              isLocked: true,
              lockoutExpiresAt: existingData.lockoutExpiresAt,
              attemptsRemaining: 0
            };
          }
          // Lockout expired, reset but keep history
        }

        // Calculate lockout duration (progressive if enabled)
        let lockoutDuration = this.DEFAULT_POLICY.lockoutDuration;
        if (this.DEFAULT_POLICY.progressiveLockout && existingData.totalLockouts > 0) {
          lockoutDuration = Math.min(
            lockoutDuration * Math.pow(2, existingData.totalLockouts),
            this.DEFAULT_POLICY.maxLockoutDuration
          );
        }

        const shouldLock = newFailedAttempts >= this.DEFAULT_POLICY.maxAttempts;
        const lockoutExpiresAt = shouldLock ? new Date(now.getTime() + lockoutDuration * 60 * 1000) : null;
        const isPermanentLockout = existingData.totalLockouts >= this.DEFAULT_POLICY.permanentLockoutThreshold;

        const updateData: Partial<LockoutEntry> = {
          failedAttempts: newFailedAttempts,
          lastFailedAttempt: now,
          // lastFailedAttemptTimestamp: serverTimestamp(),
          lastUpdated: now,
          // lastUpdatedTimestamp: serverTimestamp(),
          ...clientInfo
        };

        if (shouldLock) {
          updateData.isLocked = true;
          updateData.lockoutExpiresAt = lockoutExpiresAt;
          updateData.lockoutReason = reason;
          updateData.unlockToken = this.generateUnlockToken();
          
          if (isPermanentLockout) {
            updateData.permanentLockout = true;
            updateData.lockoutExpiresAt = null; // No expiry for permanent lockouts
          }
        }

        await updateDoc(docRef, {
          ...updateData,
          ...(shouldLock ? { totalLockouts: increment(1) } : {}),
          lockoutExpiresAtTimestamp: lockoutExpiresAt ? serverTimestamp() : null
        });

        // Log analytics event
        logAnalyticsEvent('failed_login_attempt', {
          userId,
          email,
          failedAttempts: newFailedAttempts,
          isLocked: shouldLock,
          permanentLockout: isPermanentLockout,
          reason
        });

        return {
          isLocked: shouldLock,
          lockoutExpiresAt,
          attemptsRemaining: Math.max(0, this.DEFAULT_POLICY.maxAttempts - newFailedAttempts)
        };

      } else {
        // Create new lockout entry
        const lockoutDuration = this.DEFAULT_POLICY.lockoutDuration;
        const shouldLock = 1 >= this.DEFAULT_POLICY.maxAttempts; // First attempt
        const lockoutExpiresAt = shouldLock ? new Date(now.getTime() + lockoutDuration * 60 * 1000) : null;

        const newLockoutEntry: LockoutEntry = {
          userId,
          email,
          failedAttempts: 1,
          firstFailedAttempt: now,
          lastFailedAttempt: now,
          isLocked: shouldLock,
          lockoutExpiresAt,
          lockoutReason: shouldLock ? reason : null,
          permanentLockout: false,
          totalLockouts: shouldLock ? 1 : 0,
          unlockToken: shouldLock ? this.generateUnlockToken() : undefined,
          createdAt: now,
          lastUpdated: now,
          ...clientInfo
        };

        await setDoc(docRef, {
          ...newLockoutEntry,
          firstFailedAttemptTimestamp: serverTimestamp(),
          lastFailedAttemptTimestamp: serverTimestamp(),
          lockoutExpiresAtTimestamp: lockoutExpiresAt ? serverTimestamp() : null,
          createdAtTimestamp: serverTimestamp(),
          lastUpdatedTimestamp: serverTimestamp()
        });

        logAnalyticsEvent('failed_login_attempt', {
          userId,
          email,
          failedAttempts: 1,
          isLocked: shouldLock,
          permanentLockout: false,
          reason
        });

        return {
          isLocked: shouldLock,
          lockoutExpiresAt,
          attemptsRemaining: Math.max(0, this.DEFAULT_POLICY.maxAttempts - 1)
        };
      }
    } catch (error) {
      console.error('Error recording failed attempt:', error);
      throw new Error('Failed to record login attempt');
    }
  }

  /**
   * Clear failed attempts after successful login
   */
  static async clearFailedAttempts(userId: string): Promise<void> {
    try {
      const docRef = doc(firestore, this.COLLECTION_NAME, userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const existingData = docSnap.data() as LockoutEntry;
        
        await updateDoc(docRef, {
          failedAttempts: 0,
          isLocked: false,
          lockoutExpiresAt: null,
          lockoutExpiresAtTimestamp: null,
          lockoutReason: null,
          unlockToken: null,
          lastUpdated: new Date(),
          lastUpdatedTimestamp: serverTimestamp(),
          lastSuccessfulLogin: new Date(),
          lastSuccessfulLoginTimestamp: serverTimestamp()
        });

        logAnalyticsEvent('successful_login_after_failures', {
          userId,
          previousFailedAttempts: existingData.failedAttempts,
          totalLockouts: existingData.totalLockouts
        });
      }
    } catch (error) {
      console.error('Error clearing failed attempts:', error);
      // Don't throw error as this shouldn't block successful login
    }
  }

  /**
   * Check if account is currently locked
   */
  static async isAccountLocked(userId: string): Promise<{
    isLocked: boolean;
    lockoutExpiresAt: Date | null;
    isPermanent: boolean;
    reason: string | null;
  }> {
    try {
      const docRef = doc(firestore, this.COLLECTION_NAME, userId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return {
          isLocked: false,
          lockoutExpiresAt: null,
          isPermanent: false,
          reason: null
        };
      }

      const data = docSnap.data() as LockoutEntry;
      
      // Check if lockout has expired
      if (data.isLocked && data.lockoutExpiresAt && !data.permanentLockout) {
        const now = new Date();
        if (now > data.lockoutExpiresAt) {
          // Lockout expired, update status
          await updateDoc(docRef, {
            isLocked: false,
            lockoutExpiresAt: null,
            lockoutExpiresAtTimestamp: null,
            lockoutReason: null,
            lastUpdated: now,
            lastUpdatedTimestamp: serverTimestamp()
          });
          
          return {
            isLocked: false,
            lockoutExpiresAt: null,
            isPermanent: false,
            reason: null
          };
        }
      }

      return {
        isLocked: data.isLocked,
        lockoutExpiresAt: data.lockoutExpiresAt,
        isPermanent: data.permanentLockout,
        reason: data.lockoutReason
      };
    } catch (error) {
      console.error('Error checking account lockout:', error);
      return {
        isLocked: false,
        lockoutExpiresAt: null,
        isPermanent: false,
        reason: null
      };
    }
  }

  /**
   * Manually unlock an account (admin function)
   */
  static async unlockAccount(userId: string, adminUserId: string): Promise<void> {
    try {
      const docRef = doc(firestore, this.COLLECTION_NAME, userId);
      
      await updateDoc(docRef, {
        isLocked: false,
        lockoutExpiresAt: null,
        lockoutExpiresAtTimestamp: null,
        lockoutReason: null,
        unlockToken: null,
        permanentLockout: false,
        lastUpdated: new Date(),
        lastUpdatedTimestamp: serverTimestamp(),
        unlockedBy: adminUserId,
        unlockedAt: new Date(),
        unlockedAtTimestamp: serverTimestamp()
      });

      logAnalyticsEvent('account_manually_unlocked', {
        userId,
        adminUserId
      });
    } catch (error) {
      console.error('Error unlocking account:', error);
      throw new Error('Failed to unlock account');
    }
  }

  /**
   * Get lockout statistics for admin dashboard
   */
  static async getLockoutStats(): Promise<{
    totalLockedAccounts: number;
    totalPermanentLockouts: number;
    recentLockouts: number; // last 24 hours
    topLockoutReasons: { reason: string; count: number }[];
  }> {
    try {
      // This would require a more complex query in a real implementation
      // For now, return placeholder data
      return {
        totalLockedAccounts: 0,
        totalPermanentLockouts: 0,
        recentLockouts: 0,
        topLockoutReasons: []
      };
    } catch (error) {
      console.error('Error getting lockout stats:', error);
      return {
        totalLockedAccounts: 0,
        totalPermanentLockouts: 0,
        recentLockouts: 0,
        topLockoutReasons: []
      };
    }
  }

  /**
   * Validate unlock token
   */
  static async validateUnlockToken(userId: string, token: string): Promise<boolean> {
    try {
      const docRef = doc(firestore, this.COLLECTION_NAME, userId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return false;
      }

      const data = docSnap.data() as LockoutEntry;
      return data.unlockToken === token && data.isLocked;
    } catch (error) {
      console.error('Error validating unlock token:', error);
      return false;
    }
  }

  /**
   * Unlock account using token (for self-service unlock)
   */
  static async unlockAccountWithToken(userId: string, token: string): Promise<boolean> {
    try {
      const isValid = await this.validateUnlockToken(userId, token);
      if (!isValid) {
        return false;
      }

      const docRef = doc(firestore, this.COLLECTION_NAME, userId);
      await updateDoc(docRef, {
        isLocked: false,
        lockoutExpiresAt: null,
        lockoutExpiresAtTimestamp: null,
        lockoutReason: null,
        unlockToken: null,
        lastUpdated: new Date(),
        lastUpdatedTimestamp: serverTimestamp(),
        unlockedWithToken: true,
        tokenUnlockedAt: new Date(),
        tokenUnlockedAtTimestamp: serverTimestamp()
      });

      logAnalyticsEvent('account_unlocked_with_token', { userId });
      return true;
    } catch (error) {
      console.error('Error unlocking account with token:', error);
      return false;
    }
  }
}
