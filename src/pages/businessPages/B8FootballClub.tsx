import { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import HamburgerMenu from '../../components/HamburgerMenu';
import Footer from '../../components/Footer';
import { FaLinkedin, FaInstagram, FaYoutube, FaTwitter } from 'react-icons/fa';
import '../../styles/businessStyles/B8FootballClub.css';

export default function B8FootballClub() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="football-page">
      {isMobile ? <HamburgerMenu /> : <Navbar />}

      {/* Hero Video Section */}
      <section className="hero-video">
        <div className="video-placeholder">
          <p>Hero Video Placeholder</p>
        </div>
      </section>

      {/* Intro Section */}
      <section className="football-intro-section">
        <h2>Welcome to B8 Football Club</h2>
        <p>
          B8 Football Club is more than just a team. We are a community of passionate athletes committed to excellence on and off the field.
        </p>
      </section>

            {/* Kit Shop Section */}
            <section className="football-kit-shop">
        <h3>Buy the Official B8 Kit</h3>
        <div className="football-product-card" onClick={() => setIsModalOpen(true)}>
          <img src="/assets/football1.jpg" alt="B8 Jersey" />
          <p>B8 Official Jersey - $50</p>
        </div>
      </section>

      {/* Hero Section */}
      <section className="football-hero">
        <h1>B8 Football Club</h1>
        <p>Passion, performance, and community through football excellence.</p>
      </section>

      {/* Gallery Section */}
      <section className="football-gallery">
        <div className="football-gallery-item">
          <img src="/assets/football1.jpg" alt="Football Match 1" />
          <p>Match 1: Championship League 2023</p>
        </div>
        <div className="football-gallery-item">
          <img src="/assets/football2.jpg" alt="Football Match 2" />
          <p>Match 2: Youth Development Camp</p>
        </div>
        <div className="football-gallery-item">
          <img src="/assets/football3.jpg" alt="Football Match 3" />
          <p>Match 3: International Friendly</p>
        </div>
      </section>



      {/* Modal */}
      {isModalOpen && (
        <div className="football-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="football-modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>B8 Official Jersey</h2>
            <img src="/assets/football1.jpg" alt="B8 Jersey" />
            <p>High-quality jersey made with breathable fabric, designed for comfort and performance.</p>
            <p>Price: $50</p>
            <button onClick={() => alert('Payment functionality will be integrated soon!')}>Buy Now</button>
            <button className="football-close-btn" onClick={() => setIsModalOpen(false)}>Close</button>
          </div>
        </div>
      )}

      {/* Player Widget */}
      <section className="football-player-widget">
        <h3>Player Spotlight</h3>
        <div className="football-player-card">
          <img src="/assets/player1.jpg" alt="Star Player" />
          <h4>John Doe - Forward</h4>
          <p>Goals: 15 | Assists: 10 | Appearances: 20</p>
        </div>
      </section>

      {/* Contact Section */}
      <section className="contact-section">
        <h3>Contact Us</h3>
        <form className="contact-form">
          <input type="text" placeholder="Your Name" required />
          <input type="email" placeholder="Your Email" required />
          <textarea placeholder="Your Message" required></textarea>
          <button type="submit">Send Message</button>
        </form>

        <div className="football-social-media">
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
