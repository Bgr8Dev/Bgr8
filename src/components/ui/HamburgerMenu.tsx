// src/components/HamburgerMenu.tsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { auth } from '../../firebase/firebase';
import { signOut } from 'firebase/auth';
import { useAuth } from '../../hooks/useAuth';
import { hasRole } from '../../utils/userProfile';
import '../../styles/HamburgerMenu.css';
import logo from '../../assets/bgr8-logo-transparent.png';

export default function HamburgerMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { currentUser, userProfile } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setIsOpen(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  // Get profile picture: use uploaded photo if available, otherwise use Google photo
  const getProfilePicture = () => {
    return userProfile?.photoURL || currentUser?.photoURL || null;
  };

  const profilePicture = getProfilePicture();

  return (
    <div className="hamburger-menu">
      <div className="hamburger-header">
        <Link to="/" className="hamburger-logo" onClick={closeMenu}>
          <img src={logo} alt="Bgr8 Logo" />
        </Link>
        <button 
          className={`hamburger-button ${isOpen ? 'open' : ''}`}
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>

      <div className={`hamburger-overlay ${isOpen ? 'open' : ''}`}>
        <div className="mobile-auth">
          {currentUser ? (
            <div className="mobile-user-menu">
              <div className="mobile-user-info">
                {profilePicture ? (
                  <img 
                    src={profilePicture} 
                    alt="Profile" 
                    className="mobile-user-avatar"
                  />
                ) : (
                  <div className="mobile-user-avatar-placeholder">
                    {currentUser.displayName?.charAt(0) || currentUser.email?.charAt(0)}
                  </div>
                )}
                <span>Hello, {currentUser.displayName || 'User'}</span>
              </div>
              
              <div className="mobile-user-actions">
                <Link to="/profile" onClick={closeMenu}>Profile</Link>
                <Link to="/settings" onClick={closeMenu}>Settings</Link>
                {hasRole(userProfile, 'admin') && (
                  <Link to="/admin-portal" onClick={closeMenu} className="mobile-admin-link">Admin Portal</Link>
                )}
                <button onClick={handleSignOut}>Sign Out</button>
              </div>
            </div>
          ) : (
            <div className="mobile-auth-buttons">
              <Link to="/signin" onClick={closeMenu} className="mobile-auth-button signin">Sign In</Link>
              <Link to="/signin?mode=register" onClick={closeMenu} className="mobile-auth-button register">Register</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
