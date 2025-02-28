import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import HamburgerMenu from '../../components/HamburgerMenu';
import Footer from '../../components/Footer';
import '../../styles/businessStyles/B8World.css';
import ContactForm from '../../components/ContactForm';
import { FaHandHoldingHeart, FaHospital, FaUsers, FaMosque, FaGraduationCap, FaHandsHelping, FaGlobe, FaTimes, FaCreditCard, FaPoundSign } from 'react-icons/fa';

const worldPartners = [
  {
    name: "Islamic Relief UK",
    description: "A faith-inspired humanitarian aid and development agency working to transform and save the lives of some of the most vulnerable people in over 40 countries worldwide.",
    logo: "/assets/charity1.jpg",
    link: "https://www.islamic-relief.org.uk/",
    icon: <FaHandHoldingHeart />
  },
  {
    name: "Maternal Aid Association (Maa)",
    description: "Dedicated to improving maternal healthcare and reducing maternal mortality in developing countries through education, resources, and direct medical support.",
    logo: "/assets/charity2.jpg",
    link: "https://maternalaidsociety.org/",
    icon: <FaHospital />
  },
  {
    name: "Doctors without Borders (MSF)",
    description: "An international humanitarian medical non-governmental organization known for its projects in conflict zones and countries affected by endemic diseases.",
    logo: "/assets/charity3.jpg",
    link: "https://www.msf.org/",
    icon: <FaHospital />
  },
  {
    name: "Kingston Muslim Youth (KMY)",
    description: "Empowering young Muslims in Kingston through educational programs, social activities, and community service projects that foster leadership and personal growth.",
    logo: "/assets/charity1.jpg",
    link: "https://kingstonmuslimyouth.org.uk/",
    icon: <FaUsers />
  },
  {
    name: "Muslim Cultural & Welfare Association of Sutton (MCWAS)",
    description: "Promoting community cohesion and providing welfare services to Muslims in Sutton, while fostering interfaith dialogue and cultural awareness.",
    logo: "/assets/charity2.jpg",
    link: "https://mcwas.org.uk/",
    icon: <FaMosque />
  },
  {
    name: "MATW Project",
    description: "Muslims Around The World Project delivers humanitarian aid and sustainable development initiatives to communities in need, focusing on education, clean water, and healthcare.",
    logo: "/assets/charity3.jpg",
    link: "https://matwproject.org/",
    icon: <FaGraduationCap />
  },
  {
    name: "Disasters Emergency Committee (DEC)",
    description: "Uniting 15 leading UK aid charities to raise funds quickly and efficiently in times of crisis overseas, ensuring humanitarian aid reaches those who need it most.",
    logo: "/assets/charity1.jpg",
    link: "https://www.dec.org.uk/",
    icon: <FaHandsHelping />
  }
];

