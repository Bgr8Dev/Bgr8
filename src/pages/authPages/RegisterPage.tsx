import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../../firebase';
import Navbar from '../../components/ui/Navbar';
import HamburgerMenu from '../../components/ui/HamburgerMenu';
import Footer from '../../components/ui/Footer';
import { FcGoogle } from 'react-icons/fc';
import '../../styles/AuthPages.css';
import { createUserProfile, UserProfile } from '../../utils/userProfile';
import { useIsMobile } from '../../hooks/useIsMobile';

export default function RegisterPage() {
    const isMobile = useIsMobile()
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

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
        formData.lastName
      );

      // Successful registration
      navigate('/'); // Redirect to home page
    } catch (err: any) {
      // Handle specific error cases
      switch (err.code) {
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
      const additionalData: Partial<UserProfile> = {};
      
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
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
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