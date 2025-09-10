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
  setDoc, 
  updateDoc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { firestore } from '../firebase/firebase';
import { 
  VerificationData, 
  VerificationStatus, 
  VerificationStep, 
  VerificationHistory,
  getVerificationStatusDisplay,
  canAccessPlatform,
  isUnderReview,
  isRejected,
  isSuspended
} from '../types/verification';

export class VerificationService {
  /**
   * Creates initial verification data for a new mentor
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

    // Update verification data
    const updatedVerification: VerificationData = {
      ...currentVerification,
      status: newStatus,
      currentStep: newStep,
      lastUpdated: new Date(),
      history: [...currentVerification.history, historyEntry],
      adminNotes: notes ? `${currentVerification.adminNotes || ''}\n${new Date().toISOString()}: ${notes}`.trim() : currentVerification.adminNotes,
      rejectionReason: reason || currentVerification.rejectionReason
    };

    await updateDoc(profileRef, {
      verification: updatedVerification,
      updatedAt: serverTimestamp()
    });
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
  static async getMentorsByVerificationStatus(status: VerificationStatus): Promise<any[]> {
    const profilesRef = collection(firestore, 'users');
    const q = query(
      profilesRef,
      where('mentorProgram.profile.verification.status', '==', status)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      uid: doc.id,
      ...doc.data()
    }));
  }

  /**
   * Gets all pending mentors that need review
   */
  static async getPendingMentors(): Promise<any[]> {
    const profilesRef = collection(firestore, 'users');
    const q = query(
      profilesRef,
      where('mentorProgram.profile.isMentor', '==', true),
      where('mentorProgram.profile.verification.status', 'in', ['pending', 'under_review'])
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      uid: doc.id,
      ...doc.data()
    }));
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
    const statuses: VerificationStatus[] = ['pending', 'under_review', 'approved', 'rejected', 'suspended', 'revoked'];
    const stats = {
      total: 0,
      pending: 0,
      underReview: 0,
      approved: 0,
      rejected: 0,
      suspended: 0
    };

    for (const status of statuses) {
      const mentors = await this.getMentorsByVerificationStatus(status);
      const count = mentors.length;
      
      stats.total += count;
      
      switch (status) {
        case 'pending':
          stats.pending = count;
          break;
        case 'under_review':
          stats.underReview = count;
          break;
        case 'approved':
          stats.approved = count;
          break;
        case 'rejected':
        case 'revoked':
          stats.rejected += count;
          break;
        case 'suspended':
          stats.suspended = count;
          break;
      }
    }

    return stats;
  }

  /**
   * Checks if a mentor can access the platform
   */
  static async canMentorAccessPlatform(mentorUid: string): Promise<boolean> {
    const verificationData = await this.getVerificationData(mentorUid);
    if (!verificationData) {
      return false; // No verification data means not a mentor or not submitted
    }
    
    return canAccessPlatform(verificationData.status);
  }

  /**
   * Gets mentors that need immediate attention (overdue reviews)
   */
  static async getOverdueReviews(maxDays: number = 7): Promise<any[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - maxDays);
    
    const pendingMentors = await this.getPendingMentors();
    
    return pendingMentors.filter(mentor => {
      const verification = mentor.mentorProgram?.profile?.verification;
      if (!verification) return false;
      
      const submittedAt = verification.submittedAt?.toDate ? 
        verification.submittedAt.toDate() : 
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
    await this.updateVerificationStatus(
      mentorUid,
      'approved',
      'approved',
      reviewedBy,
      notes
    );
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
    await this.updateVerificationStatus(
      mentorUid,
      'rejected',
      'rejected',
      reviewedBy,
      notes,
      reason
    );
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
    await this.updateVerificationStatus(
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
    await this.updateVerificationStatus(
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
    step: VerificationStep = 'document_review',
    notes?: string
  ): Promise<void> {
    await this.updateVerificationStatus(
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
    const verificationData = await this.getVerificationData(mentorUid);
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
