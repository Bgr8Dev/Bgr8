/**
 * VisibilityWrapper Usage Examples
 * 
 * This file demonstrates how to use the VisibilityWrapper component
 * to control section visibility based on admin settings.
 */

import React from 'react';
import VisibilityWrapper from '../components/ui/VisibilityWrapper';

/**
 * Example 1: Basic usage - Hide section completely
 * When hidden, the section won't be rendered at all
 */
export const BasicExample = () => {
  return (
    <VisibilityWrapper sectionId="analytics">
      <div className="analytics-section">
        <h2>Analytics Dashboard</h2>
        <p>Your analytics content here...</p>
      </div>
    </VisibilityWrapper>
  );
};

/**
 * Example 2: Show placeholder when hidden
 * Instead of hiding completely, show a message
 */
export const PlaceholderExample = () => {
  return (
    <VisibilityWrapper 
      sectionId="instagram-feed" 
      showPlaceholder={true}
      placeholderMessage="Instagram integration is temporarily unavailable."
    >
      <div className="instagram-feed">
        <h2>Instagram Feed</h2>
        {/* Instagram content */}
      </div>
    </VisibilityWrapper>
  );
};

/**
 * Example 3: Wrap admin portal sections
 * Control visibility of entire admin sections
 */
export const AdminSectionExample = () => {
  return (
    <VisibilityWrapper sectionId="verification">
      <div className="verification-section">
        <h2>Mentor Verification</h2>
        {/* Verification controls */}
      </div>
    </VisibilityWrapper>
  );
};

/**
 * Example 4: Multiple sections with different IDs
 */
export const MultipleSectionsExample = () => {
  return (
    <div className="admin-dashboard">
      <VisibilityWrapper sectionId="analytics">
        <div className="analytics-widget">Analytics</div>
      </VisibilityWrapper>
      
      <VisibilityWrapper sectionId="emails">
        <div className="email-widget">Email Management</div>
      </VisibilityWrapper>
      
      <VisibilityWrapper sectionId="users">
        <div className="users-widget">User Management</div>
      </VisibilityWrapper>
    </div>
  );
};

/**
 * Example 5: Wrap home page features
 */
export const HomeFeatureExample = () => {
  return (
    <>
      <VisibilityWrapper sectionId="hero-section">
        <section className="hero">
          <h1>Welcome to Bgr8</h1>
        </section>
      </VisibilityWrapper>
      
      <VisibilityWrapper sectionId="testimonials">
        <section className="testimonials">
          {/* Testimonials content */}
        </section>
      </VisibilityWrapper>
      
      <VisibilityWrapper sectionId="donation-form">
        <section className="donation">
          {/* Donation form */}
        </section>
      </VisibilityWrapper>
    </>
  );
};

/**
 * Example 6: Wrap mentor area features
 */
export const MentorAreaExample = () => {
  return (
    <div className="mentor-dashboard">
      <VisibilityWrapper sectionId="mentor-dashboard">
        <div className="dashboard-overview">
          {/* Dashboard content */}
        </div>
      </VisibilityWrapper>
      
      <VisibilityWrapper sectionId="session-scheduler">
        <div className="scheduler">
          {/* Scheduler content */}
        </div>
      </VisibilityWrapper>
      
      <VisibilityWrapper sectionId="calcom-integration">
        <div className="calendar-integration">
          {/* Cal.com integration */}
        </div>
      </VisibilityWrapper>
    </div>
  );
};

/**
 * Section IDs Reference:
 * 
 * ADMIN PAGES:
 * - 'analytics'
 * - 'emails'
 * - 'instagram'
 * - 'announcements'
 * - 'enquiries'
 * - 'verification'
 * - 'testing-feedback'
 * - 'settings'
 * - 'users'
 * - 'mentors'
 * - 'feedback'
 * - 'sessions'
 * - 'ambassadors'
 * - 'banner-test'
 * 
 * HOME FEATURES:
 * - 'hero-section'
 * - 'donation-form'
 * - 'instagram-feed'
 * - 'testimonials'
 * - 'features-grid'
 * - 'newsletter-signup'
 * - 'cta-buttons'
 * - 'footer'
 * - 'announcements'
 * 
 * MENTOR AREA:
 * - 'mentor-dashboard'
 * - 'profile-editor'
 * - 'session-scheduler'
 * - 'mentee-list'
 * - 'resources-library'
 * - 'video-calls'
 * - 'feedback-forms'
 * - 'progress-tracking'
 * - 'messaging'
 * - 'session-booking'
 * - 'calcom-integration'
 * - 'settings'
 * - 'help-support'
 * - 'achievements'
 * 
 * IMPORTANT NOTES:
 * 
 * 1. Developers always see all sections regardless of visibility settings
 * 2. Non-developers only see sections that are NOT in the hiddenSections array
 * 3. Use showPlaceholder={true} for a better UX when hiding sections temporarily
 * 4. The component will not flicker on load - it shows content while loading
 * 5. Visibility settings are synced with Firebase in real-time
 */

export default {
  BasicExample,
  PlaceholderExample,
  AdminSectionExample,
  MultipleSectionsExample,
  HomeFeatureExample,
  MentorAreaExample
};

