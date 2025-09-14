import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/LandingPage.css';

const LandingPage: React.FC = () => {
  return (
    <div className="landing-split-container">
      <Link to="/bgr8" className="landing-card">
        <div className="landing-logo">{/* Bgr8 Logo Placeholder */}</div>
        <h2 className="landing-title">Bgr8</h2>
        <p className="landing-description">Bgr8 is your hub for community growth, mentorship, and personal development. Join us to shape tomorrow.</p>
      </Link>
      <Link to="/bgr8" className="landing-card">
        <div className="landing-logo">{/* Bgr8 Logo Placeholder */}</div>
        <h2 className="landing-title">Bgr8</h2>
        <p className="landing-description">Bgr8 is your hub for community growth, mentorship, and personal development. Join us to shape tomorrow.</p>
      </Link>
    </div>
  );
};

export default LandingPage;
