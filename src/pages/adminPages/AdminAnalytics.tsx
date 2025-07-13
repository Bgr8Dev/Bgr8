import React from 'react';
import '../../styles/adminStyles/AdminAnalytics.css';

const AdminAnalytics: React.FC = () => {
  return (
    <div className="admin-analytics" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{
        background: 'rgba(33, 150, 243, 0.15)',
        border: '2px dashed #2196F3',
        borderRadius: '12px',
        padding: '48px 32px',
        textAlign: 'center',
        maxWidth: '600px',
        boxShadow: '0 4px 24px rgba(33,150,243,0.08)'
      }}>
        <h1 style={{ fontSize: '2.5rem', color: '#2196F3', marginBottom: '1rem' }}>Analytics Dashboard</h1>
        <h2 style={{ fontSize: '2rem', color: '#FFCA28', marginBottom: '1.5rem' }}>In Development 🚧</h2>
        <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '1.2rem' }}>
          This page is under construction.<br />
          Please check back soon for advanced analytics and insights!
        </p>
      </div>
    </div>
  );
};

export default AdminAnalytics; 