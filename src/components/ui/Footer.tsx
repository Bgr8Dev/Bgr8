// src/components/Footer.tsx
import { Link, useLocation } from 'react-router-dom';
import { FaFacebook, FaInstagram, FaTwitter, FaYoutube } from 'react-icons/fa';
import '../../styles/Footer.css';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
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
            <Link to="/about">About Us</Link>
            <Link to="/mentor">Mentor Portal</Link>
            <Link to="/contact">Contact</Link>
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
