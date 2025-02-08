// src/HomePage.tsx
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import HamburgerMenu from '../components/HamburgerMenu';
import Footer from '../components/Footer';
import { FaLinkedin, FaInstagram, FaYoutube, FaTwitter } from 'react-icons/fa';
import '../styles/HomePage.css';

export default function HomePage() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="homepage">
      {isMobile ? <HamburgerMenu /> : <Navbar />}

      {/* Intro Video Section */}
      <section className="intro-video">
        <div className="video-placeholder">
          <p>Intro Video Placeholder</p>
        </div>
      </section>

      <section className="hero">
        <h2>Empowering Your Business</h2>
        <p>
          We provide cutting-edge marketing strategies and innovative software development solutions tailored to your business needs.
        </p>
        <button>
          <Link to="/b8-marketing" style={{ color: 'white', textDecoration: 'none' }}>Explore B8 Marketing</Link>
        </button>
      </section>

      <section className="services">
        <h3>Explore B8</h3>
        <div className="service-list">
          <Link to="/b8-marketing" className="service-item">
            <h4>B8 Marketing</h4>
            <p>Innovative marketing strategies for your brand.</p>
          </Link>
          <Link to="/bgr8" className="service-item">
            <h4>BGr8</h4>
            <p>Community-focused growth and empowerment programs.</p>
          </Link>
          <Link to="/b8-car-club" className="service-item">
            <h4>B8 Car Club</h4>
            <p>Exclusive car events, showcases, and clubs.</p>
          </Link>
          <Link to="/b8-clothing" className="service-item">
            <h4>B8 Clothing</h4>
            <p>Modern and stylish apparel for every occasion.</p>
          </Link>
          <Link to="/b8-football-club" className="service-item">
            <h4>B8 Football Club</h4>
            <p>Fostering football talent through community and passion.</p>
          </Link>
          <Link to="/b8-charity" className="service-item">
            <h4>B8 Charity</h4>
            <p>Making a difference through impactful charity initiatives.</p>
          </Link>
          <Link to="/b8-education" className="service-item">
            <h4>B8 Education</h4>
            <p>Empowering the next generation through education.</p>
          </Link>
          <Link to="/b8-careers" className="service-item">
            <h4>B8 Careers</h4>
            <p>Join our team to grow and innovate with us.</p>
          </Link>
        </div>
      </section>

      <section className="contact-section">
        <h3>Contact Us</h3>
        <form className="contact-form">
          <input type="text" placeholder="Your Name" required />
          <input type="email" placeholder="Your Email" required />
          <textarea placeholder="Your Message" required></textarea>
          <button type="submit">Send Message</button>
        </form>

        <div className="contact-info">
          <p>Email: contact@b8company.com</p>
          <p>Phone: +123 456 7890</p>
          <p>Address: 123 B8 Street, Innovation City</p>
        </div>

        <div className="social-media">
          <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">
            <FaLinkedin />
          </a>
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
            <FaInstagram />
          </a>
          <a href="https://youtube.com" target="_blank" rel="noopener noreferrer">
            <FaYoutube />
          </a>
          <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
            <FaTwitter />
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}
