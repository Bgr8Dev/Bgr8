import React from 'react';
import BannerWrapper from '../../components/ui/BannerWrapper';
import '../../styles/adminStyles/AdminAnalytics.css';

const AdminAnalytics: React.FC = () => {
  return (
    <BannerWrapper sectionId="analytics" className="admin-analytics">
      <div className="analytics-placeholder">
        <h1>Analytics Dashboard</h1>
        <h2>In Development 🚧</h2>
        <p>
          This page is under construction.<br />
          Please check back soon for advanced analytics and insights!
        </p>
      </div>
    </BannerWrapper>
  );
};

export default AdminAnalytics; 