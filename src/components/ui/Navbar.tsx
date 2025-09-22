// src/components/Navbar.tsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../../firebase/firebase';
import { signOut } from 'firebase/auth';
import { useAuth } from '../../hooks/useAuth';
import { hasRole } from '../../utils/userProfile';
import '../../styles/Navbar.css';
import logo from '../../assets/Bgr8_logo.png';

export default function Navbar() {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setShowUserMenu(false);
      // Redirect to home page after successful sign out
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <header className="header">
      <h1 className="logo">
        <Link to="/" aria-label="BGr8 Home">
          <img src={logo} alt="BGr8 Logo" />
        </Link>
      </h1>

      {/* <nav className="nav" role="navigation" aria-label="Main navigation">
        <Link to="/dashboard" className="nav-link">Find Mentors</Link>
        {currentUser && (
          <Link to="/sessions" className="nav-link">My Sessions</Link>
        )}
      </nav> */}

      <div className="auth-section">
        {currentUser ? (
          <div className="user-menu-container">
            <button 
              className="user-menu-trigger"
              onClick={() => setShowUserMenu(!showUserMenu)}
              aria-haspopup="true"
              aria-label="User menu"
            >
              {currentUser.photoURL ? (
                <img 
                  src={currentUser.photoURL} 
                  alt={`${currentUser.displayName || 'User'} profile`}
                  className="user-avatar"
                />
              ) : (
                <div className="user-avatar-placeholder">
                  {currentUser.displayName?.charAt(0) || currentUser.email?.charAt(0)}
                </div>
              )}
              <span>Hello, {currentUser.displayName || 'User'}</span>
            </button>
            
            {showUserMenu && (
              <div className="user-menu" role="menu">
                <Link to="/profile" role="menuitem">Profile</Link>
                <Link to="/settings" role="menuitem">Settings</Link>
                {hasRole(userProfile, 'committee') && (
                  <Link to="/admin-portal" className="admin-link" role="menuitem">
                    Admin Portal
                  </Link>
                )}
                <button 
                  onClick={handleSignOut} 
                  role="menuitem"
                  aria-label="Sign out"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="auth-buttons">
            <Link to="/signin" className="auth-button signin">
              Sign In
            </Link>
            <Link to="/signin?mode=register" className="auth-button register">
              Register
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
