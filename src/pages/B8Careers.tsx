import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import HamburgerMenu from '../components/HamburgerMenu';
import Footer from '../components/Footer';
import { FaLinkedin, FaInstagram, FaYoutube, FaTwitter } from 'react-icons/fa';
import '../styles/B8Careers.css';

export default function B8Careers() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [cvDatabase, setCvDatabase] = useState([]);
  const [cvForm, setCvForm] = useState({
    name: '',
    email: '',
    phone: '',
    linkedIn: '',
    industry: '',
    professionalWeb: '',
    otherLinks: '',
    cv: null,
  });

  const handleCvSubmit = (e) => {
    e.preventDefault();
    setCvDatabase([...cvDatabase, cvForm]);
    setCvForm({
      name: '',
      email: '',
      phone: '',
      linkedIn: '',
      industry: '',
      professionalWeb: '',
      otherLinks: '',
      cv: null,
    });
  };

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="page">
      {isMobile ? <HamburgerMenu /> : <Navbar />}

      {/* About Section */}
      <section className="about-section">
        <h2>About B8 Careers</h2>
        <p>
          B8 Careers is dedicated to connecting talented individuals with dynamic opportunities in various industries.
          We believe in fostering growth, innovation, and collaboration.
        </p>
      </section>

      {/* List of Industries */}
      <section className="industries-section">
        <h3>Industries We Work With</h3>
        <ul>
          <li>Technology</li>
          <li>Marketing & Advertising</li>
          <li>Education</li>
          <li>Finance</li>
          <li>Healthcare</li>
        </ul>
      </section>

      {/* B8 Education Section with Teacher Sign-Up Form */}
      <section className="education-section">
        <h3>B8 Education - Teacher Sign-Up</h3>
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

      {/* CV Database Submission Form */}
      <section className="cv-submission-section">
        <h3>Submit Your CV</h3>
        <form onSubmit={handleCvSubmit}>
          <input
            type="text"
            placeholder="Name"
            value={cvForm.name}
            onChange={(e) => setCvForm({ ...cvForm, name: e.target.value })}
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={cvForm.email}
            onChange={(e) => setCvForm({ ...cvForm, email: e.target.value })}
            required
          />
          <input
            type="tel"
            placeholder="Phone"
            value={cvForm.phone}
            onChange={(e) => setCvForm({ ...cvForm, phone: e.target.value })}
            required
          />
          <input
            type="url"
            placeholder="LinkedIn Profile"
            value={cvForm.linkedIn}
            onChange={(e) => setCvForm({ ...cvForm, linkedIn: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="Industry"
            value={cvForm.industry}
            onChange={(e) => setCvForm({ ...cvForm, industry: e.target.value })}
            required
          />
          <input
            type="url"
            placeholder="Professional Website"
            value={cvForm.professionalWeb}
            onChange={(e) => setCvForm({ ...cvForm, professionalWeb: e.target.value })}
          />
          <input
            type="url"
            placeholder="Other Links"
            value={cvForm.otherLinks}
            onChange={(e) => setCvForm({ ...cvForm, otherLinks: e.target.value })}
          />
          <label>
            Upload CV:
            <input
              type="file"
              onChange={(e) => setCvForm({ ...cvForm, cv: e.target.files[0] })}
              required
            />
          </label>
          <button type="submit">Submit CV</button>
        </form>
      </section>

      {/* CV Database - Profile List */}
      <section className="cv-database-section">
        <h3>CV Database</h3>
        {cvDatabase.length === 0 ? (
          <p>No CVs submitted yet.</p>
        ) : (
          cvDatabase.map((cv, index) => (
            <div key={index} className="cv-profile">
              <h4>{cv.name}</h4>
              <p>Email: {cv.email}</p>
              <p>Phone: {cv.phone}</p>
              <p>LinkedIn: <a href={cv.linkedIn} target="_blank" rel="noopener noreferrer">{cv.linkedIn}</a></p>
              <p>Industry: {cv.industry}</p>
              <p>Professional Website: <a href={cv.professionalWeb} target="_blank" rel="noopener noreferrer">{cv.professionalWeb}</a></p>
              <p>Other Links: <a href={cv.otherLinks} target="_blank" rel="noopener noreferrer">{cv.otherLinks}</a></p>
            </div>
          ))
        )}
      </section>

      <Footer />
    </div>
  );
}
