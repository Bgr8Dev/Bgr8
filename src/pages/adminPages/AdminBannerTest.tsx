import React from 'react';
import BannerWrapper from '../../components/ui/BannerWrapper';
import InDevelopmentBanner from '../../components/ui/InDevelopmentBanner';
import ComingSoonBanner from '../../components/ui/ComingSoonBanner';
import '../../styles/adminStyles/AdminBannerTest.css';

const AdminBannerTest: React.FC = () => {
  return (
    <BannerWrapper sectionId="banner-test" className="admin-banner-test">
      <div className="banner-test-container">
        <h1>Banner Test Page</h1>
        <p>This page demonstrates the banner functionality. Configure banners in Admin Settings {'>'} Banner Management.</p>
        
        <div className="banner-examples">
          <h2>Banner Examples</h2>
          
          <div className="example-section">
            <h3>In Development Banner</h3>
            <InDevelopmentBanner 
              message="This is an example of the In Development banner with custom message."
              showIcon={true}
            />
          </div>
          
          <div className="example-section">
            <h3>Coming Soon Banner</h3>
            <ComingSoonBanner 
              message="This is an example of the Coming Soon banner with custom message."
              showIcon={true}
            />
          </div>
          
          <div className="example-section">
            <h3>Compact Banners</h3>
            <InDevelopmentBanner 
              message="Compact development banner"
              showIcon={true}
              className="compact"
            />
            <ComingSoonBanner 
              message="Compact coming soon banner"
              showIcon={true}
              className="compact"
            />
          </div>
        </div>
        
        <div className="instructions">
          <h3>How to Use</h3>
          <ol>
            <li>Go to Admin Settings {'>'} Banner Management</li>
            <li>Enable the banners you want to show</li>
            <li>Add page paths where banners should appear (e.g., &quot;/admin/banner-test&quot;, &quot;*&quot; for all pages)</li>
            <li>Customize the banner messages and settings</li>
            <li>Save your changes</li>
          </ol>
        </div>
      </div>
    </BannerWrapper>
  );
};

export default AdminBannerTest;
