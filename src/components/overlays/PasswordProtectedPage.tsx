import React, { useState, useEffect } from 'react';
import { useBusinessAccess } from '../../contexts/BusinessAccessContext';
import '../../styles/PasswordProtectedPage.css';
import { FaUnlock, FaExclamationTriangle } from 'react-icons/fa';
import bgr8Logo from '../../assets/bgr8-logo-transparent.png';

interface PasswordProtectedPageProps {
  businessId: string;
  children: React.ReactNode;
  customMessage?: string;
}

export const PasswordProtectedPage: React.FC<PasswordProtectedPageProps> = ({
  businessId,
  children,
  customMessage
}) => {
  const { 
    isBusinessPasswordProtected, 
    validateBusinessPassword,
    getBusinessPassword
  } = useBusinessAccess();
  
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState('');
  const [showPasswordHint, setShowPasswordHint] = useState(false);
  const [logoClicked, setLogoClicked] = useState(false);
  
  // Check if the page is password protected
  const isProtected = isBusinessPasswordProtected(businessId);
  
  // Check if there's a stored authentication state in session storage
  useEffect(() => {
    const storedAuth = sessionStorage.getItem(`password_auth_${businessId}`);
    if (storedAuth === 'true') {
      setIsAuthenticated(true);
    }
  }, [businessId]);
  
  // Reset logo animation after it completes
  useEffect(() => {
    if (logoClicked) {
      const timer = setTimeout(() => {
        setLogoClicked(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [logoClicked]);
  
  // If the page is not password protected, render children directly
  if (!isProtected) {
    return <>{children}</>;
  }
  
  // If already authenticated, render children
  if (isAuthenticated) {
    return <>{children}</>;
  }
  
  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateBusinessPassword(businessId, password)) {
      setIsAuthenticated(true);
      setError('');
      // Store authentication state in session storage
      sessionStorage.setItem(`password_auth_${businessId}`, 'true');
    } else {
      setError('Incorrect password. Please try again.');
    }
  };
  
  const togglePasswordHint = () => {
    setShowPasswordHint(!showPasswordHint);
  };
  
  // Determine if this is the Car Club page to apply special styling
  const isCarClub = businessId === 'carClub';
  
  // Custom messages for Car Club
  const carClubMessage = 'Welcome to the exclusive bgr8 Car Club area. Please enter your membership password to access premium content.';
  
  const handleLogoClick = () => {
    setLogoClicked(true);
    // Focus on password input when logo is clicked
    const inputElement = document.querySelector('.protected-password-input') as HTMLInputElement;
    if (inputElement) {
      inputElement.focus();
    }
  };
  
  return (
    <div className={`protected-password-container ${isCarClub ? 'carclub-password-protected' : ''}`}>
      <div className="protected-password-overlay">
        <div className="protected-password-content">
          <div className="bgr8-logo-container">
            <img 
              src={bgr8Logo} 
              alt="bgr8 Logo" 
              className={`bgr8-logo ${logoClicked ? 'logo-pulse' : ''}`}
              onClick={handleLogoClick}
            />
            
            <form onSubmit={handlePasswordSubmit} className="protected-password-form">
              <div className="protected-password-input-group">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isCarClub ? "Enter membership password" : "Enter password"}
                  className="protected-password-input"
                />
                <button type="submit" className="protected-password-submit-button">
                  <FaUnlock /> {isCarClub ? 'Access' : 'Unlock'}
                </button>
              </div>
            </form>
          </div>
          
          <h2>{isCarClub ? 'bgr8 Car Club Access' : 'Password Protected'}</h2>
          
          <p className="protected-password-message">
            {customMessage || (isCarClub ? carClubMessage : 'This page is password protected. Please enter the password to continue.')}
          </p>
          
          {error && (
            <div className="protected-password-error">
              <FaExclamationTriangle /> {error}
            </div>
          )}
          
          {process.env.NODE_ENV === 'development' && (
            <div className="protected-password-hint-container">
              <button 
                className="protected-password-hint-toggle" 
                onClick={togglePasswordHint}
              >
                {showPasswordHint ? 'Hide Password Hint' : 'Show Password Hint (Dev Only)'}
              </button>
              
              {showPasswordHint && (
                <div className="protected-password-hint">
                  <p>Development Mode: The correct password is: <strong>{getBusinessPassword(businessId)}</strong></p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 