// src/components/Footer.tsx
import { Link } from 'react-router-dom';
import { FaFacebook, FaInstagram, FaTwitter, FaYoutube } from 'react-icons/fa';
import '../../styles/Footer.css';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section footer-logo-section">
          <h3 className="footer-logo">Bgr8</h3>
          <p className="footer-tagline">Automotive Excellence</p>
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
            <Link to="/services">Services</Link>
            <Link to="/contact">Contact</Link>
          </nav>
        </div>
        
        <div className="footer-section footer-businesses">
          <h4>Our Businesses</h4>
          <nav>
            <Link to="/bgr8-car-club">bgr8 Car Club</Link>
            <Link to="/bgr8-league">bgr8 League</Link>
            <Link to="/bgr8-shop">bgr8 Shop</Link>
          </nav>
        </div>
        
        <div className="footer-section footer-contact">
          <h4>Contact Us</h4>
          <address>
            <p>123 Automotive Street</p>
            <p>London, UK</p>
            <p>Email: info@bgr8.com</p>
            <p>Phone: +44 123 456 7890</p>
          </address>
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
