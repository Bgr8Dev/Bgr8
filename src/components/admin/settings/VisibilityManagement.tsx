import React, { useState } from 'react';
import { FaEye, FaEyeSlash, FaSave, FaCheck, FaChevronDown, FaChevronRight, FaCog, FaEnvelope, FaChartBar, FaInstagram, FaUsers, FaBell, FaSearch, FaFileAlt, FaUserCheck, FaCalendarAlt, FaHandshake, FaHome, FaGraduationCap, FaComments, FaBookOpen, FaVideo, FaCalendar, FaStar, FaEdit, FaThumbsUp, FaQuestionCircle, FaCalendarCheck } from 'react-icons/fa';
import { useBanner, VisibilitySettings } from '../../../contexts/BannerContext';
import './VisibilityManagement.css';

// Admin pages configuration - using activeSection identifiers
const ADMIN_PAGES = [
  { sectionId: 'analytics', name: 'Analytics', icon: <FaChartBar />, description: 'Data analytics and insights' },
  { sectionId: 'emails', name: 'Email Management', icon: <FaEnvelope />, description: 'Send and manage emails' },
  { sectionId: 'instagram', name: 'Instagram Feed', icon: <FaInstagram />, description: 'Manage homepage Instagram content' },
  { sectionId: 'announcements', name: 'Announcements', icon: <FaBell />, description: 'Create and manage site announcements' },
  { sectionId: 'enquiries', name: 'Enquiries', icon: <FaSearch />, description: 'View and manage user enquiries' },
  { sectionId: 'verification', name: 'Mentor Verification', icon: <FaUserCheck />, description: 'Verify mentor applications' },
  { sectionId: 'testing-feedback', name: 'Testing & Feedback', icon: <FaFileAlt />, description: 'Manage testing and user feedback' },
  { sectionId: 'settings', name: 'Settings', icon: <FaCog />, description: 'System settings and configuration' },
  { sectionId: 'users', name: 'Role Management', icon: <FaUsers />, description: 'Manage user roles and permissions' },
  { sectionId: 'mentors', name: 'Mentor Management', icon: <FaUsers />, description: 'Manage mentors and their profiles' },
  { sectionId: 'feedback', name: 'Feedback Analytics', icon: <FaFileAlt />, description: 'View feedback analytics and insights' },
  { sectionId: 'sessions', name: 'Sessions Management', icon: <FaCalendarAlt />, description: 'Manage mentoring sessions' },
  { sectionId: 'ambassadors', name: 'Ambassador Applications', icon: <FaHandshake />, description: 'Review ambassador applications' },
  { sectionId: 'banner-test', name: 'Banner Test', icon: <FaEye />, description: 'Test banner functionality' }
];

// Home page features configuration
const HOME_FEATURES = [
  { featureId: 'hero-section', name: 'Hero Section', icon: <FaHome />, description: 'Main landing area with call-to-action' },
  { featureId: 'donation-form', name: 'Donation Form', icon: <FaStar />, description: 'Donation widget and payment form' },
  { featureId: 'instagram-feed', name: 'Instagram Feed', icon: <FaInstagram />, description: 'Social media content display' },
  { featureId: 'testimonials', name: 'Testimonials', icon: <FaComments />, description: 'User testimonials and reviews' },
  { featureId: 'features-grid', name: 'Features Grid', icon: <FaStar />, description: 'Key features and benefits showcase' },
  { featureId: 'newsletter-signup', name: 'Newsletter Signup', icon: <FaEnvelope />, description: 'Email subscription form' },
  { featureId: 'cta-buttons', name: 'Call-to-Action Buttons', icon: <FaStar />, description: 'Primary action buttons' },
  { featureId: 'footer', name: 'Footer', icon: <FaHome />, description: 'Site footer with links' },
  { featureId: 'announcements', name: 'Announcements', icon: <FaBell />, description: 'Site-wide announcements' }
];

