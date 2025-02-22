// src/components/Navbar.tsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { auth } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Navbar.css';
import logo from '../assets/B8-logo-transparent.png';

export default function Navbar() {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { currentUser, userProfile } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <header className="header">
      <h1 className="logo">
        <Link to="/">
          <img src={logo} alt="B8 Logo" />
        </Link>
      </h1>

      <nav className="nav">
        <Link to="/">Home</Link>
        <Link to="/b8-marketing">B8 Marketing</Link>
        <Link to="/bgr8">Bgr8</Link>
        <Link to="/b8-car-club">B8 Car Club</Link>
        <Link to="/b8-clothing">B8 Clothing</Link>
        <Link to="/b8-football-club">B8 Football Club</Link>
        <Link to="/b8-charity">B8 Charity</Link>
        <Link to="/b8-education">B8 Education</Link>
        <Link to="/b8-careers">B8 Careers</Link>
      </nav>

      <div className="auth-section">
        {currentUser ? (
          <div className="user-menu-container">
            <div 
              className="user-menu-trigger"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              {currentUser.photoURL ? (
                <img 
                  src={currentUser.photoURL} 
                  alt="Profile" 
                  className="user-avatar"
                />
              ) : (
                <div className="user-avatar-placeholder">
                  {currentUser.displayName?.charAt(0) || currentUser.email?.charAt(0)}
                </div>
              )}
              <span>Hello, {currentUser.displayName || 'User'}</span>
            </div>
            
            {showUserMenu && (
              <div className="user-menu">
                <Link to="/profile">Profile</Link>
                <Link to="/settings">Settings</Link>
                {userProfile?.admin && (
                  <Link to="/admin-portal" className="admin-link">Admin Portal</Link>
                )}
                <button onClick={handleSignOut}>Sign Out</button>
              </div>
            )}
          </div>
        ) : (
          <div className="auth-buttons">
            <Link to="/signin" className="auth-button signin">Sign In</Link>
            <Link to="/register" className="auth-button register">Register</Link>
          </div>
        )}
      </div>
    </header>
  );
}
