import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import HamburgerMenu from '../components/HamburgerMenu';
import Footer from '../components/Footer';
import '../styles/Pages.css';

export default function B8Marketing() {
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
        <h1>B8 Marketing</h1>
        <p>Innovative marketing strategies to boost your brand's presence globally.</p>
      </section>

      <section className="gallery">
        <img src="/assets/marketing1.jpg" alt="Marketing Campaign 1" />
        <img src="/assets/marketing2.jpg" alt="Marketing Campaign 2" />
        <img src="/assets/marketing3.jpg" alt="Marketing Campaign 3" />
      </section>

      <Footer />
    </div>
  );
}
