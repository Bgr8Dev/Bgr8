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
import { checkRateLimit, updateLastActivity, handleError, validatePassword, validateUserInput } from '../../utils/security';
import MobileSignInPage from './MobileSignInPage';

// Define FirebaseErrorWithCode type to handle Firebase errors
interface FirebaseErrorWithCode extends Error {
  code: string;
}



interface PasswordRequirement {
  label: string;
  met: boolean;
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
  const [passwordRequirements, setPasswordRequirements] = useState<PasswordRequirement[]>([
    { label: 'At least 12 characters long', met: false },
    { label: 'Contains uppercase letter', met: false },
    { label: 'Contains lowercase letter', met: false },
    { label: 'Contains number', met: false },
    { label: 'Contains special character (@$!%*?&)', met: false }
  ]);
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
    setPasswordRequirements([
      { label: 'At least 12 characters long', met: password.length >= 12 },
      { label: 'Contains uppercase letter', met: /[A-Z]/.test(password) },
      { label: 'Contains lowercase letter', met: /[a-z]/.test(password) },
      { label: 'Contains number', met: /\d/.test(password) },
      { label: 'Contains special character (@$!%*?&#^~`|\\/<>:";=+_-)', met: /[@$!%*?&#^~`|\\/<>:";=+_-]/.test(password) }
    ]);
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
        // Sign-in logic
        await signInWithEmailAndPassword(auth, formData.email, formData.password);
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

        updateLastActivity(); // Set initial session timestamp
        navigate('/'); // Redirect to home page
      }
    } catch (err: unknown) {
      const firebaseError = err as FirebaseErrorWithCode;
      let errorMessage: string;
      
      if (isSignIn) {
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
                          <div className="password-requirements">
                            {passwordRequirements.map((req, index) => (
                              <div key={index} className={`requirement ${req.met ? 'met' : ''}`}>
                                {req.met ? '✓' : '○'} {req.label}
                              </div>
                            ))}
                          </div>
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
                    
                    <button 
                      type="button" 
                      onClick={handleGoogleSignIn} 
                      className="google-sign-in"
                      disabled={isBlocked}
                    >
                      <FcGoogle size={20} />
                      {isSignIn ? 'Sign in with Google' : 'Sign up with Google'}
                    </button>
                  </form>
                  
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
      </section>

      <Footer />
    </div>
  );
} 