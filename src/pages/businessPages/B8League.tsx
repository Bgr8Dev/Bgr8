import { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import HamburgerMenu from '../../components/HamburgerMenu';
import Footer from '../../components/Footer';
import { FaLinkedin, FaInstagram, FaYoutube, FaTwitter, FaFutbol, FaGamepad, FaTableTennis } from 'react-icons/fa';
import '../../styles/businessStyles/B8League.css';
import { ComingSoonOverlay } from '../../components/ComingSoonOverlay';
import ContactForm from '../../components/ContactForm';

type LeagueSport = 'football' | 'badminton' | 'esports';

export default function B8League() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeSport, setActiveSport] = useState<LeagueSport>('football');

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <ComingSoonOverlay businessId="league">
      <div className="league-page">
        {isMobile ? <HamburgerMenu /> : <Navbar />}

        {/* Hero Section */}
        <section className="league-hero">
          <h1>B8 League</h1>
          <p>Excellence in sports - Football, Badminton, and Esports</p>
        </section>

        {/* Sport Navigation */}
        <section className="league-nav">
          <div className="league-tabs">
            <button 
              className={`league-tab ${activeSport === 'football' ? 'active' : ''}`} 
              onClick={() => setActiveSport('football')}
            >
              <FaFutbol /> B8FC
            </button>
            <button 
              className={`league-tab ${activeSport === 'badminton' ? 'active' : ''}`} 
              onClick={() => setActiveSport('badminton')}
            >
              <FaTableTennis /> B8Badminton
            </button>
            <button 
              className={`league-tab ${activeSport === 'esports' ? 'active' : ''}`} 
              onClick={() => setActiveSport('esports')}
            >
              <FaGamepad /> B8Esports
            </button>
          </div>
        </section>

        {/* Football Section */}
        {activeSport === 'football' && (
          <div className="sport-section">
            {/* Intro Section */}
            <section className="league-intro-section">
              <h2>Welcome to B8FC</h2>
              <p>
                B8FC is our premier football club with teams competing at various levels. 
                We pride ourselves on developing talent and fostering a community of passionate football enthusiasts.
              </p>
            </section>

            {/* Video Section */}
            <section className="hero-video">
              <div className="video-placeholder">
                <p>B8FC Highlights Video</p>
              </div>
            </section>

            {/* Kit Shop Section */}
            <section className="league-kit-shop">
              <h3>Official B8FC Merchandise</h3>
              <div className="league-product-card" onClick={() => setIsModalOpen(true)}>
                <img src="/assets/football1.jpg" alt="B8 Jersey" />
                <p>B8FC Official Jersey - $50</p>
              </div>
            </section>

            {/* Gallery Section */}
            <section className="league-gallery">
              <div className="league-gallery-item">
                <img src="/assets/football1.jpg" alt="Football Match 1" />
                <p>Match 1: Championship League 2023</p>
              </div>
              <div className="league-gallery-item">
                <img src="/assets/football2.jpg" alt="Football Match 2" />
                <p>Match 2: Youth Development Camp</p>
              </div>
              <div className="league-gallery-item">
                <img src="/assets/football3.jpg" alt="Football Match 3" />
                <p>Match 3: International Friendly</p>
              </div>
            </section>

            {/* Player Widget */}
            <section className="league-player-widget">
              <h3>Player Spotlight</h3>
              <div className="league-player-card">
                <img src="/assets/player1.jpg" alt="Star Player" />
                <h4>John Doe - Forward</h4>
                <p>Goals: 15 | Assists: 10 | Appearances: 20</p>
              </div>
            </section>
          </div>
        )}

        {/* Badminton Section */}
        {activeSport === 'badminton' && (
          <div className="sport-section">
            {/* Intro Section */}
            <section className="league-intro-section">
              <h2>Welcome to B8Badminton</h2>
              <p>
                B8Badminton is our fast-growing badminton division featuring top players and regular tournaments.
                Join us for competitive play, coaching, and a supportive community of badminton enthusiasts.
              </p>
            </section>

            {/* Video Section */}
            <section className="hero-video">
              <div className="video-placeholder">
                <p>B8Badminton Tournament Highlights</p>
              </div>
            </section>

            {/* Kit Shop Section */}
            <section className="league-kit-shop">
              <h3>Official B8Badminton Gear</h3>
              <div className="league-product-card">
                <img src="/assets/football1.jpg" alt="B8 Badminton Kit" />
                <p>B8Badminton Pro Racket - $120</p>
              </div>
            </section>

            {/* Gallery Section */}
            <section className="league-gallery">
              <div className="league-gallery-item">
                <img src="/assets/football1.jpg" alt="Badminton Match 1" />
                <p>Tournament Final: B8 Open 2023</p>
              </div>
              <div className="league-gallery-item">
                <img src="/assets/football2.jpg" alt="Badminton Match 2" />
                <p>Youth Development Program</p>
              </div>
              <div className="league-gallery-item">
                <img src="/assets/football3.jpg" alt="Badminton Match 3" />
                <p>B8 Badminton International Championship</p>
              </div>
            </section>

            {/* Player Widget */}
            <section className="league-player-widget">
              <h3>Player Spotlight</h3>
              <div className="league-player-card">
                <img src="/assets/player1.jpg" alt="Star Player" />
                <h4>Jane Smith - Singles Specialist</h4>
                <p>Wins: 45 | Tournament Titles: 8 | World Ranking: 24</p>
              </div>
            </section>
          </div>
        )}

        {/* Esports Section */}
        {activeSport === 'esports' && (
          <div className="sport-section">
            {/* Intro Section */}
            <section className="league-intro-section">
              <h2>Welcome to B8Esports</h2>
              <p>
                B8Esports is our cutting-edge gaming division with teams competing in top titles like League of Legends, 
                CS:GO, and Valorant. Join our growing community of professional and amateur gamers.
              </p>
            </section>

            {/* Video Section */}
            <section className="hero-video">
              <div className="video-placeholder">
                <p>B8Esports Tournament Highlights</p>
              </div>
            </section>

            {/* Kit Shop Section */}
            <section className="league-kit-shop">
              <h3>Official B8Esports Merchandise</h3>
              <div className="league-product-card">
                <img src="/assets/football1.jpg" alt="B8 Gaming Jersey" />
                <p>B8Esports Pro Gaming Jersey - $60</p>
              </div>
            </section>

            {/* Gallery Section */}
            <section className="league-gallery">
              <div className="league-gallery-item">
                <img src="/assets/football1.jpg" alt="Esports Match 1" />
                <p>B8 at the World Championship Finals</p>
              </div>
              <div className="league-gallery-item">
                <img src="/assets/football2.jpg" alt="Esports Match 2" />
                <p>CS:GO Major Tournament</p>
              </div>
              <div className="league-gallery-item">
                <img src="/assets/football3.jpg" alt="Esports Match 3" />
                <p>B8 Gaming Arena Grand Opening</p>
              </div>
            </section>

            {/* Player Widget */}
            <section className="league-player-widget">
              <h3>Player Spotlight</h3>
              <div className="league-player-card">
                <img src="/assets/player1.jpg" alt="Star Player" />
                <h4>Alex Chen - Team Captain</h4>
                <p>K/D Ratio: 2.4 | Tournament Wins: 12 | MVPs: 8</p>
              </div>
            </section>
          </div>
        )}

        {/* Modal */}
        {isModalOpen && (
          <div className="league-modal-overlay" onClick={() => setIsModalOpen(false)}>
            <div className="league-modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>B8FC Official Jersey</h2>
              <img src="/assets/football1.jpg" alt="B8 Jersey" />
              <p>High-quality jersey made with breathable fabric, designed for comfort and performance.</p>
              <p>Price: $50</p>
              <button onClick={() => alert('Payment functionality will be integrated soon!')}>Buy Now</button>
              <button className="league-close-btn" onClick={() => setIsModalOpen(false)}>Close</button>
            </div>
          </div>
        )}

        {/* Contact Section */}
        <section>
          <ContactForm source="league" />

          <div className="league-social-media">
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer"><FaLinkedin /></a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer"><FaInstagram /></a>
            <a href="https://youtube.com" target="_blank" rel="noopener noreferrer"><FaYoutube /></a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer"><FaTwitter /></a>
          </div>
        </section>

        <Footer />
      </div>
    </ComingSoonOverlay>
  );
}
