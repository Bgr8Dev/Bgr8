// src/App.tsx
import React, { useEffect } from 'react';
import { BrowserRouter as Router, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { BigTextProvider, useBigText } from './contexts/BigTextContext';
import { BannerProvider } from './contexts/BannerContext';
import Navigation from './navigation/navigation';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './utils/updatePermissions'; // Import to make updatePagePermissions available globally
import './App.css';
import './styles/bigText.css';
import './styles/tooltip.css';
import AnnouncementBanner from './components/announcements/AnnouncementBanner';
import { useIsMobile } from './hooks/useIsMobile';
import { EmailService } from './services/emailService';
import { emailConfig } from './config/emailConfig';

// Inner component to access location and mobile hook
function AppContent() {
  const location = useLocation();
  const isMobile = useIsMobile();
  const { isBigTextEnabled, fontSize } = useBigText();
  
  const isAdminPortal = location.pathname.startsWith('/admin');
  const isHomepage = location.pathname === '/';

  // Calculate font size multiplier (16px is base, so 16px = 1.0, 20px = 1.25, etc.)
  const fontSizeMultiplier = fontSize / 16;

  return (
    <div 
      className={`app-container ${isBigTextEnabled ? 'big-text' : ''}`}
      style={{
        '--font-size-multiplier': fontSizeMultiplier
      } as React.CSSProperties}
    >
      <AnnouncementBanner 
        showOnHomepage={isHomepage}
        showOnPortal={isAdminPortal}
        showOnMobile={isMobile}
      />
      <Navigation />
      <ToastContainer position="bottom-right" autoClose={5000} />
    </div>
  );
}

function App() {
  // Initialize Email API service globally on app startup
  useEffect(() => {
    EmailService.initializeEmailApi({
      apiBaseUrl: emailConfig.apiBaseUrl
    });
  }, []);

  return (
      <Router>
        <AuthProvider>
          <BigTextProvider>
            <BannerProvider>
              <AppContent />
            </BannerProvider>
          </BigTextProvider>
        </AuthProvider>
      </Router>
  );
}

export default App;
