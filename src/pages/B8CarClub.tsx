import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import HamburgerMenu from '../components/HamburgerMenu';
import Footer from '../components/Footer';
import '../styles/B8CarClub.css';

export default function B8CarClub() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
        <h2>Welcome to B8 Car Club</h2>
        <p>
          The B8 Car Club connects car enthusiasts through exclusive events, road trips, and showcases. 
          Join us to experience a community that celebrates passion for cars and performance.
        </p>
      </section>

      {/* Existing Hero Section */}
      <section className="hero">
        <h1>B8 Car Club</h1>
        <p>Join our exclusive car club for events, showcases, and community activities.</p>
      </section>

      {/* Existing Gallery Section */}
      <section className="gallery">
        <div className="gallery-item">
          <img src="/assets/car-club1.jpg" alt="Car Event 1" />
          <p>Event 1: Supercar Showcase 2023</p>
        </div>
        <div className="gallery-item">
          <img src="/assets/car-club2.jpg" alt="Car Event 2" />
          <p>Event 2: Mountain Rally Adventure</p>
        </div>
        <div className="gallery-item">
          <img src="/assets/car-club3.jpg" alt="Car Event 3" />
          <p>Event 3: Classic Car Exhibition</p>
        </div>
      </section>

      {/* Updated Event List */}
      <section className="event-list">
        <h3>Upcoming Events</h3>
        <ul>
          <li>🚗 Supercar Rally - June 15, 2024</li>
          <li>🏁 Track Day Experience - July 22, 2024</li>
          <li>🌍 International Car Expo - September 10, 2024</li>
        </ul>
      </section>

      {/* Companies We've Worked With */}
      <section className="companies-worked-with">
        <h3>Our Partners</h3>
        <div className="company-logos">
          <img src="/assets/company1-logo.png" alt="Company 1" />
          <img src="/assets/company2-logo.png" alt="Company 2" />
          <img src="/assets/company3-logo.png" alt="Company 3" />
        </div>
      </section>

      {/* Location-Based Event Information */}
      <section className="event-locations">
        <h3>Where Our Events Happen</h3>
        <p>Check out our event locations around the globe:</p>
        <ul>
          <li>🏎️ Nürburgring, Germany</li>
          <li>🏖️ Miami Beach, USA</li>
          <li>🌉 Tokyo Expressway, Japan</li>
        </ul>
      </section>

      {/* Sign-Up Form for the Club */}
      <section className="signup-form">
        <h3>Join the B8 Car Club</h3>
        <form>
          <input type="text" placeholder="Your Name" required />
          <input type="email" placeholder="Your Email" required />
          <input type="tel" placeholder="Phone Number" required />
          <input type="text" placeholder="Car Make and Model (N/A if none)" required />
          <input type="text" placeholder="Number Plate" required />
          <input type="text" placeholder="Instagram Handle" required />
          <button type="submit">Sign Up Now</button>
        </form>
      </section>

      <Footer />
    </div>
  );
}
