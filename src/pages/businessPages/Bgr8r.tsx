import { useEffect, useState } from 'react';
import Navbar from '../../components/ui/Navbar';
import HamburgerMenu from '../../components/ui/HamburgerMenu';
import Footer from '../../components/ui/Footer';
import '../../styles/businessStyles/Bgr8r.css';
import { ComingSoonOverlay } from '../../components/overlays/ComingSoonOverlay';
import SocialChannels from '../../components/ui/SocialChannels';
import { PasswordProtectedPage } from '../../components/overlays/PasswordProtectedPage';
import { loadStripe } from '@stripe/stripe-js';
import { FaTimes, FaCreditCard, FaPoundSign } from 'react-icons/fa';
import MentorProgram from '../../components/widgets/MentorAlgorithm/MentorProgram';

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_TEST_PUBLISHABLE_KEY || '');

export default function Bgr8r() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [userType, setUserType] = useState<'student' | 'teacher' | ''>('');
  const [isDonationModalOpen, setIsDonationModalOpen] = useState(false);
  const [donationAmount, setDonationAmount] = useState<number | string>('');
  const [donorName, setDonorName] = useState('');
  const [donorEmail, setDonorEmail] = useState('');

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleDonationClick = () => {
    setIsDonationModalOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeDonationModal = () => {
    setIsDonationModalOpen(false);
    document.body.style.overflow = 'auto';
  };

  const handleDonationAmountClick = (amount: number) => {
    setDonationAmount(amount);
  };

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^\d+$/.test(value)) {
      setDonationAmount(value === '' ? '' : parseInt(value));
    }
  };

  const proceedToPayment = async () => {
    try {
      if (!donationAmount) {
        alert('Please select or enter a donation amount');
        return;
      }

      // Convert donation amount to pence (Stripe uses smallest currency unit)
      const amountInPence = Math.round(Number(donationAmount) * 100);

      // Create a checkout session
      const response = await fetch(`${import.meta.env.VITE_STRIPE_SERVER_URL}/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amountInPence,
          currency: 'gbp',
          successUrl: `${window.location.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/cancel`,
          metadata: {
            donorName,
            donorEmail,
            businessId: 'bgr8r'
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const { sessionId } = await response.json();

      // Redirect to Stripe Checkout
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Stripe failed to initialize');
      }

      const { error } = await stripe.redirectToCheckout({
        sessionId: sessionId
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error:', error);
      alert('There was an error processing your donation. Please try again.');
    }
  };

  return (
    <PasswordProtectedPage businessId="bgr8r">
      <ComingSoonOverlay businessId="bgr8r">
        <div className="bgr8r-page">
          {isMobile ? <HamburgerMenu /> : <Navbar />}

          {/* Existing Hero Section */}
          <section className="bgr8r-hero">
            <h1>Bgr8r</h1>
            <p>Empowering the future through innovative education programs and resources.</p>
          </section>

          {/* Updated Hero Video Section */}
          <section className="hero-video">
            <div className="video-container">
              <iframe
                width="100%"
                height="100%"
                src="https://www.youtube.com/embed/SwCf8B07_s8"
                title="Bgr8r Video"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </section>

          {/* Intro Section */}
          <section className="intro-section">
            <h2>About Bgr8r</h2>
            <p>
              Bgr8r is dedicated to fostering learning and growth through innovative programs, resources, and support for students and educators alike.
            </p>
          </section>

          {/* Mentor Program Widget */}
          <MentorProgram />

          {/* Existing Gallery Section */}
          <section className="gallery">
            <img src="/assets/bgr8r1.jpg" alt="Bgr8r Program 1" />
            <img src="/assets/bgr8r2.jpg" alt="Bgr8r Program 2" />
            <img src="/assets/bgr8r3.jpg" alt="Bgr8r Program 3" />
          </section>

          {/* Updated Donations Section */}
          <section className="donation-section">
            <h3>Support Bgr8r</h3>
            <p>Your donation helps us provide educational resources and support to students in need.</p>
            <button onClick={handleDonationClick} className="donate-button">
              Donate Now
            </button>
          </section>

          {/* Google Maps Section */}
          <section className="map-section">
            <h3>Our Global Impact</h3>
            <iframe
              title="Bgr8r Map"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2488.8901724724397!2d-0.19435492299797727!3d51.37012597178726!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4876075d1e973c37%3A0x9a6c0c5ef5e0a1d0!2s62%20Oakhill%20Rd%2C%20Sutton%20SM1%203AG%2C%20UK!5e0!3m2!1sen!2s!4v1709835851871!5m2!1sen!2s"
              width="100%"
              height="300"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
            ></iframe>
          </section>

          {/* User Type Selection */}
          <section className="user-selection">
            <h3>Are You a Student or Teacher?</h3>
            <button onClick={() => setUserType('student')}>I'm a Student</button>
            <button onClick={() => setUserType('teacher')}>I'm a Teacher</button>
          </section>

          {/* Student Sign-Up Form */}
          {userType === 'student' && (
            <section className="signup-form">
              <h3>Student Sign-Up</h3>
              <form>
                <input type="text" placeholder="Name" required />
                <input type="email" placeholder="Email" required />
                <input type="tel" placeholder="Phone Number" required />
                <input type="text" placeholder="School" required />
                <label>
                  Household Income Under 20k?
                  <select required>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </label>
                <label>
                  Gender
                  <select required>
                    <option value="boy">Boy</option>
                    <option value="girl">Girl</option>
                  </select>
                </label>
                <button type="submit">Sign Up</button>
              </form>
            </section>
          )}

          {/* Teacher Sign-Up Form */}
          {userType === 'teacher' && (
            <section className="signup-form">
              <h3>Teacher Sign-Up</h3>
              <form>
                <input type="text" placeholder="Name" required />
                <input type="email" placeholder="Email" required />
                <input type="tel" placeholder="Phone Number" required />
                <input type="url" placeholder="LinkedIn Profile" required />
                <label>
                  Upload CV:
                  <input type="file" required />
                </label>
                <button type="submit">Sign Up</button>
              </form>
            </section>
          )}

          {/* Donation Modal */}
          {isDonationModalOpen && (
            <div className="modal-overlay" onClick={closeDonationModal}>
              <div className="donation-modal-content" onClick={(e) => e.stopPropagation()}>
                <button 
                  className="modal-close-btn" 
                  onClick={closeDonationModal}
                  aria-label="Close donation form"
                >
                  <FaTimes />
                </button>
                
                <h2>Make a Donation to Bgr8r</h2>
                <p>Your generosity helps us support education and empower students.</p>
                
                <div className="donation-amount-section">
                  <h3>Select Donation Amount</h3>
                  
                  <div className="donation-amount-buttons">
                    <button 
                      className={donationAmount === 10 ? 'amount-button selected' : 'amount-button'} 
                      onClick={() => handleDonationAmountClick(10)}
                    >
                      £10
                    </button>
                    <button 
                      className={donationAmount === 25 ? 'amount-button selected' : 'amount-button'} 
                      onClick={() => handleDonationAmountClick(25)}
                    >
                      £25
                    </button>
                    <button 
                      className={donationAmount === 50 ? 'amount-button selected' : 'amount-button'} 
                      onClick={() => handleDonationAmountClick(50)}
                    >
                      £50
                    </button>
                    <button 
                      className={donationAmount === 100 ? 'amount-button selected' : 'amount-button'} 
                      onClick={() => handleDonationAmountClick(100)}
                    >
                      £100
                    </button>
                  </div>
                  
                  <div className="custom-amount-input">
                    <label htmlFor="custom-amount">Custom Amount (£):</label>
                    <div className="input-with-icon">
                      <FaPoundSign className="input-icon" />
                      <input
                        id="custom-amount"
                        type="text"
                        placeholder="Enter amount"
                        value={typeof donationAmount === 'string' ? donationAmount : ''}
                        onChange={handleCustomAmountChange}
                        onClick={() => setDonationAmount('')}
                      />
                    </div>
                  </div>
                </div>
                
                {donationAmount && (
                  <div className="donation-summary">
                    <h3>Your Donation</h3>
                    <div className="summary-box">
                      <div className="summary-amount">
                        <span className="currency">£</span>
                        <span className="amount">{donationAmount}</span>
                      </div>
                      <p className="summary-text">Thank you for supporting education! Your contribution will help provide resources and opportunities for students.</p>
                      <div className="impact-info">
                        {Number(donationAmount) >= 100 ? (
                          <p>This generous donation could help provide a full term of educational resources for a student.</p>
                        ) : Number(donationAmount) >= 50 ? (
                          <p>This donation could help provide essential learning materials for students.</p>
                        ) : Number(donationAmount) >= 25 ? (
                          <p>This donation could help support our educational programs.</p>
                        ) : (
                          <p>Every contribution helps us support education and student development.</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="donor-info-section">
                  <h3>Your Information</h3>
                  
                  <div className="form-group">
                    <label htmlFor="donor-name">Name (Optional)</label>
                    <input
                      id="donor-name"
                      type="text"
                      placeholder="Enter your name"
                      value={donorName}
                      onChange={(e) => setDonorName(e.target.value)}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="donor-email">Email (Optional)</label>
                    <input
                      id="donor-email"
                      type="email"
                      placeholder="Enter your email"
                      value={donorEmail}
                      onChange={(e) => setDonorEmail(e.target.value)}
                    />
                  </div>
                </div>
                
                <button 
                  className="payment-button" 
                  onClick={proceedToPayment}
                  disabled={!donationAmount}
                >
                  <FaCreditCard className="button-icon" />
                  Proceed to Payment
                </button>
                
                <div className="secure-payment-notice">
                  <p>Your payment will be processed securely via Stripe.</p>
                  <p>Bgr8r does not store your payment information.</p>
                </div>
              </div>
            </div>
          )}

          <SocialChannels className="bgr8r-social-channels" />
          <Footer />
        </div>
      </ComingSoonOverlay>
    </PasswordProtectedPage>
  );
} 