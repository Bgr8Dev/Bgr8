import { useEffect, useState } from 'react';
import Navbar from '../../components/ui/Navbar';
import HamburgerMenu from '../../components/ui/HamburgerMenu';
import Footer from '../../components/ui/Footer';
import '../../styles/businessStyles/BGr8.css';
import ContactForm from '../../components/ui/ContactForm';
import SocialChannels from '../../components/ui/SocialChannels';
import MentorProgram from '../../components/widgets/MentorAlgorithm/MentorProgram';

export default function BGr8() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [donationType, setDonationType] = useState('monthly');
  const [donationAmount, setDonationAmount] = useState('25');

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="bgr8-page">
      {isMobile ? <HamburgerMenu /> : <Navbar />}

      {/* Hero Section with Background Image */}
      <section className="bgr8-hero">
        <div className="bgr8-hero-background">
          <div className="bgr8-hero-overlay">
            <div className="bgr8-hero-content">
              <div className="bgr8-hero-text">
                <h1>BGr8</h1>
                <p className="bgr8-hero-subtitle">
                  From mentorship to community development, to long-term empowerment - 
                  will you start a regular gift to support communities at every stage of their journey?
                </p>
              </div>
              
              {/* Donation Form Overlay */}
              <div className="bgr8-donation-form">
                <div className="bgr8-donation-header">
                  <span className="bgr8-donation-badge">BGR8 COMMUNITY FUND</span>
                </div>
                
                <div className="bgr8-donation-tabs">
                  <button 
                    className={`bgr8-tab ${donationType === 'one-off' ? 'active' : ''}`}
                    onClick={() => setDonationType('one-off')}
                  >
                    One-off
                  </button>
                  <button 
                    className={`bgr8-tab ${donationType === 'monthly' ? 'active' : ''}`}
                    onClick={() => setDonationType('monthly')}
                  >
                    Monthly
                  </button>
                </div>

                <div className="bgr8-amount-selection">
                  <p>Choose an amount to donate</p>
                  <div className="bgr8-amount-buttons">
                    <button 
                      className={`bgr8-amount-btn ${donationAmount === '10' ? 'active' : ''}`}
                      onClick={() => setDonationAmount('10')}
                    >
                      £10
                    </button>
                    <button 
                      className={`bgr8-amount-btn ${donationAmount === '25' ? 'active' : ''}`}
                      onClick={() => setDonationAmount('25')}
                    >
                      £25
                    </button>
                    <button 
                      className={`bgr8-amount-btn ${donationAmount === '50' ? 'active' : ''}`}
                      onClick={() => setDonationAmount('50')}
                    >
                      £50
                    </button>
                  </div>
                  <div className="bgr8-custom-amount">
                    <input 
                      type="text" 
                      placeholder="£ Other amount"
                      className="bgr8-amount-input"
                    />
                  </div>
                </div>

                <button className="bgr8-donate-btn">
                  Donate now
                </button>

                <div className="bgr8-payment-options">
                  <span>Debit/Credit Card</span>
                  <span>Apple Pay</span>
                  <span>PayPal</span>
                </div>

                {donationType === 'monthly' && (
                  <p className="bgr8-monthly-note">
                    Monthly donations mean we can plan further into the future
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Section */}
      <section className="bgr8-main-content">
        <div className="bgr8-content-wrapper">
          <nav className="bgr8-breadcrumb">
            <span>Home</span>
            <span>›</span>
            <span>BGr8 in action</span>
            <span>›</span>
            <span>Community Programs</span>
          </nav>

          <h2 className="bgr8-main-heading">
            DONATE MONTHLY TO BGR8'S COMMUNITY DEVELOPMENT FUND
          </h2>

          <p className="bgr8-main-description">
            Communities around the world are facing unprecedented challenges. Climate-driven 
            displacement, economic inequality, and lack of access to education are creating 
            barriers that prevent people from reaching their full potential. Your monthly 
            donation helps us provide critical support from the first sign of need, to full 
            community transformation.
          </p>

          <div className="bgr8-cta-bar">
            <span>START A MONTHLY DONATION TO HELP PROVIDE CRITICAL SUPPORT FROM THE FIRST SIGN OF NEED, TO FULL RECOVERY</span>
            <span className="bgr8-arrow">→</span>
          </div>
        </div>
      </section>

      {/* What is the Community Fund Section */}
      <section className="bgr8-fund-section">
        <div className="bgr8-content-wrapper">
          <h3>What is the Community Development Fund?</h3>
          <p>
            The Community Development Fund is our comprehensive approach to creating lasting 
            positive change. We believe that sustainable development requires a holistic 
            approach that addresses immediate needs while building long-term capacity.
          </p>

          <div className="bgr8-fund-stages">
            <div className="bgr8-stage">
              <h4>Before a crisis hits</h4>
              <p>Preparation and prevention through education, skill-building, and community resilience programs.</p>
            </div>
            <div className="bgr8-stage">
              <h4>During an emergency</h4>
              <p>Delivering vital support including mentorship, educational resources, and community outreach.</p>
            </div>
            <div className="bgr8-stage">
              <h4>After the immediate need passes</h4>
              <p>Rebuilding and strengthening communities through sustainable development initiatives and ongoing support.</p>
            </div>
          </div>

          <p className="bgr8-fund-conclusion">
            Regular monthly donations help us maintain this fund and respond quickly when 
            communities need our support most.
          </p>
        </div>
      </section>

      {/* Second Donation Section */}
      <section className="bgr8-second-donation">
        <div className="bgr8-second-donation-background">
          <div className="bgr8-second-donation-overlay">
            <div className="bgr8-second-donation-content">
              <div className="bgr8-second-donation-text">
                <h3>Donate to help provide critical support from the first sign of need, to full recovery</h3>
                <button className="bgr8-second-donate-btn">DONATE NOW</button>
              </div>
              
              {/* Second Donation Form */}
              <div className="bgr8-donation-form bgr8-second-form">
                <div className="bgr8-donation-header">
                  <span className="bgr8-donation-badge">BGR8 COMMUNITY FUND</span>
                </div>
                
                <div className="bgr8-donation-tabs">
                  <button 
                    className={`bgr8-tab ${donationType === 'one-off' ? 'active' : ''}`}
                    onClick={() => setDonationType('one-off')}
                  >
                    One-off
                  </button>
                  <button 
                    className={`bgr8-tab ${donationType === 'monthly' ? 'active' : ''}`}
                    onClick={() => setDonationType('monthly')}
                  >
                    Monthly
                  </button>
                </div>

                <div className="bgr8-amount-selection">
                  <p>Choose an amount to donate</p>
                  <div className="bgr8-amount-buttons">
                    <button 
                      className={`bgr8-amount-btn ${donationAmount === '10' ? 'active' : ''}`}
                      onClick={() => setDonationAmount('10')}
                    >
                      £10
                    </button>
                    <button 
                      className={`bgr8-amount-btn ${donationAmount === '25' ? 'active' : ''}`}
                      onClick={() => setDonationAmount('25')}
                    >
                      £25
                    </button>
                    <button 
                      className={`bgr8-amount-btn ${donationAmount === '50' ? 'active' : ''}`}
                      onClick={() => setDonationAmount('50')}
                    >
                      £50
                    </button>
                  </div>
                  <div className="bgr8-custom-amount">
                    <input 
                      type="text" 
                      placeholder="£ Other amount"
                      className="bgr8-amount-input"
                    />
                  </div>
                </div>

                <button className="bgr8-donate-btn">
                  Donate now
                </button>

                <div className="bgr8-payment-options">
                  <span>Debit/Credit Card</span>
                  <span>Apple Pay</span>
                  <span>PayPal</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Discover More Section */}
      <section className="bgr8-discover-section">
        <div className="bgr8-content-wrapper">
          <h3>DISCOVER MORE</h3>
          <div className="bgr8-discover-cards">
            <div className="bgr8-discover-card">
              <h4>Community Programs</h4>
              <p>Learn about our comprehensive approach to community development and how we're creating lasting positive change.</p>
            </div>
            <div className="bgr8-discover-card">
              <h4>How to leave a gift in your Will</h4>
              <p>Discover how you can create a lasting legacy by including BGr8 in your estate planning.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Mentor Program Widget */}
      <section className="bgr8-mentor-section">
        <div className="bgr8-content-wrapper">
          <h3>Join Our Mentorship Network</h3>
          <p>Connect with experienced mentors and mentees to create positive change in your community.</p>
          <MentorProgram />
        </div>
      </section>

      {/* Contact Section */}
      <section className="bgr8-contact-section">
        <div className="bgr8-content-wrapper">
          <h3>Get in Touch</h3>
          <p>
            Have questions about our programs or want to learn how you can support our mission? 
            We'd love to hear from you.
          </p>
          <ContactForm source="bgr8" />
        </div>
      </section>

      <Footer />
    </div>
  );
}
