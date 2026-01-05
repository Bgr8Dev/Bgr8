/**
 * IP-based Rate Limiting Service
 * 
 * Tracks and limits authentication attempts by IP address to prevent abuse
 */

import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { firestore } from '../firebase/firebase';
import { loggers } from '../utils/logger';

// IP Rate Limit Entry Interface
export interface IPRateLimitEntry {
  ipAddress: string;
  attempts: number;
  firstAttempt: Timestamp;
  lastAttempt: Timestamp;
  blockedUntil: Timestamp | null;
  totalBlocks: number;
  suspiciousActivity: boolean;
  deviceFingerprints: string[]; // Track devices from this IP
  createdAt: Timestamp;
  lastUpdated: Timestamp;
}

// IP Rate Limit Policy
interface IPRateLimitPolicy {
  maxAttemptsPerWindow: number;
  windowSizeMinutes: number;
  blockDurationMinutes: number;
  progressiveBlockDuration: boolean;
  maxBlockDurationMinutes: number;
  suspiciousThreshold: number;
}

export class IPRateLimitService {
  private static readonly COLLECTION_NAME = 'ipRateLimits';
  private static readonly DEFAULT_POLICY: IPRateLimitPolicy = {
    maxAttemptsPerWindow: 10, // 10 attempts per window
    windowSizeMinutes: 15, // 15 minute window
    blockDurationMinutes: 30, // Block for 30 minutes
    progressiveBlockDuration: true, // Increase block duration for repeat offenders
    maxBlockDurationMinutes: 1440, // Max 24 hours
    suspiciousThreshold: 5 // 5+ attempts = suspicious
  };

  /**
   * Get client IP address (for browser environments)
   * In production, this should come from server-side
   */
  static getClientIP(): string | null {
    // In a browser environment, we can't directly get IP
    // This would need to be passed from server-side or use a service
    // For now, we'll use a combination of factors as a fallback
    if (typeof window === 'undefined') {
      return null;
    }

    // Try to get IP from a service (optional)
    // In production, you'd get this from your backend/server
    return null;
  }

  /**
   * Check if IP is rate limited
   */
  static async checkIPRateLimit(
    ipAddress: string,
    deviceFingerprint?: string
  ): Promise<{
    allowed: boolean;
    blockedUntil: Date | null;
    attemptsRemaining: number;
    suspiciousActivity: boolean;
  }> {
    try {
      const docId = `ip_${ipAddress}`;
      const docRef = doc(firestore, this.COLLECTION_NAME, docId);
      const docSnap = await getDoc(docRef);

      const now = new Date();
      const windowStart = new Date(now.getTime() - this.DEFAULT_POLICY.windowSizeMinutes * 60 * 1000);

      if (!docSnap.exists()) {
        // First attempt from this IP
        const entry: IPRateLimitEntry = {
          ipAddress,
          attempts: 1,
          firstAttempt: serverTimestamp() as Timestamp,
          lastAttempt: serverTimestamp() as Timestamp,
          blockedUntil: null,
          totalBlocks: 0,
          suspiciousActivity: false,
          deviceFingerprints: deviceFingerprint ? [deviceFingerprint] : [],
          createdAt: serverTimestamp() as Timestamp,
          lastUpdated: serverTimestamp() as Timestamp
        };

        await setDoc(docRef, entry);

        loggers.auth.log(`IP rate limit check: ${ipAddress} - Allowed (first attempt)`);

        return {
          allowed: true,
          blockedUntil: null,
          attemptsRemaining: this.DEFAULT_POLICY.maxAttemptsPerWindow - 1,
          suspiciousActivity: false
        };
      }

      const existingData = docSnap.data() as IPRateLimitEntry;

      // Check if currently blocked
      if (existingData.blockedUntil) {
        const blockedUntil = existingData.blockedUntil.toDate();
        if (now < blockedUntil) {
          loggers.auth.warn(`IP rate limit check: ${ipAddress} - Blocked until ${blockedUntil.toISOString()}`);
          return {
            allowed: false,
            blockedUntil,
            attemptsRemaining: 0,
            suspiciousActivity: existingData.suspiciousActivity
          };
        }
      }

      // Reset if outside the time window
      let attempts = existingData.attempts;
      const firstAttempt = existingData.firstAttempt.toDate();
      if (firstAttempt < windowStart) {
        attempts = 1;
      } else {
        attempts = (existingData.attempts || 0) + 1;
      }

      // Check if should be blocked
      const shouldBlock = attempts >= this.DEFAULT_POLICY.maxAttemptsPerWindow;
      const suspiciousActivity = attempts >= this.DEFAULT_POLICY.suspiciousThreshold;

      let blockedUntil: Date | null = null;
      let totalBlocks = existingData.totalBlocks || 0;

      if (shouldBlock) {
        totalBlocks++;
        // Calculate block duration (progressive if enabled)
        let blockDuration = this.DEFAULT_POLICY.blockDurationMinutes;
        if (this.DEFAULT_POLICY.progressiveBlockDuration && totalBlocks > 0) {
          blockDuration = Math.min(
            blockDuration * Math.pow(1.5, totalBlocks - 1),
            this.DEFAULT_POLICY.maxBlockDurationMinutes
          );
        }
        blockedUntil = new Date(now.getTime() + blockDuration * 60 * 1000);

        loggers.auth.warn(`IP rate limit: ${ipAddress} - Blocked for ${blockDuration} minutes (attempt ${attempts})`);
      }

      // Update device fingerprints
      const deviceFingerprints = [...(existingData.deviceFingerprints || [])];
      if (deviceFingerprint && !deviceFingerprints.includes(deviceFingerprint)) {
        deviceFingerprints.push(deviceFingerprint);
      }

      const updateData: Partial<IPRateLimitEntry> = {
        attempts,
        lastAttempt: serverTimestamp() as Timestamp,
        blockedUntil: blockedUntil ? Timestamp.fromDate(blockedUntil) : null,
        totalBlocks,
        suspiciousActivity,
        deviceFingerprints,
        lastUpdated: serverTimestamp() as Timestamp
      };

      // Reset attempts if outside window
      if (firstAttempt < windowStart) {
        updateData.firstAttempt = serverTimestamp() as Timestamp;
      }

      await updateDoc(docRef, updateData);

      return {
        allowed: !shouldBlock,
        blockedUntil,
        attemptsRemaining: Math.max(0, this.DEFAULT_POLICY.maxAttemptsPerWindow - attempts),
        suspiciousActivity
      };
    } catch (error) {
      loggers.error.error('Error checking IP rate limit:', error);
      // Allow on error to prevent blocking legitimate users
      return {
        allowed: true,
        blockedUntil: null,
        attemptsRemaining: this.DEFAULT_POLICY.maxAttemptsPerWindow,
        suspiciousActivity: false
      };
    }
  }

