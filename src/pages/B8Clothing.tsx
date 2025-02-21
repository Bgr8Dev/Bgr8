import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import HamburgerMenu from '../components/HamburgerMenu';
import Footer from '../components/Footer';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import GooglePayButton from '@google-pay/button-react';
import { loadStripe } from '@stripe/stripe-js';
import { FaLinkedin, FaInstagram, FaYoutube, FaTwitter, FaCreditCard, FaPaypal, FaGooglePay, FaApplePay } from 'react-icons/fa';
import '../styles/B8Clothing.css';

export default function B8Clothing() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID || '';
  const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_TEST_PUBLISHABLE_KEY);

  const handleStripeCheckout = async () => {
    const stripe = await stripePromise;
    if (!stripe) {
      console.error('Stripe initialization failed');
      return;
    }
  
    // Call your backend to create a checkout session
    const response = await fetch('/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        items: [
          {
            id: 'b8-tshirt',
            quantity: 1
          }
        ]
      }),
    });
  
    const session = await response.json();
  
    // Redirect to Stripe Checkout
    const { error } = await stripe.redirectToCheckout({ sessionId: session.id });
    if (error) console.error('Stripe Checkout Error:', error);
  };
  

    useEffect(() => {
      const handleResize = () => setIsMobile(window.innerWidth < 768);
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, []);

    const product = {
      name: 'B8 Exclusive T-Shirt',
      description: 'High-quality, stylish t-shirt featuring the exclusive B8 logo.',
      price: 30, // USD
      image: '/assets/clothing1.jpg',
    };
  
  const categories = [
    'T-Shirts',
    'Hoodies',
    'Sweatshirts',
    'Jeans',
    'Joggers',
    'Shorts',
    'Jackets',
    'Caps',
    'Accessories',
    'Socks',
    'Underwear',
    'Dresses',
    'Skirts',
    'Polo Shirts',
    'Tank Tops'
  ];

  const products = [
    { id: 1, name: 'Classic B8 T-Shirt', price: 30, category: 'T-Shirts', image: '/assets/clothing1.jpg' },
    { id: 2, name: 'B8 Hoodie Black', price: 60, category: 'Hoodies', image: '/assets/clothing2.jpg' },
    { id: 3, name: 'B8 Slim Fit Jeans', price: 80, category: 'Jeans', image: '/assets/clothing3.jpg' },
    // Add more products as needed
  ];

  const [selectedCategory, setSelectedCategory] = useState('All');

  return (
    <PayPalScriptProvider options={{ clientId: PAYPAL_CLIENT_ID }}>
    <div className="clothing-page">
      {isMobile ? <HamburgerMenu /> : <Navbar />}
      {/* Hero Video Section */}
      <section className="hero-video">
        <div className="video-placeholder">
          <p>Hero Video Placeholder</p>
        </div>
      </section>

      {/* Intro Section */}
      <section className="clothing-intro-section">
        <h2>About B8 Clothing</h2>
        <p>
          B8 Clothing offers premium, stylish, and modern apparel designed for individuals who value quality and fashion-forward thinking.
        </p>
      </section>

      {/* Hero Section */}
      <section className="clothing-hero">
        <h1>B8 Clothing</h1>
        <p>Discover our exclusive range of stylish and modern B8 apparel.</p>
      </section>

      {/* Gallery Section */}
      <section className="clothing-gallery">
        <div>
          <img src="/src/assets/Volkswagen.jpg" alt="Clothing Item 1" />
        </div>
        <div>
          <img src="/src/assets/clothing2.jpg" alt="Clothing Item 2" />
        </div>
        <div>
          <img src="/src/assets/clothing3.jpg" alt="Clothing Item 3" />
        </div>
      </section>

      {/* Featured Product */}
      <section className="clothing-shop-section">
        <h3>Featured Product</h3>
        <div className="clothing-product-card" onClick={() => setIsModalOpen(true)}>
          <div className="clothing-icon-container">
            <FaCreditCard size={40} />
          </div>
          <img src={product.image} alt={product.name} />
          <p>{`${product.name} - $${product.price}`}</p>
        </div>
      </section>

            {/* Product Catalog Section */}
            <section className="clothing-catalog-section">
        <h3>Product Catalog</h3>
        
        {/* Category Filter */}
        <div className="clothing-category-filter">
          <button 
            className={`category-btn ${selectedCategory === 'All' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('All')}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category}
              className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <div className="clothing-products-grid">
          {products
            .filter(product => selectedCategory === 'All' || product.category === selectedCategory)
            .map(product => (
              <div key={product.id} className="clothing-product-card" onClick={() => setIsModalOpen(true)}>
                <img src={product.image} alt={product.name} />
                <h4>{product.name}</h4>
                <p>${product.price}</p>
              </div>
            ))}
        </div>
      </section>

      {isModalOpen && (
        <div className="clothing-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="clothing-modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{product.name}</h2>
            <img src={product.image} alt={product.name} />
            <p>{product.description}</p>
            <p>Price: ${product.price}</p>

            {/* Payment Options */}
            <div className="clothing-payment-options">
              {/* PayPal */}
              <div className="clothing-payment-card">
                <div className="clothing-icon-container">
                  <FaPaypal size={40} />
                </div>
                <div className="clothing-paypal-container">
                <PayPalButtons
                  style={{ layout: 'vertical', color: 'gold', shape: 'pill', height: 55, tagline: false }}
                  createOrder={(_data, actions) => {
                    return actions.order.create({
                      intent: "CAPTURE",
                      purchase_units: [
                        {
                          amount: { currency_code: 'USD', value: '30.00' },
                        },
                      ],
                    });
                  }}
                  onApprove={async (_data, actions) => {
                    if (actions.order) {
                      try {
                        const details = await actions.order.capture();
                        const name = details.payer?.name?.given_name ?? 'Customer';
                        alert(`Transaction completed by ${name}`);
                      } catch (error) {
                        console.error('Payment capture failed:', error);
                        alert('Payment failed.');
                      }
                    } else {
                      console.error('Order actions not available.');
                      alert('Payment could not be processed.');
                    }
                  }}
                />
                </div>
              </div>

              {/* Google Pay */}
              <div className="clothing-payment-card">
                <div className="clothing-icon-container">
                  <FaGooglePay size={40} />
                </div>
                <div className="clothing-googlepay-container">
                  <GooglePayButton
                    environment="TEST"
                    paymentRequest={{
                      apiVersion: 2,
                      apiVersionMinor: 0,
                      allowedPaymentMethods: [
                        {
                          type: 'CARD',
                          parameters: {
                            allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
                            allowedCardNetworks: ['MASTERCARD', 'VISA'],
                          },
                          tokenizationSpecification: {
                            type: 'PAYMENT_GATEWAY',
                            parameters: {
                              gateway: 'example',
                              gatewayMerchantId: 'exampleMerchantId',
                            },
                          },
                        },
                      ],
                      merchantInfo: {
                        merchantId: '12345678901234567890',
                        merchantName: 'B8 Clothing',
                      },
                      transactionInfo: {
                        totalPriceStatus: 'FINAL',
                        totalPriceLabel: 'Total',
                        totalPrice: '30.00',
                        currencyCode: 'USD',
                        countryCode: 'US',
                      },
                    }}
                    onLoadPaymentData={(paymentRequest) => {
                      console.log('Payment successful', paymentRequest);
                      alert('Google Pay payment successful!');
                    }}
                  />
                </div>
              </div>

              {/* Stripe */}
              <div className="clothing-payment-card">
                <div className="clothing-icon-container">
                  <FaCreditCard size={40} />
                </div>
                <button className="clothing-stripe-button" onClick={handleStripeCheckout}>
                  Pay with Card (Stripe)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Options Section */}
      <section className="clothing-payment-section">
        <h3>Payment Options</h3>
        <div className="clothing-payment-options">
          <div className="clothing-payment-card">
            <div className="clothing-icon-container">
              <FaCreditCard size={40} />
            </div>
            <h4>Credit/Debit Card</h4>
            <p>Secure payments via Stripe</p>
          </div>
          <div className="clothing-payment-card">
            <div className="clothing-icon-container">
              <FaPaypal size={40} />
            </div>
            <h4>PayPal</h4>
            <p>Fast and secure PayPal checkout</p>
          </div>
          <div className="clothing-payment-card">
            <div className="clothing-icon-container">
              <FaGooglePay size={40} />
            </div>
            <h4>Google Pay</h4>
            <p>Quick payments with Google Pay</p>
          </div>
          <div className="clothing-payment-card">
            <div className="clothing-icon-container">
              <FaApplePay size={40} />
            </div>
            <h4>Apple Pay</h4>
            <p>Easy payments with Apple Pay</p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="clothing-contact-section">
        <h3>Contact Us</h3>
        <form className="clothing-contact-form">
          <input type="text" placeholder="Your Name" required />
          <input type="email" placeholder="Your Email" required />
          <textarea placeholder="Your Message" required></textarea>
          <button type="submit">Send Message</button>
        </form>

        <div className="clothing-social-media">
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