import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import WebsiteLayout from './WebsiteLayout';
import { AuthProvider } from '../../contexts/AuthContext';
import { PagePermissionsProvider } from '../../contexts/PagePermissionsContext';
import Navigation from '../navigation/Navigation';
import Routes from '../navigation/Routes';

const AppWithAnnouncements: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <PagePermissionsProvider>
          <WebsiteLayout>
            <Navigation />
            <Routes />
          </WebsiteLayout>
        </PagePermissionsProvider>
      </AuthProvider>
    </Router>
  );
};

export default AppWithAnnouncements;
