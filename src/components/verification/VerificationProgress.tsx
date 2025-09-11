import React from 'react';
import { VerificationData, VerificationStep } from '../../types/verification';
import './VerificationProgress.css';

interface VerificationProgressProps {
  verificationData: VerificationData;
  className?: string;
}

const verificationSteps: VerificationStep[] = [
  'profile_submitted',
  'document_review',
  'background_check',
  'interview_scheduled',
  'interview_completed',
  'final_review',
  'approved'
];

const stepLabels: Record<VerificationStep, string> = {
  profile_submitted: 'Profile Submitted',
  document_review: 'Document Review',
  background_check: 'Background Check',
  interview_scheduled: 'Interview Scheduled',
  interview_completed: 'Interview Completed',
  final_review: 'Final Review',
  approved: 'Approved',
  rejected: 'Rejected'
};

export const VerificationProgress: React.FC<VerificationProgressProps> = ({
  verificationData,
  className = ''
}) => {
  const currentStepIndex = verificationSteps.indexOf(verificationData.currentStep);
  const isRejected = verificationData.status === 'rejected' || verificationData.status === 'revoked';
  const isSuspended = verificationData.status === 'suspended';

  const getStepStatus = (stepIndex: number): 'completed' | 'current' | 'pending' | 'rejected' => {
    if (isRejected) return 'rejected';
    if (isSuspended) return 'pending';
    if (stepIndex < currentStepIndex) return 'completed';
    if (stepIndex === currentStepIndex) return 'current';
    return 'pending';
  };

  const getStepIcon = (stepIndex: number, status: string) => {
    if (status === 'completed') return '✓';
    if (status === 'current') return '●';
    if (status === 'rejected') return '✗';
    return '○';
  };

  return (
    <div className={`verification-progress ${className}`}>
      <div className="verification-progress__header">
        <h3 className="verification-progress__title">Verification Progress</h3>
        <div className="verification-progress__status">
          Status: <strong>{verificationData.status.replace('_', ' ').toUpperCase()}</strong>
        </div>
      </div>
      
      <div className="verification-progress__timeline">
        {verificationSteps.map((step, index) => {
          const status = getStepStatus(index);
          const isLastStep = index === verificationSteps.length - 1;
          
          return (
            <div key={step} className="verification-progress__step-container">
              <div className={`verification-progress__step verification-progress__step--${status}`}>
                <div className="verification-progress__step-icon">
                  {getStepIcon(index, status)}
                </div>
                <div className="verification-progress__step-content">
                  <div className="verification-progress__step-label">
                    {stepLabels[step]}
                  </div>
                  {index === currentStepIndex && verificationData.status === 'under_review' && (
                    <div className="verification-progress__step-note">
                      Currently being reviewed
                    </div>
                  )}
                </div>
              </div>
              
              {!isLastStep && (
                <div className={`verification-progress__connector verification-progress__connector--${status}`} />
              )}
            </div>
          );
        })}
      </div>
      
      {verificationData.adminNotes && (
        <div className="verification-progress__notes">
          <h4>Admin Notes:</h4>
          <p>{verificationData.adminNotes}</p>
        </div>
      )}
      
      {verificationData.rejectionReason && (
        <div className="verification-progress__rejection">
          <h4>Rejection Reason:</h4>
          <p>{verificationData.rejectionReason}</p>
        </div>
      )}
      
      <div className="verification-progress__dates">
        <div className="verification-progress__date">
          <strong>Submitted:</strong> {verificationData.submittedAt.toLocaleDateString()}
        </div>
        <div className="verification-progress__date">
          <strong>Last Updated:</strong> {verificationData.lastUpdated.toLocaleDateString()}
        </div>
      </div>
    </div>
  );
};

export default VerificationProgress;
