import React from 'react';
import { useBanner } from '../../contexts/BannerContext';
import InDevelopmentBanner from './InDevelopmentBanner';
import ComingSoonBanner from './ComingSoonBanner';

interface BannerWrapperProps {
  children: React.ReactNode;
  pagePath?: string;
  sectionId?: string;
  className?: string;
}

export const BannerWrapper: React.FC<BannerWrapperProps> = ({
  children,
  pagePath,
  sectionId,
  className = ""
}) => {
  const { shouldShowBanner, bannerSettings, isLoading } = useBanner();

  if (isLoading) {
    return <div className={className}>{children}</div>;
  }

  // Use sectionId if provided (for admin portal), otherwise fall back to pagePath
  const targetPath = sectionId || pagePath || '';
  
  const showInDevelopment = shouldShowBanner('inDevelopment', targetPath);
  const showComingSoon = shouldShowBanner('comingSoon', targetPath);

  return (
    <div className={`banner-wrapper ${className}`}>
      {showInDevelopment && (
        <InDevelopmentBanner
          message={bannerSettings.inDevelopment.message}
          showIcon={bannerSettings.inDevelopment.showIcon}
          className="admin-page"
        />
      )}
      {showComingSoon && (
        <ComingSoonBanner
          message={bannerSettings.comingSoon.message}
          showIcon={bannerSettings.comingSoon.showIcon}
          className="admin-page"
        />
      )}
      {children}
    </div>
  );
};

export default BannerWrapper;
