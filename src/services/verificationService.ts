/**
 * Verification Service
 * 
 * This service handles all mentor verification operations including:
 * - Creating initial verification data for new mentors
 * - Updating verification status
 * - Managing verification history
 * - Querying verification data
 */

import { 
  doc, 
  updateDoc, 
  getDoc, 
  collection, 
  getDocs, 
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { firestore } from '../firebase/firebase';
import { 
  VerificationData, 
  VerificationStatus, 
  VerificationStep, 
  VerificationHistory,
  canAccessPlatform
} from '../types/verification';
import { loggers } from '../utils/logger';

export interface MentorProfile {
  uid: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  profession: string;
  linkedin: string;
  calCom: string;
  skills: string[];
  industries: string[];
  verification: {
    status: VerificationStatus;
    currentStep: VerificationStep;
    submittedAt: Date;
    lastUpdated: Date;
    history: Array<{
      id: string;
      status: VerificationStatus;
      step: VerificationStep;
      timestamp: Date;
      reviewedBy?: string;
      notes?: string;
      reason?: string;
    }>;
  };
}

export class VerificationService {
  /**
   * Creates initial verification data for a new mentor
   * Mentors start with pending status and require manual verification
   */
  static async createInitialVerification(mentorUid: string): Promise<VerificationData> {
    const verificationData: VerificationData = {
      status: 'pending',
      currentStep: 'profile_submitted',
      submittedAt: new Date(),
      lastUpdated: new Date(),
      history: [{
        id: `initial_${Date.now()}`,
        status: 'pending',
        step: 'profile_submitted',
        timestamp: new Date(),
        notes: 'Profile submitted for verification'
      }]
    };

    // Store verification data in the mentor's profile
    const profileRef = doc(firestore, 'users', mentorUid, 'mentorProgram', 'profile');
    await updateDoc(profileRef, {
      verification: verificationData,
      updatedAt: serverTimestamp()
    });

    // Send profile submitted email
    try {
      const { getUserProfile } = await import('../utils/userProfile');
      const { sendMentorProfileSubmittedEmail } = await import('./emailHelpers');
      const userProfile = await getUserProfile(mentorUid);
      
      if (userProfile && userProfile.email) {
        sendMentorProfileSubmittedEmail(userProfile.email, userProfile.firstName)
          .then(result => {
            if (result.success) {
              loggers.email.log(`Mentor profile submitted email sent to ${userProfile.email}`);
            } else {
              loggers.email.error(`Failed to send profile submitted email: ${result.error}`);
            }
          })
          .catch(error => {
            loggers.email.error('Error sending profile submitted email:', error);
          });
      }
    } catch (emailError) {
      loggers.email.error('Error in profile submitted email integration:', emailError);
    }

    return verificationData;
  }

  /**
   * Updates verification status for a mentor
   */
  static async updateVerificationStatus(
    mentorUid: string,
    newStatus: VerificationStatus,
    newStep: VerificationStep,
    reviewedBy: string,
    notes?: string,
    reason?: string
  ): Promise<void> {
    const profileRef = doc(firestore, 'users', mentorUid, 'mentorProgram', 'profile');
    const profileDoc = await getDoc(profileRef);
    
    if (!profileDoc.exists()) {
      throw new Error('Mentor profile not found');
    }

    const profileData = profileDoc.data();
    const currentVerification = profileData.verification as VerificationData;
    
    // Ensure currentVerification exists and has required fields
    if (!currentVerification) {
      throw new Error('No verification data found for mentor');
    }
    
    // Handle the existing data structure and ensure required fields exist with defaults
    // For existing data that might be missing some fields, we'll create a complete structure
    const convertTimestamp = (timestamp: unknown): Date => {
      if (!timestamp) return new Date();
      if (typeof timestamp === 'object' && timestamp !== null && 'toDate' in timestamp && typeof (timestamp as { toDate: () => Date }).toDate === 'function') {
        return (timestamp as { toDate: () => Date }).toDate();
      }
      if (timestamp instanceof Date) {
        return timestamp;
      }
      if (typeof timestamp === 'string' || typeof timestamp === 'number') {
        return new Date(timestamp);
      }
      return new Date();
    };

    const safeVerification = {
      status: currentVerification.status || 'pending',
      currentStep: currentVerification.currentStep || 'profile_submitted',
      submittedAt: currentVerification.submittedAt ? 
        convertTimestamp(currentVerification.submittedAt) :
        (currentVerification.history && currentVerification.history.length > 0 ? 
          convertTimestamp(currentVerification.history[0].timestamp) : new Date()),
      lastUpdated: currentVerification.lastUpdated ? 
        convertTimestamp(currentVerification.lastUpdated) :
        new Date(),
      history: (currentVerification.history || []).map(entry => ({
        ...entry,
        timestamp: convertTimestamp(entry.timestamp)
      })),
      adminNotes: currentVerification.adminNotes || '',
      rejectionReason: currentVerification.rejectionReason || '',
      documents: currentVerification.documents || null,
      nextReviewDate: currentVerification.nextReviewDate ? 
        convertTimestamp(currentVerification.nextReviewDate) :
        null
    };

    loggers.config.debug('Original verification data:', currentVerification);
    loggers.config.debug('Safe verification data:', safeVerification);
    loggers.config.debug('Safe verification keys:', Object.keys(safeVerification));
    loggers.config.debug('Safe verification values:', Object.values(safeVerification));

    // Create new history entry
    const historyEntry: VerificationHistory = {
      id: `update_${Date.now()}`,
      status: newStatus,
      step: newStep,
      timestamp: new Date(),
      reviewedBy,
      notes,
      reason
    };

    // Create a clean verification object with only defined values
    // Use serverTimestamp() for date fields to ensure proper Firestore Timestamp format
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updatedVerification: Record<string, any> = {
      status: newStatus,
      currentStep: newStep,
      submittedAt: Timestamp.fromDate(safeVerification.submittedAt), // Convert Date back to Timestamp
      lastUpdated: serverTimestamp(), // Use serverTimestamp for lastUpdated
      history: [
        ...safeVerification.history.map(entry => ({
          ...entry,
          timestamp: Timestamp.fromDate(entry.timestamp) // Convert existing history timestamps to Timestamp
        })),
        {
          ...historyEntry,
          timestamp: serverTimestamp() // Use serverTimestamp for new history entry
        }
      ]
    };

    // Only add optional fields if they have values
    if (safeVerification.adminNotes || notes) {
      updatedVerification.adminNotes = notes ? 
        `${safeVerification.adminNotes}\n${new Date().toISOString()}: ${notes}`.trim() : 
        safeVerification.adminNotes;
    }

    if (reason || safeVerification.rejectionReason) {
      updatedVerification.rejectionReason = reason || safeVerification.rejectionReason;
    }

    if (safeVerification.documents && Object.keys(safeVerification.documents).length > 0) {
      updatedVerification.documents = safeVerification.documents;
    }

    if (safeVerification.nextReviewDate) {
      updatedVerification.nextReviewDate = Timestamp.fromDate(safeVerification.nextReviewDate); // Convert to Timestamp
    }

    // Deep clean the updatedVerification object to remove any undefined values
    const cleanVerification = (obj: unknown): unknown => {
      if (obj === null || obj === undefined) return null;
      if (Array.isArray(obj)) {
        return obj.map(cleanVerification).filter(item => item !== undefined);
      }
      if (typeof obj === 'object') {
        const cleaned: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(obj)) {
          if (value !== undefined) {
            cleaned[key] = cleanVerification(value);
          }
        }
        return cleaned;
      }
      return obj;
    };

    const cleanedVerification = cleanVerification(updatedVerification);
    loggers.config.debug('Cleaned verification object:', cleanedVerification);

    // Prepare update data, ensuring no undefined values
    const updateData: Record<string, unknown> = {
      verification: cleanedVerification,
      updatedAt: serverTimestamp()
    };

    // Final check to remove any undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    loggers.config.debug('Updated verification object:', updatedVerification);
    loggers.config.debug('Updated verification keys:', Object.keys(updatedVerification));
    loggers.config.debug('Updated verification values:', Object.values(updatedVerification));
    loggers.config.debug('Updating verification with data:', updateData);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await updateDoc(profileRef, updateData as { [x: string]: any });
  }

  /**
   * Gets verification data for a specific mentor
   */
  static async getVerificationData(mentorUid: string): Promise<VerificationData | null> {
    const profileRef = doc(firestore, 'users', mentorUid, 'mentorProgram', 'profile');
    const profileDoc = await getDoc(profileRef);
    
    if (!profileDoc.exists()) {
      return null;
    }

    const profileData = profileDoc.data();
    return profileData.verification as VerificationData || null;
  }

  /**
   * Gets all mentors with a specific verification status
   */
  static async getMentorsByVerificationStatus(status: VerificationStatus): Promise<MentorProfile[]> {
    try {
      // Get all users first
      const usersRef = collection(firestore, 'users');
      const usersSnapshot = await getDocs(usersRef);
      
      const mentors: MentorProfile[] = [];
      
      // Check each user for mentor profiles with the specific status
      for (const userDoc of usersSnapshot.docs) {
        try {
          const mentorProfileRef = doc(firestore, 'users', userDoc.id, 'mentorProgram', 'profile');
          const mentorProfileDoc = await getDoc(mentorProfileRef);
          
          if (mentorProfileDoc.exists()) {
            const profileData = mentorProfileDoc.data();
            
            // Check if this is a mentor profile with the specific verification status
            if ((profileData.type === 'mentor' || profileData.isMentor === true) && 
                profileData.verification?.status === status) {
              mentors.push({
                uid: userDoc.id,
                firstName: profileData.firstName || '',
                lastName: profileData.lastName || '',
                email: profileData.email || '',
                phone: profileData.phone || '',
                profession: profileData.profession || '',
                linkedin: profileData.linkedin || '',
                calCom: profileData.calCom || '',
                skills: profileData.skills || [],
                industries: profileData.industries || [],
                verification: {
                  status: profileData.verification?.status || 'pending' as VerificationStatus,
                  currentStep: profileData.verification?.currentStep || 'profile_submitted' as VerificationStep,
                  submittedAt: profileData.verification?.submittedAt?.toDate ? 
                    profileData.verification.submittedAt.toDate() : 
                    new Date(profileData.verification?.submittedAt || new Date()),
                  lastUpdated: profileData.verification?.lastUpdated?.toDate ? 
                    profileData.verification.lastUpdated.toDate() : 
                    new Date(profileData.verification?.lastUpdated || new Date()),
                  history: profileData.verification?.history || []
                }
              });
            }
          }
        } catch (error) {
          loggers.warn.warn(`Error checking mentor profile for user ${userDoc.id}:`, error);
          // Continue with other users
        }
      }
      
      return mentors;
    } catch (error) {
      loggers.error.error('Error fetching mentors by verification status:', error);
      return [];
    }
  }

  /**
   * Gets all mentors regardless of verification status
   */
  static async getAllMentors(): Promise<MentorProfile[]> {
    try {
      // Get all users first
      const usersRef = collection(firestore, 'users');
      const usersSnapshot = await getDocs(usersRef);
      
      const mentors: MentorProfile[] = [];
      
      // Check each user for mentor profiles
      for (const userDoc of usersSnapshot.docs) {
        try {
          const mentorProfileRef = doc(firestore, 'users', userDoc.id, 'mentorProgram', 'profile');
          const mentorProfileDoc = await getDoc(mentorProfileRef);
          
          if (mentorProfileDoc.exists()) {
            const profileData = mentorProfileDoc.data();
            
            // Check if this is a mentor profile
            if (profileData.type === 'mentor' || profileData.isMentor === true) {
              mentors.push({
                uid: userDoc.id,
                firstName: profileData.firstName || '',
                lastName: profileData.lastName || '',
                email: profileData.email || '',
                phone: profileData.phone || '',
                profession: profileData.profession || '',
                linkedin: profileData.linkedin || '',
                calCom: profileData.calCom || '',
                skills: profileData.skills || [],
                industries: profileData.industries || [],
                verification: {
                  status: profileData.verification?.status || 'pending' as VerificationStatus,
                  currentStep: profileData.verification?.currentStep || 'profile_submitted' as VerificationStep,
                  submittedAt: profileData.verification?.submittedAt?.toDate ? 
                    profileData.verification.submittedAt.toDate() : 
                    new Date(profileData.verification?.submittedAt || new Date()),
                  lastUpdated: profileData.verification?.lastUpdated?.toDate ? 
                    profileData.verification.lastUpdated.toDate() : 
                    new Date(profileData.verification?.lastUpdated || new Date()),
                  history: profileData.verification?.history || []
                }
              });
            }
          }
        } catch (error) {
          loggers.warn.warn(`Error checking mentor profile for user ${userDoc.id}:`, error);
          // Continue with other users
        }
      }
      
      return mentors;
    } catch (error) {
      loggers.error.error('Error fetching all mentors:', error);
      return [];
    }
  }

  /**
   * Gets all pending mentors that need review
   */
  static async getPendingMentors(): Promise<MentorProfile[]> {
    try {
      // Get all users first
      const usersRef = collection(firestore, 'users');
      const usersSnapshot = await getDocs(usersRef);
      
      const mentors: MentorProfile[] = [];
      
      // Check each user for mentor profiles that are pending or under review
      for (const userDoc of usersSnapshot.docs) {
        try {
          const mentorProfileRef = doc(firestore, 'users', userDoc.id, 'mentorProgram', 'profile');
          const mentorProfileDoc = await getDoc(mentorProfileRef);
          
          if (mentorProfileDoc.exists()) {
            const profileData = mentorProfileDoc.data();
            
            // Check if this is a mentor profile with pending or under_review status
            if ((profileData.type === 'mentor' || profileData.isMentor === true) && 
                (profileData.verification?.status === 'pending' || profileData.verification?.status === 'under_review')) {
              mentors.push({
                uid: userDoc.id,
                firstName: profileData.firstName || '',
                lastName: profileData.lastName || '',
                email: profileData.email || '',
                phone: profileData.phone || '',
                profession: profileData.profession || '',
                linkedin: profileData.linkedin || '',
                calCom: profileData.calCom || '',
                skills: profileData.skills || [],
                industries: profileData.industries || [],
                verification: {
                  status: profileData.verification?.status || 'pending' as VerificationStatus,
                  currentStep: profileData.verification?.currentStep || 'profile_submitted' as VerificationStep,
                  submittedAt: profileData.verification?.submittedAt?.toDate ? 
                    profileData.verification.submittedAt.toDate() : 
                    new Date(profileData.verification?.submittedAt || new Date()),
                  lastUpdated: profileData.verification?.lastUpdated?.toDate ? 
                    profileData.verification.lastUpdated.toDate() : 
                    new Date(profileData.verification?.lastUpdated || new Date()),
                  history: profileData.verification?.history || []
                }
              });
            }
          }
        } catch (error) {
          loggers.warn.warn(`Error checking mentor profile for user ${userDoc.id}:`, error);
          // Continue with other users
        }
      }
      
      return mentors;
    } catch (error) {
      loggers.error.error('Error fetching pending mentors:', error);
      return [];
    }
  }

  /**
   * Gets verification statistics for admin dashboard
   */
  static async getVerificationStats(): Promise<{
    total: number;
    pending: number;
    underReview: number;
    approved: number;
    rejected: number;
    suspended: number;
  }> {
    try {
      // Get all mentors once and count by status
      const allMentors = await VerificationService.getAllMentors();
      
      const stats = {
        total: allMentors.length,
        pending: 0,
        underReview: 0,
        approved: 0,
        rejected: 0,
        suspended: 0
      };

      // Count mentors by verification status
      allMentors.forEach(mentor => {
        const status = mentor.verification?.status || 'pending';
        switch (status) {
          case 'pending':
            stats.pending++;
            break;
          case 'under_review':
            stats.underReview++;
            break;
          case 'approved':
            stats.approved++;
            break;
          case 'rejected':
          case 'revoked':
            stats.rejected++;
            break;
          case 'suspended':
            stats.suspended++;
            break;
        }
      });

      return stats;
    } catch (error) {
      loggers.error.error('Error calculating verification stats:', error);
      return {
        total: 0,
        pending: 0,
        underReview: 0,
        approved: 0,
        rejected: 0,
        suspended: 0
      };
    }
  }

  /**
   * Checks if a mentor can access the platform
   */
  static async canMentorAccessPlatform(mentorUid: string): Promise<boolean> {
    const verificationData = await VerificationService.getVerificationData(mentorUid);
    if (!verificationData) {
      return false; // No verification data means not a mentor or not submitted
    }
    
    return canAccessPlatform(verificationData.status);
  }

  /**
   * Gets mentors that need immediate attention (overdue reviews)
   */
  static async getOverdueReviews(maxDays: number = 7): Promise<MentorProfile[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - maxDays);
    
    const pendingMentors = await VerificationService.getPendingMentors();
    
    return pendingMentors.filter(mentor => {
      const verification = mentor.verification;
      if (!verification) return false;
      
      const submittedAt = verification.submittedAt instanceof Date ? 
        verification.submittedAt : 
        new Date(verification.submittedAt);
      
      return submittedAt < cutoffDate;
    });
  }

  /**
   * Approves a mentor (sets status to approved)
   */
  static async approveMentor(
    mentorUid: string, 
    reviewedBy: string, 
    notes?: string
  ): Promise<void> {
    await VerificationService.updateVerificationStatus(
      mentorUid,
      'approved',
      'approved',
      reviewedBy,
      notes
    );
    
    // Send verification success email
    try {
      const { getUserProfile } = await import('../utils/userProfile');
      const { sendMentorProfileVerifiedEmail } = await import('./emailHelpers');
      const userProfile = await getUserProfile(mentorUid);
      
      if (userProfile && userProfile.email) {
        sendMentorProfileVerifiedEmail(userProfile.email, userProfile.firstName)
          .then(result => {
            if (result.success) {
              loggers.email.log(`Mentor profile verified email sent to ${userProfile.email}`);
            } else {
              loggers.email.error(`Failed to send verification email: ${result.error}`);
            }
          })
          .catch(error => {
            loggers.email.error('Error sending verification email:', error);
          });
      }
    } catch (emailError) {
      loggers.email.error('Error in verification email integration:', emailError);
    }
  }

  /**
   * Rejects a mentor (sets status to rejected)
   */
  static async rejectMentor(
    mentorUid: string, 
    reviewedBy: string, 
    reason: string, 
    notes?: string
  ): Promise<void> {
    await VerificationService.updateVerificationStatus(
      mentorUid,
      'rejected',
      'rejected',
      reviewedBy,
      notes,
      reason
    );
    
    // Send rejection email
    try {
      const { getUserProfile } = await import('../utils/userProfile');
      const { sendMentorProfileRejectedEmail } = await import('./emailHelpers');
      const userProfile = await getUserProfile(mentorUid);
      
      if (userProfile && userProfile.email) {
        sendMentorProfileRejectedEmail(
          userProfile.email, 
          userProfile.firstName, 
          reason || 'Profile did not meet verification requirements.'
        )
          .then(result => {
            if (result.success) {
              loggers.email.log(`Mentor profile rejected email sent to ${userProfile.email}`);
            } else {
              loggers.email.error(`Failed to send rejection email: ${result.error}`);
            }
          })
          .catch(error => {
            loggers.email.error('Error sending rejection email:', error);
          });
      }
    } catch (emailError) {
      loggers.email.error('Error in rejection email integration:', emailError);
    }
  }

  /**
   * Suspends a mentor (sets status to suspended)
   */
  static async suspendMentor(
    mentorUid: string, 
    reviewedBy: string, 
    reason: string, 
    notes?: string
  ): Promise<void> {
    await VerificationService.updateVerificationStatus(
      mentorUid,
      'suspended',
      'rejected', // Use rejected step for suspension
      reviewedBy,
      notes,
      reason
    );
  }

  /**
   * Revokes mentor verification (sets status to revoked)
   */
  static async revokeMentorVerification(
    mentorUid: string, 
    reviewedBy: string, 
    reason: string, 
    notes?: string
  ): Promise<void> {
    await VerificationService.updateVerificationStatus(
      mentorUid,
      'revoked',
      'rejected', // Use rejected step for revocation
      reviewedBy,
      notes,
      reason
    );
  }

  /**
   * Moves mentor to under review status
   */
  static async moveToUnderReview(
    mentorUid: string, 
    reviewedBy: string, 
    step: VerificationStep = 'final_review',
    notes?: string
  ): Promise<void> {
    await VerificationService.updateVerificationStatus(
      mentorUid,
      'under_review',
      step,
      reviewedBy,
      notes
    );
  }

  /**
   * Gets verification history for a mentor
   */
  static async getVerificationHistory(mentorUid: string): Promise<VerificationHistory[]> {
    const verificationData = await VerificationService.getVerificationData(mentorUid);
    return verificationData?.history || [];
  }

  /**
   * Updates verification documents (CV, ID, etc.)
   */
  static async updateVerificationDocuments(
    mentorUid: string,
    documents: {
      idDocument?: string;
      cv?: string;
      references?: string[];
      certificates?: string[];
    }
  ): Promise<void> {
    const profileRef = doc(firestore, 'users', mentorUid, 'mentorProgram', 'profile');
    const profileDoc = await getDoc(profileRef);
    
    if (!profileDoc.exists()) {
      throw new Error('Mentor profile not found');
    }

    const profileData = profileDoc.data();
    const currentVerification = profileData.verification as VerificationData;

    const updatedVerification: VerificationData = {
      ...currentVerification,
      documents: {
        ...currentVerification.documents,
        ...documents
      },
      lastUpdated: new Date()
    };

    await updateDoc(profileRef, {
      verification: updatedVerification,
      updatedAt: serverTimestamp()
    });
  }
}

// Export utility functions for easy access
export const {
  createInitialVerification,
  updateVerificationStatus,
  getVerificationData,
  getMentorsByVerificationStatus,
  getAllMentors,
  getPendingMentors,
  getVerificationStats,
  canMentorAccessPlatform,
  getOverdueReviews,
  approveMentor,
  rejectMentor,
  suspendMentor,
  revokeMentorVerification,
  moveToUnderReview,
  getVerificationHistory,
  updateVerificationDocuments
} = VerificationService;
