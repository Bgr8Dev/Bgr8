import { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import HamburgerMenu from '../../components/HamburgerMenu';
import Footer from '../../components/Footer';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import GooglePayButton from '@google-pay/button-react';
import { loadStripe } from '@stripe/stripe-js';
import { FaLinkedin, FaInstagram, FaYoutube, FaTwitter, FaCreditCard, FaPaypal, FaGooglePay, FaApplePay } from 'react-icons/fa';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { ClothingItem, ClothingCategory } from '../../types/clothing';
import '../../styles/businessStyles/B8Clothing.css';
import { ComingSoonOverlay } from '../../components/ComingSoonOverlay';
import ContactForm from '../../components/ContactForm';

export default function B8Clothing() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID || '';
  const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_TEST_PUBLISHABLE_KEY);
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [selectedSize, setSelectedSize] = useState<string>('all');

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

    useEffect(() => {
      fetchClothingItems();
    }, []);

    const fetchClothingItems = async () => {
      try {
        const itemsRef = collection(db, 'B8Clothing');
        const q = query(itemsRef, orderBy('dateAdded', 'desc'));
        const snapshot = await getDocs(q);
        const clothingItems: ClothingItem[] = [];
        
        snapshot.forEach(doc => {
          clothingItems.push({ id: doc.id, ...doc.data() } as ClothingItem);
        });
        
        setItems(clothingItems);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching clothing items:', error);
        setLoading(false);
      }
    };

    const product = {
      name: 'B8 Exclusive T-Shirt',
      description: 'High-quality, stylish t-shirt featuring the exclusive B8 logo.',
      price: 30, // USD
      image: '/assets/clothing1.jpg',
    };
  
  const categories: ClothingCategory[] = ['tops', 'bottoms', 'outerwear', 'accessories', 'footwear'];

  const filteredItems = items.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesPrice = item.price >= priceRange[0] && item.price <= priceRange[1];
    const matchesSize = selectedSize === 'all' || item.sizes.includes(selectedSize);
    return matchesCategory && matchesPrice && matchesSize && item.inStock;
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'newest':
        return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime();
      default:
        return 0;
    }
  });

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <ComingSoonOverlay businessId="clothing">
      <PayPalScriptProvider options={{ clientId: PAYPAL_CLIENT_ID }}>
        <div className="clothing-page">
          {isMobile ? <HamburgerMenu /> : <Navbar />}

          {/* Hero Section */}
          <section className="clothing-hero">
            <h1>B8 Clothing</h1>
            <p>Discover our exclusive range of stylish and modern B8 apparel.</p>
          </section>
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
                className={`category-btn ${selectedCategory === 'all' ? 'active' : ''}`}
                onClick={() => setSelectedCategory('all')}
              >
                All
              </button>
              {categories.map((category) => (
                <button
                  key={category}
                  className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </button>
              ))}
            </div>

            {/* Sorting Filter */}
            <div className="clothing-sort-filter">
              <label>Sort By:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="newest">Newest</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>

            {/* Size Filter */}
            <div className="clothing-size-filter">
              <label>Size:</label>
              <select
                value={selectedSize}
                onChange={(e) => setSelectedSize(e.target.value)}
              >
                <option value="all">All Sizes</option>
                <option value="XS">XS</option>
                <option value="S">S</option>
                <option value="M">M</option>
                <option value="L">L</option>
                <option value="XL">XL</option>
                <option value="XXL">XXL</option>
              </select>
            </div>

            {/* Price Range Filter */}
            <div className="clothing-price-filter">
              <label>Price Range: £{priceRange[0]} - £{priceRange[1]}</label>
              <input
                type="range"
                min="0"
                max="1000"
                value={priceRange[1]}
                onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
              />
            </div>

            {/* Products Grid */}
            <div className="clothing-products-grid">
              {sortedItems.map(item => (
                <div key={item.id} className="clothing-product-card" onClick={() => setIsModalOpen(true)}>
                  <img src={item.images[0]} alt={item.name} />
                  <h4>{item.name}</h4>
                  <p>${item.price.toFixed(2)}</p>
                </div>
              ))}
            </div>
          </section>

          {isModalOpen && (
            <div className="clothing-modal-overlay" onClick={() => setIsModalOpen(false)}>
              <div className="clothing-modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close-btn" onClick={() => setIsModalOpen(false)}>×</button>
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
          <section>
            <ContactForm source="clothing" />

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
    </ComingSoonOverlay>
  );
}