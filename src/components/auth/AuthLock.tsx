import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { hasRole, UserProfile } from '../../utils/userProfile';
import { isEmailVerified } from '../../services/emailVerificationService';
import { resendVerificationEmail } from '../../services/emailVerificationService';
import { getUserProfile } from '../../utils/userProfile';
import '../../styles/AuthLock.css';

interface AuthLockProps {
  children: React.ReactNode;
  requiredPermission?: string;
  fallbackMessage?: string;
}

export const AuthLock: React.FC<AuthLockProps> = ({ 
  children, 
  requiredPermission,
  fallbackMessage 
}) => {
  const { currentUser, userProfile, loading } = useAuth();
  const [emailVerified, setEmailVerified] = useState<boolean | null>(null);
  const [isCheckingVerification, setIsCheckingVerification] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  // Check email verification status
  useEffect(() => {
    const checkVerification = async () => {
      if (currentUser && !requiredPermission) {
        // Only check for non-admin routes (admin routes might not need email verification)
        setIsCheckingVerification(true);
        try {
          const verified = await isEmailVerified(currentUser.uid);
          setEmailVerified(verified);
        } catch (error) {
          console.error('Error checking email verification:', error);
          setEmailVerified(true); // Default to true on error to not block users
        } finally {
          setIsCheckingVerification(false);
        }
      } else {
        setEmailVerified(true); // Skip check for admin routes or no user
      }
    };

    checkVerification();
  }, [currentUser, requiredPermission]);

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="auth-lock-loading">
        <div className="loading-spinner"></div>
        <p>Checking authentication...</p>
      </div>
    );
  }

  // If no user is logged in
  if (!currentUser) {
    return (
      <div className="auth-lock-container">
        <div className="auth-lock-card">
          <div className="auth-lock-icon">🔒</div>
          <h2>Authentication Required</h2>
          <p>
            {fallbackMessage || "You need to be signed in to access this page."}
          </p>
          <div className="auth-lock-actions">
            <Link to="/signin" className="auth-lock-btn primary">
              Sign In
            </Link>
            <Link to="/signin?mode=register" className="auth-lock-btn secondary">
              Create Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // If user is logged in but doesn't have required permission
  if (requiredPermission && !hasRole(userProfile, requiredPermission as keyof UserProfile['roles'])) {
    return (
      <div className="auth-lock-container">
        <div className="auth-lock-card">
          <div className="auth-lock-icon">🚫</div>
          <h2>Access Denied</h2>
          <p>
            You don't have permission to access this page. 
            {requiredPermission === 'admin' && " Admin privileges are required."}
          </p>
          <div className="auth-lock-actions">
            <Link to="/" className="auth-lock-btn primary">
              Go Home
            </Link>
            <Link to="/profile" className="auth-lock-btn secondary">
              View Profile
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Check if email is verified (for non-admin routes)
  if (!requiredPermission && emailVerified === false && currentUser) {
    return (
      <div className="auth-lock-container">
        <div className="auth-lock-card">
          <div className="auth-lock-icon">📧</div>
          <h2>Email Verification Required</h2>
          <p>
            Please verify your email address to access this page. 
            Check your inbox for the verification email.
          </p>
          <div className="auth-lock-actions">
            <button
              onClick={async () => {
                if (!currentUser) return;
                setIsResending(true);
                setResendMessage('');
                try {
                  const profile = await getUserProfile(currentUser.uid);
                  if (profile && profile.email) {
                    const result = await resendVerificationEmail(
                      currentUser.uid,
                      profile.email,
                      profile.firstName || 'User'
                    );
                    if (result.success) {
                      setResendMessage('Verification email sent! Please check your inbox.');
                    } else {
                      setResendMessage(result.error || 'Failed to send verification email');
                    }
                  }
                } catch {
                  setResendMessage('An error occurred. Please try again later.');
                } finally {
                  setIsResending(false);
                }
              }}
              disabled={isResending}
              className="auth-lock-btn primary"
            >
              {isResending ? 'Sending...' : 'Resend Verification Email'}
            </button>
            <Link to="/verify-email?prompt=true" className="auth-lock-btn secondary">
              Go to Verification Page
            </Link>
          </div>
          {resendMessage && (
            <p style={{ marginTop: '1rem', color: resendMessage.includes('sent') ? '#198754' : '#dc3545' }}>
              {resendMessage}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Show loading while checking verification
  if (!requiredPermission && isCheckingVerification) {
    return (
      <div className="auth-lock-loading">
        <div className="loading-spinner"></div>
        <p>Checking email verification...</p>
      </div>
    );
  }

  // User is authenticated, has required permissions, and email is verified
  return <>{children}</>;
};

