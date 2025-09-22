import React from 'react';
import { FaClock, FaInfoCircle, FaEnvelope } from 'react-icons/fa';
import { VerificationData } from '../../types/verification';
import './VerificationPendingNotice.css';

interface VerificationPendingNoticeProps {
  verificationData: VerificationData;
  className?: string;
}

export const VerificationPendingNotice: React.FC<VerificationPendingNoticeProps> = ({
  verificationData,
  className = ''
}) => {
  const isPending = verificationData.status === 'pending';
  const isUnderReview = verificationData.status === 'under_review';
  const isRejected = verificationData.status === 'rejected' || verificationData.status === 'revoked';
  const isSuspended = verificationData.status === 'suspended';

  if (verificationData.status === 'approved') {
    return null; // Don't show notice for approved mentors
  }

  const getStatusMessage = () => {
    if (isPending) {
      return {
        title: 'Profile Under Review',
        message: 'Your mentor profile has been submitted and is awaiting review by our team.',
        icon: FaClock,
        type: 'info'
      };
    }
    
    if (isUnderReview) {
      return {
        title: 'Verification In Progress',
        message: 'Your profile is currently being reviewed. We\'ll notify you once the review is complete.',
        icon: FaInfoCircle,
        type: 'info'
      };
    }
    
    if (isRejected) {
      return {
        title: 'Application Not Approved',
        message: verificationData.rejectionReason || 'Unfortunately, your mentor application was not approved at this time.',
        icon: FaInfoCircle,
        type: 'error'
      };
    }
    
    if (isSuspended) {
      return {
        title: 'Account Suspended',
        message: 'Your mentor account has been temporarily suspended. Please contact support for more information.',
        icon: FaInfoCircle,
        type: 'warning'
      };
    }
    
    return {
      title: 'Verification Required',
      message: 'Your mentor profile needs to be verified before you can access all features.',
      icon: FaInfoCircle,
      type: 'info'
    };
  };

  const statusInfo = getStatusMessage();
  const IconComponent = statusInfo.icon;

  const getEstimatedTime = () => {
    const submittedDate = verificationData.submittedAt;
    const daysSinceSubmission = Math.floor(
      (Date.now() - submittedDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysSinceSubmission < 1) {
      return 'within 24 hours';
    } else if (daysSinceSubmission < 3) {
      return 'within 2-3 business days';
    } else if (daysSinceSubmission < 7) {
      return 'within 1 week';
    } else {
      return 'as soon as possible';
    }
  };

  return (
    <div className={`verification-pending-notice verification-pending-notice--${statusInfo.type} ${className}`}>
      <div className="verification-pending-notice__content">
        <div className="verification-pending-notice__icon">
          <IconComponent />
        </div>
        
        <div className="verification-pending-notice__text">
          <h3 className="verification-pending-notice__title">
            {statusInfo.title}
          </h3>
          
          <p className="verification-pending-notice__message">
            {statusInfo.message}
          </p>
          
          {(isPending || isUnderReview) && (
            <div className="verification-pending-notice__timeline">
              <p className="verification-pending-notice__timeline-text">
                <strong>Submitted:</strong> {verificationData.submittedAt.toLocaleDateString()}
              </p>
              <p className="verification-pending-notice__timeline-text">
                <strong>Expected completion:</strong> {getEstimatedTime()}
              </p>
            </div>
          )}
          
          {isRejected && (
            <div className="verification-pending-notice__actions">
              <p className="verification-pending-notice__action-text">
                You can reapply after addressing the feedback above, or contact our support team for assistance.
              </p>
            </div>
          )}
          
          {isSuspended && (
            <div className="verification-pending-notice__actions">
              <p className="verification-pending-notice__action-text">
                Please contact our support team to resolve this issue.
              </p>
            </div>
          )}
        </div>
      </div>
      
      <div className="verification-pending-notice__footer">
        <div className="verification-pending-notice__contact">
          <FaEnvelope className="verification-pending-notice__contact-icon" />
          <span>Questions? Contact us at support@bgr8.com</span>
        </div>
      </div>
    </div>
  );
};

export default VerificationPendingNotice;
