// src/pages/B8Marketing.tsx
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import '../styles/Pages.css';

export default function B8Marketing() {
  return (
    <div className="page">
      <Navbar />

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
