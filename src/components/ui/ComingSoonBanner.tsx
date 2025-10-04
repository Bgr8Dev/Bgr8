import React from 'react';
import { FaClock, FaRocket } from 'react-icons/fa';
import './ComingSoonBanner.css';

interface ComingSoonBannerProps {
  message?: string;
  showIcon?: boolean;
  className?: string;
}

export const ComingSoonBanner: React.FC<ComingSoonBannerProps> = ({
  message = "This feature is coming soon! Stay tuned for updates.",
  showIcon = true,
  className = ""
}) => {
  return (
    <div className={`coming-soon-banner ${className}`}>
      <div className="banner-content">
        {showIcon && (
          <div className="banner-icon">
            <FaRocket />
          </div>
        )}
        <div className="banner-text">
          <div className="banner-title">
            <FaClock className="clock-icon" />
            Coming Soon
          </div>
          <div className="banner-message">
            {message}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComingSoonBanner;
