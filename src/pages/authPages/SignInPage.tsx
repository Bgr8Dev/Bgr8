import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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

// Define FirebaseErrorWithCode type to handle Firebase errors
interface FirebaseErrorWithCode extends Error {
  code: string;
}

// Comprehensive list of ethnicities
const ethnicityOptions = [
  'African',
  'African American',
  'Arab',
  'Asian',
  'Caucasian',
  'East Asian',
  'Hispanic/Latino',
  'Indigenous',
  'Middle Eastern',
  'Mixed/Multiracial',
  'Native American',
  'Pacific Islander',
  'South Asian',
  'Southeast Asian',
  'Other',
  'Prefer not to say'
];

// Comprehensive list of nationalities
const nationalityOptions = [
  'Afghan', 'Albanian', 'Algerian', 'American', 'Andorran', 'Angolan', 'Argentine', 'Armenian', 'Australian',
  'Austrian', 'Azerbaijani', 'Bahamian', 'Bahraini', 'Bangladeshi', 'Barbadian', 'Belarusian', 'Belgian',
  'Belizean', 'Beninese', 'Bhutanese', 'Bolivian', 'Bosnian', 'Brazilian', 'British', 'Bruneian', 'Bulgarian',
  'Burkinabe', 'Burmese', 'Burundian', 'Cambodian', 'Cameroonian', 'Canadian', 'Cape Verdean', 'Central African',
  'Chadian', 'Chilean', 'Chinese', 'Colombian', 'Comoran', 'Congolese', 'Costa Rican', 'Croatian', 'Cuban', 'Cypriot',
  'Czech', 'Danish', 'Djiboutian', 'Dominican', 'Dutch', 'Ecuadorian', 'Egyptian', 'Emirati', 'Equatorial Guinean',
  'Eritrean', 'Estonian', 'Ethiopian', 'Fijian', 'Filipino', 'Finnish', 'French', 'Gabonese', 'Gambian', 'Georgian',
  'German', 'Ghanaian', 'Greek', 'Grenadian', 'Guatemalan', 'Guinean', 'Guyanese', 'Haitian', 'Honduran', 'Hungarian',
  'Icelandic', 'Indian', 'Indonesian', 'Iranian', 'Iraqi', 'Irish', 'Israeli', 'Italian', 'Ivorian', 'Jamaican',
  'Japanese', 'Jordanian', 'Kazakhstani', 'Kenyan', 'Korean', 'Kuwaiti', 'Kyrgyz', 'Laotian', 'Latvian', 'Lebanese',
  'Liberian', 'Libyan', 'Lithuanian', 'Luxembourgish', 'Macedonian', 'Malagasy', 'Malawian', 'Malaysian', 'Maldivian',
  'Malian', 'Maltese', 'Mauritanian', 'Mauritian', 'Mexican', 'Moldovan', 'Monacan', 'Mongolian', 'Montenegrin',
  'Moroccan', 'Mozambican', 'Namibian', 'Nepalese', 'New Zealand', 'Nicaraguan', 'Nigerian', 'Norwegian', 'Omani',
  'Pakistani', 'Panamanian', 'Papua New Guinean', 'Paraguayan', 'Peruvian', 'Polish', 'Portuguese', 'Qatari',
  'Romanian', 'Russian', 'Rwandan', 'Saint Lucian', 'Salvadoran', 'Samoan', 'Saudi', 'Senegalese', 'Serbian',
  'Seychellois', 'Sierra Leonean', 'Singaporean', 'Slovak', 'Slovenian', 'Somali', 'South African', 'Spanish',
  'Sri Lankan', 'Sudanese', 'Surinamese', 'Swedish', 'Swiss', 'Syrian', 'Taiwanese', 'Tajik', 'Tanzanian', 'Thai',
  'Togolese', 'Trinidadian', 'Tunisian', 'Turkish', 'Turkmen', 'Ugandan', 'Ukrainian', 'Uruguayan', 'Uzbek',
  'Venezuelan', 'Vietnamese', 'Yemeni', 'Zambian', 'Zimbabwean',
  'Dual Nationality',
  'Stateless',
  'Other',
  'Prefer not to say'
];

interface PasswordRequirement {
  label: string;
  met: boolean;
}

