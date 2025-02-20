// src/HomePage.tsx
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import HamburgerMenu from '../components/HamburgerMenu';
import Footer from '../components/Footer';
import { FaLinkedin, FaInstagram, FaYoutube, FaTwitter } from 'react-icons/fa';
import { FaBullhorn, FaCar, FaTshirt, FaGraduationCap, FaUsers, FaGlobe, FaHeart, FaBriefcase } from 'react-icons/fa';
import '../styles/HomePage.css';

export default function HomePage() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const services = [
    { icon: <FaBullhorn size={40} />, title: 'B8 Marketing', description: 'Innovative marketing strategies.', link: '/b8-marketing', color: '#FFF', hoverColor: '#FFFFFF', iconColor: '#FFF', iconHoverColor: '#000' },
    { icon: <FaUsers size={40} />, title: 'Bgr8', description: 'Community growth programs.', link: '/bgr8', color: '#FFF', hoverColor: '#FFD700', iconColor: '#FFF', iconHoverColor: '#000' },
    { icon: <FaCar size={40} />, title: 'B8 Car Club', description: 'Exclusive car events.', link: '/b8-car-club', color: '#FFF', hoverColor: '#FF0000', iconColor: '#FFF', iconHoverColor: '#000' },
    { icon: <FaTshirt size={40} />, title: 'B8 Clothing', description: 'Stylish modern apparel.', link: '/b8-clothing', color: '#FFF', hoverColor: '#8B4513', iconColor: '#FFF', iconHoverColor: '#000' },
    { icon: <FaGlobe size={40} />, title: 'B8 Football Club', description: 'Passion for football.', link: '/b8-football-club', color: '#FFF', hoverColor: '#800080', iconColor: '#FFF', iconHoverColor: '#000' },
    { icon: <FaHeart size={40} />, title: 'B8 Charity', description: 'Impactful charity initiatives.', link: '/b8-charity', color: '#FFF', hoverColor: '#0000FF', iconColor: '#FFF', iconHoverColor: '#000' },
    { icon: <FaGraduationCap size={40} />, title: 'B8 Education', description: 'Empowering future generations.', link: '/b8-education', color: '#FFF', hoverColor: '#008000', iconColor: '#FFF', iconHoverColor: '#000' },
    { icon: <FaBriefcase size={40} />, title: 'B8 Careers', description: 'Grow and innovate with us.', link: '/b8-careers', color: '#FFF', hoverColor: '#000000', iconColor: '#FFF', iconHoverColor: '#FFF' },
  ];

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="homepage">
      {isMobile ? <HamburgerMenu /> : <Navbar />}

      {/* Intro Video Section */}
      <section className="intro-video">
        <div className="video-placeholder">
          <p>Intro Video Placeholder</p>
        </div>
      </section>

      <section className="hero">
        <h2>Empowering Your Business</h2>
        <p>
          We provide cutting-edge marketing strategies and innovative software development solutions tailored to your business needs.
        </p>
        <button>
          <Link to="/b8-marketing" style={{ color: 'white', textDecoration: 'none' }}>Explore B8 Marketing</Link>
        </button>
      </section>

      <section className="services">
        <h3>Explore B8</h3>
        <div className="service-list">
          {services.map((service, index) => (
            <Link 
              to={service.link} 
              className="service-card" 
              key={index}
              style={{ 
                '--hover-color': service.hoverColor,
                '--icon-color': service.iconColor,
                '--icon-hover-color': service.iconHoverColor,
                color: service.color 
              } as React.CSSProperties}
            >
              <div className="icon-container" style={{ color: service.iconColor }}>{service.icon}</div>
              <h4>{service.title}</h4>
              <p>{service.description}</p>
            </Link>
          ))}
        </div>
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
          <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">
            <FaLinkedin />
          </a>
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
            <FaInstagram />
          </a>
          <a href="https://youtube.com" target="_blank" rel="noopener noreferrer">
            <FaYoutube />
          </a>
          <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
            <FaTwitter />
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}
