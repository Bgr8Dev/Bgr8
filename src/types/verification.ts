/**
 * Mentor Verification System Types
 * 
 * This file defines the types and interfaces for the mentor verification system.
 * It includes verification statuses, review states, and related data structures.
 */

export type VerificationStatus = 
  | 'pending'           // Initial state when mentor submits profile
  | 'under_review'      // Profile is being reviewed by admin
  | 'approved'          // Mentor is verified and can access platform
  | 'rejected'          // Mentor application was rejected
  | 'suspended'         // Mentor was temporarily suspended
  | 'revoked';          // Mentor verification was permanently revoked

export type VerificationStep = 
  | 'profile_submitted'     // Initial profile submission
  | 'document_review'       // Reviewing submitted documents
  | 'background_check'      // Background verification
  | 'interview_scheduled'   // Interview with admin
  | 'interview_completed'   // Interview finished
  | 'final_review'         // Final admin decision
  | 'approved'             // Verification complete
  | 'rejected';            // Application rejected

export interface VerificationHistory {
  id: string;
  status: VerificationStatus;
  step: VerificationStep;
  timestamp: Date;
  reviewedBy?: string; // Admin UID who made the change
  notes?: string;      // Admin notes about the change
  reason?: string;     // Reason for rejection/suspension
}

export interface VerificationData {
  status: VerificationStatus;
  currentStep: VerificationStep;
  submittedAt: Date;
  lastUpdated: Date;
  history: VerificationHistory[];
  documents?: {
    idDocument?: string;      // URL to uploaded ID document
    cv?: string;             // URL to uploaded CV
    references?: string[];   // URLs to reference letters
    certificates?: string[]; // URLs to professional certificates
  };
  adminNotes?: string;       // Internal admin notes
  rejectionReason?: string;  // Public reason for rejection
  nextReviewDate?: Date;     // When to review again (for pending/under_review)
}

export interface VerificationConfig {
  autoApproveThreshold?: number;  // Score threshold for auto-approval
  requireInterview: boolean;      // Whether interview is mandatory
  requireDocuments: boolean;      // Whether documents are required
  maxReviewDays: number;          // Maximum days to complete review
  notificationEmails: {
    onSubmission: boolean;
    onApproval: boolean;
    onRejection: boolean;
    onSuspension: boolean;
  };
}

// Helper functions for verification status
export const getVerificationStatusDisplay = (status: VerificationStatus): string => {
  const statusMap: Record<VerificationStatus, string> = {
    pending: 'Pending Review',
    under_review: 'Under Review',
    approved: 'Approved',
    rejected: 'Rejected',
    suspended: 'Suspended',
    revoked: 'Verification Revoked'
  };
  return statusMap[status] || 'Unknown';
};

export const getVerificationStatusColor = (status: VerificationStatus): string => {
  const colorMap: Record<VerificationStatus, string> = {
    pending: '#f59e0b',      // amber-500
    under_review: '#3b82f6', // blue-500
    approved: '#10b981',     // emerald-500
    rejected: '#ef4444',     // red-500
    suspended: '#f97316',    // orange-500
    revoked: '#6b7280'       // gray-500
  };
  return colorMap[status] || '#6b7280';
};

export const canAccessPlatform = (status: VerificationStatus): boolean => {
  return status === 'approved';
};

export const isUnderReview = (status: VerificationStatus): boolean => {
  return status === 'pending' || status === 'under_review';
};

export const isRejected = (status: VerificationStatus): boolean => {
  return status === 'rejected' || status === 'revoked';
};

export const isSuspended = (status: VerificationStatus): boolean => {
  return status === 'suspended';
};