export default function SignInPage() {
  const isMobile = useIsMobile();
  const [isSignIn, setIsSignIn] = useState(true); // Toggle between sign-in and register
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    ethnicity: '',
    nationality: '',
    secondNationality: ''
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
  const [showSecondNationality, setShowSecondNationality] = useState(false);
  const navigate = useNavigate();

  // Update second nationality visibility when nationality changes
  const handleNationalityChange = (value: string) => {
    const isDual = value === 'Dual Nationality';
    setShowSecondNationality(isDual);
    setFormData({
      ...formData,
      nationality: value,
      // Clear second nationality if not dual
      secondNationality: isDual ? formData.secondNationality : ''
    });
  };

  const updatePasswordRequirements = (password: string) => {
    setPasswordRequirements([
      { label: 'At least 12 characters long', met: password.length >= 12 },
      { label: 'Contains uppercase letter', met: /[A-Z]/.test(password) },
      { label: 'Contains lowercase letter', met: /[a-z]/.test(password) },
      { label: 'Contains number', met: /\d/.test(password) },
      { label: 'Contains special character (@$!%*?&)', met: /[@$!%*?&]/.test(password) }
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
          {
            ethnicity: formData.ethnicity || 'N/A',
            nationality: formData.nationality || 'N/A',
            secondNationality: formData.secondNationality || ''
          }
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
        const additionalData: Partial<UserProfile> = {
          ethnicity: 'N/A',
          nationality: 'N/A'
        };
        
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
                    <div className="auth-mode-toggle">
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
                  
                  <div className="signin-form-content">
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
                          <label htmlFor="ethnicity">Ethnicity</label>
                          <select
                            id="ethnicity"
                            value={formData.ethnicity}
                            onChange={(e) => setFormData({...formData, ethnicity: e.target.value})}
                            className="auth-select"
                            required
                            disabled={isBlocked}
                          >
                            <option value="">Select Ethnicity</option>
                            {ethnicityOptions.map(option => (
                              <option key={option} value={option}>{option}</option>
                            ))}
                          </select>
                        </div>
                        
                        <div className="auth-input-group">
                          <label htmlFor="nationality">Nationality</label>
                          <select
                            id="nationality"
                            value={formData.nationality}
                            onChange={(e) => handleNationalityChange(e.target.value)}
                            className="auth-select"
                            required
                            disabled={isBlocked}
                          >
                            <option value="">Select Nationality</option>
                            {nationalityOptions.map(option => (
                              <option key={option} value={option}>{option}</option>
                            ))}
                          </select>
                        </div>
                        
                        {showSecondNationality && (
                          <div className="auth-input-group">
                            <label htmlFor="secondNationality">Second Nationality</label>
                            <select
                              id="secondNationality"
                              value={formData.secondNationality}
                              onChange={(e) => setFormData({...formData, secondNationality: e.target.value})}
                              className="auth-select"
                              disabled={isBlocked}
                            >
                              <option value="">Select Second Nationality</option>
                              {nationalityOptions
                                .filter(option => option !== 'Dual Nationality' && option !== formData.nationality)
                                .map(option => (
                                  <option key={option} value={option}>{option}</option>
                                ))
                              }
                            </select>
                          </div>
                        )}
                      </>
                    )}
                    
                    <div className="auth-input-group">
                      <label htmlFor="password">Password</label>
                      <input
                        id="password"
                        type="password"
                        placeholder={isSignIn ? "Enter your password" : "Create a password"}
                        value={formData.password}
                        onChange={isSignIn ? (e) => setFormData({...formData, password: e.target.value}) : handlePasswordChange}
                        required
                        disabled={isBlocked}
                      />
                    </div>

                    {!isSignIn && (
                      <>
                        <div className="password-section">
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
                    
                    <button type="submit" disabled={isBlocked} className="signin-submit-btn">
                      {isSignIn ? 'Sign In' : 'Create Account'}
                    </button>
                  </form>

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
                  
                  <div className="auth-links">
                    {isSignIn && <Link to="/forgot-password">Forgot Password?</Link>}
                    <p>
                      {isSignIn 
                        ? "Don't have an account? " 
                        : "Already have an account? "
                      }
                      <button 
                        type="button" 
                        className="auth-link-btn"
                        onClick={() => setIsSignIn(!isSignIn)}
                      >
                        {isSignIn ? 'Register' : 'Sign In'}
                      </button>
                    </p>
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