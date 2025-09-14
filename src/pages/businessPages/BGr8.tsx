import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/ui/Navbar';
import HamburgerMenu from '../../components/ui/HamburgerMenu';
import Footer from '../../components/ui/Footer';
import '../../styles/businessStyles/BGr8.css';
import ContactForm from '../../components/ui/ContactForm';
import InstagramFeed from '../../components/social/InstagramFeed';

export default function BGr8() {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [donationType, setDonationType] = useState('monthly');
  const [donationAmount, setDonationAmount] = useState('25');

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const navigateToMentors = () => {
    navigate('/dashboard');
  };

  return (
    <div className="bgr8-page">
      {isMobile ? <HamburgerMenu /> : <Navbar />}

      {/* Hero Section with Background Image */}
      <section className="bgr8-hero">
        <div className="bgr8-hero-background">
          <div className="bgr8-hero-overlay">
            <div className="bgr8-hero-content">
              <div className="bgr8-hero-text">
                <h1>Bgr8</h1>
                <p className="bgr8-hero-subtitle">
                  From mentorship to community development, to long-term empowerment - 
                  will you start a regular gift to support communities at every stage of their journey?
                </p>
              </div>
              
              {/* Navigate to Mentors Page Button */}
              <div className="bgr8-scroll-button-container">
                <button 
                  className="bgr8-scroll-to-mentor-btn"
                  onClick={navigateToMentors}
                  aria-label="Navigate to mentors page"
                >
                  <span className="bgr8-scroll-btn-text">Find Mentors & Join Network</span>
                  <span className="bgr8-scroll-btn-arrow">→</span>
                </button>
                <p className="bgr8-scroll-btn-description">
                  Connect with experienced mentors and mentees to create positive change in your community
                </p>
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

      {/* Video Section */}
      <section className="bgr8-video-section">
        <div className="bgr8-content-wrapper">
          <div className="bgr8-video-header">
            <h3>See BGr8 in Action</h3>
            <p>Watch how your support transforms communities and creates lasting positive change</p>
          </div>
          
          <div className="bgr8-video-container">
            <div className="bgr8-video-placeholder">
              <div className="bgr8-video-overlay">
                <div className="bgr8-play-button">
                  <div className="bgr8-play-icon">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </div>
                  <div className="bgr8-play-ripple"></div>
                </div>
                <div className="bgr8-video-title">
                  <h4>BGr8 Community Impact</h4>
                  <span className="bgr8-video-duration">3:42</span>
                </div>
              </div>
              <div className="bgr8-video-thumbnail">
                <div className="bgr8-video-gradient"></div>
                <div className="bgr8-video-pattern"></div>
              </div>
            </div>
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

      {/* About Us Section */}
      <section className="bgr8-about-section">
        <div className="bgr8-content-wrapper">
          <div className="bgr8-about-header">
            <h3>About BGr8</h3>
            <p>Empowering communities through mentorship, education, and sustainable development</p>
          </div>
          
          <div className="bgr8-about-content">
            <div className="bgr8-about-text">
              <div className="bgr8-about-story">
                <h4>Our Story</h4>
                <p>
                  Founded with a vision to create lasting positive change, BGr8 has been at the forefront 
                  of community development and mentorship programs. We believe that sustainable growth 
                  comes from empowering individuals and communities to reach their full potential.
                </p>
                <p>
                  Through our comprehensive approach that spans from crisis prevention to long-term 
                  empowerment, we've helped thousands of people build better futures for themselves 
                  and their communities.
                </p>
              </div>
              
              <div className="bgr8-about-mission">
                <h4>Our Mission</h4>
                <p>
                  To provide critical support from the first sign of need to full community transformation, 
                  ensuring that no one is left behind in the journey toward sustainable development and 
                  lasting positive change.
                </p>
              </div>
            </div>
            
            <div className="bgr8-about-stats">
              <div className="bgr8-stat-card">
                <div className="bgr8-stat-number">10,000+</div>
                <div className="bgr8-stat-label">Lives Impacted</div>
              </div>
              <div className="bgr8-stat-card">
                <div className="bgr8-stat-number">50+</div>
                <div className="bgr8-stat-label">Communities Served</div>
              </div>
              <div className="bgr8-stat-card">
                <div className="bgr8-stat-number">5</div>
                <div className="bgr8-stat-label">Years of Service</div>
              </div>
              <div className="bgr8-stat-card">
                <div className="bgr8-stat-number">95%</div>
                <div className="bgr8-stat-label">Success Rate</div>
              </div>
            </div>
          </div>
          
          <div className="bgr8-about-values">
            <h4>Our Values</h4>
            <div className="bgr8-values-grid">
              <div className="bgr8-value-item">
                <div className="bgr8-value-icon">🤝</div>
                <h5>Community First</h5>
                <p>We prioritize the needs and voices of the communities we serve, ensuring our programs are culturally sensitive and locally relevant.</p>
              </div>
              <div className="bgr8-value-item">
                <div className="bgr8-value-icon">🌱</div>
                <h5>Sustainable Impact</h5>
                <p>We focus on creating long-term, sustainable solutions that continue to benefit communities long after our direct involvement.</p>
              </div>
              <div className="bgr8-value-item">
                <div className="bgr8-value-icon">🎓</div>
                <h5>Education & Mentorship</h5>
                <p>We believe in the power of education and mentorship to unlock potential and create opportunities for growth.</p>
              </div>
              <div className="bgr8-value-item">
                <div className="bgr8-value-icon">💙</div>
                <h5>Transparency</h5>
                <p>We maintain complete transparency in our operations, ensuring donors and partners can see exactly how their support makes a difference.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Instagram Section */}
      <section className="bgr8-instagram-section">
        <div className="bgr8-content-wrapper">
          <div className="bgr8-instagram-header">
            <h3>Follow Our Journey</h3>
            <p>See the real impact of your support through our latest updates and community stories</p>
          </div>
          <InstagramFeed 
            accessToken={import.meta.env.VITE_INSTAGRAM_ACCESS_TOKEN}
            maxPosts={6}
            showProfile={true}
            className="bgr8-instagram-feed"
          />
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
