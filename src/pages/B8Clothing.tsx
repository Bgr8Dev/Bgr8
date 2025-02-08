// src/pages/B8Clothing.tsx
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import '../styles/Pages.css';

export default function B8Clothing() {
  return (
    <div className="page">
      <Navbar />

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
