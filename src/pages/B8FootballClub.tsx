// src/pages/B8FootballClub.tsx
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import '../styles/Pages.css';

export default function B8FootballClub() {
  return (
    <div className="page">
      <Navbar />

      <section className="hero">
        <h1>B8 Football Club</h1>
        <p>Passion, performance, and community through football excellence.</p>
      </section>

      <section className="gallery">
        <img src="/assets/football1.jpg" alt="Football Match 1" />
        <img src="/assets/football2.jpg" alt="Football Match 2" />
        <img src="/assets/football3.jpg" alt="Football Match 3" />
      </section>

      <Footer />
    </div>
  );
}
