import React, { useState } from 'react';
import { FaFlag, FaTools, FaRocket, FaPlus, FaTrash, FaSave, FaCheck, FaChevronDown, FaChevronRight, FaCog, FaEnvelope, FaChartBar, FaInstagram, FaUsers, FaBell, FaSearch, FaFileAlt, FaUserCheck, FaCalendarAlt, FaHandshake } from 'react-icons/fa';
import { useBanner, BannerSettings } from '../../../contexts/BannerContext';
import './BannerManagement.css';

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
  { sectionId: 'banner-test', name: 'Banner Test', icon: <FaFlag />, description: 'Test banner functionality' }
];

export const BannerManagement: React.FC = () => {
  const { bannerSettings, updateBannerSettings, isLoading } = useBanner();
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [localSettings, setLocalSettings] = useState<BannerSettings>(bannerSettings);
  const [expandedCategories, setExpandedCategories] = useState<{ [key: string]: boolean }>({
    admin: true,
    general: false
  });

  React.useEffect(() => {
    setLocalSettings(bannerSettings);
  }, [bannerSettings]);

  // Initialize local settings with defaults if bannerSettings is empty
  React.useEffect(() => {
    if (!isLoading && (!bannerSettings.inDevelopment || !bannerSettings.comingSoon)) {
      setLocalSettings({
        inDevelopment: {
          enabled: false,
          message: "This feature is currently in development and may not work as expected.",
          pages: [],
          showIcon: true
        },
        comingSoon: {
          enabled: false,
          message: "This feature is coming soon! Stay tuned for updates.",
          pages: [],
          showIcon: true
        }
      });
    }
  }, [bannerSettings, isLoading]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setMessage(null);
      await updateBannerSettings(localSettings);
      setMessage({ type: 'success', text: 'Banner settings saved successfully!' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to save banner settings. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  const updateBannerSetting = (bannerType: 'inDevelopment' | 'comingSoon', field: string, value: string | boolean | string[]) => {
    setLocalSettings(prev => ({
      ...prev,
      [bannerType]: {
        ...prev[bannerType],
        [field]: value
      }
    }));
  };

  const togglePage = (bannerType: 'inDevelopment' | 'comingSoon', sectionId: string) => {
    const currentPages = localSettings[bannerType].pages;
    const isPageEnabled = currentPages.includes(sectionId);
    
    if (isPageEnabled) {
      // Remove page
      const newPages = currentPages.filter(id => id !== sectionId);
      updateBannerSetting(bannerType, 'pages', newPages);
    } else {
      // Add page
      updateBannerSetting(bannerType, 'pages', [...currentPages, sectionId]);
    }
  };

  const toggleAllPages = (bannerType: 'inDevelopment' | 'comingSoon', enable: boolean) => {
    if (enable) {
      // Add all admin pages
      const allAdminSections = ADMIN_PAGES.map(page => page.sectionId);
      updateBannerSetting(bannerType, 'pages', allAdminSections);
    } else {
      // Remove all pages
      updateBannerSetting(bannerType, 'pages', []);
    }
  };

  const isPageEnabled = (bannerType: 'inDevelopment' | 'comingSoon', sectionId: string) => {
    return localSettings[bannerType].pages.includes(sectionId);
  };

  const areAllPagesEnabled = (bannerType: 'inDevelopment' | 'comingSoon') => {
    const enabledPages = localSettings[bannerType].pages;
    return ADMIN_PAGES.every(page => enabledPages.includes(page.sectionId));
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const addPage = (bannerType: 'inDevelopment' | 'comingSoon') => {
    const newPage = prompt('Enter page path (use * for all pages):');
    if (newPage && !localSettings[bannerType].pages.includes(newPage)) {
      updateBannerSetting(bannerType, 'pages', [...localSettings[bannerType].pages, newPage]);
    }
  };

  const removePage = (bannerType: 'inDevelopment' | 'comingSoon', pageIndex: number) => {
    const newPages = localSettings[bannerType].pages.filter((_, index) => index !== pageIndex);
    updateBannerSetting(bannerType, 'pages', newPages);
  };

  const hasChanges = JSON.stringify(localSettings) !== JSON.stringify(bannerSettings);

  if (isLoading) {
    return (
      <div className="banner-management">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading banner settings...</p>
        </div>
      </div>
    );
  }

  // Check if this is the first time setup
  const isFirstTimeSetup = !bannerSettings.inDevelopment || !bannerSettings.comingSoon;

  return (
    <div className="banner-management">
      <div className="banner-header">
        <FaFlag className="banner-header-icon" />
        <h3>Banner Management</h3>
        <p>Configure development and coming soon banners across the site</p>
        {isFirstTimeSetup && (
          <div className="first-time-setup-notice">
            <p><strong>Welcome!</strong> This is your first time setting up banners. Configure your settings below and save to get started.</p>
          </div>
        )}
      </div>

      {message && (
        <div className={`banner-message ${message.type}`}>
          <div className="message-icon">
            {message.type === 'success' ? <FaCheck /> : <FaFlag />}
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

      <div className="banner-sections">
        {/* In Development Banner */}
        <div className="banner-section">
          <div className="banner-section-header">
            <FaTools className="banner-section-icon" />
            <h4>In Development Banner</h4>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={localSettings.inDevelopment.enabled}
                onChange={(e) => updateBannerSetting('inDevelopment', 'enabled', e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          {localSettings.inDevelopment.enabled && (
            <div className="banner-section-content">
              <div className="form-group">
                <label>Message</label>
                <textarea
                  value={localSettings.inDevelopment.message}
                  onChange={(e) => updateBannerSetting('inDevelopment', 'message', e.target.value)}
                  className="form-textarea"
                  rows={3}
                  placeholder="Enter banner message..."
                />
              </div>

              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={localSettings.inDevelopment.showIcon}
                    onChange={(e) => updateBannerSetting('inDevelopment', 'showIcon', e.target.checked)}
                  />
                  <span className="checkmark"></span>
                  Show Icon
                </label>
              </div>

              <div className="form-group">
                <label>Pages to Show On</label>
                
                {/* Admin Pages Category */}
                <div className="page-category">
                  <div 
                    className="category-header"
                    onClick={() => toggleCategory('admin')}
                  >
                    <div className="category-title">
                      <FaCog className="category-icon" />
                      <span>Admin Pages</span>
                      <span className="page-count">
                        ({localSettings.inDevelopment.pages.filter(page => 
                          ADMIN_PAGES.some(adminPage => adminPage.sectionId === page)
                        ).length}/{ADMIN_PAGES.length})
                      </span>
                    </div>
                    <div className="category-actions">
                      <button
                        className="toggle-all-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleAllPages('inDevelopment', !areAllPagesEnabled('inDevelopment'));
                        }}
                        title={areAllPagesEnabled('inDevelopment') ? 'Disable all' : 'Enable all'}
                      >
                        {areAllPagesEnabled('inDevelopment') ? 'Disable All' : 'Enable All'}
                      </button>
                      {expandedCategories.admin ? <FaChevronDown /> : <FaChevronRight />}
                    </div>
                  </div>
                  
                  {expandedCategories.admin && (
                    <div className="pages-grid">
                      {ADMIN_PAGES.map((page) => (
                        <div key={page.sectionId} className="page-toggle-item">
                          <div className="page-info">
                            <div className="page-icon">{page.icon}</div>
                            <div className="page-details">
                              <div className="page-name">{page.name}</div>
                              <div className="page-description">{page.description}</div>
                              <div className="page-path">{page.sectionId}</div>
                            </div>
                          </div>
                          <label className="page-toggle">
                            <input
                              type="checkbox"
                              checked={isPageEnabled('inDevelopment', page.sectionId)}
                              onChange={() => togglePage('inDevelopment', page.sectionId)}
                            />
                            <span className="toggle-slider"></span>
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Custom Pages */}
                <div className="custom-pages-section">
                  <div className="custom-pages-header">
                    <span>Custom Pages</span>
                    <button
                      className="add-page-btn"
                      onClick={() => addPage('inDevelopment')}
                    >
                      <FaPlus />
                      Add Custom Page
                    </button>
                  </div>
                  <div className="custom-pages-list">
                    {localSettings.inDevelopment.pages
                      .filter(page => !ADMIN_PAGES.some(adminPage => adminPage.sectionId === page))
                      .map((page, index) => (
                        <div key={index} className="custom-page-item">
                          <span className="page-path">{page}</span>
                          <button
                            className="remove-page-btn"
                            onClick={() => removePage('inDevelopment', 
                              localSettings.inDevelopment.pages.indexOf(page)
                            )}
                            title="Remove page"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Coming Soon Banner */}
        <div className="banner-section">
          <div className="banner-section-header">
            <FaRocket className="banner-section-icon" />
            <h4>Coming Soon Banner</h4>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={localSettings.comingSoon.enabled}
                onChange={(e) => updateBannerSetting('comingSoon', 'enabled', e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          {localSettings.comingSoon.enabled && (
            <div className="banner-section-content">
              <div className="form-group">
                <label>Message</label>
                <textarea
                  value={localSettings.comingSoon.message}
                  onChange={(e) => updateBannerSetting('comingSoon', 'message', e.target.value)}
                  className="form-textarea"
                  rows={3}
                  placeholder="Enter banner message..."
                />
              </div>

              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={localSettings.comingSoon.showIcon}
                    onChange={(e) => updateBannerSetting('comingSoon', 'showIcon', e.target.checked)}
                  />
                  <span className="checkmark"></span>
                  Show Icon
                </label>
              </div>

              <div className="form-group">
                <label>Pages to Show On</label>
                
                {/* Admin Pages Category */}
                <div className="page-category">
                  <div 
                    className="category-header"
                    onClick={() => toggleCategory('admin')}
                  >
                    <div className="category-title">
                      <FaCog className="category-icon" />
                      <span>Admin Pages</span>
                      <span className="page-count">
                        ({localSettings.comingSoon.pages.filter(page => 
                          ADMIN_PAGES.some(adminPage => adminPage.sectionId === page)
                        ).length}/{ADMIN_PAGES.length})
                      </span>
                    </div>
                    <div className="category-actions">
                      <button
                        className="toggle-all-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleAllPages('comingSoon', !areAllPagesEnabled('comingSoon'));
                        }}
                        title={areAllPagesEnabled('comingSoon') ? 'Disable all' : 'Enable all'}
                      >
                        {areAllPagesEnabled('comingSoon') ? 'Disable All' : 'Enable All'}
                      </button>
                      {expandedCategories.admin ? <FaChevronDown /> : <FaChevronRight />}
                    </div>
                  </div>
                  
                  {expandedCategories.admin && (
                    <div className="pages-grid">
                      {ADMIN_PAGES.map((page) => (
                        <div key={page.sectionId} className="page-toggle-item">
                          <div className="page-info">
                            <div className="page-icon">{page.icon}</div>
                            <div className="page-details">
                              <div className="page-name">{page.name}</div>
                              <div className="page-description">{page.description}</div>
                              <div className="page-path">{page.sectionId}</div>
                            </div>
                          </div>
                          <label className="page-toggle">
                            <input
                              type="checkbox"
                              checked={isPageEnabled('comingSoon', page.sectionId)}
                              onChange={() => togglePage('comingSoon', page.sectionId)}
                            />
                            <span className="toggle-slider"></span>
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Custom Pages */}
                <div className="custom-pages-section">
                  <div className="custom-pages-header">
                    <span>Custom Pages</span>
                    <button
                      className="add-page-btn"
                      onClick={() => addPage('comingSoon')}
                    >
                      <FaPlus />
                      Add Custom Page
                    </button>
                  </div>
                  <div className="custom-pages-list">
                    {localSettings.comingSoon.pages
                      .filter(page => !ADMIN_PAGES.some(adminPage => adminPage.sectionId === page))
                      .map((page, index) => (
                        <div key={index} className="custom-page-item">
                          <span className="page-path">{page}</span>
                          <button
                            className="remove-page-btn"
                            onClick={() => removePage('comingSoon', 
                              localSettings.comingSoon.pages.indexOf(page)
                            )}
                            title="Remove page"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {hasChanges && (
        <div className="banner-actions">
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
                Save Banner Settings
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default BannerManagement;
