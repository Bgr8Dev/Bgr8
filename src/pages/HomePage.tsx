// App.tsx
import '../styles/HomePage.css';

export default function HomePage() {
  return (
    <div className="homepage">
      <header className="header">
        <h1 className="logo">B8</h1>
        <nav className="nav">
          <a href="#services">Services</a>
          <a href="#about">About</a>
          <a href="#contact">Contact</a>
        </nav>
      </header>

      <section className="hero">
        <h2>Empowering Your Business</h2>
        <p>
          We provide cutting-edge marketing strategies and innovative software development solutions tailored to your business needs.
        </p>
        <button>Get Started</button>
      </section>

      <section id="services" className="services">
        <h3>Our Services</h3>
        <div className="service-list">
          <div className="service-item">
            <h4>Marketing Strategies</h4>
            <p>Tailored campaigns to boost your brand visibility and engagement.</p>
          </div>
          <div className="service-item">
            <h4>Software Development</h4>
            <p>Custom software solutions designed to optimize your business processes.</p>
          </div>
          <div className="service-item">
            <h4>Consulting Services</h4>
            <p>Expert advice to help you navigate complex business challenges.</p>
          </div>
        </div>
      </section>

      <footer className="footer">
        <p>&copy; {new Date().getFullYear()} B8. All rights reserved.</p>
      </footer>
    </div>
  );
}