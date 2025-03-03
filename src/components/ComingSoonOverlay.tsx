import React from 'react';
import '../styles/ComingSoonOverlay.css';
import { useBusinessAccess } from '../contexts/BusinessAccessContext';

interface ComingSoonOverlayProps {
  businessId: string;
  children: React.ReactNode;
  customMessage?: string;
}

/**
 * A component that wraps content and displays a "Coming Soon" overlay
 * if the specified business is marked as "grayed out" in the admin settings.
 * 
 * @param businessId - The ID of the business to check (e.g., "marketing", "carClub")
 * @param children - The content to render inside the container
 * @param customMessage - Optional custom message to display
 */
export const ComingSoonOverlay: React.FC<ComingSoonOverlayProps> = ({ 
  businessId, 
  children, 
  customMessage 
}) => {
  const { isBusinessGrayedOut } = useBusinessAccess();
  const showOverlay = isBusinessGrayedOut(businessId);
  
  // Default messages for each business
  const getDefaultMessage = () => {
    switch(businessId) {
      case 'marketing':
        return 'Our marketing solutions are coming soon! Stay tuned for innovative strategies to boost your brand.';
      case 'carClub':
        return 'B8 Car Club is revving up! Check back soon for exclusive events and car enthusiast community features.';
      case 'clothing':
        return 'B8 Clothing line is currently in development. Exciting new styles will be available soon!';
      case 'league':
        return 'B8 League is getting ready for kickoff! Sports and esports content coming soon.';
      case 'world':
        return 'B8 World initiatives are under development. Our global impact projects will be launching soon!';
      case 'bgr8r':
        return 'Bgr8r programs are being developed. Learn with us soon!';
      case 'podcast':
        return 'B8 Podcast portal is under construction. Exciting episodes will be available soon!';
      case 'bgr8':
        return 'BGr8 features are coming soon! Join our community to be part of something great.';
      default:
        return 'This page is currently under development. Check back soon for updates!';
    }
  };

  const displayMessage = customMessage || getDefaultMessage();

  return (
    <div className={`coming-soon-overlay-container ${showOverlay ? 'has-overlay' : ''}`}>
      {showOverlay && (
        <>
          <div className="coming-soon-overlay">
            Coming Soon
          </div>
          <div className="coming-soon-message">
            {displayMessage}
          </div>
        </>
      )}
      {children}
    </div>
  );
}; 