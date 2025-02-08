// src/pages/B8Education.tsx
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import '../styles/Pages.css';

export default function B8Education() {
  return (
    <div className="page">
      <Navbar />

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
