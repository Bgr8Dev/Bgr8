// src/components/Navbar.tsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, firestore } from '../../firebase/firebase';
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../../hooks/useAuth';
import { hasRole } from '../../utils/userProfile';
import '../../styles/Navbar.css';
import logo from '../../assets/Bgr8_logo.png';

interface MentorMenteeProfile {
  isMentor?: boolean;
  isMentee?: boolean;
  type?: string;
  verification?: {
    status?: string;
  };
}

export default function Navbar() {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [userRole, setUserRole] = useState<'mentor' | 'mentee' | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<string | null>(null);
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
              {profilePicture ? (
                <img 
                  src={profilePicture} 
                  alt={`${currentUser.displayName || 'User'} profile`}
                  className="user-avatar"
                />
              ) : (
                <div className="user-avatar-placeholder">
                  {currentUser.displayName?.charAt(0) || currentUser.email?.charAt(0)}
                </div>
              )}
              <div className="user-menu-info">
                <span className="user-name">{currentUser.displayName || 'User'}</span>
                {statusTag && (
                  <span 
                    className={`user-status-tag ${statusTag.className}`}
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
