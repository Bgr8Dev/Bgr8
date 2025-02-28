import { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import HamburgerMenu from '../../components/HamburgerMenu';
import Footer from '../../components/Footer';
import { FaLinkedin, FaInstagram, FaYoutube, FaTwitter } from 'react-icons/fa';
import '../../styles/businessStyles/B8Education.css';
import ContactForm from '../../components/ContactForm';
import { ComingSoonOverlay } from '../../components/ComingSoonOverlay';

export default function B8Education() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [userType, setUserType] = useState<'student' | 'teacher' | ''>('');

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <ComingSoonOverlay businessId="education">
      <div className="page">
        {isMobile ? <HamburgerMenu /> : <Navbar />}

        {/* Updated Hero Video Section */}
        <section className="hero-video">
          <div className="video-container">
            <iframe
              width="100%"
              height="100%"
              src="https://www.youtube.com/embed/SwCf8B07_s8"
              title="B8 Education Video"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        </section>

        {/* Intro Section */}
        <section className="intro-section">
          <h2>About B8 Education</h2>
          <p>
            B8 Education is dedicated to fostering learning and growth through innovative programs, resources, and support for students and educators alike.
          </p>
        </section>

        {/* Existing Hero Section */}
        <section className="hero">
          <h1>B8 Education</h1>
          <p>Empowering the future through innovative education programs and resources.</p>
        </section>

        {/* Existing Gallery Section */}
        <section className="gallery">
          <img src="/assets/education1.jpg" alt="Education Program 1" />
          <img src="/assets/education2.jpg" alt="Education Program 2" />
          <img src="/assets/education3.jpg" alt="Education Program 3" />
        </section>

        {/* Donations Section */}
        <section className="donation-section">
          <h3>Support B8 Education</h3>
          <form>
            <input type="number" placeholder="Donation Amount ($)" required />
            <button type="submit">Donate Now</button>
          </form>
        </section>

        {/* Google Maps Section */}
        <section className="map-section">
          <h3>Our Global Impact</h3>
          <iframe
            title="B8 Education Map"
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

        {/* Existing Contact Section */}
        <section className="contact-section">
          <ContactForm source="education" />
          <div className="social-media">
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer"><FaLinkedin /></a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer"><FaInstagram /></a>
            <a href="https://youtube.com" target="_blank" rel="noopener noreferrer"><FaYoutube /></a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer"><FaTwitter /></a>
          </div>
        </section>

        <Footer />
      </div>
    </ComingSoonOverlay>
  );
}
