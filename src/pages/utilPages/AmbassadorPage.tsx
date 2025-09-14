import React, { useState } from 'react';
import Navbar from '../../components/ui/Navbar';
import HamburgerMenu from '../../components/ui/HamburgerMenu';
import Footer from '../../components/ui/Footer';
import { useState as useStateHook, useEffect, useCallback } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { firestore } from '../../firebase/firebase';
import { useAuth } from '../../hooks/useAuth';
import { 
  FaInstagram, 
  FaLinkedin, 
  FaTwitter, 
  FaFacebook, 
  FaTiktok, 
  FaYoutube 
} from 'react-icons/fa';
import './AmbassadorPage.css';

export default function AmbassadorPage() {
  const { currentUser, loading } = useAuth();
  const [isMobile, setIsMobile] = useStateHook(window.innerWidth < 768);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    location: '',
    experience: '',
    motivation: '',
    availability: '',
    socialMedia: {
      instagram: { enabled: false, handle: '' },
      linkedin: { enabled: false, handle: '' },
      twitter: { enabled: false, handle: '' },
      facebook: { enabled: false, handle: '' },
      tiktok: { enabled: false, handle: '' },
      youtube: { enabled: false, handle: '' }
    },
    referral: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [applicationId, setApplicationId] = useState<string>('');
  const [modal, setModal] = useState<{
    show: boolean;
    type: 'info' | 'warning' | 'error' | 'success';
    title: string;
    message: string;
    onConfirm?: () => void;
    confirmText?: string;
    showCancel?: boolean;
  }>({
    show: false,
    type: 'info',
    title: '',
    message: '',
    confirmText: 'OK',
    showCancel: false
  });

  const handleResize = useCallback(() => {
    setIsMobile(window.innerWidth < 768);
  }, [setIsMobile]);

  const showModal = useCallback((type: 'info' | 'warning' | 'error' | 'success', title: string, message: string, onConfirm?: () => void, confirmText = 'OK', showCancel = false) => {
    setModal({
      show: true,
      type,
      title,
      message,
      onConfirm,
      confirmText,
      showCancel
    });
  }, []);

  const hideModal = useCallback(() => {
    setModal(prev => ({ ...prev, show: false }));
  }, []);

  const handleModalConfirm = useCallback(() => {
    if (modal.onConfirm) {
      modal.onConfirm();
    }
    hideModal();
  }, [modal, hideModal]);

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSocialMediaToggle = (platform: string) => {
    setFormData(prev => ({
      ...prev,
      socialMedia: {
        ...prev.socialMedia,
        [platform]: {
          ...prev.socialMedia[platform as keyof typeof prev.socialMedia],
          enabled: !prev.socialMedia[platform as keyof typeof prev.socialMedia].enabled,
          handle: !prev.socialMedia[platform as keyof typeof prev.socialMedia].enabled 
            ? prev.socialMedia[platform as keyof typeof prev.socialMedia].handle 
            : ''
        }
      }
    }));
  };

  const handleSocialMediaHandleChange = (platform: string, handle: string) => {
    setFormData(prev => ({
      ...prev,
      socialMedia: {
        ...prev.socialMedia,
        [platform]: {
          ...prev.socialMedia[platform as keyof typeof prev.socialMedia],
          handle: handle
        }
      }
    }));
  };

  const isAtLeastOneSocialMediaSelected = () => {
    return Object.values(formData.socialMedia).some(platform => platform.enabled);
  };

  const getSocialMediaIcon = (platform: string) => {
    switch (platform) {
      case 'instagram': return FaInstagram;
      case 'linkedin': return FaLinkedin;
      case 'twitter': return FaTwitter;
      case 'facebook': return FaFacebook;
      case 'tiktok': return FaTiktok;
      case 'youtube': return FaYoutube;
      default: return FaInstagram;
    }
  };

  const getSocialMediaColor = (platform: string) => {
    switch (platform) {
      case 'instagram': return '#E4405F';
      case 'linkedin': return '#0077B5';
      case 'twitter': return '#1DA1F2';
      case 'facebook': return '#1877F2';
      case 'tiktok': return '#000000';
      case 'youtube': return '#FF0000';
      default: return '#6B7280';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if user is authenticated
    if (!currentUser) {
      showModal('warning', 'Authentication Required', 'You must be logged in to submit an ambassador application.');
      return;
    }
    
    // Validate that at least one social media platform is selected
    if (!isAtLeastOneSocialMediaSelected()) {
      showModal('warning', 'Social Media Required', 'Please select at least one social media platform to continue.');
      return;
    }
    
    setIsSubmitting(true);
    setSubmitStatus('idle');
    
    try {
      // Create the application data object
      const applicationData = {
        ...formData,
        uid: currentUser.uid, // Store the user's UID for direct reference
        submittedAt: serverTimestamp(),
        status: 'pending',
        applicationId: `AMB-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
      };

      // Save to Firebase collection
      const ambassadorApplicationsRef = collection(firestore, 'ambassadorApplications');
      const docRef = await addDoc(ambassadorApplicationsRef, applicationData);
      
      console.log('Ambassador application saved with ID:', docRef.id);
      
      setApplicationId(applicationData.applicationId);
      setSubmitStatus('success');
      
      // Reset form after successful submission
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        location: '',
        experience: '',
        motivation: '',
        availability: '',
        socialMedia: {
          instagram: { enabled: false, handle: '' },
          linkedin: { enabled: false, handle: '' },
          twitter: { enabled: false, handle: '' },
          facebook: { enabled: false, handle: '' },
          tiktok: { enabled: false, handle: '' },
          youtube: { enabled: false, handle: '' }
        },
        referral: ''
      });
    } catch (error) {
      console.error('Error saving ambassador application:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="ambassador-page">
      {isMobile ? <HamburgerMenu /> : <Navbar />}

      {/* Hero Section */}
      <section className="ambassador-hero">
        <div className="ambassador-hero-content">
          <h1>Become a BGr8 Ambassador</h1>
          <p>Join our global network of passionate advocates making a real difference in communities worldwide</p>
          <div className="ambassador-hero-stats">
            <div className="ambassador-hero-stat">
              <span className="stat-number">500+</span>
              <span className="stat-label">Active Ambassadors</span>
            </div>
            <div className="ambassador-hero-stat">
              <span className="stat-number">50+</span>
              <span className="stat-label">Countries</span>
            </div>
            <div className="ambassador-hero-stat">
              <span className="stat-number">10,000+</span>
              <span className="stat-label">Lives Impacted</span>
            </div>
          </div>
        </div>
      </section>

      {/* What is an Ambassador Section */}
      <section className="ambassador-info-section">
        <div className="ambassador-container">
          <div className="ambassador-info-content">
            <div className="ambassador-info-text">
              <h2>What is a BGr8 Ambassador?</h2>
              <p>
                BGr8 Ambassadors are passionate individuals who believe in our mission of creating positive change 
                through mentorship and community development. As an ambassador, you'll help spread awareness, 
                connect with potential mentors and mentees, and represent BGr8 in your community.
              </p>
              
              <h3>Your Role as an Ambassador:</h3>
              <ul>
                <li>Share BGr8's mission and values with your network</li>
                <li>Connect potential mentors and mentees to our platform</li>
                <li>Organize and participate in community events</li>
                <li>Provide feedback and insights to improve our programs</li>
                <li>Represent BGr8 professionally in your community</li>
              </ul>
            </div>
            
            <div className="ambassador-benefits">
              <h3>Benefits of Becoming an Ambassador:</h3>
              <div className="benefits-grid">
                <div className="benefit-card">
                  <div className="benefit-icon">🌟</div>
                  <h4>Make an Impact</h4>
                  <p>Be part of meaningful change in communities worldwide</p>
                </div>
                <div className="benefit-card">
                  <div className="benefit-icon">🤝</div>
                  <h4>Build Connections</h4>
                  <p>Connect with mentors, mentees, and fellow ambassadors</p>
                </div>
                <div className="benefit-card">
                  <div className="benefit-icon">📈</div>
                  <h4>Personal Growth</h4>
                  <p>Develop leadership skills and expand your network</p>
                </div>
                <div className="benefit-card">
                  <div className="benefit-icon">🎯</div>
                  <h4>Exclusive Access</h4>
                  <p>Get early access to new programs and opportunities</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Requirements Section */}
      <section className="ambassador-requirements-section">
        <div className="ambassador-container">
          <h2>Ambassador Requirements</h2>
          <div className="requirements-grid">
            <div className="requirement-card">
              <div className="requirement-icon">✅</div>
              <h3>Commitment</h3>
              <p>Dedicate at least 5-10 hours per month to ambassador activities</p>
            </div>
            <div className="requirement-card">
              <div className="requirement-icon">🌍</div>
              <h3>Community Focus</h3>
              <p>Have a passion for community development and social impact</p>
            </div>
            <div className="requirement-card">
              <div className="requirement-icon">💬</div>
              <h3>Communication</h3>
              <p>Strong communication skills and ability to represent BGr8 professionally</p>
            </div>
            <div className="requirement-card">
              <div className="requirement-icon">📱</div>
              <h3>Digital Presence</h3>
              <p>Active on social media and comfortable with digital tools</p>
            </div>
          </div>
        </div>
      </section>

      {/* Application Form Section */}
      <section className="ambassador-form-section">
        <div className="ambassador-container">
          <div className="ambassador-form-content">
            <div className="ambassador-form-header">
              <h2>Apply to Become an Ambassador</h2>
              <p>Fill out the form below to start your journey as a BGr8 Ambassador</p>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="ambassador-loading-message">
                <div className="loading-spinner"></div>
                <p>Loading...</p>
              </div>
            )}

            {/* Authentication Required Message */}
            {!loading && !currentUser && (
              <div className="ambassador-auth-required">
                <div className="auth-icon">🔐</div>
                <h3>Login Required</h3>
                <p>You must be logged in to submit an ambassador application.</p>
                <div className="auth-buttons">
                  <a href="/signin" className="auth-btn primary">Sign In</a>
                  <a href="/signup" className="auth-btn secondary">Sign Up</a>
                </div>
              </div>
            )}

            {/* Only show form content if user is authenticated and not loading */}
            {!loading && currentUser && submitStatus === 'success' && (
              <div className="ambassador-success-message">
                <div className="success-icon">✅</div>
                <h3>Application Submitted Successfully!</h3>
                <p>Thank you for your interest in becoming a BGr8 Ambassador. We'll review your application and get back to you within 5-7 business days.</p>
                <div className="application-id">
                  <strong>Application ID:</strong> {applicationId}
                </div>
                <p className="success-note">Please save this ID for your records. You can use it to reference your application in any future communications.</p>
              </div>
            )}

            {!loading && currentUser && submitStatus === 'error' && (
              <div className="ambassador-error-message">
                <div className="error-icon">❌</div>
                <h3>Submission Failed</h3>
                <p>There was an error submitting your application. Please try again or contact us directly.</p>
              </div>
            )}

            {!loading && currentUser && submitStatus === 'idle' && (
              <form className="ambassador-form" onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="firstName">First Name *</label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="lastName">Last Name *</label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="email">Email Address *</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="phone">Phone Number</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="location">Location *</label>
                    <input
                      type="text"
                      id="location"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      placeholder="City, Country"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="availability">Time Availability *</label>
                    <select
                      id="availability"
                      name="availability"
                      value={formData.availability}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select availability</option>
                      <option value="5-10 hours/month">5-10 hours per month</option>
                      <option value="10-20 hours/month">10-20 hours per month</option>
                      <option value="20+ hours/month">20+ hours per month</option>
                      <option value="flexible">Flexible schedule</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="experience">Relevant Experience *</label>
                  <textarea
                    id="experience"
                    name="experience"
                    value={formData.experience}
                    onChange={handleInputChange}
                    placeholder="Tell us about your experience with mentoring, community work, or social impact..."
                    rows={4}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="motivation">Why do you want to become a BGr8 Ambassador? *</label>
                  <textarea
                    id="motivation"
                    name="motivation"
                    value={formData.motivation}
                    onChange={handleInputChange}
                    placeholder="Share your motivation and what you hope to achieve as an ambassador..."
                    rows={4}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Social Media Presence *</label>
                  <p className="social-media-description">Select the platforms you're active on and provide your handles:</p>
                  
                  <div className="social-media-grid">
                    {Object.entries(formData.socialMedia).map(([platform, data]) => (
                      <div key={platform} className={`social-media-platform ${data.enabled ? 'platform-selected' : ''}`}>
                        <div className="platform-checkbox-container">
                          <input
                            type="checkbox"
                            id={`social-${platform}`}
                            checked={data.enabled}
                            onChange={() => handleSocialMediaToggle(platform)}
                            className="custom-checkbox"
                          />
                          <label htmlFor={`social-${platform}`} className="platform-label">
                            <div className="platform-icon" style={{ color: getSocialMediaColor(platform) }}>
                              {React.createElement(getSocialMediaIcon(platform))}
                            </div>
                            <span className="platform-name">{platform.charAt(0).toUpperCase() + platform.slice(1)}</span>
                          </label>
                        </div>
                        
                        {data.enabled && (
                          <div className="platform-handle">
                            <input
                              type="text"
                              placeholder={`@your${platform}handle`}
                              value={data.handle}
                              onChange={(e) => handleSocialMediaHandleChange(platform, e.target.value)}
                              className="handle-input"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {!isAtLeastOneSocialMediaSelected() && (
                    <p className="validation-message">⚠️ Please select at least one social media platform</p>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="referral">How did you hear about BGr8?</label>
                  <select
                    id="referral"
                    name="referral"
                    value={formData.referral}
                    onChange={handleInputChange}
                  >
                    <option value="">Select an option</option>
                    <option value="social-media">Social Media</option>
                    <option value="website">BGr8 Website</option>
                    <option value="friend">Friend/Family</option>
                    <option value="mentor">Current Mentor</option>
                    <option value="event">Community Event</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <button 
                  type="submit" 
                  className="ambassador-submit-btn"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting Application...' : 'Submit Application'}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="ambassador-contact-section">
        <div className="ambassador-container">
          <div className="ambassador-contact-content">
            <h2>Questions About Becoming an Ambassador?</h2>
            <p>Our team is here to help. Reach out to us if you have any questions about the ambassador program.</p>
            <div className="ambassador-contact-info">
              <div className="contact-method">
                <div className="contact-icon">📧</div>
                <h4>Email Us</h4>
                <p>ambassadors@bgr8.com</p>
              </div>
              <div className="contact-method">
                <div className="contact-icon">📱</div>
                <h4>Call Us</h4>
                <p>+44 123 456 7890</p>
              </div>
              <div className="contact-method">
                <div className="contact-icon">💬</div>
                <h4>Live Chat</h4>
                <p>Available Monday-Friday 9AM-5PM GMT</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />

      {/* Custom Modal */}
      {modal.show && (
        <div className="ambassador-modal-overlay" onClick={hideModal}>
          <div className="ambassador-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className={`ambassador-modal-header ${modal.type}`}>
              <div className="modal-icon">
                {modal.type === 'success' && '✅'}
                {modal.type === 'error' && '❌'}
                {modal.type === 'warning' && '⚠️'}
                {modal.type === 'info' && 'ℹ️'}
              </div>
              <h3 className="modal-title">{modal.title}</h3>
              <button className="modal-close" onClick={hideModal}>
                ×
              </button>
            </div>
            
            <div className="ambassador-modal-body">
              <p className="modal-message">{modal.message}</p>
            </div>
            
            <div className="ambassador-modal-footer">
              <div className="modal-actions">
                {modal.showCancel && (
                  <button 
                    className="modal-btn cancel-btn" 
                    onClick={hideModal}
                  >
                    Cancel
                  </button>
                )}
                <button 
                  className={`modal-btn ${modal.type}-btn`} 
                  onClick={handleModalConfirm}
                >
                  {modal.confirmText}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
