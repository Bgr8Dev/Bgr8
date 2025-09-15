import React, { useState } from 'react';
import { 
  FaCog, 
  FaShieldAlt, 
  FaSync, 
  FaExclamationTriangle,
  FaBell,
  FaLock,  
  FaSave,
  FaCheck,
  FaTimes,
  FaInfoCircle
} from 'react-icons/fa';
import PagePermissionsManager from './PagePermissionsManager';
import { PagePermissionsService } from '../../../services/pagePermissionsService';
import './MobileAdminSettings.css';

export function MobileAdminSettings() {
  const [activeTab, setActiveTab] = useState<'permissions' | 'general' | 'notifications' | 'security'>('permissions');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);
  
  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    systemAlerts: true,
    weeklyReports: true,
    mentorUpdates: true,
    enquiryAlerts: true
  });

  // General settings
  const [generalSettings, setGeneralSettings] = useState({
    siteName: 'bgr8',
    maintenanceMode: false,
    allowRegistrations: true,
    requireEmailVerification: true,
    maxFileUploadSize: '10MB',
    sessionTimeout: '24'
  });

  // Security settings
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    passwordMinLength: 8,
    requireStrongPasswords: true,
    loginAttempts: 5,
    lockoutDuration: '15'
  });

  const handleForceUpdatePermissions = async () => {
    try {
      setIsUpdating(true);
      setUpdateMessage(null);
      await PagePermissionsService.forceUpdatePermissions();
      setUpdateMessage('Page permissions updated successfully! All new pages have been added to Firebase.');
    } catch (error) {
      console.error('Error updating permissions:', error);
      setUpdateMessage('Failed to update page permissions. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveSettings = (settingsType: string) => {
    // In a real app, this would save to your backend
    setUpdateMessage(`${settingsType} settings saved successfully!`);
    setTimeout(() => setUpdateMessage(null), 3000);
  };

  const tabs = [
    { id: 'permissions', label: 'Permissions', icon: <FaShieldAlt /> },
    { id: 'general', label: 'General', icon: <FaCog /> },
    { id: 'notifications', label: 'Notifications', icon: <FaBell /> },
    { id: 'security', label: 'Security', icon: <FaLock /> }
  ];

  return (
    <div className="mobile-admin-settings">
      {/* Tab Navigation */}
      <div className="settings-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id as 'permissions' | 'general' | 'notifications' | 'security')}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Update Message */}
      {updateMessage && (
        <div className={`update-message ${updateMessage.includes('successfully') ? 'success' : 'error'}`}>
          <div className="message-content">
            {updateMessage.includes('successfully') ? <FaCheck /> : <FaExclamationTriangle />}
            <span>{updateMessage}</span>
          </div>
          <button 
            className="close-message"
            onClick={() => setUpdateMessage(null)}
            title="Close message"
          >
            <FaTimes />
          </button>
        </div>
      )}

      {/* Tab Content */}
      <div className="settings-content">
        {activeTab === 'permissions' && (
          <div className="settings-section">
            <div className="section-header">
              <h3>Page Permissions</h3>
              <p>Manage access control for different pages and features</p>
            </div>
            
            <div className="permissions-actions">
              <button
                className="action-btn primary"
                onClick={handleForceUpdatePermissions}
                disabled={isUpdating}
              >
                <FaSync className={isUpdating ? 'spinning' : ''} />
                {isUpdating ? 'Updating...' : 'Update Page Permissions'}
              </button>
              
              <div className="info-card">
                <FaInfoCircle />
                <div>
                  <h4>About Page Permissions</h4>
                  <p>This will scan your codebase for new pages and add them to Firebase with default permissions.</p>
                </div>
              </div>
            </div>

            <div className="permissions-manager">
              <PagePermissionsManager />
            </div>
          </div>
        )}

        {activeTab === 'general' && (
          <div className="settings-section">
            <div className="section-header">
              <h3>General Settings</h3>
              <p>Configure basic system settings and preferences</p>
            </div>

            <div className="settings-form">
              <div className="form-group">
                <label>Site Name</label>
                <input
                  type="text"
                  value={generalSettings.siteName}
                  onChange={(e) => setGeneralSettings(prev => ({ ...prev, siteName: e.target.value }))}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Max File Upload Size</label>
                <select
                  value={generalSettings.maxFileUploadSize}
                  onChange={(e) => setGeneralSettings(prev => ({ ...prev, maxFileUploadSize: e.target.value }))}
                  className="form-select"
                >
                  <option value="5MB">5MB</option>
                  <option value="10MB">10MB</option>
                  <option value="25MB">25MB</option>
                  <option value="50MB">50MB</option>
                </select>
              </div>

              <div className="form-group">
                <label>Session Timeout (hours)</label>
                <select
                  value={generalSettings.sessionTimeout}
                  onChange={(e) => setGeneralSettings(prev => ({ ...prev, sessionTimeout: e.target.value }))}
                  className="form-select"
                >
                  <option value="1">1 hour</option>
                  <option value="8">8 hours</option>
                  <option value="24">24 hours</option>
                  <option value="168">7 days</option>
                </select>
              </div>

              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={generalSettings.maintenanceMode}
                    onChange={(e) => setGeneralSettings(prev => ({ ...prev, maintenanceMode: e.target.checked }))}
                  />
                  <span className="checkmark"></span>
                  Enable Maintenance Mode
                </label>
              </div>

              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={generalSettings.allowRegistrations}
                    onChange={(e) => setGeneralSettings(prev => ({ ...prev, allowRegistrations: e.target.checked }))}
                  />
                  <span className="checkmark"></span>
                  Allow New Registrations
                </label>
              </div>

              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={generalSettings.requireEmailVerification}
                    onChange={(e) => setGeneralSettings(prev => ({ ...prev, requireEmailVerification: e.target.checked }))}
                  />
                  <span className="checkmark"></span>
                  Require Email Verification
                </label>
              </div>

              <button
                className="save-btn"
                onClick={() => handleSaveSettings('General')}
              >
                <FaSave />
                Save General Settings
              </button>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="settings-section">
            <div className="section-header">
              <h3>Notification Preferences</h3>
              <p>Configure how and when you receive notifications</p>
            </div>

            <div className="settings-form">
              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={notificationSettings.emailNotifications}
                    onChange={(e) => setNotificationSettings(prev => ({ ...prev, emailNotifications: e.target.checked }))}
                  />
                  <span className="checkmark"></span>
                  Email Notifications
                </label>
              </div>

              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={notificationSettings.pushNotifications}
                    onChange={(e) => setNotificationSettings(prev => ({ ...prev, pushNotifications: e.target.checked }))}
                  />
                  <span className="checkmark"></span>
                  Push Notifications
                </label>
              </div>

              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={notificationSettings.systemAlerts}
                    onChange={(e) => setNotificationSettings(prev => ({ ...prev, systemAlerts: e.target.checked }))}
                  />
                  <span className="checkmark"></span>
                  System Alerts
                </label>
              </div>

              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={notificationSettings.weeklyReports}
                    onChange={(e) => setNotificationSettings(prev => ({ ...prev, weeklyReports: e.target.checked }))}
                  />
                  <span className="checkmark"></span>
                  Weekly Reports
                </label>
              </div>

              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={notificationSettings.mentorUpdates}
                    onChange={(e) => setNotificationSettings(prev => ({ ...prev, mentorUpdates: e.target.checked }))}
                  />
                  <span className="checkmark"></span>
                  Mentor Updates
                </label>
              </div>

              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={notificationSettings.enquiryAlerts}
                    onChange={(e) => setNotificationSettings(prev => ({ ...prev, enquiryAlerts: e.target.checked }))}
                  />
                  <span className="checkmark"></span>
                  Enquiry Alerts
                </label>
              </div>

              <button
                className="save-btn"
                onClick={() => handleSaveSettings('Notification')}
              >
                <FaSave />
                Save Notification Settings
              </button>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="settings-section">
            <div className="section-header">
              <h3>Security Settings</h3>
              <p>Configure security policies and authentication requirements</p>
            </div>

            <div className="settings-form">
              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={securitySettings.twoFactorAuth}
                    onChange={(e) => setSecuritySettings(prev => ({ ...prev, twoFactorAuth: e.target.checked }))}
                  />
                  <span className="checkmark"></span>
                  Enable Two-Factor Authentication
                </label>
              </div>

              <div className="form-group">
                <label>Minimum Password Length</label>
                <select
                  value={securitySettings.passwordMinLength}
                  onChange={(e) => setSecuritySettings(prev => ({ ...prev, passwordMinLength: parseInt(e.target.value) }))}
                  className="form-select"
                >
                  <option value={6}>6 characters</option>
                  <option value={8}>8 characters</option>
                  <option value={12}>12 characters</option>
                  <option value={16}>16 characters</option>
                </select>
              </div>

              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={securitySettings.requireStrongPasswords}
                    onChange={(e) => setSecuritySettings(prev => ({ ...prev, requireStrongPasswords: e.target.checked }))}
                  />
                  <span className="checkmark"></span>
                  Require Strong Passwords
                </label>
              </div>

              <div className="form-group">
                <label>Max Login Attempts</label>
                <select
                  value={securitySettings.loginAttempts}
                  onChange={(e) => setSecuritySettings(prev => ({ ...prev, loginAttempts: parseInt(e.target.value) }))}
                  className="form-select"
                >
                  <option value={3}>3 attempts</option>
                  <option value={5}>5 attempts</option>
                  <option value={10}>10 attempts</option>
                </select>
              </div>

              <div className="form-group">
                <label>Account Lockout Duration (minutes)</label>
                <select
                  value={securitySettings.lockoutDuration}
                  onChange={(e) => setSecuritySettings(prev => ({ ...prev, lockoutDuration: e.target.value }))}
                  className="form-select"
                >
                  <option value="5">5 minutes</option>
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="60">1 hour</option>
                </select>
              </div>

              <button
                className="save-btn"
                onClick={() => handleSaveSettings('Security')}
              >
                <FaSave />
                Save Security Settings
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
