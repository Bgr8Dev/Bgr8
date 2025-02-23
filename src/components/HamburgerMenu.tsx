// src/components/HamburgerMenu.tsx
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Navbar.css';
import logo from '../assets/B8-logo-transparent.png';

export default function HamburgerMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { currentUser, userProfile } = useAuth();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
    if (showUserMenu) setShowUserMenu(false);
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setIsOpen(false);
      setShowUserMenu(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="hamburger-menu">
      <div className="mobile-header">
        <Link to="/" className="mobile-logo">
          <img src={logo} alt="B8 Logo" />
        </Link>
        
        <div className="mobile-header-center">
          {currentUser && (
            <span className="mobile-greeting">
              Hello, {currentUser.displayName || 'User'}
            </span>
          )}
        </div>

        <div className="menu-icon" onClick={toggleMenu}>
          ☰
        </div>
      </div>

      {isOpen && (
        <div className="mobile-menu">
          <div className="mobile-auth-section">
            {currentUser ? (
              <div className="mobile-user-menu">
                {showUserMenu && (
                  <div className="mobile-user-submenu">
                    <Link to="/profile" onClick={toggleMenu}>Profile</Link>
                    <Link to="/settings" onClick={toggleMenu}>Settings</Link>
                    {userProfile?.admin && (
                      <Link to="/admin-portal" onClick={toggleMenu} className="admin-link">
                        Admin Portal
                      </Link>
                    )}
                    <button onClick={handleSignOut}>Sign Out</button>
                  </div>
                )}
              </div>
            ) : (
              <div className="mobile-auth-buttons">
                <Link to="/signin" onClick={toggleMenu} className="auth-button signin">
                  Sign In
                </Link>
                <Link to="/register" onClick={toggleMenu} className="auth-button register">
                  Register
                </Link>
              </div>
            )}
          </div>

          <nav className="mobile-nav">
            <Link to="/" onClick={toggleMenu}>Home</Link>
            <Link to="/b8-marketing" onClick={toggleMenu}>B8 Marketing</Link>
            <Link to="/bgr8" onClick={toggleMenu}>Bgr8</Link>
            <Link to="/b8-car-club" onClick={toggleMenu}>B8 Car Club</Link>
            <Link to="/b8-clothing" onClick={toggleMenu}>B8 Clothing</Link>
            <Link to="/b8-football-club" onClick={toggleMenu}>B8 Football Club</Link>
            <Link to="/b8-charity" onClick={toggleMenu}>B8 Charity</Link>
            <Link to="/b8-education" onClick={toggleMenu}>B8 Education</Link>
            <Link to="/b8-careers" onClick={toggleMenu}>B8 Careers</Link>
          </nav>
        </div>
      )}
    </div>
  );
}
