// src/components/HamburgerMenu.tsx
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { auth } from '../../firebase/firebase';
import { signOut } from 'firebase/auth';
import { useAuth } from '../../contexts/AuthContext';
import { useBusinessAccess } from '../../contexts/BusinessAccessContext';
import '../../styles/Navbar.css';
import logo from '../../assets/B8-logo-transparent.png';

export default function HamburgerMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [, setShowUserMenu] = useState(true);
  const { currentUser, userProfile } = useAuth();
  const { isBusinessAccessible } = useBusinessAccess();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
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
            {isBusinessAccessible('marketing') && <Link to="/b8-marketing" onClick={toggleMenu}>Innov8</Link>}
            {isBusinessAccessible('bgr8') && <Link to="/bgr8" onClick={toggleMenu}>Bgr8</Link>}
            {isBusinessAccessible('carClub') && <Link to="/b8-car-club" onClick={toggleMenu}>B8 Car Club</Link>}
            {isBusinessAccessible('clothing') && <Link to="/b8-clothing" onClick={toggleMenu} className="glitch-link">??????????</Link>}
            {isBusinessAccessible('league') && <Link to="/b8-league" onClick={toggleMenu}>B8 League</Link>}
            {isBusinessAccessible('world') && <Link to="/b8-world" onClick={toggleMenu}>B8 World</Link>}
            {isBusinessAccessible('bgr8r') && <Link to="/bgr8r" onClick={toggleMenu}>Bgr8r</Link>}
            {isBusinessAccessible('podcast') && <Link to="/b8-podcast" onClick={toggleMenu}>B8 Podcast</Link>}
          </nav>
        </div>
      )}
    </div>
  );
}
