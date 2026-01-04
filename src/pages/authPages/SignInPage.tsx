import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth, firestore } from '../../firebase/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { createUserProfile, UserProfile } from '../../utils/userProfile';
import Navbar from '../../components/ui/Navbar';
import HamburgerMenu from '../../components/ui/HamburgerMenu';
import Footer from '../../components/ui/Footer';
import PasswordInput from '../../components/ui/PasswordInput';
import { FcGoogle } from 'react-icons/fc';
import '../../styles/AuthPages.css';
import { useIsMobile } from '../../hooks/useIsMobile';
import { checkRateLimit, updateLastActivity, handleError, validatePassword, calculatePasswordStrength, PasswordStrength, clearRateLimit, validateFirstName, validateLastName } from '../../utils/security';
import MobileSignInPage from './MobileSignInPage';
import { sendRegistrationWelcomeEmail, sendAccountCreatedEmail } from '../../services/emailHelpers';
import { loggers } from '../../utils/logger';
// import PasswordStrengthMeter from '../../components/ui/PasswordStrengthMeter';

// Simple inline PasswordStrengthMeter component
const SimplePasswordStrengthMeter = ({ strength }: { strength: PasswordStrength }) => {
  const getColor = (level: PasswordStrength['level']) => {
    switch (level) {
      case 'Very Weak': return '#dc3545';
      case 'Weak': return '#fd7e14';
      case 'Fair': return '#ffc107';
      case 'Good': return '#20c997';
      case 'Strong': return '#198754';
      case 'Very Strong': return '#0d6efd';
      default: return '#6c757d';
    }
  };

  return (
    <div style={{ marginTop: '0.5rem' }}>
      <div style={{ 
        width: '100%', 
        height: '4px', 
        backgroundColor: '#e9ecef', 
        borderRadius: '2px',
        overflow: 'hidden'
      }}>
        <div style={{
          width: `${strength.score}%`,
          height: '100%',
          backgroundColor: getColor(strength.level),
          transition: 'all 0.3s ease'
        }} />
      </div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        marginTop: '0.25rem',
        fontSize: '0.875rem'
      }}>
        <span style={{ color: getColor(strength.level), fontWeight: '600' }}>
          {strength.level}
        </span>
        <span style={{ color: '#6c757d' }}>
          {strength.score}/100
        </span>
      </div>
    </div>
  );
};
import { PasswordHistoryService } from '../../services/passwordHistoryService';
import { AccountLockoutService } from '../../services/accountLockoutService';
import { BruteForceProtectionService } from '../../services/bruteForceProtectionService';

// Define FirebaseErrorWithCode type to handle Firebase errors
interface FirebaseErrorWithCode extends Error {
  code: string;
}




// Auto-save key for localStorage
const FORM_DRAFT_KEY = 'auth_form_draft';
const FORM_DRAFT_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

