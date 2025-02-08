// src/pages/B8CarClub.tsx
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import '../styles/Pages.css';

export default function B8CarClub() {
  return (
    <div className="page">
      <Navbar />

      <section className="hero">
        <h1>B8 Car Club</h1>
        <p>Join our exclusive car club for events, showcases, and community activities.</p>
      </section>

      <section className="gallery">
        <img src="/assets/car-club1.jpg" alt="Car Event 1" />
        <img src="/assets/car-club2.jpg" alt="Car Event 2" />
        <img src="/assets/car-club3.jpg" alt="Car Event 3" />
      </section>

      <Footer />
    </div>
  );
}
