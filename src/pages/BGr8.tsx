import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import HamburgerMenu from '../components/HamburgerMenu';
import Footer from '../components/Footer';
import '../styles/Pages.css';

export default function BGr8() {
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
        <h1>BGr8</h1>
        <p>Empowering individuals to be great through community engagement and growth.</p>
      </section>

      <section className="gallery">
        <img src="/assets/bgr8-1.jpg" alt="BGr8 Event 1" />
        <img src="/assets/bgr8-2.jpg" alt="BGr8 Event 2" />
        <img src="/assets/bgr8-3.jpg" alt="BGr8 Event 3" />
      </section>

      <Footer />
    </div>
  );
}
