import React from 'react';
import { 
  VerificationStatus, 
  getVerificationStatusDisplay, 
  getVerificationStatusColor 
} from '../../types/verification';
import './VerificationStatusBadge.css';

interface VerificationStatusBadgeProps {
  status: VerificationStatus;
  size?: 'small' | 'medium' | 'large';
  showIcon?: boolean;
  className?: string;
}

export const VerificationStatusBadge: React.FC<VerificationStatusBadgeProps> = ({
  status,
  size = 'medium',
  showIcon = true,
  className = ''
}) => {
  const displayText = getVerificationStatusDisplay(status);
  const color = getVerificationStatusColor(status);
  
  const getStatusIcon = () => {
    switch (status) {
      case 'pending':
        return '⏳';
      case 'under_review':
        return '🔍';
      case 'approved':
        return '✅';
      case 'rejected':
        return '❌';
      case 'suspended':
        return '⏸️';
      case 'revoked':
        return '🚫';
      default:
        return '❓';
    }
  };

  return (
    <span 
      className={`verification-status-badge verification-status-badge--${size} ${className}`}
      style={{ 
        backgroundColor: `${color}20`,
        borderColor: color,
        color: color
      }}
      title={displayText}
    >
      {showIcon && (
        <span className="verification-status-badge__icon">
          {getStatusIcon()}
        </span>
      )}
      <span className="verification-status-badge__text">
        {displayText}
      </span>
    </span>
  );
};

export default VerificationStatusBadge;
