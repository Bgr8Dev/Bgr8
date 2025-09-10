import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth, firestore } from '../../firebase/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { createUserProfile, UserProfile } from '../../utils/userProfile';
import HamburgerMenu from '../../components/ui/HamburgerMenu';
import Footer from '../../components/ui/Footer';
import { FcGoogle } from 'react-icons/fc';
import '../../styles/MobileAuthPages.css';
import { checkRateLimit, updateLastActivity, handleError, validatePassword, validateUserInput } from '../../utils/security';

// Define FirebaseErrorWithCode type to handle Firebase errors
interface FirebaseErrorWithCode extends Error {
  code: string;
}

interface PasswordRequirement {
  label: string;
  met: boolean;
}

export default function MobileSignInPage() {
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
    <div className="mobile-signin-page">
      <HamburgerMenu />
      
      {/* Mobile Header */}
      <div className="mobile-signin-header">
        <div className="mobile-signin-logo">
          <span className="mobile-logo-slash">/</span>
          <span className="mobile-logo-b">B</span>
          <span className="mobile-logo-gr">gr</span>
          <span className="mobile-logo-eight">8</span>
        </div>
        <h1>Welcome Back</h1>
        <p>Connect with mentors and mentees to create positive change</p>
      </div>

      {/* Mobile Form Container */}
      <div className="mobile-signin-container">
        <div className="mobile-signin-card">
          <div className="mobile-signin-header">
            <div className={`mobile-auth-mode-toggle ${!isSignIn ? 'register-active' : ''}`}>
              <button 
                className={`mobile-auth-mode-btn ${isSignIn ? 'active' : ''}`}
                onClick={() => setIsSignIn(true)}
              >
                Sign In
              </button>
              <button 
                className={`mobile-auth-mode-btn ${!isSignIn ? 'active' : ''}`}
                onClick={() => setIsSignIn(false)}
              >
                Register
              </button>
            </div>
            <h2>{isSignIn ? 'Sign In' : 'Create Account'}</h2>
            <p className="mobile-signin-subtitle">
              {isSignIn 
                ? 'Enter your credentials to access your account' 
                : 'Join our community of mentors and mentees'
              }
            </p>
          </div>
          
          <div className="mobile-signin-content">
            {error && <div className="mobile-auth-error">{error}</div>}
            {isBlocked && (
              <div className="mobile-auth-warning">
                Account temporarily blocked due to too many login attempts.
                Please try again later or reset your password.
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="mobile-auth-form">
              {!isSignIn && (
                <div className="mobile-form-group">
                  <div className="mobile-auth-input-group">
                    <label htmlFor="mobile-firstName">First Name</label>
                    <input
                      id="mobile-firstName"
                      type="text"
                      placeholder="Enter your first name"
                      value={formData.firstName}
                      onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                      required
                      maxLength={50}
                      disabled={isBlocked}
                    />
                  </div>
                  <div className="mobile-auth-input-group">
                    <label htmlFor="mobile-lastName">Last Name</label>
                    <input
                      id="mobile-lastName"
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
              
              <div className="mobile-auth-input-group">
                <label htmlFor="mobile-email">Email Address</label>
                <input
                  id="mobile-email"
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
                  <div className="mobile-auth-input-group">
                    <label htmlFor="mobile-password">Password</label>
                    <input
                      id="mobile-password"
                      type="password"
                      placeholder="Create a password"
                      value={formData.password}
                      onChange={handlePasswordChange}
                      required
                      disabled={isBlocked}
                    />
                    <div className="mobile-password-requirements">
                      {passwordRequirements.map((req, index) => (
                        <div key={index} className={`mobile-requirement ${req.met ? 'met' : ''}`}>
                          {req.met ? '✓' : '○'} {req.label}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="mobile-auth-input-group">
                    <label htmlFor="mobile-confirmPassword">Confirm Password</label>
                    <input
                      id="mobile-confirmPassword"
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
                <div className="mobile-auth-input-group">
                  <label htmlFor="mobile-signin-password">Password</label>
                  <input
                    id="mobile-signin-password"
                    type="password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    required
                    disabled={isBlocked}
                  />
                </div>
              )}
              
              <button type="submit" disabled={isBlocked} className="mobile-signin-submit-btn">
                {isSignIn ? 'Sign In' : 'Create Account'}
              </button>

              <div className="mobile-auth-divider">
                <span>or</span>
              </div>
              
              <button 
                type="button" 
                onClick={handleGoogleSignIn} 
                className="mobile-google-sign-in"
                disabled={isBlocked}
              >
                <FcGoogle size={20} />
                {isSignIn ? 'Sign in with Google' : 'Sign up with Google'}
              </button>
            </form>
            
            <div className="mobile-auth-links">
              {isSignIn && <Link to="/forgot-password">Forgot Password?</Link>}
              {isSignIn && (
                <p>
                  Don't have an account? 
                  <button 
                    type="button" 
                    className="mobile-auth-link-btn"
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

      <Footer />
    </div>
  );
}
