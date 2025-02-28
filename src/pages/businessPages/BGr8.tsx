import { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import HamburgerMenu from '../../components/HamburgerMenu';
import Footer from '../../components/Footer';
import { FaInstagram, FaYoutube } from 'react-icons/fa';
import '../../styles/businessStyles/BGr8.css';
import BGr8Medical from './BGr8Medical';
import ContactForm from '../../components/ContactForm';
import { ComingSoonOverlay } from '../../components/ComingSoonOverlay';

export default function BGr8() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showMedical, setShowMedical] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <ComingSoonOverlay businessId="bgr8">
      <div className="page">
        {isMobile ? <HamburgerMenu /> : <Navbar />}

        {/* Hero Video Section */}
        <section className="hero-video">
          <div className="video-placeholder">
            <p>Hero Video Placeholder</p>
          </div>
        </section>

        {/* Intro Section */}
        <section className="intro-section">
          <h2>Welcome to BGr8</h2>
          <p>
            BGr8 is dedicated to inspiring and empowering individuals to achieve greatness through community programs, workshops, and engaging events. 
            We believe in creating opportunities for growth, learning, and collaboration.
          </p>
        </section>

        {/* Existing Hero Section */}
        <section className="hero">
          <h1>BGr8</h1>
          <p>Empowering individuals to be great through community engagement and growth.</p>
        </section>

        {/* Existing Gallery Section */}
        <section className="gallery">
          <div className="gallery-item">
            <img src="/assets/bgr8-1.jpg" alt="BGr8 Event 1" />
            <p>Event 1: Leadership Workshop 2023</p>
          </div>
          <div className="gallery-item">
            <img src="/assets/bgr8-2.jpg" alt="BGr8 Event 2" />
            <p>Event 2: Community Outreach Program</p>
          </div>
          <div className="gallery-item">
            <img src="/assets/bgr8-3.jpg" alt="BGr8 Event 3" />
            <p>Event 3: Youth Empowerment Summit</p>
          </div>
        </section>

        {/* Social Media Links */}
        <section className="social-links">
          <h3>Follow Us</h3>
          <div className="social-media">
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer"><FaInstagram /></a>
            <a href="https://youtube.com" target="_blank" rel="noopener noreferrer"><FaYoutube /></a>
          </div>
        </section>

        {/* Google Calendar / Calendly Link */}
        <section className="calendar-section">
          <h3>Book an Event with Us</h3>
          <p>Schedule your appointment through our calendar:</p>
          <a href="https://calendly.com" target="_blank" rel="noopener noreferrer" className="calendar-link">
            Book Now via Calendly
          </a>
        </section>

        {/* Medical Section */}
        <section className="medical-section">
          <h3>BGr8 Medical</h3>
          <p>Join our medical community and make a difference in healthcare</p>
          <button 
            className="medical-button"
            onClick={() => setShowMedical(true)}
          >
            Join BGr8 Medical
          </button>
        </section>

        {showMedical && <BGr8Medical onClose={() => setShowMedical(false)} />}

        {/* Existing Contact Section */}
        <section className="contact-section">
          <ContactForm source="bgr8" />
          <div className="contact-info">
            <p>Email: contact@b8company.com</p>
            <p>Phone: +123 456 7890</p>
            <p>Address: 123 B8 Street, Innovation City</p>
          </div>
        </section>

        <Footer />
      </div>
    </ComingSoonOverlay>
  );
}
