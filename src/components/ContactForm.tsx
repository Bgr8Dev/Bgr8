import { useState, FormEvent } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { FaUser, FaEnvelope, FaPhone, FaCommentAlt, FaPaperPlane, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import '../styles/ContactForm.css';

interface ContactFormProps {
  source?: string; // To track which page the enquiry came from
}

export default function ContactForm({ source = 'general' }: ContactFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');

    try {
      await addDoc(collection(db, 'enquiries'), {
        ...formData,
        source,
        dateSubmitted: serverTimestamp(),
        status: 'pending'
      });

      setSubmitSuccess(true);
      setFormData({
        name: '',
        email: '',
        phone: '',
        message: '',
      });

      // Reset success message after 5 seconds
      setTimeout(() => setSubmitSuccess(false), 5000);
    } catch (error) {
      console.error('Error submitting enquiry:', error);
      setSubmitError('Failed to submit enquiry. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleFocus = (field: string) => {
    setFocusedField(field);
  };
  
  const handleBlur = () => {
    setFocusedField(null);
  };

  return (
    <section className="contactForm-section">
      <h3>Get In Touch</h3>
      <p>We'd love to hear from you! Fill out the form below and we'll get back to you as soon as possible.</p>

      <form onSubmit={handleSubmit} className="contactForm-form">
        <div className={`contactForm-form-group ${focusedField === 'name' ? 'focused' : ''}`}>
          <label htmlFor="name">
            <FaUser className="form-icon" /> Full Name
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            placeholder="Your Name"
            onFocus={() => handleFocus('name')}
            onBlur={handleBlur}
          />
        </div>

        <div className={`contactForm-form-group ${focusedField === 'email' ? 'focused' : ''}`}>
          <label htmlFor="email">
            <FaEnvelope className="form-icon" /> Email Address
          </label>
          <input
            type="email"
            id="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            placeholder="Your Email"
            onFocus={() => handleFocus('email')}
            onBlur={handleBlur}
          />
        </div>

        <div className={`contactForm-form-group ${focusedField === 'phone' ? 'focused' : ''}`}>
          <label htmlFor="phone">
            <FaPhone className="form-icon" /> Phone Number (Optional)
          </label>
          <input
            type="tel"
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="Your Phone Number"
            onFocus={() => handleFocus('phone')}
            onBlur={handleBlur}
          />
        </div>

        <div className={`contactForm-form-group ${focusedField === 'message' ? 'focused' : ''}`}>
          <label htmlFor="message">
            <FaCommentAlt className="form-icon" /> Your Message
          </label>
          <textarea
            id="message"
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            required
            placeholder="Tell us what's on your mind..."
            rows={4}
            onFocus={() => handleFocus('message')}
            onBlur={handleBlur}
          />
        </div>

        <button 
          type="submit" 
          disabled={isSubmitting}
          className={isSubmitting ? 'submitting' : ''}
        >
          {isSubmitting ? (
            <>
              <span className="loading-spinner"></span>
              Sending...
            </>
          ) : (
            <>
              <FaPaperPlane className="send-icon" /> Send Message
            </>
          )}
        </button>

        {submitSuccess && (
          <div className="contactForm-success-message">
            <FaCheckCircle className="status-icon" />
            Thank you for your message! We'll get back to you soon.
          </div>
        )}

        {submitError && (
          <div className="contactForm-error-message">
            <FaExclamationTriangle className="status-icon" />
            {submitError}
          </div>
        )}
      </form>
    </section>
  );
} 