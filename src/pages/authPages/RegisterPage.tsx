import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../../firebase/firebase';
import Navbar from '../../components/ui/Navbar';
import HamburgerMenu from '../../components/ui/HamburgerMenu';
import Footer from '../../components/ui/Footer';
import { FcGoogle } from 'react-icons/fc';
import '../../styles/AuthPages.css';
import { createUserProfile, UserProfile } from '../../utils/userProfile';
import { useIsMobile } from '../../hooks/useIsMobile';

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

export default function RegisterPage() {
  const isMobile = useIsMobile()
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
  const navigate = useNavigate();
  const [showSecondNationality, setShowSecondNationality] = useState(
    formData.nationality === 'Dual Nationality'
  );

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation checks
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      // Create user
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

      // Successful registration
      navigate('/'); // Redirect to home page
    } catch (err: unknown) {
      // Handle specific error cases
      const firebaseError = err as FirebaseErrorWithCode;
      switch (firebaseError.code) {
        case 'auth/email-already-in-use':
          setError('An account already exists with this email');
          break;
        case 'auth/invalid-email':
          setError('Invalid email address');
          break;
        case 'auth/weak-password':
          setError('Password is too weak');
          break;
        default:
          setError('An error occurred during registration');
      }
      console.error('Registration error:', err);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Get user info from Google
      const user = result.user;
      const nameParts = user.displayName?.split(' ') || ['', ''];
      
      // Create user profile in Firestore
      const additionalData: Partial<UserProfile> = {
        ethnicity: 'N/A',
        nationality: 'N/A'
      };
      
      if (user.photoURL) {
        additionalData.photoURL = user.photoURL;
      }
      
      if (user.phoneNumber) {
        additionalData.phoneNumber = user.phoneNumber;
      }

      await createUserProfile(
        user.uid,
        user.email || '',
        nameParts[0],
        nameParts.slice(1).join(' '),
        additionalData
      );

      navigate('/');
    } catch (err: unknown) {
      const firebaseError = err as FirebaseErrorWithCode;
      if (firebaseError.code === 'auth/popup-closed-by-user') {
        setError('Sign in cancelled');
      } else {
        setError('Error signing in with Google');
        console.error('Google sign in error:', err);
      }
    }
  };

  return (
    <div className="auth-page">
      {isMobile ? <HamburgerMenu /> : <Navbar />}
      
      <div className="auth-container">
        <h2>Create Account</h2>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={handleSubmit} className="auth-form">
          <input
            type="text"
            placeholder="First Name"
            value={formData.firstName}
            onChange={(e) => setFormData({...formData, firstName: e.target.value})}
            required
          />
          <input
            type="text"
            placeholder="Last Name"
            value={formData.lastName}
            onChange={(e) => setFormData({...formData, lastName: e.target.value})}
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            required
          />
          
          <select
            value={formData.ethnicity}
            onChange={(e) => setFormData({...formData, ethnicity: e.target.value})}
            className="auth-select"
            aria-label="Ethnicity"
          >
            <option value="">Select Ethnicity</option>
            {ethnicityOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          
          <select
            value={formData.nationality}
            onChange={(e) => handleNationalityChange(e.target.value)}
            className="auth-select"
            aria-label="Nationality"
          >
            <option value="">Select Nationality</option>
            {nationalityOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          
          {showSecondNationality && (
            <select
              value={formData.secondNationality}
              onChange={(e) => setFormData({...formData, secondNationality: e.target.value})}
              className="auth-select"
              aria-label="Second Nationality"
            >
              <option value="">Select Second Nationality</option>
              {nationalityOptions
                .filter(option => option !== 'Dual Nationality' && option !== formData.nationality)
                .map(option => (
                  <option key={option} value={option}>{option}</option>
                ))
              }
            </select>
          )}
          
          <input
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            required
          />
          <input
            type="password"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
            required
          />
          <button type="submit">Register</button>
        </form>

        <div className="auth-divider">
          <span>or</span>
        </div>
        
        <button 
          type="button" 
          onClick={handleGoogleSignIn} 
          className="google-sign-in"
        >
          <FcGoogle size={20} />
          Sign up with Google
        </button>
        
        <div className="auth-links">
          <p>Already have an account? <Link to="/signin">Sign In</Link></p>
        </div>
      </div>

      <Footer />
    </div>
  );
} 