// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Navigation from './navigation/navigation';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './utils/updatePermissions'; // Import to make updatePagePermissions available globally
import './App.css';
import AnnouncementBanner from './components/announcements/AnnouncementBanner';
import { useIsMobile } from './hooks/useIsMobile';

// Inner component to access location and mobile hook
function AppContent() {
  const location = useLocation();
  const isMobile = useIsMobile();
  
  const isAdminPortal = location.pathname.startsWith('/admin');
  const isHomepage = location.pathname === '/';

  return (
    <div className="app-container">
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
  return (
      <Router>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </Router>
  );
}

export default App;
