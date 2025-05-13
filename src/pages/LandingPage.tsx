import React from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';

const LandingPage: React.FC = () => {
  return (
    <div className="landing-split-container">
      <Link to="/b8network" className="landing-card">
        <div className="landing-logo">{/* B8Network Logo Placeholder */}</div>
        <h2 className="landing-title">B8Network</h2>
        <p className="landing-description">The B8 Network connects businesses, people, and ideas for a brighter future. Discover our ecosystem.</p>
      </Link>
      <Link to="/innov8" className="landing-card">
        <div className="landing-logo">{/* Innov8 Logo Placeholder */}</div>
        <h2 className="landing-title">Innov8</h2>
        <p className="landing-description">Innov8 is your hub for innovation, creativity, and entrepreneurship. Join us to shape tomorrow.</p>
      </Link>
    </div>
  );
};

export default LandingPage;
