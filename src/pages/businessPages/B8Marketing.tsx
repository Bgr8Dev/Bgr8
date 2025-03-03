import { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import HamburgerMenu from '../../components/HamburgerMenu';
import Footer from '../../components/Footer';
import { FaLinkedin, FaInstagram, FaYoutube, FaTwitter } from 'react-icons/fa';
import { ComingSoonOverlay } from '../../components/ComingSoonOverlay';
import { renderIcon } from '../../utils/iconMapping';
import '../../styles/businessStyles/B8Marketing.css';
import {
  getCategories,
  getSoftware,
  getServices,
  getCompanies,
  getPricingPlans
} from '../../services/marketingService';
import { 
  MarketingCategory, 
  MarketingSoftware, 
  MarketingService, 
  MarketingCompany, 
  MarketingPricingPlan
} from '../../types/marketing';
import ContactForm from '../../components/ContactForm';

export default function B8Marketing() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isLoading, setIsLoading] = useState(true);
  
  // State for storing data from Firestore
  const [categories, setCategories] = useState<MarketingCategory[]>([]);
  const [software, setSoftware] = useState<MarketingSoftware[]>([]);
  const [services, setServices] = useState<MarketingService[]>([]);
  const [companies, setCompanies] = useState<MarketingCompany[]>([]);
  const [pricingPlans, setPricingPlans] = useState<MarketingPricingPlan[]>([]);

  // Filter software based on selected category
  const filteredSoftware = software.filter(item => 
    (selectedCategory === "All" || item.category === selectedCategory) && item.isActive
  );

  // Get active services
  const activeServices = services.filter(service => service.isActive);
  
  // Get active companies
  const activeCompanies = companies.filter(company => company.isActive);
  
  // Get active pricing plans
  const activePricingPlans = pricingPlans.filter(plan => plan.isActive);

  // Load all data from Firestore
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [
        categoriesData,
        softwareData,
        servicesData,
        companiesData,
        pricingPlansData
      ] = await Promise.all([
        getCategories(),
        getSoftware(),
        getServices(),
        getCompanies(),
        getPricingPlans()
      ]);
      
      setCategories(categoriesData);
      setSoftware(softwareData);
      setServices(servicesData);
      setCompanies(companiesData);
      setPricingPlans(pricingPlansData);
    } catch (error) {
      console.error('Error loading marketing data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Filter categories to only show active ones
  const activeCategories = categories.filter(category => category.isActive);

  return (
    <ComingSoonOverlay businessId="marketing">
      <div className="page">
        {isMobile ? <HamburgerMenu /> : <Navbar />}

        {/* Existing Hero Section */}
        <section className="marketing-hero">
          <h1><s>B8</s> Marketing</h1>
          <p> <s>We dont have a slogan yet</s></p>
        </section>

        {/* Updated Header Video Section */}
        <section className="header-video">
          <div className="video-container">
            <iframe
              width="100%"
              height="100%"
              src="https://www.youtube.com/embed/uPXf6RjA5RI"
              title="B8 Marketing Video"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        </section>

        {/* Intro About Section */}
        <section className="intro-about">
          <h2>About B8 Marketing</h2>
          <p>
            At B8 Marketing, we specialize in innovative marketing strategies designed to elevate brands to new heights. 
            Our team is dedicated to delivering impactful campaigns that resonate with audiences globally.
          </p>
        </section>

        {/* Gallery of Media with Descriptions */}
        <section className="gallery">
          <div className="gallery-item">
            <img src="/assets/marketing1.jpg" alt="Marketing Campaign 1" />
            <p>Campaign 1: Social Media Engagement Strategy</p>
          </div>
          <div className="gallery-item">
            <img src="/assets/marketing2.jpg" alt="Marketing Campaign 2" />
            <p>Campaign 2: Influencer Partnerships for Brand Growth</p>
          </div>
          <div className="gallery-item">
            <img src="/assets/marketing3.jpg" alt="Marketing Campaign 3" />
            <p>Campaign 3: Viral Video Production and Promotion</p>
          </div>
        </section>

        {/* Companies We've Worked With */}
        <section className="companies-worked-with">
          <h3>Companies We've Worked With</h3>
          {isLoading ? (
            <div className="loading">Loading companies...</div>
          ) : activeCompanies.length > 0 ? (
            <div className="company-logos">
              {activeCompanies.map(company => (
                <div key={company.id} className="logo-wrapper">
                  <a href={company.websiteUrl} target="_blank" rel="noopener noreferrer">
                    <img src={company.imageUrl} alt={company.name} />
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <p>No companies to display</p>
          )}
        </section>

        {/* Marketing Services */}
        <section className="marketing-services">
          <h2>Our Marketing Solutions</h2>
          {isLoading ? (
            <div className="loading">Loading services...</div>
          ) : activeServices.length > 0 ? (
            <div className="services-container">
              {activeServices.map((service) => (
                <div className="marketing-service-card" key={service.id}>
                  <div className="service-icon">{renderIcon(service.iconName)}</div>
                  <h3>{service.category}</h3>
                  <h4>{service.title}</h4>
                  <ul className="service-list">
                    {service.services.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                  <p className="service-price">{service.price}</p>
                  <button className="learn-more-btn">Learn More</button>
                </div>
              ))}
            </div>
          ) : (
            <p>No services to display</p>
          )}
        </section>

        {/* Software Tools Section */}
        <section className="software-tools">
          <h2>Our Marketing Tech Stack</h2>
          <p>We use industry-leading software to deliver exceptional results</p>
          
          {isLoading ? (
            <div className="loading">Loading tech stack...</div>
          ) : (
            <>
              <div className="category-filter">
                {activeCategories.map((category) => (
                  <button
                    key={category.id}
                    className={`category-btn ${selectedCategory === category.name ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(category.name)}
                  >
                    {category.name}
                  </button>
                ))}
              </div>

              <div className="software-grid">
                {filteredSoftware.length > 0 ? (
                  filteredSoftware.map((software) => (
                    <div className="software-card" key={software.id}>
                      <div className="software-icon">{renderIcon(software.iconName)}</div>
                      <h4>{software.name}</h4>
                      <p className="software-category">{software.category}</p>
                      <p className="software-description">{software.description}</p>
                    </div>
                  ))
                ) : (
                  <p>No software to display for this category</p>
                )}
              </div>
            </>
          )}
        </section>

        {/* Pricing List */}
        <section className="pricing-list">
          <h3>Our Pricing</h3>
          {isLoading ? (
            <div className="loading">Loading pricing plans...</div>
          ) : activePricingPlans.length > 0 ? (
            <div className="pricing-cards">
              {activePricingPlans.map((plan) => (
                <div className="pricing-card" key={plan.id}>
                  <div className="icon-container">{renderIcon(plan.iconName)}</div>
                  <h4>{plan.title}</h4>
                  <p className="price">{plan.price}</p>
                  <p className="description">{plan.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <p>No pricing plans to display</p>
          )}
        </section>

        {/* Links to Social Channels */}
        <section className="social-channels">
          <h3>Follow Us</h3>
          <div className="social-media">
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer"><FaLinkedin /></a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer"><FaInstagram /></a>
            <a href="https://youtube.com" target="_blank" rel="noopener noreferrer"><FaYoutube /></a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer"><FaTwitter /></a>
          </div>
        </section>

        {/* Detailed Contact Us Form */}
        <section>
          <ContactForm source="marketing" />
        </section>

        <Footer />
      </div>
    </ComingSoonOverlay>
  );
}
