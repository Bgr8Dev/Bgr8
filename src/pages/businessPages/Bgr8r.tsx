import { useEffect, useState } from 'react';
import Navbar from '../../components/ui/Navbar';
import HamburgerMenu from '../../components/ui/HamburgerMenu';
import Footer from '../../components/ui/Footer';
import '../../styles/businessStyles/Bgr8r.css';
import { ComingSoonOverlay } from '../../components/overlays/ComingSoonOverlay';
import SocialChannels from '../../components/ui/SocialChannels';
import { PasswordProtectedPage } from '../../components/overlays/PasswordProtectedPage';

export default function Bgr8r() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [userType, setUserType] = useState<'student' | 'teacher' | ''>('');

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <PasswordProtectedPage businessId="bgr8r">
      <ComingSoonOverlay businessId="bgr8r">
        <div className="bgr8r-page">
          {isMobile ? <HamburgerMenu /> : <Navbar />}

          {/* Existing Hero Section */}
          <section className="bgr8r-hero">
            <h1>Bgr8r</h1>
            <p>Empowering the future through innovative education programs and resources.</p>
          </section>

          {/* Updated Hero Video Section */}
          <section className="hero-video">
            <div className="video-container">
              <iframe
                width="100%"
                height="100%"
                src="https://www.youtube.com/embed/SwCf8B07_s8"
                title="Bgr8r Video"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </section>

          {/* Intro Section */}
          <section className="intro-section">
            <h2>About Bgr8r</h2>
            <p>
              Bgr8r is dedicated to fostering learning and growth through innovative programs, resources, and support for students and educators alike.
            </p>
          </section>


          {/* Existing Gallery Section */}
          <section className="gallery">
            <img src="/assets/bgr8r1.jpg" alt="Bgr8r Program 1" />
            <img src="/assets/bgr8r2.jpg" alt="Bgr8r Program 2" />
            <img src="/assets/bgr8r3.jpg" alt="Bgr8r Program 3" />
          </section>

          {/* Donations Section */}
          <section className="donation-section">
            <h3>Support Bgr8r</h3>
            <form>
              <input type="number" placeholder="Donation Amount ($)" required />
              <button type="submit">Donate Now</button>
            </form>
          </section>

          {/* Google Maps Section */}
          <section className="map-section">
            <h3>Our Global Impact</h3>
            <iframe
              title="Bgr8r Map"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2488.8901724724397!2d-0.19435492299797727!3d51.37012597178726!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4876075d1e973c37%3A0x9a6c0c5ef5e0a1d0!2s62%20Oakhill%20Rd%2C%20Sutton%20SM1%203AG%2C%20UK!5e0!3m2!1sen!2s!4v1709835851871!5m2!1sen!2s"
              width="100%"
              height="300"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
            ></iframe>
          </section>

          {/* User Type Selection */}
          <section className="user-selection">
            <h3>Are You a Student or Teacher?</h3>
            <button onClick={() => setUserType('student')}>I'm a Student</button>
            <button onClick={() => setUserType('teacher')}>I'm a Teacher</button>
          </section>

          {/* Student Sign-Up Form */}
          {userType === 'student' && (
            <section className="signup-form">
              <h3>Student Sign-Up</h3>
              <form>
                <input type="text" placeholder="Name" required />
                <input type="email" placeholder="Email" required />
                <input type="tel" placeholder="Phone Number" required />
                <input type="text" placeholder="School" required />
                <label>
                  Household Income Under 20k?
                  <select required>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </label>
                <label>
                  Gender
                  <select required>
                    <option value="boy">Boy</option>
                    <option value="girl">Girl</option>
                  </select>
                </label>
                <button type="submit">Sign Up</button>
              </form>
            </section>
          )}

          {/* Teacher Sign-Up Form */}
          {userType === 'teacher' && (
            <section className="signup-form">
              <h3>Teacher Sign-Up</h3>
              <form>
                <input type="text" placeholder="Name" required />
                <input type="email" placeholder="Email" required />
                <input type="tel" placeholder="Phone Number" required />
                <input type="url" placeholder="LinkedIn Profile" required />
                <label>
                  Upload CV:
                  <input type="file" required />
                </label>
                <button type="submit">Sign Up</button>
              </form>
            </section>
          )}

          {/* Social Channels */}
          <SocialChannels className="bgr8r-social-channels" />

          <Footer />
        </div>
      </ComingSoonOverlay>
    </PasswordProtectedPage>
  );
} 