// Mentor Area features configuration
const MENTOR_AREA_FEATURES = [
  { featureId: 'mentor-dashboard', name: 'Mentor Dashboard', icon: <FaGraduationCap />, description: 'Main mentor control panel' },
  { featureId: 'mentee-dashboard', name: 'Mentee Dashboard', icon: <FaUsers />, description: 'Main mentee control panel' },
  { featureId: 'profile-editor', name: 'Profile Editor', icon: <FaEdit />, description: 'Edit mentor profile information' },
  { featureId: 'session-scheduler', name: 'Session Scheduler', icon: <FaCalendar />, description: 'Schedule mentoring sessions' },
  { featureId: 'mentee-list', name: 'Mentee List', icon: <FaUsers />, description: 'View assigned mentees' },
  { featureId: 'resources-library', name: 'Resources Library', icon: <FaBookOpen />, description: 'Educational materials and resources' },
  { featureId: 'video-calls', name: 'Video Calls', icon: <FaVideo />, description: 'Video conferencing interface' },
  { featureId: 'feedback-forms', name: 'Feedback Forms', icon: <FaThumbsUp />, description: 'Mentee feedback collection' },
  { featureId: 'progress-tracking', name: 'Progress Tracking', icon: <FaChartBar />, description: 'Track mentee progress' },
  { featureId: 'messaging', name: 'Messaging System', icon: <FaComments />, description: 'Direct communication with mentees' },
  { featureId: 'session-booking', name: 'Session Booking', icon: <FaCalendarAlt />, description: 'Book mentoring sessions' },
  { featureId: 'calcom-integration', name: 'Cal.com Integration', icon: <FaCalendarCheck />, description: 'Calendar integration for scheduling' },
  { featureId: 'settings', name: 'Mentor Settings', icon: <FaCog />, description: 'Personal mentor preferences' },
  { featureId: 'help-support', name: 'Help & Support', icon: <FaQuestionCircle />, description: 'Support and documentation' },
  { featureId: 'achievements', name: 'Achievements', icon: <FaStar />, description: 'Mentor achievements and badges' }
];

