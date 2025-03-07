import React, { useState, useEffect } from 'react';
import Navbar from '../../components/ui/Navbar';
import HamburgerMenu from '../../components/ui/HamburgerMenu';
import Footer from '../../components/ui/Footer';
import '../../styles/businessStyles/B8World.css';
import ContactForm from '../../components/ui/ContactForm';
import { FaTimes, FaCreditCard, FaPoundSign } from 'react-icons/fa';
import { ComingSoonOverlay } from '../../components/overlays/ComingSoonOverlay';
import SocialChannels from '../../components/ui/SocialChannels';
import { PasswordProtectedPage } from '../../components/overlays/PasswordProtectedPage';
import { db } from '../../firebase';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { renderIcon } from '../../utils/iconMapping';

// Add interface for partner data
interface Partner {
  id: string;
  organization: string;
  description?: string;
  logoUrl?: string;
  websiteLink?: string;
  icon?: string;
  status: string;
}

export default function B8World() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<number>(0);
  const [isDonationModalOpen, setIsDonationModalOpen] = useState(false);
  const [donationAmount, setDonationAmount] = useState<number | string>('');
  const [donorName, setDonorName] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loadingPartners, setLoadingPartners] = useState(true);

  useEffect(() => {
    const handleWindowResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleWindowResize);
    
    // Cleanup event listener on component unmount
    return () => {
      window.removeEventListener('resize', handleWindowResize);
    };
  }, []);

  useEffect(() => {
    const fetchPartners = async () => {
      try {
        const partnersQuery = query(
          collection(db, 'B8WorldPartners'), 
          where('status', '==', 'active')
        );
        const partnersSnapshot = await getDocs(partnersQuery);
        
        const partnersData: Partner[] = [];
        partnersSnapshot.forEach((doc) => {
          partnersData.push({
            id: doc.id,
            organization: doc.data().organization || '',
            description: doc.data().description || '',
            logoUrl: doc.data().logoUrl || '',
            websiteLink: doc.data().websiteLink || '',
            icon: doc.data().icon || 'FaHandHoldingHeart',
            status: doc.data().status
          });
        });
        
        setPartners(partnersData);
      } catch (error) {
        console.error('Error fetching partners:', error);
      } finally {
        setLoadingPartners(false);
      }
    };
    
    fetchPartners();
  }, []);

  const openImageModal = (index: number) => {
    setSelectedImage(index);
    setIsImageModalOpen(true);
    document.body.style.overflow = 'hidden'; // Prevent scrolling when modal is open
  };

  const closeImageModal = () => {
    setIsImageModalOpen(false);
    document.body.style.overflow = 'auto'; // Restore scrolling
  };

  const handleDonationClick = () => {
    setIsDonationModalOpen(true);
    document.body.style.overflow = 'hidden'; // Prevent scrolling when modal is open
  };

  const closeDonationModal = () => {
    setIsDonationModalOpen(false);
    document.body.style.overflow = 'auto'; // Restore scrolling
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

  const proceedToPayment = () => {
    // Here we would typically redirect to Stripe or open a Stripe payment modal
    // For now, we'll just log the donation details and close the modal
    console.log('Processing donation:', {
      amount: donationAmount,
      name: donorName,
      email: donorEmail
    });
    
    // In a real implementation, we would redirect to Stripe:
    // window.location.href = `https://your-stripe-checkout-url?amount=${donationAmount}`;
    
    // For demo purposes, show an alert
    alert(`Thank you for your donation of £${donationAmount}! You would now be redirected to our secure payment processor.`);
    
    // Close the modal
    closeDonationModal();
  };
  
  return (
    <PasswordProtectedPage businessId="world">
      <ComingSoonOverlay businessId="world">
        <div className="page-container">
          {isMobile ? <HamburgerMenu /> : <Navbar />}

          <main className="main-content">
            {/* Hero Section */}
            <section className="hero-section">
              <div className="hero-content">
                <h1>B8 World</h1>
                <p>Making the world a <s>Better</s> B8er place</p>
              </div>
            </section>

            {/* Intro Section */}
            <section className="intro-section">
              <h2>About B8 World</h2>
              <p>
                B8 World is committed to creating meaningful change through impactful initiatives and community-driven support.
                We partner with respected charitable organizations globally to address critical issues and build a better world for all.
                Through our partnerships, we've supported humanitarian aid, healthcare, education, and community development projects.
              </p>
            </section>

            {/* Gallery Section */}
            <section className="gallery-section">
              <div className="gallery-item" onClick={() => openImageModal(0)}>
                <img src="/assets/charity1.jpg" alt="Humanitarian Aid" />
                <p>Humanitarian Relief Projects</p>
              </div>
              <div className="gallery-item" onClick={() => openImageModal(1)}>
                <img src="/assets/charity2.jpg" alt="Healthcare Initiatives" />
                <p>Healthcare & Medical Support</p>
              </div>
              <div className="gallery-item" onClick={() => openImageModal(2)}>
                <img src="/assets/charity3.jpg" alt="Community Development" />
                <p>Community & Youth Development</p>
              </div>
            </section>

            {/* Donation Widget */}
            <section className="donation-widget">
              <h3>Support Our Global Initiatives</h3>
              <p>Your contribution helps us create meaningful change worldwide by supporting our charitable partners.</p>
              <button onClick={handleDonationClick}>Donate Now</button>
            </section>

            {/* Fundraiser Progress */}
            <section className="fundraiser-section">
              <h2>Current Fundraising Campaign</h2>
              <p>Join our mission to make a difference around the world. Every contribution brings us closer to our goal.</p>
              
              <div className="fundraiser-stats">
                <div className="stat-card">
                  <span className="stat-value">£0</span>
                  <span className="stat-label">Raised so far</span>
                </div>
                <div className="stat-card">
                  <span className="stat-value">£50,000</span>
                  <span className="stat-label">Campaign goal</span>
                </div>
                <div className="stat-card">
                  <span className="stat-value">0</span>
                  <span className="stat-label">Donors</span>
                </div>
              </div>
              
              <div className="fundraiser-progress-container">
                <div className="fundraiser-progress-bar">
                  <div className="fundraiser-progress" style={{ width: '0%' }}></div>
                </div>
                <div className="fundraiser-percentage">0% Complete</div>
              </div>
              
              <div className="fundraiser-description">
                <p>Our current fundraising campaign aims to provide emergency relief, medical supplies, and educational resources to communities in need. While we're not actively collecting donations yet, we're preparing to launch this initiative soon.</p>
                <p>Check back for updates on our campaign and how your contributions will make an impact.</p>
              </div>
            </section>

            {/* World Partners Section */}
            <section className="world-partners">
              <h2>Our Global Partners</h2>
              <p>We collaborate with organizations around the world to make a difference.</p>
              
              <div className="world-partners-grid">
                {loadingPartners ? (
                  <div className="loading-partners">Loading partners...</div>
                ) : partners.length > 0 ? (
                  partners.map((partner) => (
                    <div className="world-partner-card" key={partner.id}>
                      <div className="partner-icon">
                        {partner.icon && renderIcon(partner.icon)}
                      </div>
                      <h3>{partner.organization}</h3>
                      {partner.description && <p>{partner.description}</p>}
                      {partner.websiteLink && (
                        <a 
                          href={partner.websiteLink} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="partner-link"
                        >
                          Visit Website
                        </a>
                      )}
                      {partner.logoUrl && (
                        <img 
                          src={partner.logoUrl} 
                          alt={`${partner.organization} logo`} 
                          className="partner-logo" 
                        />
                      )}
                    </div>
                  ))
                ) : (
                  <p className="no-partners">No partners available at the moment.</p>
                )}
              </div>
            </section>

            {/* Contact Form */}
            <section className="contact-section">
              <ContactForm source="world" />
            </section>
            
            {/* Social Channels */}
            <SocialChannels className="world-social-channels" />
          </main>

          <Footer />

          {/* Image Modal */}
          {isImageModalOpen && (
            <div className="modal-overlay" onClick={closeImageModal}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <img src={`/assets/charity${selectedImage + 1}.jpg`} alt={`B8 World Initiative ${selectedImage + 1}`} />
                <button className="close-button" onClick={closeImageModal}>Close</button>
              </div>
            </div>
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
                
                <h2>Make a Donation</h2>
                <p>Your generosity helps us support our charitable partners worldwide.</p>
                
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
                
                {/* Add donation summary section here */}
                {donationAmount && (
                  <div className="donation-summary">
                    <h3>Your Donation</h3>
                    <div className="summary-box">
                      <div className="summary-amount">
                        <span className="currency">£</span>
                        <span className="amount">{donationAmount}</span>
                      </div>
                      <p className="summary-text">Thank you for supporting our global initiatives! Your contribution will help make a difference with our charity partners.</p>
                      <div className="impact-info">
                        {Number(donationAmount) >= 100 ? (
                          <p>This generous donation could help provide emergency relief kits for families in crisis.</p>
                        ) : Number(donationAmount) >= 50 ? (
                          <p>This donation could help provide medical supplies for vulnerable communities.</p>
                        ) : Number(donationAmount) >= 25 ? (
                          <p>This donation could help supply educational materials for children in need.</p>
                        ) : (
                          <p>Every contribution, no matter the size, helps us support our charitable partners.</p>
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
                  <p>B8 World does not store your payment information.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </ComingSoonOverlay>
    </PasswordProtectedPage>
  );
}
