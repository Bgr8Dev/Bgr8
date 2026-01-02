import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaStar, FaHandshake, FaChartLine, FaCalendarAlt, FaMapMarkerAlt, FaClock } from 'react-icons/fa';
import Navbar from '../../components/ui/Navbar';
import HamburgerMenu from '../../components/ui/HamburgerMenu';
import Footer from '../../components/ui/Footer';
import BannerWrapper from '../../components/ui/BannerWrapper';
import VisibilityWrapper from '../../components/ui/VisibilityWrapper';
import '../../styles/businessStyles/BGr8.css';
import ContactForm from '../../components/ui/ContactForm';
import InstagramFeed from '../../components/social/InstagramFeed';
import { collection, getDocs } from 'firebase/firestore';
import { firestore } from '../../firebase/firebase';

export default function BGr8() {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [donationType, setDonationType] = useState('monthly');
  const [donationAmount, setDonationAmount] = useState('25');
  const [ambassadorCount, setAmbassadorCount] = useState(500); // Default fallback value
  const [showMentorDef, setShowMentorDef] = useState(false);
  const [showMenteeDef, setShowMenteeDef] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch ambassador count (non-blocking)
  useEffect(() => {
    const fetchAmbassadorCount = async () => {
      try {
        const usersCollection = collection(firestore, 'users');
        const usersSnapshot = await getDocs(usersCollection);
        
        let count = 0;
        usersSnapshot.forEach((docSnapshot) => {
          const userData = docSnapshot.data();
          if (userData.roles && userData.roles.ambassador === true) {
            count++;
          }
        });
        
        setAmbassadorCount(count);
      } catch (error) {
        console.error('Error fetching ambassador count:', error);
        // Keep the default fallback value on error
      }
    };

    // Run this in the background without blocking the UI
    fetchAmbassadorCount();
  }, []);

  const navigateToMentors = () => {
    navigate('/dashboard');
  };

  return (
    <div className="bgr8-page">
      {isMobile ? <HamburgerMenu /> : <Navbar />}

      {/* Hero Section with Background Image */}
      <VisibilityWrapper sectionId="hero-section">
        <BannerWrapper sectionId="hero-section" bannerType="element">
          <section className="bgr8-hero">
          <div className="bgr8-hero-background">
            <div className="bgr8-hero-overlay">
              <div className="bgr8-hero-content">
                <div className="bgr8-hero-text">
                  <h1>Welcome to Bgr8</h1>
                  <p className="bgr8-hero-subtitle">
                    Bgr8 is a non-profit organisation dedicated to help 16-19 year-olds discover new opportunities and build a brighter future.
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
        </BannerWrapper>
      </VisibilityWrapper>



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

          <VisibilityWrapper sectionId="cta-buttons">
            <BannerWrapper sectionId="cta-buttons" bannerType="element">
              <div className="bgr8-cta-bar">
                <span>START A MONTHLY DONATION TO HELP PROVIDE CRITICAL SUPPORT FROM THE FIRST SIGN OF NEED, TO FULL RECOVERY</span>
                <span className="bgr8-arrow">→</span>
              </div>
            </BannerWrapper>
          </VisibilityWrapper>
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
      <VisibilityWrapper sectionId="donation-form">
        <section className="bgr8-second-donation">
          <div className="bgr8-second-donation-background">
            <div className="bgr8-second-donation-overlay">
              <div className="bgr8-second-donation-content">
                <div className="bgr8-second-donation-text">
                  <h3>Donate to help provide critical support from the first sign of need, to full recovery</h3>
                  <button className="bgr8-second-donate-btn">DONATE NOW</button>
                </div>
                
                {/* Second Donation Form */}
                <BannerWrapper sectionId="donation-form" bannerType="element">
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
              </BannerWrapper>
            </div>
          </div>
        </div>
        </section>
      </VisibilityWrapper>

      {/* About Us Section */}
      <section className="bgr8-about-section">
        <div className="bgr8-content-wrapper">
          <div className="bgr8-about-header">
            <h3>About BGr8</h3>
            <p>Learn more about our mission, values, and the impact we strive to make.</p>
          </div>
          
          <div className="bgr8-about-content">
            <div className="bgr8-about-text">
              <div className="bgr8-about-story">
                <h4>Our Story</h4>
                <p>
                  We are a charity made by young people for young people.
                </p>
              </div>
              
              <div className="bgr8-about-challenge">
                <h4>The Challenge</h4>
                <p>
                  Many young people face barriers such as lack of direction, low confidence, limited access to opportunities.
                </p>
                <p>
                  At Bgr8, we recognise that every young person has potential, some just need support to unlock it.
                </p>
              </div>

              <div className="bgr8-about-offer">
                <h4>What we offer</h4>
                <ul>
                  <li>
                    <strong>National Mentorship Programme:</strong> Connect with experienced professionals and passionate mentors across the UK who are committed to supporting your growth and development.
                  </li>
                  <li>
                    <strong>Personalised Matching:</strong> Our intelligent 
                    <span 
                      className="bgr8-mentor-link"
                      onClick={() => {
                        setShowMentorDef(!showMentorDef);
                        setShowMenteeDef(false);
                      }}
                      onMouseEnter={() => setShowMentorDef(true)}
                      onMouseLeave={() => setShowMentorDef(false)}
                    >
                      Mentor
                      {showMentorDef && (
                        <div className="bgr8-definition-tooltip bgr8-mentor-tooltip">
                          <strong>Mentor:</strong> An experienced professional who shares their expertise, knowledge, and insights to guide and support your personal and professional development journey.
                        </div>
                      )}
                    </span>
                    {' × '}
                    <span 
                      className="bgr8-mentee-link"
                      onClick={() => {
                        setShowMenteeDef(!showMenteeDef);
                        setShowMentorDef(false);
                      }}
                      onMouseEnter={() => setShowMenteeDef(true)}
                      onMouseLeave={() => setShowMenteeDef(false)}
                    >
                      Mentee
                      {showMenteeDef && (
                        <div className="bgr8-definition-tooltip bgr8-mentee-tooltip">
                          <strong>Mentee:</strong> A young person aged 16-19 seeking guidance, inspiration, and support from experienced role models to explore career paths, develop skills, and unlock their full potential.
                        </div>
                      )}
                    </span>
                    {' '}pairing system uses advanced algorithms to match you with the most compatible mentor or mentee based on your interests, goals, and aspirations.
                  </li>
                  <li>
                    <strong>Structured Support Framework:</strong> Benefit from our proven mentorship methodology designed to foster meaningful connections, set clear objectives, and track your progress towards achieving your goals.
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="bgr8-about-stats">
              <div className="bgr8-stat-card">
                <div className="bgr8-stat-number">15</div>
                <div className="bgr8-stat-label">Committee Members</div>
              </div>
              <div className="bgr8-stat-card">
                <div className="bgr8-stat-number">50+</div>
                <div className="bgr8-stat-label">Schools Visited</div>
              </div>
              <div className="bgr8-stat-card">
                <div className="bgr8-stat-number">100+</div>
                <div className="bgr8-stat-label">Mentors</div>
              </div>
              <div className="bgr8-stat-card">
                <div className="bgr8-stat-number">100+</div>
                <div className="bgr8-stat-label">Mentees</div>
              </div>
            </div>
          </div>
          
          <BannerWrapper sectionId="features-grid" bannerType="element">
            <div className="bgr8-about-values">
              <h4>Our Values</h4>
              <div className="bgr8-values-grid">
                <div className="bgr8-value-item">
                  <div className="bgr8-value-icon">🧭</div>
                  <h5>Guiding Young People</h5>
                  <p>We are dedicated to guiding young people, empowering them with the mentorship, resources, and encouragement needed to unlock their potential and confidently shape their futures.</p>
                </div>
                <div className="bgr8-value-item">
                  <div className="bgr8-value-icon">🚀</div>
                  <h5>Potential Beyond Circumstances</h5>
                  <p>We believe anyone can achieve success, no matter where they start. Your background doesn't decide your future. With the right support, you can accomplish your goals.</p>
                </div>
                <div className="bgr8-value-item">
                  <div className="bgr8-value-icon">🌐</div>
                  <h5>Learning Should Be Free and Accessible</h5>
                  <p>Our platform is designed to be free for everyone, and we will never charge for our services.</p>
                </div>
                <div className="bgr8-value-item">
                  <div className="bgr8-value-icon">🛡️</div>
                  <h5>Safeguarding and Accountability</h5>
                  <p>We are committed to safeguarding the welfare of young people and ensuring that our platform is used responsibly and ethically.</p>
                </div>
              </div>
            </div>
          </BannerWrapper>
        </div>
      </section>

      {/* Ambassador Section */}
      <section className="bgr8-ambassador-section">
        <div className="bgr8-content-wrapper">
          <div className="bgr8-ambassador-content">
            <div className="bgr8-ambassador-text">
              <h3>Become a Bgr8 Ambassador</h3>
              <p>
                Join our network of passionate advocates who are making a real difference in their communities. 
                As a BGr8 Ambassador, you'll help spread our mission, connect with like-minded individuals, 
                and create lasting positive change.
              </p>
              <div className="bgr8-ambassador-benefits">
                <div className="bgr8-benefit-item">
                  <div className="bgr8-benefit-icon">
                    <FaStar />
                  </div>
                  <div className="bgr8-benefit-content">
                    <h4>Make an Impact</h4>
                    <p>Be part of meaningful change in communities worldwide</p>
                  </div>
                </div>
                <div className="bgr8-benefit-item">
                  <div className="bgr8-benefit-icon">
                    <FaHandshake />
                  </div>
                  <div className="bgr8-benefit-content">
                    <h4>Build Connections</h4>
                    <p>Connect with mentors, mentees, and fellow ambassadors</p>
                  </div>
                </div>
                <div className="bgr8-benefit-item">
                  <div className="bgr8-benefit-icon">
                    <FaChartLine />
                  </div>
                  <div className="bgr8-benefit-content">
                    <h4>Grow Personally</h4>
                    <p>Develop skills you can apply to your CV and expand your network</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bgr8-ambassador-cta">
              <div className="bgr8-ambassador-card">
                <h4>Ready to Make a Difference?</h4>
                <p>Join our ambassador program and help us create positive change in communities around the world.</p>
                <button 
                  className="bgr8-ambassador-btn"
                  onClick={() => navigate('/ambassador')}
                >
                  Become an Ambassador
                </button>
                <div className="bgr8-ambassador-stats">
                  <div className="bgr8-ambassador-stat">
                    <span className="bgr8-stat-number">{ambassadorCount}+</span>
                    <span className="bgr8-stat-label">Active Ambassadors</span>
                  </div>
                  <div className="bgr8-ambassador-stat">
                    <span className="bgr8-stat-number">18</span>
                    <span className="bgr8-stat-label">Schools Visited</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Instagram Section */}
      <VisibilityWrapper sectionId="instagram-feed">
        <BannerWrapper sectionId="instagram-feed" bannerType="element">
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
        </BannerWrapper>
      </VisibilityWrapper>

      {/* Upcoming Events Section */}
      <section className="bgr8-events-section">
        <div className="bgr8-content-wrapper">
          <div className="bgr8-events-header">
            <h3>Upcoming Events</h3>
            <p>Join us at our upcoming events and be part of the Bgr8 community</p>
          </div>
          <div className="bgr8-events-grid">
            <div className="bgr8-event-card">
              <div className="bgr8-event-date">
                <FaCalendarAlt className="bgr8-event-date-icon" />
                <div className="bgr8-event-date-content">
                  <span className="bgr8-event-day">TBC</span>
                  <span className="bgr8-event-month">TBC</span>
                </div>
              </div>
              <div className="bgr8-event-content">
                <h4>Bgr8 Launch</h4>
                <p>Join us for the official launch of Bgr8! Celebrate with us as we kickstart our mission to empower young people through mentorship.</p>
                <div className="bgr8-event-details">
                  <div className="bgr8-event-detail">
                    <FaClock className="bgr8-event-detail-icon" />
                    <span>6:00 PM - 9:00 PM</span>
                  </div>
                  <div className="bgr8-event-detail">
                    <FaMapMarkerAlt className="bgr8-event-detail-icon" />
                    <span>London, UK</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="bgr8-contact-section">
        <div className="bgr8-content-wrapper">
          <h3>Contact us</h3>
          <p>
            Have questions about our programs or want to learn how you can support our mission? 
            We'd love to hear from you.
          </p>
          <ContactForm source="bgr8" />
        </div>
      </section>

      <VisibilityWrapper sectionId="footer">
        <BannerWrapper sectionId="footer" bannerType="element">
          <Footer />
        </BannerWrapper>
      </VisibilityWrapper>
    </div>
  );
}
