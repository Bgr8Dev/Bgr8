import React from 'react';
import { FaTools, FaExclamationTriangle } from 'react-icons/fa';
import './InDevelopmentBanner.css';

interface InDevelopmentBannerProps {
  message?: string;
  showIcon?: boolean;
  className?: string;
}

export const InDevelopmentBanner: React.FC<InDevelopmentBannerProps> = ({
  message = "This feature is currently in development and may not work as expected.",
  showIcon = true,
  className = ""
}) => {
  return (
    <div className={`in-development-banner ${className}`}>
      <div className="banner-content">
        {showIcon && (
          <div className="banner-icon">
            <FaTools />
          </div>
        )}
        <div className="banner-text">
          <div className="banner-title">
            <FaExclamationTriangle className="warning-icon" />
            In Development
          </div>
          <div className="banner-message">
            {message}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InDevelopmentBanner;
