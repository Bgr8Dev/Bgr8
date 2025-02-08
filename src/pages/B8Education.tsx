import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import HamburgerMenu from '../components/HamburgerMenu';
import Footer from '../components/Footer';
import '../styles/Pages.css';

export default function B8Education() {
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
        <h1>B8 Education</h1>
        <p>Empowering the future through innovative education programs and resources.</p>
      </section>

      <section className="gallery">
        <img src="/assets/education1.jpg" alt="Education Program 1" />
        <img src="/assets/education2.jpg" alt="Education Program 2" />
        <img src="/assets/education3.jpg" alt="Education Program 3" />
      </section>

      <Footer />
    </div>
  );
}
