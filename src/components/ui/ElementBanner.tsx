import React from 'react';
import { FaTools, FaRocket } from 'react-icons/fa';
import './ElementBanner.css';

interface ElementBannerProps {
  type: 'inDevelopment' | 'comingSoon';
  message?: string;
  showIcon?: boolean;
  className?: string;
}

const ElementBanner: React.FC<ElementBannerProps> = ({
  type,
  message,
  showIcon = true,
  className = ''
}) => {
  const isInDevelopment = type === 'inDevelopment';
  const defaultMessage = isInDevelopment 
    ? 'This feature is currently in development' 
    : 'This feature is coming soon';
  
  const displayMessage = message || defaultMessage;
  const icon = isInDevelopment ? <FaTools /> : <FaRocket />;

  return (
    <div className={`element-banner element-banner-${type} ${className}`}>
      <div className="element-banner-content">
        {showIcon && (
          <div className="element-banner-icon">
            {icon}
          </div>
        )}
        <div className="element-banner-text">
          <div className="element-banner-title">
            {isInDevelopment ? 'IN DEVELOPMENT' : 'COMING SOON'}
          </div>
          <div className="element-banner-message">
            {displayMessage}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ElementBanner;
