import { doc, getDoc, setDoc, updateDoc, serverTimestamp, increment } from 'firebase/firestore';
import { firestore } from '../firebase/firebase';
import { logAnalyticsEvent } from '../firebase/firebase';

export interface BruteForceAttempt {
  identifier: string; // IP, email, or user ID
  attempts: number;
  firstAttempt: Date;
  lastAttempt: Date;
  blockedUntil: Date | null;
  totalBlocks: number;
  suspiciousActivity: boolean;
  deviceFingerprint?: string;
  userAgent?: string;
  geolocation?: {
    country?: string;
    city?: string;
    coordinates?: { lat: number; lng: number };
  };
  createdAt: Date;
  lastUpdated: Date;
}

export interface BruteForcePolicy {
  maxAttemptsPerWindow: number;
  windowSizeMinutes: number;
  blockDurationMinutes: number;
  progressiveBlockDuration: boolean;
  maxBlockDuration: number;
  suspiciousThreshold: number; // attempts that trigger enhanced monitoring
  ipBasedProtection: boolean;
  emailBasedProtection: boolean;
  deviceBasedProtection: boolean;
  geolocationBasedProtection: boolean;
  requireHumanVerification: boolean;
}

export class BruteForceProtectionService {
  private static readonly COLLECTION_NAME = 'bruteForceProtection';
  private static readonly DEFAULT_POLICY: BruteForcePolicy = {
    maxAttemptsPerWindow: 10,
    windowSizeMinutes: 15,
    blockDurationMinutes: 30,
    progressiveBlockDuration: true,
    maxBlockDuration: 1440, // 24 hours
    suspiciousThreshold: 5,
    ipBasedProtection: true,
    emailBasedProtection: true,
    deviceBasedProtection: true,
    geolocationBasedProtection: false,
    requireHumanVerification: false
  };

