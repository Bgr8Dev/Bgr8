import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import HamburgerMenu from '../components/HamburgerMenu';
import Footer from '../components/Footer';
import '../styles/Pages.css';

export default function B8Clothing() {
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
        <h1>B8 Clothing</h1>
        <p>Discover our exclusive range of stylish and modern B8 apparel.</p>
      </section>

      <section className="gallery">
        <img src="/assets/clothing1.jpg" alt="Clothing Item 1" />
        <img src="/assets/clothing2.jpg" alt="Clothing Item 2" />
        <img src="/assets/clothing3.jpg" alt="Clothing Item 3" />
      </section>

      <Footer />
    </div>
  );
}
