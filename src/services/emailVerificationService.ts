/**
 * Email Verification Service
 * 
 * Handles email verification tokens, validation, and verification flow
 */

import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  getDocs,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { firestore } from '../firebase/firebase';
import { sendEmailVerificationEmail, sendEmailVerifiedEmail } from './emailHelpers';
import { loggers } from '../utils/logger';
import { normalizeEmail } from '../utils/emailValidation';

// Verification token interface
export interface VerificationToken {
  token: string;
  userId: string;
  email: string;
  createdAt: Timestamp;
  expiresAt: Timestamp;
  used: boolean;
  usedAt?: Timestamp;
  ipAddress?: string;
  attempts?: number;
  lastAttemptAt?: Timestamp;
}

// Resend rate limit interface
interface ResendRateLimit {
  userId: string;
  count: number;
  firstResend: Timestamp;
  lastResend: Timestamp;
}

// Constants
const VERIFICATION_TOKEN_EXPIRY_HOURS = 48; // 48 hours expiry
const MAX_RESEND_ATTEMPTS = 3; // Max 3 resends per hour
const RESEND_RATE_LIMIT_HOURS = 1; // 1 hour window
const TOKEN_LENGTH = 64; // 64 character token

/**
 * Generate a secure random token using Web Crypto API
 */
