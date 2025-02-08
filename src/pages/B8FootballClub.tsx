import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import HamburgerMenu from '../components/HamburgerMenu';
import Footer from '../components/Footer';
import '../styles/Pages.css';

export default function B8FootballClub() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="page">
      {isMobile ? <HamburgerMenu /> : <Navbar />}

      <section className="hero">
        <h1>B8 Football Club</h1>
        <p>Passion, performance, and community through football excellence.</p>
      </section>

      <section className="gallery">
        <img src="/assets/football1.jpg" alt="Football Match 1" />
        <img src="/assets/football2.jpg" alt="Football Match 2" />
        <img src="/assets/football3.jpg" alt="Football Match 3" />
      </section>

      <Footer />
    </div>
  );
}