export const VisibilityManagement: React.FC = () => {
  const { visibilitySettings, updateVisibilitySettings, isLoading } = useBanner();
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [localSettings, setLocalSettings] = useState<VisibilitySettings>(visibilitySettings);
  const [expandedCategories, setExpandedCategories] = useState<{ [key: string]: boolean }>({
    admin: true,
    home: false,
    mentorArea: false
  });

  React.useEffect(() => {
    setLocalSettings(visibilitySettings);
  }, [visibilitySettings]);

  // Initialize local settings with defaults if visibilitySettings is empty
  React.useEffect(() => {
    if (!isLoading && !visibilitySettings.hiddenSections) {
      setLocalSettings({
        hiddenSections: []
      });
    }
  }, [visibilitySettings, isLoading]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setMessage(null);
      await updateVisibilitySettings(localSettings);
      setMessage({ type: 'success', text: 'Visibility settings saved successfully!' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to save visibility settings. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleSection = (sectionId: string) => {
    const isCurrentlyHidden = localSettings.hiddenSections.includes(sectionId);
    
    if (isCurrentlyHidden) {
      // Make visible (remove from hidden list)
      const newHiddenSections = localSettings.hiddenSections.filter(id => id !== sectionId);
      setLocalSettings({ hiddenSections: newHiddenSections });
    } else {
      // Make hidden (add to hidden list)
      setLocalSettings({ hiddenSections: [...localSettings.hiddenSections, sectionId] });
    }
  };

  const toggleAllSections = (category: 'admin' | 'home' | 'mentorArea', hide: boolean) => {
    let allSections: string[] = [];
    if (category === 'admin') {
      allSections = ADMIN_PAGES.map(page => page.sectionId);
    } else if (category === 'home') {
      allSections = HOME_FEATURES.map(feature => feature.featureId);
    } else if (category === 'mentorArea') {
      allSections = MENTOR_AREA_FEATURES.map(feature => feature.featureId);
    }
    
    if (hide) {
      // Add all sections from this category to hidden list
      const newHiddenSections = Array.from(new Set([...localSettings.hiddenSections, ...allSections]));
      setLocalSettings({ hiddenSections: newHiddenSections });
    } else {
      // Remove all sections from this category from hidden list
      const newHiddenSections = localSettings.hiddenSections.filter(section => !allSections.includes(section));
      setLocalSettings({ hiddenSections: newHiddenSections });
    }
  };

  const isSectionHidden = (sectionId: string) => {
    return localSettings.hiddenSections.includes(sectionId);
  };

  const areAllSectionsHidden = (category: 'admin' | 'home' | 'mentorArea') => {
    const hiddenSections = localSettings.hiddenSections;
    if (category === 'admin') {
      return ADMIN_PAGES.every(page => hiddenSections.includes(page.sectionId));
    } else if (category === 'home') {
      return HOME_FEATURES.every(feature => hiddenSections.includes(feature.featureId));
    } else if (category === 'mentorArea') {
      return MENTOR_AREA_FEATURES.every(feature => hiddenSections.includes(feature.featureId));
    }
    return false;
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const hasChanges = JSON.stringify(localSettings) !== JSON.stringify(visibilitySettings);

  if (isLoading) {
    return (
      <div className="visibility-management">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading visibility settings...</p>
        </div>
      </div>
    );
  }

  // Check if this is the first time setup
  const isFirstTimeSetup = !visibilitySettings.hiddenSections;

  return (
    <div className="visibility-management">
      <div className="visibility-header">
        <FaEye className="visibility-header-icon" />
        <h3>Visibility Management</h3>
        <p>Control which sections and features are visible to non-developer users</p>
        {isFirstTimeSetup && (
          <div className="first-time-setup-notice">
            <p><strong>Welcome!</strong> By default, all sections are visible. Toggle sections to hide them from non-developer users.</p>
          </div>
        )}
        <div className="developer-notice">
          <FaEye className="notice-icon" />
          <p><strong>Note:</strong> Developers can always see all sections regardless of these settings.</p>
        </div>
      </div>

      {message && (
        <div className={`visibility-message ${message.type}`}>
          <div className="message-icon">
            {message.type === 'success' ? <FaCheck /> : <FaEyeSlash />}
          </div>
          <span>{message.text}</span>
          <button 
            className="close-message"
            onClick={() => setMessage(null)}
          >
            ×
          </button>
        </div>
      )}

      <div className="visibility-sections">
        {/* Admin Pages Category */}
        <div className="visibility-category">
          <div 
            className="category-header"
            onClick={() => toggleCategory('admin')}
          >
            <div className="category-title">
              <FaCog className="category-icon" />
              <span>Admin Pages</span>
              <span className="visibility-count">
                {localSettings.hiddenSections.filter(section => 
                  ADMIN_PAGES.some(page => page.sectionId === section)
                ).length} hidden / {ADMIN_PAGES.length} total
              </span>
            </div>
            <div className="category-actions">
              <button
                className="toggle-all-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleAllSections('admin', !areAllSectionsHidden('admin'));
                }}
                title={areAllSectionsHidden('admin') ? 'Show all' : 'Hide all'}
              >
                {areAllSectionsHidden('admin') ? 'Show All' : 'Hide All'}
              </button>
              {expandedCategories.admin ? <FaChevronDown /> : <FaChevronRight />}
            </div>
          </div>
          
          {expandedCategories.admin && (
            <div className="sections-grid">
              {ADMIN_PAGES.map((page) => {
                const isHidden = isSectionHidden(page.sectionId);
                return (
                  <div key={page.sectionId} className={`section-toggle-item ${isHidden ? 'hidden' : ''}`}>
                    <div className="section-info">
                      <div className="section-icon">{page.icon}</div>
                      <div className="section-details">
                        <div className="section-name">{page.name}</div>
                        <div className="section-description">{page.description}</div>
                        <div className="section-path">{page.sectionId}</div>
                      </div>
                    </div>
                    <button
                      className={`visibility-toggle-btn ${isHidden ? 'hidden' : 'visible'}`}
                      onClick={() => toggleSection(page.sectionId)}
                      title={isHidden ? 'Click to show' : 'Click to hide'}
                    >
                      {isHidden ? <FaEyeSlash /> : <FaEye />}
                      {isHidden ? 'Hidden' : 'Visible'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Home Features */}
        <div className="visibility-category">
          <div 
            className="category-header"
            onClick={() => toggleCategory('home')}
          >
            <div className="category-info">
              <FaHome className="category-icon" />
              <div className="category-details">
                <div className="category-name">Home Features</div>
                <div className="category-description">Control visibility of homepage features</div>
                <span className="visibility-count">
                  {localSettings.hiddenSections.filter(section => 
                    HOME_FEATURES.some(feature => feature.featureId === section)
                  ).length} hidden / {HOME_FEATURES.length} total
                </span>
              </div>
            </div>
            <div className="category-actions">
              <button
                className="toggle-all-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleAllSections('home', !areAllSectionsHidden('home'));
                }}
                title={areAllSectionsHidden('home') ? 'Show all' : 'Hide all'}
              >
                {areAllSectionsHidden('home') ? 'Show All' : 'Hide All'}
              </button>
              {expandedCategories.home ? <FaChevronDown /> : <FaChevronRight />}
            </div>
          </div>
          
          {expandedCategories.home && (
            <div className="sections-grid">
              {HOME_FEATURES.map((feature) => {
                const isHidden = isSectionHidden(feature.featureId);
                return (
                  <div key={feature.featureId} className={`section-toggle-item ${isHidden ? 'hidden' : ''}`}>
                    <div className="section-info">
                      <div className="section-icon">{feature.icon}</div>
                      <div className="section-details">
                        <div className="section-name">{feature.name}</div>
                        <div className="section-description">{feature.description}</div>
                        <div className="section-path">{feature.featureId}</div>
                      </div>
                    </div>
                    <button
                      className={`visibility-toggle-btn ${isHidden ? 'hidden' : 'visible'}`}
                      onClick={() => toggleSection(feature.featureId)}
                      title={isHidden ? 'Click to show' : 'Click to hide'}
                    >
                      {isHidden ? <FaEyeSlash /> : <FaEye />}
                      {isHidden ? 'Hidden' : 'Visible'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Mentor Area Features */}
        <div className="visibility-category">
          <div 
            className="category-header"
            onClick={() => toggleCategory('mentorArea')}
          >
            <div className="category-info">
              <FaGraduationCap className="category-icon" />
              <div className="category-details">
                <div className="category-name">Mentor Area Features</div>
                <div className="category-description">Control visibility of mentor area features</div>
                <span className="visibility-count">
                  {localSettings.hiddenSections.filter(section => 
                    MENTOR_AREA_FEATURES.some(feature => feature.featureId === section)
                  ).length} hidden / {MENTOR_AREA_FEATURES.length} total
                </span>
              </div>
            </div>
            <div className="category-actions">
              <button
                className="toggle-all-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleAllSections('mentorArea', !areAllSectionsHidden('mentorArea'));
                }}
                title={areAllSectionsHidden('mentorArea') ? 'Show all' : 'Hide all'}
              >
                {areAllSectionsHidden('mentorArea') ? 'Show All' : 'Hide All'}
              </button>
              {expandedCategories.mentorArea ? <FaChevronDown /> : <FaChevronRight />}
            </div>
          </div>
          
          {expandedCategories.mentorArea && (
            <div className="sections-grid">
              {MENTOR_AREA_FEATURES.map((feature) => {
                const isHidden = isSectionHidden(feature.featureId);
                return (
                  <div key={feature.featureId} className={`section-toggle-item ${isHidden ? 'hidden' : ''}`}>
                    <div className="section-info">
                      <div className="section-icon">{feature.icon}</div>
                      <div className="section-details">
                        <div className="section-name">{feature.name}</div>
                        <div className="section-description">{feature.description}</div>
                        <div className="section-path">{feature.featureId}</div>
                      </div>
                    </div>
                    <button
                      className={`visibility-toggle-btn ${isHidden ? 'hidden' : 'visible'}`}
                      onClick={() => toggleSection(feature.featureId)}
                      title={isHidden ? 'Click to show' : 'Click to hide'}
                    >
                      {isHidden ? <FaEyeSlash /> : <FaEye />}
                      {isHidden ? 'Hidden' : 'Visible'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {hasChanges && (
        <div className="visibility-actions">
          <button
            className="save-btn"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <div className="loading-spinner-small" />
                Saving...
              </>
            ) : (
              <>
                <FaSave />
                Save Visibility Settings
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default VisibilityManagement;

