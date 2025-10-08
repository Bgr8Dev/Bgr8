import React from 'react';
import { useBanner } from '../../contexts/BannerContext';
import InDevelopmentBanner from './InDevelopmentBanner';
import ComingSoonBanner from './ComingSoonBanner';
import ElementBanner from './ElementBanner';
import './BannerWrapper.css';

interface BannerWrapperProps {
  children: React.ReactNode;
  pagePath?: string;
  sectionId?: string;
  className?: string;
  bannerType?: 'full-page' | 'element';
}

export const BannerWrapper: React.FC<BannerWrapperProps> = ({
  children,
  pagePath,
  sectionId,
  className = "",
  bannerType = 'full-page'
}) => {
  const { shouldShowBanner, bannerSettings, isLoading } = useBanner();

  if (isLoading) {
    return <div className={className}>{children}</div>;
  }

  // Use sectionId if provided (for admin portal), otherwise fall back to pagePath
  const targetPath = sectionId || pagePath || '';
  
  const showInDevelopment = shouldShowBanner('inDevelopment', targetPath);
  const showComingSoon = shouldShowBanner('comingSoon', targetPath);

  // Determine which banner component to use
  const useElementBanner = bannerType === 'element';
  
  return (
    <div className={`banner-wrapper ${className} ${useElementBanner ? 'element-wrapper' : 'full-page-wrapper'}`}>
      {useElementBanner ? (
        // Element-level banners (for widgets/features)
        <>
          {showInDevelopment && (
            <ElementBanner
              type="inDevelopment"
              message={bannerSettings.inDevelopment.message}
              showIcon={bannerSettings.inDevelopment.showIcon}
            />
          )}
          {showComingSoon && (
            <ElementBanner
              type="comingSoon"
              message={bannerSettings.comingSoon.message}
              showIcon={bannerSettings.comingSoon.showIcon}
            />
          )}
          {children}
        </>
      ) : (
        // Full-page banners (for admin pages)
        <>
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
        </>
      )}
    </div>
  );
};

export default BannerWrapper;
