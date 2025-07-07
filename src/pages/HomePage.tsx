// src/HomePage.tsx
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Navbar from '../components/ui/Navbar';
import HamburgerMenu from '../components/ui/HamburgerMenu';
import Footer from '../components/ui/Footer';
import { FaLinkedin, FaInstagram, FaYoutube, FaWhatsapp } from 'react-icons/fa';
import { FaUsers, FaGraduationCap } from 'react-icons/fa';
import ContactForm from '../components/ui/ContactForm';
import { useBusinessAccess } from '../contexts/BusinessAccessContext';
import { Helmet } from 'react-helmet';

export default function HomePage() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const { isBusinessComingSoon } = useBusinessAccess();
  
  const services = [
    { id: 'bgr8', icon: <FaUsers size={40} />, title: 'Bgr8', description: 'Community-focused programs designed to foster growth and collaboration.', link: '/bgr8', color: '#FFF', hoverColor: 'rgba(255, 215, 0, 0.5)', iconColor: '#FFF', iconHoverColor: '#000' },
    { id: 'bgr8r', icon: <FaGraduationCap size={40} />, title: 'Bgr8r', description: 'Educational programs empowering future generations with knowledge and skills.', link: '/bgr8r', color: '#FFF', hoverColor: 'rgba(0, 128, 0, 0.5)', iconColor: '#FFF', iconHoverColor: '#000' },
  ];

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <>
      <Helmet>
        <title>Bgr8 Network | Community Growth & Education</title>
        <meta name="description" content="Bgr8 Network connects communities and individuals through innovative programs, education, and mentorship. Discover our platform for personal and professional growth." />
        <link rel="canonical" href="https://bgr8network.co.uk/" />
      </Helmet>

      <div className="homepage">
        {isMobile ? <HamburgerMenu /> : <Navbar />}

        {/* Intro Video Section */}
        <section className="homepage-intro-video" aria-label="Introduction Video">
          <div className="homepage-video-placeholder">
            <p>HURRY THE FUCK UP BAQUEER</p>
          </div>
        </section>

      <section className="homepage-hero">
        <h2>Empowering Communities</h2>
        <p>
          We provide innovative community programs and educational solutions designed to foster growth, collaboration, and personal development.
        </p>
        <button>
          <Link to="/bgr8" className="homepage-cta-link">Explore Bgr8</Link>
        </button>
      </section>

      <section className="homepage-services">
        <h3>Explore Bgr8</h3>
        <div className="homepage-service-list">
          {services.map((service, index) => (
            <Link 
              to={service.link} 
              className={`homepage-service-card ${isBusinessComingSoon(service.id) ? 'restricted' : ''}`}
              key={index}
              style={{ 
                '--hover-color': service.hoverColor,
                '--icon-color': service.iconColor,
                '--icon-hover-color': service.iconHoverColor,
                color: service.color 
              } as React.CSSProperties}
            >
              <div className="homepage-icon-container" style={{ color: service.iconColor }}>{service.icon}</div>
              <h4>{service.title}</h4>
              <p>{service.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="homepage-contact-section">
        <ContactForm source="home" />
        <div className="homepage-social-media">
          <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">
            <FaLinkedin />
          </a>
          <a href="https://www.instagram.com/bgr8network/" target="_blank" rel="noopener noreferrer">
            <FaInstagram />
          </a>
          <a href="https://www.youtube.com/@Bgr8Network" target="_blank" rel="noopener noreferrer">
            <FaYoutube />
          </a>
          <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
            <FaWhatsapp />
          </a>
        </div>
      </section>

        <Footer />
      </div>
    </>
  );
}
