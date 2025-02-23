import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import '../../styles/businessStyles/BGr8Medical.css';

export default function BGr8Medical({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    profession: '',
    licenseNumber: '',
    affiliation: '',
    reason: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');

    try {
      // Save to medical registrations collection
      await addDoc(collection(db, 'Bgr8Medical'), {
        ...formData,
        status: 'pending',
        dateSubmitted: serverTimestamp()
      });

      setSubmitSuccess(true);
      // Reset form
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        profession: '',
        licenseNumber: '',
        affiliation: '',
        reason: ''
      });

      // Close modal after 2 seconds on success
      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (error) {
      console.error('Error submitting medical registration:', error);
      setSubmitError('Failed to submit registration. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="medical-overlay" onClick={onClose}>
      <div className="medical-content" onClick={e => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>&times;</button>
        
        <h2>BGr8 Medical Registration</h2>
        <p>Join our medical community and make a difference in healthcare</p>
        
        <form onSubmit={handleSubmit} className="medical-form">
          <div className="form-group">
            <input 
              type="text" 
              placeholder="Full Name" 
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              required 
            />
          </div>
          
          <div className="form-group">
            <input 
              type="email" 
              placeholder="Email Address" 
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required 
            />
          </div>
          
          <div className="form-group">
            <input 
              type="tel" 
              placeholder="Phone Number" 
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required 
            />
          </div>
          
          <div className="form-group">
            <select 
              value={formData.profession}
              onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
              required
            >
              <option value="">Select Medical Profession</option>
              <option value="doctor">Doctor</option>
              <option value="nurse">Nurse</option>
              <option value="paramedic">Paramedic</option>
              <option value="pharmacist">Pharmacist</option>
              <option value="other">Other Healthcare Professional</option>
            </select>
          </div>
          
          <div className="form-group">
            <input 
              type="text" 
              placeholder="Medical License Number (Optional)" 
              value={formData.licenseNumber}
              onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
            />
          </div>
          
          <div className="form-group">
            <input 
              type="text" 
              placeholder="Hospital/Clinic Affiliation (Optional)" 
              value={formData.affiliation}
              onChange={(e) => setFormData({ ...formData, affiliation: e.target.value })}
            />
          </div>
          
          <div className="form-group">
            <textarea 
              placeholder="Why would you like to join BGr8 Medical?" 
              rows={4} 
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              required
            ></textarea>
          </div>
          
          <button 
            type="submit" 
            className={`submit-button ${isSubmitting ? 'submitting' : ''}`}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Application'}
          </button>

          {submitSuccess && (
            <div className="success-message">
              Registration submitted successfully! We'll be in touch soon.
            </div>
          )}

          {submitError && (
            <div className="error-message">
              {submitError}
            </div>
          )}
        </form>
      </div>
    </div>
  );
} 