import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import HamburgerMenu from '../components/HamburgerMenu';
import Footer from '../components/Footer';
import { FaLinkedin, FaInstagram, FaYoutube, FaTwitter } from 'react-icons/fa';
import '../styles/Pages.css';

export default function B8Clothing() {
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
        <h1>B8 Clothing</h1>
        <p>Discover our exclusive range of stylish and modern B8 apparel.</p>
      </section>

      <section className="gallery">
        <img src="/assets/clothing1.jpg" alt="Clothing Item 1" />
        <img src="/assets/clothing2.jpg" alt="Clothing Item 2" />
        <img src="/assets/clothing3.jpg" alt="Clothing Item 3" />
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
          <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer"><FaLinkedin /></a>
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer"><FaInstagram /></a>
          <a href="https://youtube.com" target="_blank" rel="noopener noreferrer"><FaYoutube /></a>
          <a href="https://twitter.com" target="_blank" rel="noopener noreferrer"><FaTwitter /></a>
        </div>
      </section>

      <Footer />
    </div>
  );
}
