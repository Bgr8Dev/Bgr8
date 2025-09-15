import React from 'react';
import { useLocation } from 'react-router-dom';
import AnnouncementBanner from '../announcements/AnnouncementBanner';
import { useIsMobile } from '../../hooks/useIsMobile';
import './WebsiteLayout.css';

interface WebsiteLayoutProps {
  children: React.ReactNode;
}

const WebsiteLayout: React.FC<WebsiteLayoutProps> = ({ children }) => {
  const location = useLocation();
  const isMobile = useIsMobile();
  
  // Determine if we're on admin portal pages
  const isAdminPortal = location.pathname.startsWith('/admin');
  
  // Determine if we're on homepage
  const isHomepage = location.pathname === '/';

  return (
    <div className="website-layout">
      {/* Announcement Banner - appears at the top of all pages */}
      <AnnouncementBanner 
        showOnHomepage={isHomepage}
        showOnPortal={isAdminPortal}
        showOnMobile={isMobile}
        className="website-announcement-banner"
      />
      
      {/* Main content */}
      <div className="website-content">
        {children}
      </div>
    </div>
  );
};

export default WebsiteLayout;
