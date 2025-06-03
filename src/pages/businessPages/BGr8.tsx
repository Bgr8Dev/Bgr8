import { useEffect, useState } from 'react';
import Navbar from '../../components/ui/Navbar';
import HamburgerMenu from '../../components/ui/HamburgerMenu';
import Footer from '../../components/ui/Footer';
import '../../styles/businessStyles/BGr8.css';
import BGr8Medical from './BGr8Medical';
import ContactForm from '../../components/ui/ContactForm';
import { ComingSoonOverlay } from '../../components/overlays/ComingSoonOverlay';
import SocialChannels from '../../components/ui/SocialChannels';
import { PasswordProtectedPage } from '../../components/overlays/PasswordProtectedPage';
import BroBot from '../../components/widgets/brobot/BroBot';
import MentorProgram from '../../components/widgets/MentorAlgorithm/MentorProgram';

export default function BGr8() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showMedical, setShowMedical] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <PasswordProtectedPage businessId="bgr8">
      <ComingSoonOverlay businessId="bgr8">
        <div className="bgr8-page">
          {isMobile ? <HamburgerMenu /> : <Navbar />}

          {/* Existing Hero Section */}
          <section className="bgr8-hero">
            <h1>BGr8</h1>
            <p>Empowering individuals to be great through community engagement and growth.</p>
          </section>


          {/* Hero Video Section */}
          <section className="bgr8-hero-video">
            <div className="bgr8-video-placeholder">
              <p>Hero Video Placeholder</p>
            </div>
          </section>

          {/* Intro Section */}
          <section className="bgr8-intro-section">
            <h2>Welcome to BGr8</h2>
            <p>
              BGr8 is dedicated to inspiring and empowering individuals to achieve greatness through community programs, workshops, and engaging events. 
              We believe in creating opportunities for growth, learning, and collaboration.
            </p>
          </section>

          {/* Mentor Program Widget */}
          <MentorProgram />

          {/* Existing Gallery Section */}
          <section className="bgr8-gallery">
            <div className="bgr8-gallery-item">
              <img src="/assets/bgr8-1.jpg" alt="BGr8 Event 1" />
              <p>Event 1: Leadership Workshop 2023</p>
            </div>
            <div className="bgr8-gallery-item">
              <img src="/assets/bgr8-2.jpg" alt="BGr8 Event 2" />
              <p>Event 2: Community Outreach Program</p>
            </div>
            <div className="bgr8-gallery-item">
              <img src="/assets/bgr8-3.jpg" alt="BGr8 Event 3" />
              <p>Event 3: Youth Empowerment Summit</p>
            </div>
          </section>

          {/* Social Media Links */}
          <SocialChannels className="bgr8-social-channels" />

          {/* Google Calendar / Calendly Link */}
          <section className="bgr8-calendar-section">
            <h3>Book an Event with Us</h3>
            <p>Schedule your appointment through our calendar:</p>
            <a href="https://calendly.com" target="_blank" rel="noopener noreferrer" className="bgr8-calendar-link">
              Book Now via Calendly
            </a>
          </section>

          {/* Medical Section */}
          <section className="bgr8-medical-section">
            <h3>BGr8 Medical</h3>
            <p>Join our medical community and make a difference in healthcare</p>
            <button 
              className="bgr8-medical-button"
              onClick={() => setShowMedical(true)}
            >
              Join BGr8 Medical
            </button>
          </section>

          {showMedical && <BGr8Medical onClose={() => setShowMedical(false)} />}

          {/* Existing Contact Section */}
          <section className="bgr8-contact-section">
            <ContactForm source="bgr8" />
          </section>

          <Footer />
          <BroBot />
        </div>
      </ComingSoonOverlay>
    </PasswordProtectedPage>
  );
}
