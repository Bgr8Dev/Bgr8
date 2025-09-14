// src/components/Footer.tsx
import { Link, useLocation } from 'react-router-dom';
import { FaFacebook, FaInstagram, FaTwitter, FaYoutube } from 'react-icons/fa';
import '../../styles/Footer.css';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const location = useLocation();
  const isBgr8Page = location.pathname.includes('/bgr8') || location.pathname === '/';
  
  const handleSmartNavigation = (section: string) => {
    if (isBgr8Page) {
      // If we're on the BGr8 page, scroll to the section
      let selector = '';
      if (section === 'about') {
        selector = '.bgr8-about-section';
      } else if (section === 'contact') {
        selector = '.bgr8-contact-section';
      }
      
      const element = document.querySelector(selector);
      if (element) {
        element.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
      }
    } else {
      // If we're not on the BGr8 page, navigate to it with a hash
      const hash = section === 'about' ? '#about-us' : '#contact-us';
      window.location.href = `/${hash}`;
    }
  };
  
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section footer-logo-section">
          <h3 className="footer-logo">Bgr8</h3>
          <p className="footer-tagline">Connecting Mentors & Mentees</p>
          <div className="footer-social">
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <FaInstagram />
            </a>
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
              <FaFacebook />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
              <FaTwitter />
            </a>
            <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
              <FaYoutube />
            </a>
          </div>
        </div>
        
        <div className="footer-section footer-links">
          <h4>Quick Links</h4>
          <nav>
            <Link to="/">Home</Link>
            <button 
              onClick={() => handleSmartNavigation('about')}
              className="footer-nav-button"
            >
              About Us
            </button>
            <Link to="/mentor">Mentor Portal</Link>
            <button 
              onClick={() => handleSmartNavigation('contact')}
              className="footer-nav-button"
            >
              Contact
            </button>
          </nav>
        </div>
        
        <div className="footer-section footer-mentoring">
          <h4>Mentoring</h4>
          <nav>
            <Link to="/mentor">Find a Mentor</Link>
            <Link to="/become-mentor">Become a Mentor</Link>
            <Link to="/sessions">Book Sessions</Link>
            <Link to="/feedback">Feedback</Link>
          </nav>
        </div>
        
      </div>
      
      <div className="footer-bottom">
        <p className="copyright">&copy; {currentYear} bgr8. All rights reserved.</p>
        <div className="footer-legal">
          <Link to="/privacy-policy">Privacy Policy</Link>
          <Link to="/terms-of-service">Terms of Service</Link>
        </div>
      </div>
    </footer>
  );
}
