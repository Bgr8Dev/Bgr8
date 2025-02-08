// src/pages/BGr8.tsx
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import '../styles/Pages.css';

export default function BGr8() {
  return (
    <div className="page">
      <Navbar />

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
