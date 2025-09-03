import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
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
  if (requiredPermission && !hasPermission(userProfile, requiredPermission)) {
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

  // User is authenticated and has required permissions
  return <>{children}</>;
};

// Helper function to check permissions
function hasPermission(userProfile: any, permission: string): boolean {
  if (!userProfile) return false;

  switch (permission) {
    case 'admin':
      return userProfile.admin;
    default:
      return false;
  }
}
