// src/components/HamburgerMenu.tsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { auth } from '../../firebase/firebase';
import { signOut } from 'firebase/auth';
import { useAuth } from '../../contexts/AuthContext';
import { useBusinessAccess } from '../../contexts/BusinessAccessContext';
import '../../styles/HamburgerMenu.css';
import logo from '../../assets/bgr8-logo-transparent.png';

export default function HamburgerMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { currentUser, userProfile } = useAuth();
  const { isBusinessAccessible } = useBusinessAccess();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="hamburger-menu">
      <div className="hamburger-header">
        <Link to="/" className="hamburger-logo">
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

      {isOpen && (
        <div className="hamburger-overlay">
          <nav className="mobile-nav">
            <Link to="/" onClick={toggleMenu}>Home</Link>
            {isBusinessAccessible('bgr8') && <Link to="/bgr8" onClick={toggleMenu}>Bgr8</Link>}
            {isBusinessAccessible('bgr8r') && <Link to="/bgr8r" onClick={toggleMenu}>Bgr8r</Link>}
          </nav>

          <div className="mobile-auth">
            {currentUser ? (
              <div className="mobile-user-menu">
                <div className="mobile-user-info">
                  {currentUser.photoURL ? (
                    <img 
                      src={currentUser.photoURL} 
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
                  <Link to="/profile" onClick={toggleMenu}>Profile</Link>
                  <Link to="/settings" onClick={toggleMenu}>Settings</Link>
                  {userProfile?.admin && (
                    <Link to="/admin-portal" onClick={toggleMenu} className="mobile-admin-link">Admin Portal</Link>
                  )}
                  <button onClick={handleSignOut}>Sign Out</button>
                </div>
              </div>
            ) : (
              <div className="mobile-auth-buttons">
                <Link to="/signin" onClick={toggleMenu} className="mobile-auth-button signin">Sign In</Link>
                <Link to="/register" onClick={toggleMenu} className="mobile-auth-button register">Register</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
