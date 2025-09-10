// src/App.tsx
import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Navigation from './navigation/navigation';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './utils/updatePermissions'; // Import to make updatePagePermissions available globally

function App() {
  return (
      <Router>
        <AuthProvider>
            <Navigation />
            <ToastContainer position="bottom-right" autoClose={5000} />
        </AuthProvider>
      </Router>
  );
}

export default App;
