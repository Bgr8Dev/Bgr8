import React from 'react';
import '../../styles/BGr8Medical.css';

export default function BGr8Medical({ onClose }: { onClose: () => void }) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission logic here
    console.log('Form submitted');
  };

  return (
    <div className="medical-overlay" onClick={onClose}>
      <div className="medical-content" onClick={e => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>&times;</button>
        
        <h2>BGr8 Medical Registration</h2>
        <p>Join our medical community and make a difference in healthcare</p>
        
        <form onSubmit={handleSubmit} className="medical-form">
          <div className="form-group">
            <input type="text" placeholder="Full Name" required />
          </div>
          
          <div className="form-group">
            <input type="email" placeholder="Email Address" required />
          </div>
          
          <div className="form-group">
            <input type="tel" placeholder="Phone Number" required />
          </div>
          
          <div className="form-group">
            <select required>
              <option value="">Select Medical Profession</option>
              <option value="doctor">Doctor</option>
              <option value="nurse">Nurse</option>
              <option value="paramedic">Paramedic</option>
              <option value="pharmacist">Pharmacist</option>
              <option value="other">Other Healthcare Professional</option>
            </select>
          </div>
          
          <div className="form-group">
            <input type="text" placeholder="Medical License Number (Optional)" />
          </div>
          
          <div className="form-group">
            <input type="text" placeholder="Hospital/Clinic Affiliation (Optional)" />
          </div>
          
          <div className="form-group">
            <textarea placeholder="Why would you like to join BGr8 Medical?" rows={4} required></textarea>
          </div>
          
          <button type="submit" className="submit-button">Submit Application</button>
        </form>
      </div>
    </div>
  );
} 