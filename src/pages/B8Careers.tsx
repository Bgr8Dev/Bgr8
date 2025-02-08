import { useEffect, useState, FormEvent, ChangeEvent } from 'react';
import Navbar from '../components/Navbar';
import HamburgerMenu from '../components/HamburgerMenu';
import Footer from '../components/Footer';
import '../styles/B8Careers.css';

interface CvFormData {
  name: string;
  email: string;
  phone: string;
  linkedIn: string;
  industry: string;
  professionalWeb: string;
  otherLinks: string;
  cv: File | null;
}

export default function B8Careers() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [cvDatabase, setCvDatabase] = useState<CvFormData[]>([]); // Correct typing
  const [cvForm, setCvForm] = useState<CvFormData>({
    name: '',
    email: '',
    phone: '',
    linkedIn: '',
    industry: '',
    professionalWeb: '',
    otherLinks: '',
    cv: null,
  });

  const handleCvSubmit = (e: FormEvent<HTMLFormElement>) => {
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

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCvForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setCvForm((prev) => ({ ...prev, cv: files[0] }));
    }
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

      {/* CV Submission Form */}
      <section className="cv-submission-section">
        <h3>Submit Your CV</h3>
        <form onSubmit={handleCvSubmit}>
          <input
            name="name"
            type="text"
            placeholder="Name"
            value={cvForm.name}
            onChange={handleInputChange}
            required
          />
          <input
            name="email"
            type="email"
            placeholder="Email"
            value={cvForm.email}
            onChange={handleInputChange}
            required
          />
          <input
            name="phone"
            type="tel"
            placeholder="Phone"
            value={cvForm.phone}
            onChange={handleInputChange}
            required
          />
          <input
            name="linkedIn"
            type="url"
            placeholder="LinkedIn Profile"
            value={cvForm.linkedIn}
            onChange={handleInputChange}
            required
          />
          <input
            name="industry"
            type="text"
            placeholder="Industry"
            value={cvForm.industry}
            onChange={handleInputChange}
            required
          />
          <input
            name="professionalWeb"
            type="url"
            placeholder="Professional Website"
            value={cvForm.professionalWeb}
            onChange={handleInputChange}
          />
          <input
            name="otherLinks"
            type="url"
            placeholder="Other Links"
            value={cvForm.otherLinks}
            onChange={handleInputChange}
          />
          <label>
            Upload CV:
            <input
              type="file"
              onChange={handleFileChange}
              required
            />
          </label>
          <button type="submit">Submit CV</button>
        </form>
      </section>

      {/* CV Database */}
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
              <p>LinkedIn: <a href={cv.linkedIn}>{cv.linkedIn}</a></p>
              <p>Industry: {cv.industry}</p>
              <p>Professional Website: <a href={cv.professionalWeb}>{cv.professionalWeb}</a></p>
              <p>Other Links: <a href={cv.otherLinks}>{cv.otherLinks}</a></p>
            </div>
          ))
        )}
      </section>

      <Footer />
    </div>
  );
}
