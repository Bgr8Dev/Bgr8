import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTimes, FaInfoCircle } from 'react-icons/fa';
import '../../styles/Overlay.css';

export default function Settings() {
  const navigate = useNavigate();

  return (
    <div className="overlay">
      <div className="overlay-content">
        <button className="close-button" onClick={() => navigate(-1)} aria-label="Close settings">
          <FaTimes />
        </button>

        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <FaInfoCircle style={{ fontSize: '4rem', color: '#ffb300', marginBottom: '1rem' }} />
          <h2>Settings</h2>
          <p style={{ fontSize: '1.1rem', color: '#666', marginBottom: '2rem' }}>
            User profile settings have been simplified to focus on essential information only.
          </p>
          
          <div style={{ background: '#f5f5f5', padding: '1.5rem', borderRadius: '8px', textAlign: 'left' }}>
            <h3 style={{ color: '#333', marginBottom: '1rem' }}>Current Profile Structure:</h3>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li style={{ marginBottom: '0.5rem' }}>✓ Basic Information (Name, Email, etc.)</li>
              <li style={{ marginBottom: '0.5rem' }}>✓ Demographic Information</li>
              <li style={{ marginBottom: '0.5rem' }}>✓ Location & Social Media</li>
              <li style={{ marginBottom: '0.5rem' }}>✓ Education & Career</li>
              <li style={{ marginBottom: '0.5rem' }}>✓ Car Club Information</li>
              <li style={{ marginBottom: '0.5rem' }}>✓ Activity Tracking</li>
            </ul>
          </div>
          
          <p style={{ fontSize: '0.9rem', color: '#888', marginTop: '2rem' }}>
            Unnecessary fields like preferences, bgr8 memberships, and privacy settings have been removed to streamline the user experience.
          </p>
        </div>
      </div>
    </div>
  );
} 