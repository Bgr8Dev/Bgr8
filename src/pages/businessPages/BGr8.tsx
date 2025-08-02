import { useEffect, useState } from 'react';
import Navbar from '../../components/ui/Navbar';
import HamburgerMenu from '../../components/ui/HamburgerMenu';
import Footer from '../../components/ui/Footer';
import '../../styles/businessStyles/BGr8.css';
import ContactForm from '../../components/ui/ContactForm';
import SocialChannels from '../../components/ui/SocialChannels';
import MentorProgram from '../../components/widgets/MentorAlgorithm/MentorProgram';

export default function BGr8() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="bgr8-page">
      {isMobile ? <HamburgerMenu /> : <Navbar />}

      {/* Hero Section */}
      <section className="bgr8-hero">
        <h1>BGr8</h1>
        <p>Empowering communities through mentorship, education, and sustainable development initiatives.</p>
      </section>

      {/* Hero Video Section */}
      <section className="bgr8-hero-video">
        <div className="bgr8-video-placeholder">
          <p>📹 Watch Our Impact Story</p>
          <p>Learn how BGr8 is transforming lives through community programs</p>
        </div>
      </section>

      {/* Intro Section */}
      <section className="bgr8-intro-section">
        <h2>Our Mission</h2>
        <p>
          BGr8 is a community-focused charity dedicated to creating lasting positive change through 
          mentorship programs, educational initiatives, and sustainable development projects. We believe 
          that everyone deserves the opportunity to reach their full potential, regardless of their 
          background or circumstances.
        </p>
      </section>

      {/* Stats Section */}
      <section className="bgr8-stats-section">
        <h3>Our Impact</h3>
        <div className="bgr8-stats-grid">
          <div className="bgr8-stat-item">
            <span className="bgr8-stat-number">500+</span>
            <span className="bgr8-stat-label">Lives Impacted</span>
          </div>
          <div className="bgr8-stat-item">
            <span className="bgr8-stat-number">50+</span>
            <span className="bgr8-stat-label">Community Events</span>
          </div>
          <div className="bgr8-stat-item">
            <span className="bgr8-stat-number">25+</span>
            <span className="bgr8-stat-label">Partner Organizations</span>
          </div>
          <div className="bgr8-stat-item">
            <span className="bgr8-stat-number">3</span>
            <span className="bgr8-stat-label">Years of Service</span>
          </div>
        </div>
      </section>

      {/* Programs Section */}
      <section className="bgr8-gallery">
        <h3>Our Programs</h3>
        <div className="bgr8-gallery-grid">
          <div className="bgr8-gallery-item">
            <img src="/assets/bgr8-1.jpg" alt="Youth Mentorship Program" />
            <div className="bgr8-gallery-item-content">
              <h4>Youth Mentorship Program</h4>
              <p>Connecting young people with experienced mentors to guide their personal and professional development.</p>
              <span className="bgr8-event-date">Ongoing Program</span>
            </div>
          </div>
          <div className="bgr8-gallery-item">
            <img src="/assets/bgr8-2.jpg" alt="Community Outreach" />
            <div className="bgr8-gallery-item-content">
              <h4>Community Outreach</h4>
              <p>Supporting local communities through food drives, educational workshops, and health awareness campaigns.</p>
              <span className="bgr8-event-date">Monthly Events</span>
            </div>
          </div>
          <div className="bgr8-gallery-item">
            <img src="/assets/bgr8-3.jpg" alt="Skills Development" />
            <div className="bgr8-gallery-item-content">
              <h4>Skills Development</h4>
              <p>Providing vocational training and skill-building workshops to enhance employability and economic independence.</p>
              <span className="bgr8-event-date">Quarterly Sessions</span>
            </div>
          </div>
        </div>
      </section>

      {/* Mentor Program Widget */}
      <section style={{ background: 'var(--white)', padding: '80px 20px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h3 style={{ textAlign: 'center', fontSize: '2rem', color: 'var(--text)', marginBottom: '40px', fontWeight: '600' }}>
            Join Our Mentorship Network
          </h3>
          <MentorProgram />
        </div>
      </section>

      {/* CTA Section */}
      <section className="bgr8-cta-section">
        <h3>Make a Difference Today</h3>
        <p>
          Join us in our mission to create positive change. Whether you want to volunteer, 
          donate, or partner with us, every contribution makes a difference.
        </p>
        <div className="bgr8-cta-buttons">
          <a href="#contact" className="bgr8-cta-primary">Get Involved</a>
          <a href="#donate" className="bgr8-cta-secondary">Donate Now</a>
        </div>
      </section>

      {/* Calendar Section */}
      <section className="bgr8-calendar-section">
        <h3>Book a Consultation</h3>
        <p>
          Interested in learning more about our programs or how you can contribute? 
          Schedule a meeting with our team to discuss partnership opportunities.
        </p>
        <a 
          href="https://calendly.com" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="bgr8-calendar-link"
        >
          📅 Schedule a Meeting
        </a>
      </section>

      {/* Social Media Links */}
      <section style={{ background: 'var(--gray-50)', padding: '60px 20px', textAlign: 'center' }}>
        <h3 style={{ fontSize: '2rem', color: 'var(--text)', marginBottom: '30px', fontWeight: '600' }}>
          Stay Connected
        </h3>
        <p style={{ fontSize: '1.1rem', color: 'var(--gray-700)', marginBottom: '30px', maxWidth: '600px', margin: '0 auto 30px' }}>
          Follow our journey and stay updated with our latest initiatives and success stories.
        </p>
        <SocialChannels className="bgr8-social-channels" />
      </section>

      {/* Contact Section */}
      <section className="bgr8-contact-section">
        <h3>Get in Touch</h3>
        <p>
          Have questions about our programs or want to learn how you can support our mission? 
          We'd love to hear from you.
        </p>
        <ContactForm source="bgr8" />
      </section>

      <Footer />
    </div>
  );
}
