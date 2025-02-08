import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import HamburgerMenu from '../components/HamburgerMenu';
import Footer from '../components/Footer';
import { FaLinkedin, FaInstagram, FaYoutube, FaTwitter } from 'react-icons/fa';
import '../styles/Pages.css';

export default function B8Careers() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="page">
      {isMobile ? <HamburgerMenu /> : <Navbar />}

      <section className="intro-video">
        <div className="video-placeholder">
          <p>Intro Video Placeholder</p>
        </div>
      </section>

      <section className="hero">
        <h1>B8 Careers</h1>
        <p>Join our team and be part of a dynamic organization focused on growth and innovation.</p>
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
