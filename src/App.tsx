// src/App.tsx
import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { BusinessAccessProvider } from './contexts/BusinessAccessContext';
import { Bgr8SectionVisibilityProvider } from './contexts/Bgr8SectionVisibilityContext';
import Navigation from './navigation/navigation';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  return (
    <Bgr8SectionVisibilityProvider>
      <Router>
        <AuthProvider>
          <BusinessAccessProvider>
            <Navigation />
            <ToastContainer position="bottom-right" autoClose={5000} />
          </BusinessAccessProvider>
        </AuthProvider>
      </Router>
    </Bgr8SectionVisibilityProvider>
  );
}

export default App;
