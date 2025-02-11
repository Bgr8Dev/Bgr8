import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import HamburgerMenu from '../components/HamburgerMenu';
import Footer from '../components/Footer';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { FaLinkedin, FaInstagram, FaYoutube, FaTwitter } from 'react-icons/fa';
import '../styles/B8Clothing.css';

export default function B8Clothing() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID || '';



  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return (
    <PayPalScriptProvider options={{ clientId: PAYPAL_CLIENT_ID }}>
    <div className="page">
      {isMobile ? <HamburgerMenu /> : <Navbar />}
      {/* Hero Video Section */}
      <section className="hero-video">
        <div className="video-placeholder">
          <p>Hero Video Placeholder</p>
        </div>
      </section>

      {/* Intro Section */}
      <section className="intro-section">
        <h2>About B8 Clothing</h2>
        <p>
          B8 Clothing offers premium, stylish, and modern apparel designed for individuals who value quality and fashion-forward thinking.
        </p>
      </section>

      {/* Existing Hero Section */}
      <section className="hero">
        <h1>B8 Clothing</h1>
        <p>Discover our exclusive range of stylish and modern B8 apparel.</p>
      </section>

      {/* Existing Gallery Section */}
      <section className="gallery">
        <img src="/assets/clothing1.jpg" alt="Clothing Item 1" />
        <img src="/assets/clothing2.jpg" alt="Clothing Item 2" />
        <img src="/assets/clothing3.jpg" alt="Clothing Item 3" />
      </section>

      {/* Placeholder Item to Purchase */}
      <section className="shop-section">
        <h3>Featured Product</h3>
        <div className="product-card" onClick={() => setIsModalOpen(true)}>
          <img src="/assets/clothing1.jpg" alt="B8 T-Shirt" />
          <p>B8 Exclusive T-Shirt - $30</p>
        </div>
      </section>


      {isModalOpen && (
          <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
            <div className="modal-content enhanced-modal" onClick={(e) => e.stopPropagation()}>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>×</button>
              <h2 className="modal-title">B8 Exclusive T-Shirt</h2>
              <img className="modal-image" src="/assets/clothing1.jpg" alt="B8 T-Shirt" />
              <p className="modal-description">High-quality, comfortable, and stylish t-shirt featuring the exclusive B8 logo. Perfect for any occasion!</p>
              <p className="modal-price">Price: <strong>$30</strong></p>
              <div className="paypal-container">
                <PayPalButtons
                  style={{
                    layout: 'vertical',     // Options: 'vertical' or 'horizontal'
                    color: 'gold',          // Options: 'gold', 'blue', 'silver', 'black', 'white'
                    shape: 'pill',          // Options: 'rect' or 'pill'
                    label: 'paypal',        // Options: 'paypal', 'checkout', 'buynow', 'pay', 'installment'
                    height: 55,             // Adjust button height
                    tagline: false          // Hide the "Powered by PayPal" tagline
                  }}
                  createOrder={(data, actions) => {
                    return actions.order.create({
                      purchase_units: [{ amount: { value: '30.00' } }],
                    });
                  }}
                  onApprove={(data, actions) => {
                    return actions.order.capture().then((details) => {
                      alert(`Transaction completed by ${details.payer.name.given_name}`);
                    });
                  }}
                />
              </div>
            </div>
          </div>
        )}

      {/* Payment Process Placeholder */}
      <section className="payment-section">
        <h3>Payment Options</h3>
        <ul>
          <li>💳 Credit/Debit Card (via Stripe)</li>
          <li>💸 PayPal</li>
          <li>📱 Google Pay</li>
          <li>🍎 Apple Pay</li>
        </ul>
        <p>*Note: We do not accept cryptocurrency payments.</p>
      </section>

      {/* Existing Contact Section */}
      <section className="contact-section">
        <h3>Contact Us</h3>
        <form className="contact-form">
          <input type="text" placeholder="Your Name" required />
          <input type="email" placeholder="Your Email" required />
          <textarea placeholder="Your Message" required></textarea>
          <button type="submit">Send Message</button>
        </form>

        <div className="contact-info">
          <p>Email: contact@b8company.com</p>
          <p>Phone: +123 456 7890</p>
          <p>Address: 123 B8 Street, Innovation City</p>
        </div>

        <div className="social-media">
          <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer"><FaLinkedin /></a>
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer"><FaInstagram /></a>
          <a href="https://youtube.com" target="_blank" rel="noopener noreferrer"><FaYoutube /></a>
          <a href="https://twitter.com" target="_blank" rel="noopener noreferrer"><FaTwitter /></a>
        </div>
      </section>

      <Footer />
    </div>
    </PayPalScriptProvider>
  );
}
