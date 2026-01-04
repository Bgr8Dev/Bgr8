import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth, firestore } from '../../firebase/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { createUserProfile, UserProfile } from '../../utils/userProfile';
import Navbar from '../../components/ui/Navbar';
import HamburgerMenu from '../../components/ui/HamburgerMenu';
import Footer from '../../components/ui/Footer';
import { FcGoogle } from 'react-icons/fc';
import '../../styles/AuthPages.css';
import { useIsMobile } from '../../hooks/useIsMobile';
import { checkRateLimit, updateLastActivity, handleError, validatePassword, validateUserInput, calculatePasswordStrength, PasswordStrength, clearRateLimit } from '../../utils/security';
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
      if (!validateUserInput(formData.firstName) || !validateUserInput(formData.lastName)) {
        setError('Invalid characters in name fields');
        return false;
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

    if (!validateForm()) {
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

        updateLastActivity(); // Set initial session timestamp
        navigate('/'); // Redirect to home page
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
          case 'auth/user-not-found':
            setError('No account found with this email');
            break;
          case 'auth/wrong-password':
            setError('Incorrect password');
            break;
          case 'auth/invalid-email':
            setError('Invalid email address');
            break;
          default:
            errorMessage = handleError(firebaseError);
            setError(errorMessage);
        }
      } else {
        switch (firebaseError.code) {
          case 'auth/email-already-in-use':
            setError('An account with this email already exists');
            break;
          case 'auth/weak-password':
            setError('Password is too weak');
            break;
          case 'auth/invalid-email':
            setError('Invalid email address');
            break;
          default:
            errorMessage = handleError(firebaseError);
            setError(errorMessage);
        }
      }
      console.error('Authentication error:', err);
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
                <div className="signin-logo">
                  <span className="signin-logo-slash">/</span>
                  <span className="signin-logo-b">B</span>
                  <span className="signin-logo-gr">gr</span>
                  <span className="signin-logo-eight">8</span>
                </div>
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
                    {error && <div className="auth-error">{error}</div>}
                    {isBlocked && (
                      <div className="auth-warning">
                        Account temporarily blocked due to too many login attempts.
                        Please try again later or reset your password.
                      </div>
                    )}
                    
                    <form onSubmit={handleSubmit} className="auth-form">
                    {!isSignIn && (
                      <div className="form-group">
                        <div className="auth-input-group">
                          <label htmlFor="firstName">First Name</label>
                          <input
                            id="firstName"
                            type="text"
                            placeholder="Enter your first name"
                            value={formData.firstName}
                            onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                            required
                            maxLength={50}
                            disabled={isBlocked}
                          />
                        </div>
                        <div className="auth-input-group">
                          <label htmlFor="lastName">Last Name</label>
                          <input
                            id="lastName"
                            type="text"
                            placeholder="Enter your last name"
                            value={formData.lastName}
                            onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                            required
                            maxLength={50}
                            disabled={isBlocked}
                          />
                        </div>
                      </div>
                    )}
                    
                    <div className="auth-input-group">
                      <label htmlFor="email">Email Address</label>
                      <input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        required
                        disabled={isBlocked}
                      />
                    </div>

                    {!isSignIn && (
                      <>
                        <div className="auth-input-group">
                          <label htmlFor="password">Password</label>
                          <input
                            id="password"
                            type="password"
                            placeholder="Create a password"
                            value={formData.password}
                            onChange={handlePasswordChange}
                            required
                            disabled={isBlocked}
                          />
                          {passwordStrength && (
                            <SimplePasswordStrengthMeter 
                              strength={passwordStrength}
                            />
                          )}
                        </div>
                        
                        <div className="auth-input-group">
                          <label htmlFor="confirmPassword">Confirm Password</label>
                          <input
                            id="confirmPassword"
                            type="password"
                            placeholder="Confirm your password"
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                            required
                            disabled={isBlocked}
                          />
                        </div>
                        

                      </>
                    )}
                    
                    {isSignIn && (
                      <div className="auth-input-group">
                        <label htmlFor="password">Password</label>
                        <input
                          id="password"
                          type="password"
                          placeholder="Enter your password"
                          value={formData.password}
                          onChange={(e) => setFormData({...formData, password: e.target.value})}
                          required
                          disabled={isBlocked}
                        />
                      </div>
                    )}
                    
                    <button type="submit" disabled={isBlocked} className="signin-submit-btn">
                      {isSignIn ? 'Sign In' : 'Create Account'}
                    </button>

                    <div className="auth-divider">
                      <span>or</span>
                    </div>
                    
                    <div className="google-sign-in-container">
                      <button 
                        type="button" 
                        onClick={handleGoogleSignIn} 
                        className="google-sign-in"
                        disabled={isBlocked}
                      >
                        <FcGoogle size={20} />
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