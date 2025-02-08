// src/pages/B8Charity.tsx
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import '../styles/Pages.css';

export default function B8Charity() {
  return (
    <div className="page">
      <Navbar />

      <section className="hero">
        <h1>B8 Charity</h1>
        <p>Making a difference through impactful initiatives and community support.</p>
      </section>

      <section className="gallery">
        <img src="/assets/charity1.jpg" alt="Charity Event 1" />
        <img src="/assets/charity2.jpg" alt="Charity Event 2" />
        <img src="/assets/charity3.jpg" alt="Charity Event 3" />
      </section>

      <Footer />
    </div>
  );
}