  /**
   * Generate device fingerprint
   */
  private static generateDeviceFingerprint(): string {
    if (typeof window === 'undefined') return 'server';
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('Device fingerprint', 2, 2);
    }
    
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      canvas.toDataURL()
    ].join('|');
    
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(36);
  }

  /**
   * Get client information
   */
  private static getClientInfo(): {
    userAgent: string;
    deviceFingerprint: string;
    ipAddress?: string;
  } {
    return {
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
      deviceFingerprint: this.generateDeviceFingerprint(),
      // In a real implementation, you'd get IP from server-side
      ipAddress: undefined
    };
  }

  /**
   * Check if an identifier is currently blocked
   */
  static async isBlocked(identifier: string, type: 'ip' | 'email' | 'device' = 'ip'): Promise<{
    isBlocked: boolean;
    blockedUntil: Date | null;
    reason: string | null;
    attemptsRemaining: number;
  }> {
    try {
      const docId = `${type}_${identifier}`;
      const docRef = doc(firestore, this.COLLECTION_NAME, docId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return {
          isBlocked: false,
          blockedUntil: null,
          reason: null,
          attemptsRemaining: this.DEFAULT_POLICY.maxAttemptsPerWindow
        };
      }

      const data = docSnap.data() as BruteForceAttempt;
      const now = new Date();

      // Check if block has expired
      if (data.blockedUntil && now > data.blockedUntil) {
        // Block expired, reset
        await updateDoc(docRef, {
          attempts: 0,
          blockedUntil: null,
          blockedUntilTimestamp: null,
          lastUpdated: now,
          lastUpdatedTimestamp: serverTimestamp()
        });

        return {
          isBlocked: false,
          blockedUntil: null,
          reason: null,
          attemptsRemaining: this.DEFAULT_POLICY.maxAttemptsPerWindow
        };
      }

      // Check if currently blocked
      if (data.blockedUntil && now <= data.blockedUntil) {
        const timeRemaining = Math.ceil((data.blockedUntil.getTime() - now.getTime()) / (1000 * 60));
        return {
          isBlocked: true,
          blockedUntil: data.blockedUntil,
          reason: `Too many attempts. Blocked for ${timeRemaining} minutes.`,
          attemptsRemaining: 0
        };
      }

      // Calculate attempts remaining
      const windowStart = new Date(now.getTime() - this.DEFAULT_POLICY.windowSizeMinutes * 60 * 1000);
      const recentAttempts = data.firstAttempt > windowStart ? data.attempts : 0;
      const attemptsRemaining = Math.max(0, this.DEFAULT_POLICY.maxAttemptsPerWindow - recentAttempts);

      return {
        isBlocked: false,
        blockedUntil: null,
        reason: null,
        attemptsRemaining
      };
    } catch (error) {
      console.error('Error checking brute force protection:', error);
      return {
        isBlocked: false,
        blockedUntil: null,
        reason: null,
        attemptsRemaining: this.DEFAULT_POLICY.maxAttemptsPerWindow
      };
    }
  }

  /**
   * Record a failed attempt
   */
  static async recordFailedAttempt(
    identifier: string,
    type: 'ip' | 'email' | 'device' = 'ip',
    reason: string = 'failed_authentication'
  ): Promise<{
    isBlocked: boolean;
    blockedUntil: Date | null;
    attemptsRemaining: number;
    suspiciousActivity: boolean;
  }> {
    try {
      const docId = `${type}_${identifier}`;
      const docRef = doc(firestore, this.COLLECTION_NAME, docId);
      const docSnap = await getDoc(docRef);

      const now = new Date();
      const clientInfo = this.getClientInfo();
      const windowStart = new Date(now.getTime() - this.DEFAULT_POLICY.windowSizeMinutes * 60 * 1000);

      if (docSnap.exists()) {
        const existingData = docSnap.data() as BruteForceAttempt;
        
        // Reset if outside the time window
        let attempts = existingData.attempts;
        if (existingData.firstAttempt < windowStart) {
          attempts = 1;
        } else {
          attempts++;
        }

        // Check if should be blocked
        const shouldBlock = attempts >= this.DEFAULT_POLICY.maxAttemptsPerWindow;
        const suspiciousActivity = attempts >= this.DEFAULT_POLICY.suspiciousThreshold;

        let blockedUntil: Date | null = null;
        if (shouldBlock) {
          // Calculate block duration (progressive if enabled)
          let blockDuration = this.DEFAULT_POLICY.blockDurationMinutes;
          if (this.DEFAULT_POLICY.progressiveBlockDuration && existingData.totalBlocks > 0) {
            blockDuration = Math.min(
              blockDuration * Math.pow(1.5, existingData.totalBlocks),
              this.DEFAULT_POLICY.maxBlockDuration
            );
          }
          blockedUntil = new Date(now.getTime() + blockDuration * 60 * 1000);
        }

        const updateData: Partial<BruteForceAttempt> = {
          attempts,
          lastAttempt: now,
          lastUpdated: now,
          suspiciousActivity,
          ...clientInfo
        };

        if (shouldBlock) {
          updateData.blockedUntil = blockedUntil;
          // Do not set totalBlocks here, handle it in updateDoc below
        }

        await updateDoc(docRef, {
          ...updateData,
          lastAttemptTimestamp: serverTimestamp(),
          lastUpdatedTimestamp: serverTimestamp(),
          blockedUntilTimestamp: blockedUntil ? serverTimestamp() : null,
          ...(shouldBlock && { totalBlocks: increment(1) })
        });

        // Log analytics event
        logAnalyticsEvent('brute_force_attempt_recorded', {
          identifier,
          type,
          attempts,
          isBlocked: shouldBlock,
          suspiciousActivity,
          reason
        });

        return {
          isBlocked: shouldBlock,
          blockedUntil,
          attemptsRemaining: Math.max(0, this.DEFAULT_POLICY.maxAttemptsPerWindow - attempts),
          suspiciousActivity
        };

      } else {
        // Create new entry
        const shouldBlock = 1 >= this.DEFAULT_POLICY.maxAttemptsPerWindow;
        const blockedUntil = shouldBlock ? new Date(now.getTime() + this.DEFAULT_POLICY.blockDurationMinutes * 60 * 1000) : null;
        const suspiciousActivity = 1 >= this.DEFAULT_POLICY.suspiciousThreshold;

        const newAttempt: BruteForceAttempt = {
          identifier,
          attempts: 1,
          firstAttempt: now,
          lastAttempt: now,
          blockedUntil,
          totalBlocks: shouldBlock ? 1 : 0,
          suspiciousActivity,
          createdAt: now,
          lastUpdated: now,
          ...clientInfo
        };

        await setDoc(docRef, {
          ...newAttempt,
          firstAttemptTimestamp: serverTimestamp(),
          lastAttemptTimestamp: serverTimestamp(),
          blockedUntilTimestamp: blockedUntil ? serverTimestamp() : null,
          createdAtTimestamp: serverTimestamp(),
          lastUpdatedTimestamp: serverTimestamp()
        });

        logAnalyticsEvent('brute_force_attempt_recorded', {
          identifier,
          type,
          attempts: 1,
          isBlocked: shouldBlock,
          suspiciousActivity,
          reason
        });

        return {
          isBlocked: shouldBlock,
          blockedUntil,
          attemptsRemaining: Math.max(0, this.DEFAULT_POLICY.maxAttemptsPerWindow - 1),
          suspiciousActivity
        };
      }
    } catch (error) {
      console.error('Error recording brute force attempt:', error);
      throw new Error('Failed to record security attempt');
    }
  }

  /**
   * Clear attempts after successful authentication
   */
  static async clearAttempts(identifier: string, type: 'ip' | 'email' | 'device' = 'ip'): Promise<void> {
    try {
      const docId = `${type}_${identifier}`;
      const docRef = doc(firestore, this.COLLECTION_NAME, docId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        await updateDoc(docRef, {
          attempts: 0,
          blockedUntil: null,
          blockedUntilTimestamp: null,
          lastSuccessfulAuth: new Date(),
          lastSuccessfulAuthTimestamp: serverTimestamp(),
          lastUpdated: new Date(),
          lastUpdatedTimestamp: serverTimestamp()
        });

        logAnalyticsEvent('brute_force_attempts_cleared', {
          identifier,
          type
        });
      }
    } catch (error) {
      console.error('Error clearing brute force attempts:', error);
      // Don't throw error as this shouldn't block successful login
    }
  }

  /**
   * Check multiple identifiers for comprehensive protection
   */
  static async checkComprehensiveProtection(
    email: string,
    ipAddress?: string
  ): Promise<{
    isBlocked: boolean;
    blockedUntil: Date | null;
    reason: string | null;
    attemptsRemaining: number;
    blockedIdentifiers: string[];
  }> {
    try {
      const clientInfo = this.getClientInfo();
      const deviceFingerprint = clientInfo.deviceFingerprint;

      // Check all relevant identifiers
      const checks = await Promise.all([
        this.isBlocked(email, 'email'),
        ipAddress ? this.isBlocked(ipAddress, 'ip') : { isBlocked: false, blockedUntil: null, reason: null, attemptsRemaining: Infinity },
        this.isBlocked(deviceFingerprint, 'device')
      ]);

      const blockedIdentifiers: string[] = [];
      let maxBlockedUntil: Date | null = null;
      let minAttemptsRemaining = Infinity;

      checks.forEach((check, index) => {
        const identifier = index === 0 ? email : index === 1 ? ipAddress : deviceFingerprint;
        if (check.isBlocked) {
          blockedIdentifiers.push(identifier || 'unknown');
          if (check.blockedUntil && (!maxBlockedUntil || check.blockedUntil > maxBlockedUntil)) {
            maxBlockedUntil = check.blockedUntil;
          }
        }
        minAttemptsRemaining = Math.min(minAttemptsRemaining, check.attemptsRemaining);
      });

      const isBlocked = blockedIdentifiers.length > 0;
      const reason = isBlocked 
        ? `Blocked due to suspicious activity from ${blockedIdentifiers.join(', ')}`
        : null;

      return {
        isBlocked,
        blockedUntil: maxBlockedUntil,
        reason,
        attemptsRemaining: minAttemptsRemaining,
        blockedIdentifiers
      };
    } catch (error) {
      console.error('Error checking comprehensive protection:', error);
      return {
        isBlocked: false,
        blockedUntil: null,
        reason: null,
        attemptsRemaining: this.DEFAULT_POLICY.maxAttemptsPerWindow,
        blockedIdentifiers: []
      };
    }
  }

  /**
   * Record failed attempt across multiple identifiers
   */
  static async recordComprehensiveFailedAttempt(
    email: string,
    ipAddress?: string,
    reason: string = 'failed_authentication'
  ): Promise<{
    isBlocked: boolean;
    blockedUntil: Date | null;
    attemptsRemaining: number;
    suspiciousActivity: boolean;
  }> {
    try {
      const clientInfo = this.getClientInfo();
      const deviceFingerprint = clientInfo.deviceFingerprint;

      // Record attempts for all identifiers
      const results = await Promise.all([
        this.recordFailedAttempt(email, 'email', reason),
        ipAddress ? this.recordFailedAttempt(ipAddress, 'ip', reason) : null,
        this.recordFailedAttempt(deviceFingerprint, 'device', reason)
      ]);

      // Determine overall status
      const anyBlocked = results.some(result => result && result.isBlocked);
      const anySuspicious = results.some(result => result && result.suspiciousActivity);
      const maxBlockedUntil = results.reduce((max, result) => {
        if (result && result.blockedUntil && (!max || result.blockedUntil > max)) {
          return result.blockedUntil;
        }
        return max;
      }, null as Date | null);
      const minAttemptsRemaining = Math.min(...results.map(result => result?.attemptsRemaining || Infinity));

      return {
        isBlocked: anyBlocked,
        blockedUntil: maxBlockedUntil,
        attemptsRemaining: minAttemptsRemaining,
        suspiciousActivity: anySuspicious
      };
    } catch (error) {
      console.error('Error recording comprehensive failed attempt:', error);
      throw new Error('Failed to record security attempt');
    }
  }

  /**
   * Clear attempts across all identifiers after successful authentication
   */
  static async clearComprehensiveAttempts(email: string, ipAddress?: string): Promise<void> {
    try {
      const clientInfo = this.getClientInfo();
      const deviceFingerprint = clientInfo.deviceFingerprint;

      await Promise.all([
        this.clearAttempts(email, 'email'),
        ipAddress ? this.clearAttempts(ipAddress, 'ip') : Promise.resolve(),
        this.clearAttempts(deviceFingerprint, 'device')
      ]);
    } catch (error) {
      console.error('Error clearing comprehensive attempts:', error);
      // Don't throw error as this shouldn't block successful login
    }
  }

  /**
   * Get brute force protection statistics for admin dashboard
   */
  static async getProtectionStats(): Promise<{
    totalBlockedIdentifiers: number;
    activeBlocks: number;
    suspiciousActivities: number;
    topBlockedIPs: { ip: string; blocks: number }[];
    topBlockedEmails: { email: string; blocks: number }[];
  }> {
    try {
      // This would require more complex queries in a real implementation
      // For now, return placeholder data
      return {
        totalBlockedIdentifiers: 0,
        activeBlocks: 0,
        suspiciousActivities: 0,
        topBlockedIPs: [],
        topBlockedEmails: []
      };
    } catch (error) {
      console.error('Error getting brute force protection stats:', error);
      return {
        totalBlockedIdentifiers: 0,
        activeBlocks: 0,
        suspiciousActivities: 0,
        topBlockedIPs: [],
        topBlockedEmails: []
      };
    }
  }
}
