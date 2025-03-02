import { useEffect, useState } from 'react';
import { FaFlagCheckered, FaMapMarkerAlt, FaCar, FaGlobe, FaInstagram, FaFacebook, FaTwitter, FaYoutube } from 'react-icons/fa';
import Navbar from '../../components/Navbar';
import HamburgerMenu from '../../components/HamburgerMenu';
import Footer from '../../components/Footer';
import { ComingSoonOverlay } from '../../components/ComingSoonOverlay';
import '../../styles/businessStyles/B8CarClub.css';

export default function B8CarClub() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const upcomingEvents = [
    { icon: <FaFlagCheckered size={40} />, title: 'Supercar Rally', date: 'June 15, 2024', description: 'High-speed adventure for supercar enthusiasts.' },
    { icon: <FaCar size={40} />, title: 'Track Day Experience', date: 'July 22, 2024', description: 'Feel the thrill of racing on professional tracks.' },
    { icon: <FaGlobe size={40} />, title: 'International Car Expo', date: 'September 10, 2024', description: 'Showcasing cars from around the world.' },
  ];

  const eventLocations = [
    { icon: <FaMapMarkerAlt size={40} />, location: 'Nürburgring, Germany', description: 'Home of legendary car races.' },
    { icon: <FaMapMarkerAlt size={40} />, location: 'Miami Beach, USA', description: 'Scenic drives with ocean views.' },
    { icon: <FaMapMarkerAlt size={40} />, location: 'Tokyo Expressway, Japan', description: 'Urban racing at its finest.' },
  ];

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <ComingSoonOverlay businessId="carClub">
      <div className="carclub-page">
        {isMobile ? <HamburgerMenu /> : <Navbar />}

        {/* Existing Hero Section */}
        <section className="car-club-hero">
          <h1>B8 Car Club</h1>
          <p>Join our exclusive car club for events, showcases, and community activities.</p>
        </section>


        {/* Updated Hero Video Section */}
        <section className="hero-video">
          <div className="video-container">
            <iframe
              width="100%"
              height="100%"
              src="https://www.youtube.com/embed/SQK4uEwRfRo"
              title="B8 Car Club Video"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        </section>

        {/* Intro Section */}
        <section className="carclub-intro-section">
          <h2>Welcome to B8 Car Club</h2>
          <p>
            The B8 Car Club connects car enthusiasts through exclusive events, road trips, and showcases. 
            Join us to experience a community that celebrates passion for cars and performance.
          </p>
        </section>

        {/* Existing Gallery Section */}
        <section className="carclub-gallery">
          <div className="carclub-gallery-item">
            <img src="/assets/car-club1.jpg" alt="Car Event 1" />
            <p>Event 1: Supercar Showcase 2023</p>
          </div>
          <div className="carclub-gallery-item">
            <img src="/assets/car-club2.jpg" alt="Car Event 2" />
            <p>Event 2: Mountain Rally Adventure</p>
          </div>
          <div className="carclub-gallery-item">
            <img src="/assets/car-club3.jpg" alt="Car Event 3" />
            <p>Event 3: Classic Car Exhibition</p>
          </div>
        </section>

        {/* Updated Event List */}
        <section className="carclub-event-list">
          <h3>Upcoming Events</h3>
          <div className="carclub-event-cards">
            {upcomingEvents.map((event, index) => (
              <div className="carclub-event-card" key={index}>
                <div className="carclub-icon-container">{event.icon}</div>
                <h4>{event.title}</h4>
                <p className="carclub-event-date">{event.date}</p>
                <p className="carclub-event-description">{event.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Companies We've Worked With */}
        <section className="carclub-companies-worked-with">
          <h3>Our Partners</h3>
          <div className="carclub-company-logos">
            <img src="/assets/company1-logo.png" alt="Company 1" />
            <img src="/assets/company2-logo.png" alt="Company 2" />
            <img src="/assets/company3-logo.png" alt="Company 3" />
          </div>
        </section>

        {/* Location-Based Event Information */}
        <section className="carclub-event-locations">
          <h3>Where Our Events Happen</h3>
          <div className="carclub-location-cards">
            {eventLocations.map((location, index) => (
              <div className="carclub-location-card" key={index}>
                <div className="carclub-icon-container">{location.icon}</div>
                <h4>{location.location}</h4>
                <p className="carclub-location-description">{location.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Sign-Up Form for the Club */}
        <section className="carclub-signup-form">
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

        {/* Social Media Section */}
        <section className="carclub-social-media">
          <h3>Follow Our Journey</h3>
          <p>Stay connected with B8 Car Club across our social media platforms</p>
          
          <div className="social-media-grid">
            <a 
              href="https://instagram.com/b8carclub" 
              target="_blank" 
              rel="noopener noreferrer"
              className="social-media-card instagram"
            >
              <FaInstagram size={40} />
              <h4>Instagram</h4>
              <p>@b8carclub</p>
              <span>Daily updates & exclusive content</span>
            </a>

            <a 
              href="https://facebook.com/b8carclub" 
              target="_blank" 
              rel="noopener noreferrer"
              className="social-media-card facebook"
            >
              <FaFacebook size={40} />
              <h4>Facebook</h4>
              <p>B8 Car Club Official</p>
              <span>Events & community updates</span>
            </a>

            <a 
              href="https://twitter.com/b8carclub" 
              target="_blank" 
              rel="noopener noreferrer"
              className="social-media-card twitter"
            >
              <FaTwitter size={40} />
              <h4>Twitter</h4>
              <p>@b8carclub</p>
              <span>Latest news & announcements</span>
            </a>

            <a 
              href="https://www.youtube.com/@B8Cars" 
              target="_blank" 
              rel="noopener noreferrer"
              className="social-media-card youtube"
            >
              <FaYoutube size={40} />
              <h4>YouTube</h4>
              <p>B8 Car Club TV</p>
              <span>Event highlights & features</span>
            </a>
          </div>
        </section>

        <Footer />
      </div>
    </ComingSoonOverlay>
  );
}
