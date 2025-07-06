import React from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';

const LandingPage: React.FC = () => {
  return (
    <div className="landing-split-container">
      <Link to="/b8network" className="landing-card">
        <div className="landing-logo">{/* Bgr8Network Logo Placeholder */}</div>
        <h2 className="landing-title">Bgr8Network</h2>
        <p className="landing-description">The Bgr8 Network connects communities and individuals for growth and collaboration. Discover our ecosystem.</p>
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
