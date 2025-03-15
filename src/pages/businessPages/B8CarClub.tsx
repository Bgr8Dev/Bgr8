import { useEffect, useState } from 'react';
import { FaFlagCheckered, FaMapMarkerAlt, FaCar, FaGlobe } from 'react-icons/fa';
import Navbar from '../../components/ui/Navbar';
import HamburgerMenu from '../../components/ui/HamburgerMenu';
import Footer from '../../components/ui/Footer';
import { ComingSoonOverlay } from '../../components/overlays/ComingSoonOverlay';
import { PasswordProtectedPage } from '../../components/overlays/PasswordProtectedPage';
import '../../styles/businessStyles/B8CarClub.css';
import SocialChannels from '../../components/ui/SocialChannels';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase/firebase';
import { doc, updateDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from 'react-toastify';

export default function B8CarClub() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const { currentUser, userProfile } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    carMakeModel: '',
    numberPlate: '',
    instagramHandle: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const upcomingEvents = [
    { icon: <FaFlagCheckered size={40} />, title: 'Supercar Rally', date: 'June 15, 2024', description: 'High-speed adventure for supercar enthusiasts.' },
    { icon: <FaCar size={40} />, title: 'Track Day Experience', date: 'July 22, 2024', description: 'Feel the thrill of racing on professional tracks.' },
    { icon: <FaGlobe size={40} />, title: 'International Car Expo', date: 'September 10, 2024', description: 'Showcasing cars from around the world.' },
  ];

  const eventLocations = [
    { icon: <FaMapMarkerAlt size={40} />, location: 'Nürburgring, Germany', description: 'Home of legendary car races.' },
    { icon: <FaMapMarkerAlt size={40} />, location: 'Miami Beach, USA', description: 'Scenic drives with ocean views.' },
    { icon: <FaMapMarkerAlt size={40} />, location: 'Tokyo Expressway, Japan', description: 'Urban racing at its finest.' },
  ];

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Pre-fill form with user data if available
  useEffect(() => {
    if (currentUser && userProfile) {
      setFormData(prevData => ({
        ...prevData,
        name: userProfile.displayName || '',
        email: currentUser.email || '',
        phone: userProfile.phoneNumber || '',
        carMakeModel: userProfile.carClub?.carMake && userProfile.carClub?.carModel 
          ? `${userProfile.carClub.carMake} ${userProfile.carClub.carModel}`
          : '',
        numberPlate: userProfile.carClub?.numberPlate || '',
        instagramHandle: userProfile.socialMedia?.instagram || ''
      }));
    }
  }, [currentUser, userProfile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      toast.error("You must be logged in to join the car club");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // 1. Add the request to a 'carClubRequests' collection
      const requestData = {
        userId: currentUser.uid,
        userEmail: currentUser.email,
        name: formData.name,
        phone: formData.phone,
        carMakeModel: formData.carMakeModel,
        numberPlate: formData.numberPlate,
        instagramHandle: formData.instagramHandle,
        status: 'pending', // pending, approved, rejected
        requestDate: serverTimestamp(),
        notes: ''
      };
      
      await addDoc(collection(db, 'carClubRequests'), requestData);
      
      // 2. Update the user's profile with car club information
      if (userProfile) {
        const userRef = doc(db, 'users', currentUser.uid);
        
        // Extract car make and model
        const [carMake, ...modelParts] = formData.carMakeModel.split(' ');
        const carModel = modelParts.join(' ');
        
        await updateDoc(userRef, {
          'lastUpdated': new Date(),
          'carClub.carMake': carMake || '',
          'carClub.carModel': carModel || '',
          'carClub.numberPlate': formData.numberPlate,
          'carClub.membershipType': 'pending',
          'carClub.joinDate': new Date(),
          'socialMedia.instagram': formData.instagramHandle,
          'b8Memberships.carClub': true
        });
      }
      
      toast.success("Your car club application has been submitted!");
      
      // Reset form after successful submission
      setFormData({
        name: '',
        email: '',
        phone: '',
        carMakeModel: '',
        numberPlate: '',
        instagramHandle: ''
      });
      
    } catch (error) {
      console.error("Error submitting car club application:", error);
      toast.error("Failed to submit application. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderLoginPrompt = () => {
    return (
      <div className="carclub-login-prompt">
        <p className="title">B8 Car Club Access</p>
        <p className="subtitle">Join our exclusive community of car enthusiasts</p>
        
        <div className="carclub-login-options">
          <a href="/login">SIGN IN</a>
          <span>or</span>
          <a href="/register">CREATE AN ACCOUNT</a>
        </div>
        
        <p>Please sign in or create an account to join the car club.</p>
      </div>
    );
  };

  return (
    <PasswordProtectedPage businessId="carClub">
      <ComingSoonOverlay businessId="carClub">
        <div className="carclub-page">
          {isMobile ? <HamburgerMenu /> : <Navbar />}

          {/* Existing Hero Section */}
          <section className="car-club-hero">
            <h1>B8 Car Club</h1>
            <p>Join our exclusive car club for events, showcases, and community activities.</p>
          </section>


          {/* Updated Hero Video Section */}
          <section className="carclub-hero-video">
            <div className="video-container">
              <iframe
                width="100%"
                height="100%"
                src="https://www.youtube.com/embed/SQK4uEwRfRo"
                title="B8 Car Club Video"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </section>

          {/* Intro Section */}
          <section className="carclub-intro-section">
            <h2>Welcome to B8 Car Club</h2>
            <p>
              The B8 Car Club connects car enthusiasts through exclusive events, road trips, and showcases. 
              Join us to experience a community that celebrates passion for cars and performance.
            </p>
          </section>

          {/* Existing Gallery Section */}
          <section className="carclub-gallery">
            <div className="carclub-gallery-item">
              <img src="/assets/car-club1.jpg" alt="Car Event 1" />
              <p>Event 1: Supercar Showcase 2023</p>
            </div>
            <div className="carclub-gallery-item">
              <img src="/assets/car-club2.jpg" alt="Car Event 2" />
              <p>Event 2: Mountain Rally Adventure</p>
            </div>
            <div className="carclub-gallery-item">
              <img src="/assets/car-club3.jpg" alt="Car Event 3" />
              <p>Event 3: Classic Car Exhibition</p>
            </div>
          </section>

          {/* Updated Event List */}
          <section className="carclub-event-list">
            <h3>Upcoming Events</h3>
            <div className="carclub-event-cards">
              {upcomingEvents.map((event, index) => (
                <div className="carclub-event-card" key={index}>
                  <div className="carclub-icon-container">{event.icon}</div>
                  <h4>{event.title}</h4>
                  <p className="carclub-event-date">{event.date}</p>
                  <p className="carclub-event-description">{event.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Companies We've Worked With */}
          <section className="carclub-companies-worked-with">
            <h3>Our Partners</h3>
            <div className="carclub-company-logos">
              <img src="/assets/company1-logo.png" alt="Company 1" />
              <img src="/assets/company2-logo.png" alt="Company 2" />
              <img src="/assets/company3-logo.png" alt="Company 3" />
            </div>
          </section>

          {/* Location-Based Event Information */}
          <section className="carclub-event-locations">
            <h3>Where Our Events Happen</h3>
            <div className="carclub-location-cards">
              {eventLocations.map((location, index) => (
                <div className="carclub-location-card" key={index}>
                  <div className="carclub-icon-container">{location.icon}</div>
                  <h4>{location.location}</h4>
                  <p className="carclub-location-description">{location.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Sign-Up Form for the Club */}
          <section className="carclub-signup-form">
            <h3>Join the B8 Car Club</h3>
            {!currentUser ? (
              renderLoginPrompt()
            ) : (
              <form onSubmit={handleSubmit}>
                <input 
                  type="text" 
                  name="name" 
                  placeholder="Your Name" 
                  value={formData.name} 
                  onChange={handleInputChange} 
                  required 
                />
                <input 
                  type="email" 
                  name="email" 
                  placeholder="Your Email" 
                  value={formData.email} 
                  onChange={handleInputChange} 
                  required 
                  disabled 
                />
                <input 
                  type="tel" 
                  name="phone" 
                  placeholder="Phone Number" 
                  value={formData.phone} 
                  onChange={handleInputChange} 
                  required 
                />
                <input 
                  type="text" 
                  name="carMakeModel" 
                  placeholder="Car Make and Model (N/A if none)" 
                  value={formData.carMakeModel} 
                  onChange={handleInputChange} 
                  required 
                />
                <input 
                  type="text" 
                  name="numberPlate" 
                  placeholder="Number Plate" 
                  value={formData.numberPlate} 
                  onChange={handleInputChange} 
                  required 
                />
                <input 
                  type="text" 
                  name="instagramHandle" 
                  placeholder="Instagram Handle" 
                  value={formData.instagramHandle} 
                  onChange={handleInputChange} 
                  required 
                />
                <button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting...' : 'Sign Up Now'}
                </button>
              </form>
            )}
          </section>

          {/* Standard Social Channels */}
          <SocialChannels className="carclub-standard-social-channels" />

          <Footer />
        </div>
      </ComingSoonOverlay>
    </PasswordProtectedPage>
  );
}
