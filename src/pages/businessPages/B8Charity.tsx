import { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import HamburgerMenu from '../../components/HamburgerMenu';
import Footer from '../../components/Footer';
import { FaLinkedin, FaInstagram, FaYoutube, FaTwitter, FaHandHoldingHeart, FaGlobe, FaHospital, FaUsers, FaHandsHelping } from 'react-icons/fa';
import '../../styles/businessStyles/B8Charity.css';
import ContactForm from '../../components/ContactForm';

const charityPartners = [
  {
    name: "Islamic Relief UK",
    description: "International humanitarian organization providing emergency relief and development programs",
    icon: <FaGlobe size={40} />,
    link: "https://www.islamic-relief.org.uk/"
  },
  {
    name: "Maternal Aid Association (Maa)",
    description: "Supporting maternal health and wellbeing across communities",
    icon: <FaHandHoldingHeart size={40} />,
    link: "https://maacharity.org/"
  },
  {
    name: "Doctors without Borders (MSF)",
    description: "International medical humanitarian organization",
    icon: <FaHospital size={40} />,
    link: "https://www.msf.org/uk"
  },
  {
    name: "Kingston Muslim Youth (KMY)",
    description: "Empowering and supporting young Muslims in Kingston",
    icon: <FaUsers size={40} />,
    link: "https://www.kingstonmuslimyouth.org.uk/"
  },
  {
    name: "Muslim Cultural & Welfare Association of Sutton (MCWAS)",
    description: "Promoting cultural understanding and community welfare",
    icon: <FaHandsHelping size={40} />,
    link: "https://mcwas.org.uk/"
  },
  {
    name: "MATW Project",
    description: "Making positive change through humanitarian projects",
    icon: <FaHandHoldingHeart size={40} />,
    link: "https://www.matwproject.org/"
  },
  {
    name: "Disasters Emergency Committee (DEC)",
    description: "Coordinating emergency aid response for major disasters",
    icon: <FaGlobe size={40} />,
    link: "https://www.dec.org.uk/"
  }
];

export default function B8Charity() {
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

      {/* Charity Partners Section */}
      <section className="charity-partners-showcase">
        <h2>Charities We've Worked With</h2>
        <p>Proud to partner with these amazing organizations making a difference in the world</p>
        
        <div className="charity-partners-grid">
          {charityPartners.map((partner, index) => (
            <a 
              href={partner.link} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="charity-partner-card" 
              key={index}
            >
              <div className="partner-icon">{partner.icon}</div>
              <h3>{partner.name}</h3>
              <p>{partner.description}</p>
            </a>
          ))}
        </div>
      </section>

      {/* Existing Contact Section */}
      <section className="contact-section">
        <ContactForm source="charity" />
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