export default function B8World() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<number>(0);
  const [isDonationModalOpen, setIsDonationModalOpen] = useState(false);
  const [donationAmount, setDonationAmount] = useState<number | string>('');
  const [donorName, setDonorName] = useState('');
  const [donorEmail, setDonorEmail] = useState('');

  useEffect(() => {
    const handleWindowResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleWindowResize);
    
    // Cleanup event listener on component unmount
    return () => {
      window.removeEventListener('resize', handleWindowResize);
    };
  }, []);

  const openImageModal = (index: number) => {
    setSelectedImage(index);
    setIsImageModalOpen(true);
    document.body.style.overflow = 'hidden'; // Prevent scrolling when modal is open
  };

  const closeImageModal = () => {
    setIsImageModalOpen(false);
    document.body.style.overflow = 'auto'; // Restore scrolling
  };

  const handleDonationClick = () => {
    setIsDonationModalOpen(true);
    document.body.style.overflow = 'hidden'; // Prevent scrolling when modal is open
  };

  const closeDonationModal = () => {
    setIsDonationModalOpen(false);
    document.body.style.overflow = 'auto'; // Restore scrolling
  };

  const handleDonationAmountClick = (amount: number) => {
    setDonationAmount(amount);
  };

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow only numbers and decimal points
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
      setDonationAmount(value);
    }
  };

  const proceedToPayment = () => {
    // Here we would typically redirect to Stripe or open a Stripe payment modal
    // For now, we'll just log the donation details and close the modal
    console.log('Processing donation:', {
      amount: donationAmount,
      name: donorName,
      email: donorEmail
    });
    
    // In a real implementation, we would redirect to Stripe:
    // window.location.href = `https://your-stripe-checkout-url?amount=${donationAmount}`;
    
    // For demo purposes, show an alert
    alert(`Thank you for your donation of £${donationAmount}! You would now be redirected to our secure payment processor.`);
    
    // Close the modal
    closeDonationModal();
  };
  
  return (
    <div className="page-container">
      {isMobile ? <HamburgerMenu /> : <Navbar />}

      <main className="main-content">
        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-content">
            <h1>B8 World</h1>
            <p>Making a positive impact across the globe</p>
          </div>
        </section>

        {/* Intro Section */}
        <section className="intro-section">
          <h2>About B8 World</h2>
          <p>
            B8 World is committed to creating meaningful change through impactful initiatives and community-driven support.
            We partner with respected charitable organizations globally to address critical issues and build a better world for all.
            Through our partnerships, we've supported humanitarian aid, healthcare, education, and community development projects.
          </p>
        </section>

        {/* Gallery Section */}
        <section className="gallery-section">
          <div className="gallery-item" onClick={() => openImageModal(0)}>
            <img src="/assets/charity1.jpg" alt="Humanitarian Aid" />
            <p>Humanitarian Relief Projects</p>
          </div>
          <div className="gallery-item" onClick={() => openImageModal(1)}>
            <img src="/assets/charity2.jpg" alt="Healthcare Initiatives" />
            <p>Healthcare & Medical Support</p>
          </div>
          <div className="gallery-item" onClick={() => openImageModal(2)}>
            <img src="/assets/charity3.jpg" alt="Community Development" />
            <p>Community & Youth Development</p>
          </div>
        </section>

        {/* Donation Widget */}
        <section className="donation-widget">
          <h3>Support Our Global Initiatives</h3>
          <p>Your contribution helps us create meaningful change worldwide by supporting our charitable partners.</p>
          <button onClick={handleDonationClick}>Donate Now</button>
        </section>

        {/* World Partners Section */}
        <section className="world-partners-showcase">
          <h2>Our Global Partners</h2>
          <p>B8 World collaborates with established charitable organizations around the globe to maximize our impact and create sustainable change in communities that need it most.</p>

          <div className="world-partners-grid">
            {worldPartners.map((partner, index) => (
              <a 
                key={index}
                href={partner.link}
                target="_blank"
                rel="noopener noreferrer"
                className="world-partner-card"
              >
                <img src={partner.logo} alt={partner.name} />
                <div className="partner-icon">
                  {partner.icon || <FaGlobe />}
                </div>
                <h3>{partner.name}</h3>
                <p>{partner.description}</p>
              </a>
            ))}
          </div>
        </section>

        {/* Contact Form */}
        <section className="contact-section">
          <h3>Get Involved</h3>
          <p>Reach out to learn more about our global initiatives, charity partners, and how you can contribute to making the world a better place.</p>
          <ContactForm source="world" />
        </section>
      </main>

      <Footer />

      {/* Image Modal */}
      {isImageModalOpen && (
        <div className="modal-overlay" onClick={closeImageModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <img src={`/assets/charity${selectedImage + 1}.jpg`} alt={`B8 World Initiative ${selectedImage + 1}`} />
            <button className="close-button" onClick={closeImageModal}>Close</button>
          </div>
        </div>
      )}

      {/* Donation Modal */}
      {isDonationModalOpen && (
        <div className="modal-overlay" onClick={closeDonationModal}>
          <div className="donation-modal-content" onClick={(e) => e.stopPropagation()}>
            <button 
              className="modal-close-btn" 
              onClick={closeDonationModal}
              aria-label="Close donation form"
            >
              <FaTimes />
            </button>
            
            <h2>Make a Donation</h2>
            <p>Your generosity helps us support our charitable partners worldwide.</p>
            
            <div className="donation-amount-section">
              <h3>Select Donation Amount</h3>
              
              <div className="donation-amount-buttons">
                <button 
                  className={donationAmount === 10 ? 'amount-button selected' : 'amount-button'} 
                  onClick={() => handleDonationAmountClick(10)}
                >
                  £10
                </button>
                <button 
                  className={donationAmount === 25 ? 'amount-button selected' : 'amount-button'} 
                  onClick={() => handleDonationAmountClick(25)}
                >
                  £25
                </button>
                <button 
                  className={donationAmount === 50 ? 'amount-button selected' : 'amount-button'} 
                  onClick={() => handleDonationAmountClick(50)}
                >
                  £50
                </button>
                <button 
                  className={donationAmount === 100 ? 'amount-button selected' : 'amount-button'} 
                  onClick={() => handleDonationAmountClick(100)}
                >
                  £100
                </button>
              </div>
              
              <div className="custom-amount-input">
                <label htmlFor="custom-amount">Custom Amount (£):</label>
                <div className="input-with-icon">
                  <FaPoundSign className="input-icon" />
                  <input
                    id="custom-amount"
                    type="text"
                    placeholder="Enter amount"
                    value={typeof donationAmount === 'string' ? donationAmount : ''}
                    onChange={handleCustomAmountChange}
                    onClick={() => setDonationAmount('')}
                  />
                </div>
              </div>
            </div>
            
            {/* Add donation summary section here */}
            {donationAmount && (
              <div className="donation-summary">
                <h3>Your Donation</h3>
                <div className="summary-box">
                  <div className="summary-amount">
                    <span className="currency">£</span>
                    <span className="amount">{donationAmount}</span>
                  </div>
                  <p className="summary-text">Thank you for supporting our global initiatives! Your contribution will help make a difference with our charity partners.</p>
                  <div className="impact-info">
                    {Number(donationAmount) >= 100 ? (
                      <p>This generous donation could help provide emergency relief kits for families in crisis.</p>
                    ) : Number(donationAmount) >= 50 ? (
                      <p>This donation could help provide medical supplies for vulnerable communities.</p>
                    ) : Number(donationAmount) >= 25 ? (
                      <p>This donation could help supply educational materials for children in need.</p>
                    ) : (
                      <p>Every contribution, no matter the size, helps us support our charitable partners.</p>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            <div className="donor-info-section">
              <h3>Your Information</h3>
              
              <div className="form-group">
                <label htmlFor="donor-name">Name (Optional)</label>
                <input
                  id="donor-name"
                  type="text"
                  placeholder="Enter your name"
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="donor-email">Email (Optional)</label>
                <input
                  id="donor-email"
                  type="email"
                  placeholder="Enter your email"
                  value={donorEmail}
                  onChange={(e) => setDonorEmail(e.target.value)}
                />
              </div>
            </div>
            
            <button 
              className="payment-button" 
              onClick={proceedToPayment}
              disabled={!donationAmount}
            >
              <FaCreditCard className="button-icon" />
              Proceed to Payment
            </button>
            
            <div className="secure-payment-notice">
              <p>Your payment will be processed securely via Stripe.</p>
              <p>B8 World does not store your payment information.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
