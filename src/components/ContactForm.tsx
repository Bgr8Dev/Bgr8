import { useState, FormEvent } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
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

  return (
    <section className="contact-section">
      <h3>Contact Us</h3>
      <p>Have a question? We'd love to hear from you.</p>

      <form onSubmit={handleSubmit} className="contact-form">
        <div className="form-group">
          <label htmlFor="name">Name</label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            placeholder="Your Name"
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            placeholder="Your Email"
          />
        </div>

        <div className="form-group">
          <label htmlFor="phone">Phone (Optional)</label>
          <input
            type="tel"
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="Your Phone Number"
          />
        </div>

        <div className="form-group">
          <label htmlFor="message">Message</label>
          <textarea
            id="message"
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            required
            placeholder="Your Message"
            rows={4}
          />
        </div>

        <button 
          type="submit" 
          disabled={isSubmitting}
          className={isSubmitting ? 'submitting' : ''}
        >
          {isSubmitting ? 'Sending...' : 'Send Message'}
        </button>

        {submitSuccess && (
          <div className="success-message">
            Thank you for your message! We'll get back to you soon.
          </div>
        )}

        {submitError && (
          <div className="error-message">
            {submitError}
          </div>
        )}
      </form>
    </section>
  );
} 