async function generateSecureToken(): Promise<string> {
  const array = new Uint8Array(TOKEN_LENGTH / 2);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Create a verification token for a user
 */
export async function createVerificationToken(
  userId: string,
  email: string,
  ipAddress?: string
): Promise<{ token: string; expiresAt: Date }> {
  try {
    // Normalize email
    const normalizedEmail = normalizeEmail(email);
    
    // Generate secure token
    const token = await generateSecureToken();
    
    // Calculate expiry (48 hours from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + VERIFICATION_TOKEN_EXPIRY_HOURS);
    
    // Invalidate any existing tokens for this user/email
    await invalidateExistingTokens(userId, normalizedEmail);
    
    // Store token in Firestore
    const tokenRef = doc(firestore, 'emailVerificationTokens', token);
    const tokenData: VerificationToken = {
      token,
      userId,
      email: normalizedEmail,
      createdAt: serverTimestamp() as Timestamp,
      expiresAt: Timestamp.fromDate(expiresAt),
      used: false,
      ipAddress,
      attempts: 0
    };
    
    await setDoc(tokenRef, tokenData);
    
    loggers.auth.log(`Verification token created for user ${userId}, email ${normalizedEmail}`);
    
    return { token, expiresAt };
  } catch (error) {
    loggers.error.error('Error creating verification token:', error);
    throw new Error('Failed to create verification token');
  }
}

/**
 * Invalidate existing tokens for a user/email
 */
async function invalidateExistingTokens(userId: string, email: string): Promise<void> {
  try {
    // Find all unused tokens for this user/email
    const tokensRef = collection(firestore, 'emailVerificationTokens');
    const q = query(
      tokensRef,
      where('userId', '==', userId),
      where('email', '==', email),
      where('used', '==', false)
    );
    
    const snapshot = await getDocs(q);
    const batch = snapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(batch);
    
    if (snapshot.docs.length > 0) {
      loggers.auth.log(`Invalidated ${snapshot.docs.length} existing tokens for user ${userId}`);
    }
  } catch (error) {
    loggers.error.error('Error invalidating existing tokens:', error);
    // Don't throw - this is not critical
  }
}

/**
 * Verify a token and mark email as verified
 */
export async function verifyEmailToken(
  token: string,
  ipAddress?: string
): Promise<{
  success: boolean;
  userId?: string;
  email?: string;
  error?: string;
}> {
  try {
    // Get token document
    const tokenRef = doc(firestore, 'emailVerificationTokens', token);
    const tokenDoc = await getDoc(tokenRef);
    
    if (!tokenDoc.exists()) {
      loggers.auth.warn(`Verification attempt with invalid token: ${token}`);
      return {
        success: false,
        error: 'Invalid verification token'
      };
    }
    
    const tokenData = tokenDoc.data() as VerificationToken;
    
    // Check if token is already used
    if (tokenData.used) {
      loggers.auth.warn(`Verification attempt with already-used token: ${token}`);
      return {
        success: false,
        error: 'This verification link has already been used'
      };
    }
    
    // Check if token is expired
    const now = new Date();
    const expiresAt = tokenData.expiresAt.toDate();
    if (now > expiresAt) {
      loggers.auth.warn(`Verification attempt with expired token: ${token}`);
      // Mark as used to prevent further attempts
      await updateDoc(tokenRef, {
        used: true,
        usedAt: serverTimestamp()
      });
      return {
        success: false,
        error: 'Verification link has expired. Please request a new one.'
      };
    }
    
    // Increment attempts
    const attempts = (tokenData.attempts || 0) + 1;
    await updateDoc(tokenRef, {
      attempts,
      lastAttemptAt: serverTimestamp(),
      ipAddress: ipAddress || tokenData.ipAddress
    });
    
    // Mark token as used
    await updateDoc(tokenRef, {
      used: true,
      usedAt: serverTimestamp()
    });
    
    // Update user profile to mark email as verified
    await markEmailAsVerified(tokenData.userId, tokenData.email);
    
    loggers.auth.log(`Email verified successfully for user ${tokenData.userId}, email ${tokenData.email}`);
    
    return {
      success: true,
      userId: tokenData.userId,
      email: tokenData.email
    };
  } catch (error) {
    loggers.error.error('Error verifying email token:', error);
    return {
      success: false,
      error: 'Failed to verify email. Please try again.'
    };
  }
}

/**
 * Mark email as verified in user profile
 */
async function markEmailAsVerified(userId: string, email: string): Promise<void> {
  try {
    const userRef = doc(firestore, 'users', userId);
    await updateDoc(userRef, {
      emailVerified: true,
      emailVerifiedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    // Also update Firebase Auth email verification status if needed
    // Note: Firebase Auth has its own emailVerified field, but we're using Firestore for our system
    
    loggers.auth.log(`Email marked as verified for user ${userId}`);
  } catch (error) {
    loggers.error.error('Error marking email as verified:', error);
    throw error;
  }
}

/**
 * Send verification email
 */
export async function sendVerificationEmail(
  userId: string,
  email: string,
  firstName: string,
  ipAddress?: string
): Promise<{ success: boolean; error?: string; token?: string }> {
  try {
    // Create verification token
    const { token, expiresAt } = await createVerificationToken(userId, email, ipAddress);
    
    // Build verification URL
    const baseUrl = window.location.origin;
    const verificationUrl = `${baseUrl}/verify-email?token=${token}`;
    
    // Send verification email
    const emailResult = await sendEmailVerificationEmail(email, firstName, verificationUrl);
    
    if (!emailResult.success) {
      loggers.email.error(`Failed to send verification email to ${email}:`, emailResult.error);
      return {
        success: false,
        error: emailResult.error || 'Failed to send verification email'
      };
    }
    
    loggers.email.log(`Verification email sent to ${email} for user ${userId}`);
    
    return {
      success: true,
      token
    };
  } catch (error) {
    loggers.error.error('Error sending verification email:', error);
    return {
      success: false,
      error: 'Failed to send verification email'
    };
  }
}

/**
 * Resend verification email with rate limiting
 */
export async function resendVerificationEmail(
  userId: string,
  email: string,
  firstName: string,
  ipAddress?: string
): Promise<{
  success: boolean;
  error?: string;
  canResendAt?: Date;
  attemptsRemaining?: number;
}> {
  try {
    // Check rate limit
    const rateLimitCheck = await checkResendRateLimit(userId);
    if (!rateLimitCheck.allowed) {
      return {
        success: false,
        error: `Too many resend attempts. Please try again after ${rateLimitCheck.canResendAt?.toLocaleTimeString()}`,
        canResendAt: rateLimitCheck.canResendAt,
        attemptsRemaining: 0
      };
    }
    
    // Update rate limit
    await updateResendRateLimit(userId);
    
    // Send verification email
    const result = await sendVerificationEmail(userId, email, firstName, ipAddress);
    
    if (result.success) {
      return {
        success: true,
        attemptsRemaining: rateLimitCheck.attemptsRemaining ? rateLimitCheck.attemptsRemaining - 1 : MAX_RESEND_ATTEMPTS - 1
      };
    }
    
    return result;
  } catch (error) {
    loggers.error.error('Error resending verification email:', error);
    return {
      success: false,
      error: 'Failed to resend verification email'
    };
  }
}

/**
 * Check resend rate limit
 */
async function checkResendRateLimit(userId: string): Promise<{
  allowed: boolean;
  canResendAt?: Date;
  attemptsRemaining?: number;
}> {
  try {
    const rateLimitRef = doc(firestore, 'emailVerificationResendLimits', userId);
    const rateLimitDoc = await getDoc(rateLimitRef);
    
    if (!rateLimitDoc.exists()) {
      return {
        allowed: true,
        attemptsRemaining: MAX_RESEND_ATTEMPTS
      };
    }
    
    const rateLimitData = rateLimitDoc.data() as ResendRateLimit;
    const now = new Date();
    const firstResend = rateLimitData.firstResend.toDate();
    const hoursSinceFirstResend = (now.getTime() - firstResend.getTime()) / (1000 * 60 * 60);
    
    // Reset if outside the rate limit window
    if (hoursSinceFirstResend >= RESEND_RATE_LIMIT_HOURS) {
      return {
        allowed: true,
        attemptsRemaining: MAX_RESEND_ATTEMPTS
      };
    }
    
    // Check if under limit
    if (rateLimitData.count < MAX_RESEND_ATTEMPTS) {
      return {
        allowed: true,
        attemptsRemaining: MAX_RESEND_ATTEMPTS - rateLimitData.count
      };
    }
    
    // Calculate when they can resend again
    const canResendAt = new Date(firstResend);
    canResendAt.setHours(canResendAt.getHours() + RESEND_RATE_LIMIT_HOURS);
    
    return {
      allowed: false,
      canResendAt
    };
  } catch (error) {
    loggers.error.error('Error checking resend rate limit:', error);
    // Allow on error to prevent blocking legitimate users
    return {
      allowed: true,
      attemptsRemaining: MAX_RESEND_ATTEMPTS
    };
  }
}

/**
 * Update resend rate limit
 */
async function updateResendRateLimit(userId: string): Promise<void> {
  try {
    const rateLimitRef = doc(firestore, 'emailVerificationResendLimits', userId);
    const rateLimitDoc = await getDoc(rateLimitRef);
    
    const now = serverTimestamp() as Timestamp;
    
    if (!rateLimitDoc.exists()) {
      // Create new rate limit entry
      await setDoc(rateLimitRef, {
        userId,
        count: 1,
        firstResend: now,
        lastResend: now
      });
    } else {
      const rateLimitData = rateLimitDoc.data() as ResendRateLimit;
      const firstResend = rateLimitData.firstResend.toDate();
      const nowDate = new Date();
      const hoursSinceFirstResend = (nowDate.getTime() - firstResend.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceFirstResend >= RESEND_RATE_LIMIT_HOURS) {
        // Reset counter
        await updateDoc(rateLimitRef, {
          count: 1,
          firstResend: now,
          lastResend: now
        });
      } else {
        // Increment counter
        await updateDoc(rateLimitRef, {
          count: rateLimitData.count + 1,
          lastResend: now
        });
      }
    }
  } catch (error) {
    loggers.error.error('Error updating resend rate limit:', error);
    // Don't throw - rate limiting is not critical
  }
}

/**
 * Check if user's email is verified
 */
export async function isEmailVerified(userId: string): Promise<boolean> {
  try {
    const userRef = doc(firestore, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return false;
    }
    
    const userData = userDoc.data();
    return userData?.emailVerified === true;
  } catch (error) {
    loggers.error.error('Error checking email verification status:', error);
    return false;
  }
}

/**
 * Get user's email verification status
 */
export async function getEmailVerificationStatus(userId: string): Promise<{
  verified: boolean;
  verifiedAt?: Date;
}> {
  try {
    const userRef = doc(firestore, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return { verified: false };
    }
    
    const userData = userDoc.data();
    const verified = userData?.emailVerified === true;
    const verifiedAt = userData?.emailVerifiedAt?.toDate();
    
    return {
      verified,
      verifiedAt
    };
  } catch (error) {
    loggers.error.error('Error getting email verification status:', error);
    return { verified: false };
  }
}

/**
 * Send email verified confirmation
 */
export async function sendVerificationConfirmationEmail(
  email: string,
  firstName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    return await sendEmailVerifiedEmail(email, firstName);
  } catch (error) {
    loggers.error.error('Error sending verification confirmation email:', error);
    return {
      success: false,
      error: 'Failed to send confirmation email'
    };
  }
}

