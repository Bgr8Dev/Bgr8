// src/components/HamburgerMenu.tsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { auth, firestore } from '../../firebase/firebase';
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../../hooks/useAuth';
import { hasRole } from '../../utils/userProfile';
import '../../styles/HamburgerMenu.css';
import logo from '../../assets/bgr8-logo-transparent.png';

interface MentorMenteeProfile {
  isMentor?: boolean;
  isMentee?: boolean;
  type?: string;
  verification?: {
    status?: string;
  };
}

export default function HamburgerMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [userRole, setUserRole] = useState<'mentor' | 'mentee' | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<string | null>(null);
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

  // Fetch user role and verification status from mentorProgram profile
  useEffect(() => {
    const fetchUserRole = async () => {
      if (!currentUser?.uid) return;
      
      try {
        const mentorProgramDoc = await getDoc(
          doc(firestore, 'users', currentUser.uid, 'mentorProgram', 'profile')
        );
        
        if (mentorProgramDoc.exists()) {
          const profileData = mentorProgramDoc.data() as MentorMenteeProfile;
          if (profileData.isMentor === true || profileData.type?.toLowerCase() === 'mentor') {
            setUserRole('mentor');
            setVerificationStatus(profileData.verification?.status || null);
          } else if (profileData.isMentee === true || profileData.type?.toLowerCase() === 'mentee') {
            setUserRole('mentee');
            setVerificationStatus(null);
          }
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
      }
    };

    fetchUserRole();
  }, [currentUser]);

  // Get profile picture: use uploaded photo if available, otherwise use Google photo
  const getProfilePicture = () => {
    return userProfile?.photoURL || currentUser?.photoURL || null;
  };

  const profilePicture = getProfilePicture();

  // Get status tag based on role and verification
  const getStatusTag = () => {
    if (userRole === 'mentor') {
      if (verificationStatus === 'approved') {
        return { text: 'Verified Mentor', color: 'var(--success)', className: 'status-tag-verified' };
      } else {
        return { text: 'Unverified Mentor', color: '#fca5a5', className: 'status-tag-unverified' };
      }
    } else if (userRole === 'mentee') {
      return { text: 'Mentee', color: 'var(--mentee)', className: 'status-tag-mentee' };
    }
    return null;
  };

  const statusTag = getStatusTag();

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
                <div className="mobile-user-info-text">
                  <span className="mobile-user-name">{currentUser.displayName || 'User'}</span>
                  {statusTag && (
                    <span 
                      className={`mobile-user-status-tag ${statusTag.className}`}
                      style={{ 
                        backgroundColor: statusTag.color,
                        color: 'white',
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '0.875rem',
                        fontWeight: '600'
                      }}
                    >
                      {statusTag.text}
                    </span>
                  )}
                </div>
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
