import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Navbar from '../../components/ui/Navbar';
import HamburgerMenu from '../../components/ui/HamburgerMenu';
import Footer from '../../components/ui/Footer';
import '../../styles/AuthPages.css';
import { useIsMobile } from '../../hooks/useIsMobile';

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const isMobile = useIsMobile();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsSubmitting(true);

    try {
      await resetPassword(email);
      setMessage('Password reset instructions have been sent to your email');
      setEmail(''); // Clear the email field
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An error occurred while sending the password reset email');
      }
      console.error('Password reset error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      {isMobile ? <HamburgerMenu /> : <Navbar />}
      
      <div className="auth-container">
        <h2>Reset Password</h2>
        <p className="auth-description">
          Enter your email address and we'll send you instructions to reset your password.
        </p>
        
        {error && <div className="auth-error">{error}</div>}
        {message && <div className="auth-success">{message}</div>}
        
        <form onSubmit={handleSubmit} className="auth-form">
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button 
            type="submit" 
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
        
        <div className="auth-links">
          <Link to="/signin">Back to Sign In</Link>
        </div>
      </div>

      <Footer />
    </div>
  );
} 