// src/App.tsx
import React, { useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { BusinessAccessProvider } from './contexts/BusinessAccessContext';
import { TournamentVisibilityProvider } from './contexts/TournamentVisibilityContext';
import { B8SectionVisibilityProvider } from './contexts/B8SectionVisibilityContext';
import Navigation from './navigation/navigation';
// @ts-expect-error Missing type definitions for this module
import { initializeB8LeagueSettings } from './scripts/initializeB8LeagueSettings';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  // Initialize B8 League settings when the app starts
  useEffect(() => {
    try {
      initializeB8LeagueSettings();
    } catch (error) {
      console.error('Error initializing B8 League settings:', error);
    }
  }, []);

  return (
    <Router>
      <AuthProvider>
        <BusinessAccessProvider>
          <B8SectionVisibilityProvider>
            <TournamentVisibilityProvider>
              <Navigation />
              <ToastContainer position="bottom-right" autoClose={5000} />
            </TournamentVisibilityProvider>
          </B8SectionVisibilityProvider>
        </BusinessAccessProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
