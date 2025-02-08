import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import HamburgerMenu from '../components/HamburgerMenu';
import Footer from '../components/Footer';
import { FaLinkedin, FaInstagram, FaYoutube, FaTwitter } from 'react-icons/fa';
import '../styles/B8Charity.css';

export default function B8Charity() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [activeCharity, setActiveCharity] = useState(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleCharityClick = (charity: string) => {
    setActiveCharity(charity);
  };

  return (
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
        <h2>About B8 Charity</h2>
        <p>
          B8 Charity is committed to creating meaningful change through impactful initiatives and community-driven support.
          We work with various organizations to uplift communities around the world.
        </p>
      </section>

      {/* Existing Hero Section */}
      <section className="hero">
        <h1>B8 Charity</h1>
        <p>Making a difference through impactful initiatives and community support.</p>
      </section>

      {/* Existing Gallery Section */}
      <section className="gallery">
        <div className="gallery-item">
          <img src="/assets/charity1.jpg" alt="Charity Event 1" />
          <p>Event 1: Community Food Drive</p>
        </div>
        <div className="gallery-item">
          <img src="/assets/charity2.jpg" alt="Charity Event 2" />
          <p>Event 2: Educational Support Program</p>
        </div>
        <div className="gallery-item">
          <img src="/assets/charity3.jpg" alt="Charity Event 3" />
          <p>Event 3: Medical Aid Initiative</p>
        </div>
      </section>

      {/* Donation Widget */}
      <section className="donation-widget">
        <h3>Support Our Cause</h3>
        <form>
          <input type="number" placeholder="Donation Amount ($)" required />
          <button type="submit">Donate Now</button>
        </form>
      </section>

      {/* Charities We Work With */}
      <section className="charity-partners">
        <h3>Charities We Work With</h3>
        <div className="charity-logos">
          {['charity1', 'charity2', 'charity3'].map((charity, index) => (
            <div
              key={index}
              className="charity-card"
              onClick={() => handleCharityClick(charity)}
            >
              <img src={`/assets/${charity}-logo.png`} alt={`Charity ${index + 1}`} />
              <div className="overlay">
                {/* <p>{charity.toUpperCase()}</p> */}
                <p>Click to Learn More</p>
              </div>
            </div>
          ))}
        </div>

        {activeCharity && (
          <div className="charity-info-modal" onClick={() => setActiveCharity(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h4>{activeCharity.toUpperCase()}</h4>
              <p>Learn about how this charity is making a difference in the community.</p>
              <button onClick={() => setActiveCharity(null)}>Close</button>
            </div>
          </div>
        )}
      </section>

      {/* Existing Contact Section */}
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