export default function SignInPage() {
  const isMobile = useIsMobile();
  const [searchParams] = useSearchParams();
  const [isSignIn, setIsSignIn] = useState(true); // Toggle between sign-in and register
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [isBlocked, setIsBlocked] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  // Handle URL parameters to set initial tab
  useEffect(() => {
    const mode = searchParams.get('mode');
    if (mode === 'register') {
      setIsSignIn(false);
    } else {
      setIsSignIn(true);
    }
  }, [searchParams]);

  // Load draft from localStorage on mount
  useEffect(() => {
    if (!isSignIn) {
      try {
        const draftData = localStorage.getItem(FORM_DRAFT_KEY);
        if (draftData) {
          const { data, timestamp } = JSON.parse(draftData);
          // Check if draft is still valid (not expired)
          if (Date.now() - timestamp < FORM_DRAFT_EXPIRY) {
            setFormData(data);
            // Show a notification that draft was restored
            setSuccessMessage('Draft restored from previous session');
            setTimeout(() => setSuccessMessage(''), 3000);
          } else {
            localStorage.removeItem(FORM_DRAFT_KEY);
          }
        }
      } catch (err) {
        loggers.error.error('Error loading form draft:', err);
      }
    }
  }, [isSignIn]);

  // Auto-save draft to localStorage
  useEffect(() => {
    if (!isSignIn && (formData.firstName || formData.lastName || formData.email)) {
      const draftData = {
        data: formData,
        timestamp: Date.now()
      };
      try {
        localStorage.setItem(FORM_DRAFT_KEY, JSON.stringify(draftData));
      } catch (err) {
        loggers.error.error('Error saving form draft:', err);
      }
    }
  }, [formData, isSignIn]);

  // Clear draft on successful registration
  const clearDraft = () => {
    try {
      localStorage.removeItem(FORM_DRAFT_KEY);
    } catch (err) {
      loggers.error.error('Error clearing form draft:', err);
    }
  };

  // Calculate form completion progress (for registration)
  const calculateProgress = (): number => {
    if (isSignIn) return 0;
    
    const fields = [
      formData.firstName,
      formData.lastName,
      formData.email,
      formData.password,
      formData.confirmPassword
    ];
    
    const filledFields = fields.filter(field => field.trim().length > 0).length;
    const validFields = Object.keys(fieldErrors).filter(key => !fieldErrors[key]).length;
    
    // Base progress on filled fields (60%) and valid fields (40%)
    const fillProgress = (filledFields / fields.length) * 60;
    const validationProgress = (validFields / fields.length) * 40;
    
    return Math.min(100, fillProgress + validationProgress);
  };

  // Real-time field validation
  const validateField = (fieldName: string, value: string): string => {
    switch (fieldName) {
      case 'firstName': {
        if (!value.trim()) return 'First name is required';
        const firstNameValidation = validateFirstName(value);
        return firstNameValidation.isValid ? '' : (firstNameValidation.error || '');
      }
      case 'lastName': {
        if (!value.trim()) return 'Last name is required';
        const lastNameValidation = validateLastName(value);
        return lastNameValidation.isValid ? '' : (lastNameValidation.error || '');
      }
      case 'email': {
        if (!value.trim()) return 'Email is required';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) return 'Please enter a valid email address';
        return '';
      }
      case 'password': {
        if (!value) return 'Password is required';
        if (!validatePassword(value)) return 'Password does not meet security requirements';
        return '';
      }
      case 'confirmPassword': {
        if (!value) return 'Please confirm your password';
        if (value !== formData.password) return 'Passwords do not match';
        return '';
      }
      default:
        return '';
    }
  };

  // Handle field blur (mark as touched and validate)
  const handleFieldBlur = (fieldName: string) => {
    setTouchedFields(prev => new Set(Array.from(prev).concat(fieldName)));
    const value = formData[fieldName as keyof typeof formData];
    const error = validateField(fieldName, value);
    setFieldErrors(prev => ({ ...prev, [fieldName]: error }));
  };

  // Handle field change with real-time validation
  const handleFieldChange = (fieldName: string, value: string) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
    
    // Clear error when user starts typing
    if (fieldErrors[fieldName]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
    
    // Validate if field has been touched
    if (touchedFields.has(fieldName)) {
      const error = validateField(fieldName, value);
      setFieldErrors(prev => ({ ...prev, [fieldName]: error }));
    }
  };

  // Render mobile version if on mobile device
  if (isMobile) {
    return <MobileSignInPage />;
  }

  const updatePasswordRequirements = (password: string) => {
    // Calculate enhanced password strength
    const strength = calculatePasswordStrength(password, {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email
    });
    setPasswordStrength(strength);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setFormData({ ...formData, password: newPassword });
    updatePasswordRequirements(newPassword);
  };

  const validateForm = (): boolean => {
    if (isSignIn) {
      // Sign-in validation
      return true;
    } else {
      // Registration validation
      // Validate first name
      const firstNameValidation = validateFirstName(formData.firstName);
      if (!firstNameValidation.isValid) {
        setError(firstNameValidation.error || 'Invalid first name');
        return false;
      }

      // Validate last name
      const lastNameValidation = validateLastName(formData.lastName);
      if (!lastNameValidation.isValid) {
        setError(lastNameValidation.error || 'Invalid last name');
        return false;
      }

      // Update form data with normalized names if needed
      if (firstNameValidation.normalized || lastNameValidation.normalized) {
        setFormData({
          ...formData,
          firstName: firstNameValidation.normalized || formData.firstName,
          lastName: lastNameValidation.normalized || formData.lastName
        });
      }

      if (!validatePassword(formData.password)) {
        setError('Password does not meet security requirements');
        return false;
      }

      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return false;
      }

      return true;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    // Mark all fields as touched
    const allFields = isSignIn 
      ? ['email', 'password']
      : ['firstName', 'lastName', 'email', 'password', 'confirmPassword'];
    allFields.forEach(field => setTouchedFields(prev => new Set(Array.from(prev).concat(field))));

    // Validate all fields
    const errors: Record<string, string> = {};
    allFields.forEach(field => {
      const value = formData[field as keyof typeof formData];
      const error = validateField(field, value);
      if (error) errors[field] = error;
    });
    
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0 || !validateForm()) {
      setIsLoading(false);
      return;
    }

    // Check rate limiting for sign-in
    if (isSignIn && !checkRateLimit(formData.email)) {
      setIsBlocked(true);
      setError('Too many login attempts. Please try again in 15 minutes.');
      return;
    }
    
    try {
      if (isSignIn) {
        // Check comprehensive brute force protection first
        const bruteForceStatus = await BruteForceProtectionService.checkComprehensiveProtection(formData.email);
        if (bruteForceStatus.isBlocked) {
          const timeRemaining = bruteForceStatus.blockedUntil 
            ? Math.ceil((bruteForceStatus.blockedUntil.getTime() - Date.now()) / (1000 * 60))
            : null;
          setError(`Access blocked due to suspicious activity. Please try again in ${timeRemaining || 'unknown'} minutes.`);
          setIsBlocked(true);
          return;
        }

        // Check account lockout status
        const lockoutStatus = await AccountLockoutService.isAccountLocked(formData.email);
        if (lockoutStatus.isLocked) {
          if (lockoutStatus.isPermanent) {
            setError('Account has been permanently locked due to repeated security violations. Please contact support.');
          } else if (lockoutStatus.lockoutExpiresAt) {
            const timeRemaining = Math.ceil((lockoutStatus.lockoutExpiresAt.getTime() - Date.now()) / (1000 * 60));
            setError(`Account is temporarily locked. Please try again in ${timeRemaining} minutes.`);
          } else {
            setError('Account is currently locked. Please try again later.');
          }
          return;
        }

        // Sign-in logic
        await signInWithEmailAndPassword(auth, formData.email, formData.password);
        
        // Clear any failed attempts on successful login
        await Promise.all([
          AccountLockoutService.clearFailedAttempts(formData.email),
          BruteForceProtectionService.clearComprehensiveAttempts(formData.email),
          clearRateLimit(formData.email)
        ]);
        
        updateLastActivity(); // Set initial session timestamp
        setIsLoading(false);
        navigate('/');
      } else {
        // Registration logic
        const userCredential = await createUserWithEmailAndPassword(
          auth, 
          formData.email, 
          formData.password
        );

        // Update profile with display name
        await updateProfile(userCredential.user, {
          displayName: `${formData.firstName} ${formData.lastName}`
        });

        // Create user profile in Firestore
        await createUserProfile(
          userCredential.user.uid,
          formData.email,
          formData.firstName,
          formData.lastName,
          {}
        );

        // Add initial password to history
        await PasswordHistoryService.addPasswordToHistory(userCredential.user.uid, formData.password);

        // Clear draft on successful registration
        clearDraft();

        // Send welcome emails (non-blocking - don't fail registration if email fails)
        sendRegistrationWelcomeEmail(formData.email, formData.firstName, formData.lastName)
          .then(result => {
            if (result.success) {
              loggers.email.log(`Welcome email sent to ${formData.email}`);
            } else {
              loggers.email.error(`Failed to send welcome email: ${result.error}`);
            }
          })
          .catch(error => {
            loggers.email.error('Error sending welcome email:', error);
          });

        sendAccountCreatedEmail(formData.email, formData.firstName)
          .then(result => {
            if (result.success) {
              loggers.email.log(`Account created email sent to ${formData.email}`);
            } else {
              loggers.email.error(`Failed to send account created email: ${result.error}`);
            }
          })
          .catch(error => {
            loggers.email.error('Error sending account created email:', error);
          });

        // Show success message
        setIsLoading(false);
        setSuccessMessage(`Account created successfully! Welcome, ${formData.firstName}!`);
        
        // Clear form and redirect after 2 seconds
        setTimeout(() => {
          updateLastActivity();
          navigate('/');
        }, 2000);
      }
    } catch (err: unknown) {
      const firebaseError = err as FirebaseErrorWithCode;
      let errorMessage: string;
      
      if (isSignIn) {
        // Record failed attempt for security-related errors
        if (firebaseError.code === 'auth/wrong-password' || firebaseError.code === 'auth/user-not-found') {
          try {
            const reason = firebaseError.code === 'auth/wrong-password' ? 'wrong_password' : 'user_not_found';
            
            // Record in both account lockout and brute force protection
            const [lockoutResult, bruteForceResult] = await Promise.all([
              AccountLockoutService.recordFailedAttempt(formData.email, formData.email, reason),
              BruteForceProtectionService.recordComprehensiveFailedAttempt(formData.email, undefined, reason)
            ]);
            
            if (lockoutResult.isLocked || bruteForceResult.isBlocked) {
              const timeRemaining = lockoutResult.lockoutExpiresAt 
                ? Math.ceil((lockoutResult.lockoutExpiresAt.getTime() - Date.now()) / (1000 * 60))
                : bruteForceResult.blockedUntil
                ? Math.ceil((bruteForceResult.blockedUntil.getTime() - Date.now()) / (1000 * 60))
                : null;
              setError(`Too many failed attempts. Access blocked for ${timeRemaining || 'unknown'} minutes.`);
              setIsBlocked(true);
              return;
            }
          } catch (lockoutError) {
            console.error('Error recording failed attempt:', lockoutError);
          }
        }

        switch (firebaseError.code) {
          case 'auth/user-not-found': {
            setError('No account found with this email');
            break;
          }
          case 'auth/wrong-password': {
            setError('Incorrect password');
            break;
          }
          case 'auth/invalid-email': {
            setError('Invalid email address');
            break;
          }
          default: {
            errorMessage = handleError(firebaseError);
            setError(errorMessage);
            break;
          }
        }
      } else {
        switch (firebaseError.code) {
          case 'auth/email-already-in-use': {
            setError('An account with this email already exists');
            break;
          }
          case 'auth/weak-password': {
            setError('Password is too weak');
            break;
          }
          case 'auth/invalid-email': {
            setError('Invalid email address');
            break;
          }
          default: {
            errorMessage = handleError(firebaseError);
            setError(errorMessage);
            break;
          }
        }
      }
      console.error('Authentication error:', err);
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Check if user profile exists
      const userDoc = await getDoc(doc(firestore, 'users', result.user.uid));
      
      if (!userDoc.exists()) {
        // Create user profile for new Google sign-in users
        const nameParts = result.user.displayName?.split(' ') || ['', ''];
        const additionalData: Partial<UserProfile> = {};
        
        if (result.user.photoURL) {
          additionalData.photoURL = result.user.photoURL;
        }
        
        if (result.user.phoneNumber) {
          additionalData.phoneNumber = result.user.phoneNumber;
        }

        await createUserProfile(
          result.user.uid,
          result.user.email || '',
          nameParts[0],
          nameParts.slice(1).join(' '),
          additionalData
        );
      }
      
      updateLastActivity(); // Set initial session timestamp
      navigate('/');
    } catch (err: unknown) {
      const errorMessage = handleError(err as Error);
      setError(errorMessage);
    }
  };

  return (
    <div className="signin-page">
      {isMobile ? <HamburgerMenu /> : <Navbar />}
      
      {/* Hero Section with Background Image */}
      <section className="signin-hero">
        <div className="signin-hero-background">
          <div className="signin-hero-overlay">
            <div className="signin-hero-content">
              {/* Left Content */}
              <div className="signin-hero-text">
                <h1>Welcome Back</h1>
                <p className="signin-hero-subtitle">
                  Connect with mentors and mentees to create positive change in your community. 
                  Sign in to continue your journey of growth and impact.
                </p>
                <div className="signin-features">
                  <div className="signin-feature">
                    <div className="signin-feature-icon">🎯</div>
                    <span>Find Your Perfect Mentor</span>
                  </div>
                  <div className="signin-feature">
                    <div className="signin-feature-icon">🌱</div>
                    <span>Grow Your Skills</span>
                  </div>
                  <div className="signin-feature">
                    <div className="signin-feature-icon">🤝</div>
                    <span>Make a Difference</span>
                  </div>
                </div>
              </div>
              
              {/* Right Sign-in Form */}
              <div className="signin-form-container">
                <div className="signin-form-card">
                  <div className="signin-form-header">
                    <div className={`auth-mode-toggle ${!isSignIn ? 'register-active' : ''}`}>
                      <button 
                        className={`auth-mode-btn ${isSignIn ? 'active' : ''}`}
                        onClick={() => setIsSignIn(true)}
                      >
                        Sign In
                      </button>
                      <button 
                        className={`auth-mode-btn ${!isSignIn ? 'active' : ''}`}
                        onClick={() => setIsSignIn(false)}
                      >
                        Register
                      </button>
                    </div>
                    <h2>{isSignIn ? 'Sign In' : 'Create Account'}</h2>
                    <p className="signin-form-subtitle">
                      {isSignIn 
                        ? 'Enter your credentials to access your account' 
                        : 'Join our community of mentors and mentees'
                      }
                    </p>
                  </div>
                  
                  <div className="signin-form-content" key={isSignIn ? 'signin' : 'register'}>
                    {error && (
                      <div className="auth-error" role="alert" aria-live="polite">
                        {error}
                      </div>
                    )}
                    {successMessage && (
                      <div className="auth-success" role="alert" aria-live="polite">
                        {successMessage}
                      </div>
                    )}
                    {isBlocked && (
                      <div className="auth-warning" role="alert" aria-live="polite">
                        Account temporarily blocked due to too many login attempts.
                        Please try again later or reset your password.
                      </div>
                    )}
                    
                    {/* Progress Indicator for Registration */}
                    {!isSignIn && (() => {
                      const progressValue = Math.round(calculateProgress());
                      const progressProps = {
                        'aria-valuenow': progressValue,
                        'aria-valuemin': 0,
                        'aria-valuemax': 100
                      };
                      return (
                        <div 
                          className="form-progress-container" 
                          role="progressbar" 
                          {...progressProps}
                          aria-label="Form completion progress"
                        >
                          <div className="form-progress-label">
                            <span>Form Progress</span>
                            <span>{progressValue}%</span>
                          </div>
                          <div className="form-progress-bar">
                            <div 
                              className="form-progress-fill" 
                              style={{ width: `${progressValue}%` }}
                              aria-hidden="true"
                            />
                          </div>
                        </div>
                      );
                    })()}
                    
                    <form 
                      onSubmit={handleSubmit} 
                      className="auth-form"
                      aria-label={isSignIn ? 'Sign in form' : 'Registration form'}
                      noValidate
                    >
                    {!isSignIn && (
                      <div className="form-group">
                        <div className="auth-input-group">
                          <label htmlFor="firstName">
                            First Name
                            <span className="required-indicator" aria-label="required">*</span>
                          </label>
                          <input
                            id="firstName"
                            type="text"
                            placeholder="Enter your first name"
                            value={formData.firstName}
                            onChange={(e) => handleFieldChange('firstName', e.target.value)}
                            onBlur={() => handleFieldBlur('firstName')}
                            required
                            maxLength={50}
                            disabled={isBlocked || isLoading}
                            aria-required="true"
                            {...(fieldErrors.firstName ? { 'aria-invalid': true } : {})}
                            aria-describedby={fieldErrors.firstName ? 'firstName-error' : undefined}
                            autoComplete="given-name"
                          />
                          {fieldErrors.firstName && (
                            <span id="firstName-error" className="field-error" role="alert">
                              {fieldErrors.firstName}
                            </span>
                          )}
                        </div>
                        <div className="auth-input-group">
                          <label htmlFor="lastName">
                            Last Name
                            <span className="required-indicator" aria-label="required">*</span>
                          </label>
                          <input
                            id="lastName"
                            type="text"
                            placeholder="Enter your last name"
                            value={formData.lastName}
                            onChange={(e) => handleFieldChange('lastName', e.target.value)}
                            onBlur={() => handleFieldBlur('lastName')}
                            required
                            maxLength={50}
                            disabled={isBlocked || isLoading}
                            aria-required="true"
                            {...(fieldErrors.lastName ? { 'aria-invalid': true } : {})}
                            aria-describedby={fieldErrors.lastName ? 'lastName-error' : undefined}
                            autoComplete="family-name"
                          />
                          {fieldErrors.lastName && (
                            <span id="lastName-error" className="field-error" role="alert">
                              {fieldErrors.lastName}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <div className="auth-input-group">
                      <label htmlFor="email">
                        Email Address
                        <span className="required-indicator" aria-label="required">*</span>
                      </label>
                      <input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={formData.email}
                        onChange={(e) => handleFieldChange('email', e.target.value)}
                        onBlur={() => handleFieldBlur('email')}
                        required
                        disabled={isBlocked || isLoading}
                        aria-required="true"
                        {...(fieldErrors.email ? { 'aria-invalid': true } : {})}
                        aria-describedby={fieldErrors.email ? 'email-error' : undefined}
                        autoComplete="email"
                      />
                      {fieldErrors.email && (
                        <span id="email-error" className="field-error" role="alert">
                          {fieldErrors.email}
                        </span>
                      )}
                    </div>

                    {!isSignIn && (
                      <>
                        <div className="auth-input-group">
                          <PasswordInput
                            id="password"
                            label="Password"
                            value={formData.password}
                            onChange={(e) => {
                              handlePasswordChange(e);
                              handleFieldChange('password', e.target.value);
                            }}
                            onBlur={() => handleFieldBlur('password')}
                            placeholder="Create a password"
                            required
                            disabled={isBlocked || isLoading}
                            showSuggestions={true}
                            onUseSuggestion={(suggestedPassword) => {
                              setFormData({...formData, password: suggestedPassword});
                              updatePasswordRequirements(suggestedPassword);
                              handleFieldChange('password', suggestedPassword);
                            }}
                            {...(fieldErrors.password ? { 'aria-invalid': true } : {})}
                            aria-describedby={fieldErrors.password ? 'password-error' : undefined}
                          />
                          {fieldErrors.password && (
                            <span id="password-error" className="field-error" role="alert">
                              {fieldErrors.password}
                            </span>
                          )}
                          {passwordStrength && (
                            <SimplePasswordStrengthMeter 
                              strength={passwordStrength}
                            />
                          )}
                        </div>
                        
                        <div className="auth-input-group">
                          <PasswordInput
                            id="confirmPassword"
                            label="Confirm Password"
                            value={formData.confirmPassword}
                            onChange={(e) => handleFieldChange('confirmPassword', e.target.value)}
                            onBlur={() => handleFieldBlur('confirmPassword')}
                            placeholder="Confirm your password"
                            required
                            disabled={isBlocked || isLoading}
                            {...(fieldErrors.confirmPassword ? { 'aria-invalid': true } : {})}
                            aria-describedby={fieldErrors.confirmPassword ? 'confirmPassword-error' : undefined}
                          />
                          {fieldErrors.confirmPassword && (
                            <span id="confirmPassword-error" className="field-error" role="alert">
                              {fieldErrors.confirmPassword}
                            </span>
                          )}
                        </div>
                        

                      </>
                    )}
                    
                    {isSignIn && (
                      <div className="auth-input-group">
                        <PasswordInput
                          id="password"
                          label="Password"
                          value={formData.password}
                          onChange={(e) => setFormData({...formData, password: e.target.value})}
                          placeholder="Enter your password"
                          required
                          disabled={isBlocked}
                        />
                      </div>
                    )}
                    
                    <button 
                      type="submit" 
                      disabled={isBlocked || isLoading} 
                      className="signin-submit-btn"
                      {...(isLoading ? { 'aria-busy': true } : {})}
                    >
                      {isLoading ? (
                        <>
                          <span className="spinner" aria-hidden="true" />
                          {isSignIn ? 'Signing In...' : 'Creating Account...'}
                        </>
                      ) : (
                        isSignIn ? 'Sign In' : 'Create Account'
                      )}
                    </button>

                    <div className="auth-divider">
                      <span>or</span>
                    </div>
                    
                    <div className="google-sign-in-container">
                      <button 
                        type="button" 
                        onClick={handleGoogleSignIn} 
                        className="google-sign-in"
                        disabled={isBlocked || isLoading}
                        aria-label={isSignIn ? 'Sign in with Google' : 'Sign up with Google'}
                      >
                        <FcGoogle size={20} aria-hidden="true" />
                        {isSignIn ? 'Sign in with Google' : 'Sign up with Google'}
                      </button>
                    </div>
                  </form>
                  
                  <div className="auth-links-container">
                    <div className="auth-links">
                      {isSignIn && <Link to="/forgot-password">Forgot Password?</Link>}
                      {isSignIn && (
                        <p>
                          Don't have an account? 
                          <button 
                            type="button" 
                            className="auth-link-btn"
                            onClick={() => setIsSignIn(false)}
                          >
                            Register
                          </button>
                        </p>
                      )}
                    </div>
                  </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
} 