  /**
   * Record a failed attempt from an IP
   */
  static async recordFailedAttempt(
    ipAddress: string,
    deviceFingerprint?: string
  ): Promise<{
    isBlocked: boolean;
    blockedUntil: Date | null;
    attemptsRemaining: number;
    suspiciousActivity: boolean;
  }> {
    const result = await this.checkIPRateLimit(ipAddress, deviceFingerprint);
    return {
      isBlocked: !result.allowed,
      blockedUntil: result.blockedUntil,
      attemptsRemaining: result.attemptsRemaining,
      suspiciousActivity: result.suspiciousActivity
    };
  }

  /**
   * Clear rate limit for successful authentication
   */
  static async clearIPRateLimit(ipAddress: string): Promise<void> {
    try {
      const docId = `ip_${ipAddress}`;
      const docRef = doc(firestore, this.COLLECTION_NAME, docId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        await updateDoc(docRef, {
          attempts: 0,
          blockedUntil: null,
          lastUpdated: serverTimestamp() as Timestamp
        });

        loggers.auth.log(`IP rate limit cleared: ${ipAddress}`);
      }
    } catch (error) {
      loggers.error.error('Error clearing IP rate limit:', error);
      // Don't throw - this is not critical
    }
  }

  /**
   * Check if IP is currently blocked
   */
  static async isIPBlocked(ipAddress: string): Promise<{
    isBlocked: boolean;
    blockedUntil: Date | null;
    attemptsRemaining: number;
  }> {
    try {
      const docId = `ip_${ipAddress}`;
      const docRef = doc(firestore, this.COLLECTION_NAME, docId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return {
          isBlocked: false,
          blockedUntil: null,
          attemptsRemaining: this.DEFAULT_POLICY.maxAttemptsPerWindow
        };
      }

      const data = docSnap.data() as IPRateLimitEntry;
      const now = new Date();

      if (data.blockedUntil) {
        const blockedUntil = data.blockedUntil.toDate();
        if (now < blockedUntil) {
          return {
            isBlocked: true,
            blockedUntil,
            attemptsRemaining: 0
          };
        }
      }

      return {
        isBlocked: false,
        blockedUntil: null,
        attemptsRemaining: Math.max(0, this.DEFAULT_POLICY.maxAttemptsPerWindow - (data.attempts || 0))
      };
    } catch (error) {
      loggers.error.error('Error checking if IP is blocked:', error);
      return {
        isBlocked: false,
        blockedUntil: null,
        attemptsRemaining: this.DEFAULT_POLICY.maxAttemptsPerWindow
      };
    }
  }
}

