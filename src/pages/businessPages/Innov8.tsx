import { useEffect, useState, useRef } from 'react';
import Footer from '../../components/ui/Footer';
import { ComingSoonOverlay } from '../../components/overlays/ComingSoonOverlay';
import { PasswordProtectedPage } from '../../components/overlays/PasswordProtectedPage';
import { renderIcon } from '../../utils/iconMapping';
import '../../styles/businessStyles/Innov8.css';
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
import ContactForm from '../../components/ui/ContactForm';
import SocialChannels from '../../components/ui/SocialChannels';
import JoinOurTeam from '../../components/ui/JoinOurTeam';
import { FaPlay } from 'react-icons/fa';

declare global {
  interface Window {
    YT: unknown;
    onYouTubeIframeAPIReady: (() => void) | undefined;
  }
}

// --- INNOV8 PAGE ---
export default function Innov8() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isLoading, setIsLoading] = useState(true);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const playerRef = useRef<HTMLDivElement>(null);
  const [ytPlayer, setYtPlayer] = useState<unknown>(null);
  
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
      console.error('Error loading Innov8 data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter categories to only show active ones
  const activeCategories = categories.filter(category => category.isActive);

  // Load YouTube IFrame API
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.body.appendChild(tag);
    }
    // YT API will call window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      // nothing here, handled on play
    };
  }, []);

  // Handle play button click
  const handlePlay = () => {
    setIsVideoPlaying(true);
    setTimeout(() => {
      if (window.YT && playerRef.current && !ytPlayer) {
        const Player = (window.YT as unknown as { Player: unknown }).Player as unknown as (new (...args: any[]) => any);
        const player = new Player(playerRef.current, {
          height: '100%',
          width: '100%',
          videoId: 'uPXf6RjA5RI',
          playerVars: { autoplay: 1, rel: 0, modestbranding: 1 },
          events: {
            onStateChange: (event: unknown) => {
              const ytEvent = event as { data: number };
              if (ytEvent.data === 0 || ytEvent.data === 2) {
                setIsVideoPlaying(false);
                setYtPlayer(null);
              }
            },
          },
        });
        setYtPlayer(player);
      }
    }, 300);
  };

  return (
    <PasswordProtectedPage businessId="marketing">
      <ComingSoonOverlay businessId="marketing">
        <div className="page">
          {/* {isMobile ? <HamburgerMenu /> : <Navbar />} */}

          {/* Hero Section */}
          <section className="marketing-hero">
            <h1>Innov8</h1>
            <p>Innovative marketing for the next generation.</p>
          </section>

          {/* Header Video Section */}
          <section className={`header-video-banner${isVideoPlaying ? ' expanded' : ''}`}> 
            {!isVideoPlaying && (
              <button className="video-play-btn" onClick={handlePlay} aria-label="Play video">
                <FaPlay size={38} color="#e86a1a" />
              </button>
            )}
            <div className={`video-container${isVideoPlaying ? ' visible' : ''}`}> 
              <div ref={playerRef} style={{ width: '100%', height: '100%' }} />
            </div>
          </section>

          {/* Intro About Section */}
          <section className="intro-about">
            <h2>About Innov8</h2>
            <p>
              At Innov8, we specialize in innovative marketing strategies designed to elevate brands to new heights. 
              Our team is dedicated to delivering impactful campaigns that resonate with audiences globally.
            </p>
          </section>

          {/* Gallery of Media with Descriptions */}
          <section className="gallery">
            <div className="gallery-item">
              <img src="../../assets/Marketing/Hyundai.png" alt="Marketing Campaign 1" />
              <p>Campaign 1: Social Media Engagement Strategy</p>
            </div>
            <div className="gallery-item">
              <img src="../../assets/Marketing/Surrey.png" alt="Marketing Campaign 2" />
              <p>Campaign 2: Influencer Partnerships for Brand Growth</p>
            </div>
            <div className="gallery-item">
              <img src="../../assets/Marketing/Volkwagen.png" alt="Marketing Campaign 3" />
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

          {/* Career Opportunities Section */}
          <section className="career-opportunities-section">
            <div className="section-header">
              <h2>Career Opportunities</h2>
              <p>Join our team of marketing professionals and help shape the future of digital marketing</p>
            </div>
            <JoinOurTeam />
          </section>

          {/* Links to Social Channels */}
          <SocialChannels />

          {/* Detailed Contact Us Form */}
          <section>
            <ContactForm source="marketing" />
          </section>

          <Footer />
        </div>
      </ComingSoonOverlay>
    </PasswordProtectedPage>
  );
}
