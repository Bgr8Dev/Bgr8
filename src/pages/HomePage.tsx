// src/HomePage.tsx
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Navbar from '../components/ui/Navbar';
import HamburgerMenu from '../components/ui/HamburgerMenu';
import Footer from '../components/ui/Footer';
import { FaLinkedin, FaInstagram, FaYoutube, FaWhatsapp, FaMedal } from 'react-icons/fa';
import { FaBullhorn, FaCar, FaTshirt, FaGraduationCap, FaUsers, FaHeart, FaBriefcase, FaChartBar } from 'react-icons/fa';
import '../styles/HomePage.css';
import ContactForm from '../components/ui/ContactForm';
import UserDemographics from '../components/maps/UserDemographics';
import { useBusinessAccess } from '../contexts/BusinessAccessContext';
import Globe3D from '../components/maps/Globe3D';
import { Helmet } from 'react-helmet';

export default function HomePage() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const { isBusinessComingSoon } = useBusinessAccess();
  
  const services = [
    { id: 'marketing', icon: <FaBullhorn size={40} />, title: 'B8 Marketing', description: 'Innovative digital marketing strategies for business growth and brand awareness.', link: '/b8-marketing', color: '#FFF', hoverColor: 'rgba(255, 255, 255, 0.5)', iconColor: '#FFF', iconHoverColor: '#000' },
    { id: 'bgr8', icon: <FaUsers size={40} />, title: 'Bgr8', description: 'Community-focused programs designed to foster growth and collaboration.', link: '/bgr8', color: '#FFF', hoverColor: 'rgba(255, 215, 0, 0.5)', iconColor: '#FFF', iconHoverColor: '#000' },
    { id: 'carClub', icon: <FaCar size={40} />, title: 'B8 Car Club', description: 'Exclusive automotive events and community for car enthusiasts.', link: '/b8-car-club', color: '#FFF', hoverColor: 'rgba(255, 0, 0, 0.5)', iconColor: '#FFF', iconHoverColor: '#000' },
    { id: 'clothing', icon: <FaTshirt size={40} />, title: 'B8 Clothing', description: 'Modern, stylish apparel designed for comfort and self-expression.', link: '/b8-clothing', color: '#FFF', hoverColor: 'rgba(139, 69, 19, 0.5)', iconColor: '#FFF', iconHoverColor: '#000' },
    { id: 'league', icon: <FaMedal size={40} />, title: 'B8 League', description: 'Sports tournaments and leagues bringing together competitors and fans.', link: '/b8-league', color: '#FFF', hoverColor: 'rgba(128, 0, 128, 0.5)', iconColor: '#FFF', iconHoverColor: '#000' },
    { id: 'world', icon: <FaHeart size={40} />, title: 'B8 World', description: 'Making the world a B8er place through community initiatives and global outreach.', link: '/b8-world', color: '#FFF', hoverColor: 'rgba(0, 0, 255, 0.5)', iconColor: '#FFF', iconHoverColor: '#000' },
    { id: 'bgr8r', icon: <FaGraduationCap size={40} />, title: 'Bgr8r', description: 'Educational programs empowering future generations with knowledge and skills.', link: '/bgr8r', color: '#FFF', hoverColor: 'rgba(0, 128, 0, 0.5)', iconColor: '#FFF', iconHoverColor: '#000' },
    { id: 'podcast', icon: <FaBriefcase size={40} />, title: 'B8 Podcast', description: 'Insightful discussions with industry leaders on business, sports, and personal growth.', link: '/b8-podcast', color: '#FFF', hoverColor: 'rgba(0, 0, 0, 0.5)', iconColor: '#FFF', iconHoverColor: '#FFF' },
  ];

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <>
      <Helmet>
        <title>B8 Network | Integrated Business Solutions & Sports League</title>
        <meta name="description" content="B8 Network connects businesses and individuals across marketing, sports leagues, fashion, automotive, and entertainment sectors. Discover our integrated platform for professional growth and opportunities." />
        <link rel="canonical" href="https://b8network.co.uk/" />
      </Helmet>

      <div className="homepage">
        {isMobile ? <HamburgerMenu /> : <Navbar />}

        {/* Intro Video Section */}
        <section className="homepage-intro-video" aria-label="Introduction Video">
          <div className="homepage-video-placeholder">
            <p>Intro Video Placeholder</p>
          </div>
        </section>

      <section className="homepage-hero">
        <h2>Empowering Your Business</h2>
        <p>
          We provide cutting-edge marketing strategies and innovative software development solutions tailored to your business needs.
        </p>
        <button>
          <Link to="/b8-marketing" className="homepage-cta-link">Explore B8 Marketing</Link>
        </button>
      </section>

      <section className="homepage-services">
        <h3>Explore B8</h3>
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

      {/* Demographics Section */}
      <section className="homepage-demographics-section">
        <h3>
          <FaChartBar /> Our Community Demographics
        </h3>
        {/* <div className="homepage-globe-container">
          <Globe3D width={600} height={600} />
        </div> */}
        <p>
          Explore the diverse makeup of our B8 community. Understanding our user base helps us tailor our services to better meet your needs.
        </p>
        <div className="homepage-demographics-container">
          <UserDemographics />
        </div>
      </section>

      <section className="homepage-contact-section">
        <ContactForm source="home" />
        <div className="homepage-social-media">
          <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">
            <FaLinkedin />
          </a>
          <a href="https://www.instagram.com/b8carclub/" target="_blank" rel="noopener noreferrer">
            <FaInstagram />
          </a>
          <a href="https://www.youtube.com/@B8Cars" target="_blank" rel="noopener noreferrer">
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
