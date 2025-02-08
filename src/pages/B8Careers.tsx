// src/pages/B8Careers.tsx
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import '../styles/Pages.css';

export default function B8Careers() {
  return (
    <div className="page">
      <Navbar />

      <section className="hero">
        <h1>B8 Careers</h1>
        <p>Join our team and be part of a dynamic organization focused on growth and innovation.</p>
      </section>

      <Footer />
    </div>
  );
}
