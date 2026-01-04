import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { verifyEmailToken, resendVerificationEmail, getEmailVerificationStatus, sendVerificationConfirmationEmail } from '../../services/emailVerificationService';
import { getUserProfile } from '../../utils/userProfile';
import { useAuth } from '../../hooks/useAuth';
import Navbar from '../../components/ui/Navbar';
import Footer from '../../components/ui/Footer';
import HamburgerMenu from '../../components/ui/HamburgerMenu';
import { useIsMobile } from '../../hooks/useIsMobile';
import { loggers } from '../../utils/logger';
import '../../styles/AuthPages.css';

export default function EmailVerificationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentUser } = useAuth();
  const isMobile = useIsMobile();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error' | 'expired' | 'already-verified'>('verifying');
  const [error, setError] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [canResendAt, setCanResendAt] = useState<Date | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');
  const [isPromptMode, setIsPromptMode] = useState(false);

  useEffect(() => {
    // Check if this is a prompt (user just registered)
    const prompt = searchParams.get('prompt');
    if (prompt === 'true') {
      setIsPromptMode(true);
      setStatus('verifying'); // Show prompt UI instead
    }
  }, [searchParams]);

  useEffect(() => {
    const verifyToken = async () => {
      const token = searchParams.get('token');
      const prompt = searchParams.get('prompt');
      
      // Skip token verification if in prompt mode
      if (prompt === 'true') {
        return;
      }
      
      if (!token) {
        setStatus('error');
        setError('No verification token provided');
        return;
      }

      try {
        // Get IP address if possible (for logging)
        const ipAddress = await getClientIP();
        
        const result = await verifyEmailToken(token, ipAddress);
        
        if (result.success && result.userId && result.email) {
          setUserEmail(result.email);
          
          // Send confirmation email
          try {
            const userProfile = await getUserProfile(result.userId);
            if (userProfile) {
              await sendVerificationConfirmationEmail(result.email, userProfile.firstName);
            }
          } catch (emailError) {
            loggers.email.error('Error sending verification confirmation email:', emailError);
            // Don't fail verification if confirmation email fails
          }
          
          setStatus('success');
          
          // Auto-redirect after 3 seconds
          setTimeout(() => {
            navigate('/');
          }, 3000);
        } else {
          if (result.error?.includes('expired')) {
            setStatus('expired');
          } else if (result.error?.includes('already been used')) {
            setStatus('already-verified');
          } else {
            setStatus('error');
            setError(result.error || 'Verification failed');
          }
        }
      } catch (err) {
        loggers.error.error('Error verifying email:', err);
        setStatus('error');
        setError('An error occurred during verification. Please try again.');
      }
    };

    verifyToken();
  }, [searchParams, navigate]);

  // Get client IP address (for logging purposes)
  const getClientIP = async (): Promise<string | undefined> => {
    try {
      // Try to get IP from a service (optional, for logging)
      // In production, you might want to get this from your backend
      return undefined;
    } catch {
      return undefined;
    }
  };

  const handleResendVerification = async () => {
    if (!currentUser) {
      setError('Please sign in to resend verification email');
      return;
    }

    setIsResending(true);
    setResendMessage('');
    setError('');

    try {
      const userProfile = await getUserProfile(currentUser.uid);
      if (!userProfile || !userProfile.email) {
        setError('Unable to find your email address');
        setIsResending(false);
        return;
      }

      const ipAddress = await getClientIP();
      const result = await resendVerificationEmail(
        currentUser.uid,
        userProfile.email,
        userProfile.firstName,
        ipAddress
      );

      if (result.success) {
        setResendMessage('Verification email sent! Please check your inbox.');
        if (result.canResendAt) {
          setCanResendAt(result.canResendAt);
        }
      } else {
        setError(result.error || 'Failed to resend verification email');
        if (result.canResendAt) {
          setCanResendAt(result.canResendAt);
        }
      }
    } catch (err) {
      loggers.error.error('Error resending verification email:', err);
      setError('An error occurred. Please try again later.');
    } finally {
      setIsResending(false);
    }
  };

  // Check if user is already verified
  useEffect(() => {
    const checkVerificationStatus = async () => {
      if (currentUser) {
        const status = await getEmailVerificationStatus(currentUser.uid);
        if (status.verified) {
          setStatus('already-verified');
        }
      }
    };

    checkVerificationStatus();
  }, [currentUser]);

  return (
    <div className="signin-page">
      {isMobile ? <HamburgerMenu /> : <Navbar />}
      
      <section className="signin-hero">
        <div className="signin-hero-background">
          <div className="signin-hero-overlay">
            <div className="signin-hero-content">
              <div className="signin-form-container" style={{ maxWidth: '600px', margin: '0 auto' }}>
                <div className="signin-form-card">
                  <div className="signin-form-header">
                    <h2>Email Verification</h2>
                  </div>
                  
                  <div className="signin-form-content">
                    {status === 'verifying' && isPromptMode && (
                      <div className="verification-status prompt">
                        <div className="info-icon" style={{ fontSize: '4rem', marginBottom: '1rem' }}>📧</div>
                        <h3>Verify Your Email Address</h3>
                        <p>We've sent a verification email to your inbox.</p>
                        <p>Please check your email and click the verification link to activate your account.</p>
                        <div className="verification-info-box" style={{ 
                          marginTop: '1.5rem', 
                          padding: '1rem', 
                          backgroundColor: '#f8f9fa', 
                          borderRadius: '8px',
                          border: '1px solid #dee2e6'
                        }}>
                          <p><strong>Didn't receive the email?</strong></p>
                          <ul style={{ textAlign: 'left', marginTop: '0.5rem' }}>
                            <li>Check your spam/junk folder</li>
                            <li>Make sure you entered the correct email address</li>
                            <li>Wait a few minutes for the email to arrive</li>
                          </ul>
                        </div>
                        {currentUser && (
                          <div style={{ marginTop: '1.5rem' }}>
                            <button
                              onClick={handleResendVerification}
                              disabled={isResending || (canResendAt !== null && new Date() < canResendAt)}
                              className="signin-submit-btn"
                            >
                              {isResending 
                                ? 'Sending...' 
                                : (canResendAt && new Date() < canResendAt)
                                  ? `Resend available at ${canResendAt.toLocaleTimeString()}`
                                  : 'Resend Verification Email'
                              }
                            </button>
                          </div>
                        )}
                        <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#666' }}>
                          <Link to="/signin">Back to Sign In</Link>
                        </p>
                      </div>
                    )}

                    {status === 'verifying' && !isPromptMode && (
                      <div className="verification-status">
                        <div className="spinner" style={{ margin: '2rem auto' }} aria-hidden="true" />
                        <p>Verifying your email address...</p>
                      </div>
                    )}

                    {status === 'success' && (
                      <div className="verification-status success">
                        <div className="success-icon" style={{ fontSize: '4rem', marginBottom: '1rem' }}>✓</div>
                        <h3>Email Verified Successfully!</h3>
                        <p>Your email address <strong>{userEmail}</strong> has been verified.</p>
                        <p>You now have full access to all Bgr8 features.</p>
                        <p style={{ marginTop: '1rem', color: '#666' }}>
                          Redirecting to home page in 3 seconds...
                        </p>
                        <Link to="/" className="signin-submit-btn" style={{ marginTop: '1.5rem', display: 'inline-block' }}>
                          Go to Home Page
                        </Link>
                      </div>
                    )}

                    {status === 'error' && (
                      <div className="verification-status error">
                        <div className="error-icon" style={{ fontSize: '4rem', marginBottom: '1rem' }}>✗</div>
                        <h3>Verification Failed</h3>
                        <p>{error || 'Unable to verify your email address.'}</p>
                        {currentUser && (
                          <div style={{ marginTop: '1.5rem' }}>
                            <button
                              onClick={handleResendVerification}
                              disabled={isResending}
                              className="signin-submit-btn"
                            >
                              {isResending ? 'Sending...' : 'Resend Verification Email'}
                            </button>
                          </div>
                        )}
                        {!currentUser && (
                          <p style={{ marginTop: '1rem' }}>
                            <Link to="/signin">Sign in</Link> to resend verification email.
                          </p>
                        )}
                      </div>
                    )}

                    {status === 'expired' && (
                      <div className="verification-status error">
                        <div className="error-icon" style={{ fontSize: '4rem', marginBottom: '1rem' }}>⏰</div>
                        <h3>Verification Link Expired</h3>
                        <p>This verification link has expired. Verification links are valid for 48 hours.</p>
                        {currentUser && (
                          <div style={{ marginTop: '1.5rem' }}>
                            <button
                              onClick={handleResendVerification}
                              disabled={isResending || (canResendAt !== null && new Date() < canResendAt)}
                              className="signin-submit-btn"
                            >
                              {isResending 
                                ? 'Sending...' 
                                : (canResendAt && new Date() < canResendAt)
                                  ? `Resend available at ${canResendAt.toLocaleTimeString()}`
                                  : 'Resend Verification Email'
                              }
                            </button>
                          </div>
                        )}
                        {!currentUser && (
                          <p style={{ marginTop: '1rem' }}>
                            <Link to="/signin">Sign in</Link> to request a new verification email.
                          </p>
                        )}
                      </div>
                    )}

                    {status === 'already-verified' && (
                      <div className="verification-status success">
                        <div className="success-icon" style={{ fontSize: '4rem', marginBottom: '1rem' }}>✓</div>
                        <h3>Email Already Verified</h3>
                        <p>Your email address has already been verified.</p>
                        <Link to="/" className="signin-submit-btn" style={{ marginTop: '1.5rem', display: 'inline-block' }}>
                          Go to Home Page
                        </Link>
                      </div>
                    )}

                    {resendMessage && (
                      <div className="auth-success" style={{ marginTop: '1rem' }}>
                        {resendMessage}
                      </div>
                    )}

                    {error && status !== 'error' && (
                      <div className="auth-error" style={{ marginTop: '1rem' }}>
                        {error}
                      </div>
                    )}
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

