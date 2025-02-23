import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { FaTimes } from 'react-icons/fa';
import '../../styles/Overlay.css';

export default function Settings() {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    // Notifications
    marketingEmails: userProfile?.preferences?.marketingEmails || false,
    notifications: userProfile?.preferences?.notifications || false,
    orderUpdates: userProfile?.preferences?.orderUpdates || true,
    newProductAlerts: userProfile?.preferences?.newProductAlerts || false,
    
    // Appearance
    theme: userProfile?.preferences?.theme || 'dark',
    fontSize: userProfile?.preferences?.fontSize || 'medium',
    colorScheme: userProfile?.preferences?.colorScheme || 'default',
    
    // Language & Region
    language: userProfile?.preferences?.language || 'en',
    currency: userProfile?.preferences?.currency || 'GBP',
    timezone: userProfile?.preferences?.timezone || 'UTC',
    
    // Privacy & Security
    twoFactorEnabled: userProfile?.security?.twoFactorEnabled || false,
    showProfile: userProfile?.privacy?.showProfile || true,
    activityStatus: userProfile?.privacy?.activityStatus || true,
    dataCollection: userProfile?.privacy?.dataCollection || true
  });

  const handleSave = async () => {
    if (!userProfile?.uid) return;

    try {
      const userRef = doc(db, 'users', userProfile.uid);
      await updateDoc(userRef, {
        'preferences.marketingEmails': settings.marketingEmails,
        'preferences.notifications': settings.notifications,
        'preferences.orderUpdates': settings.orderUpdates,
        'preferences.newProductAlerts': settings.newProductAlerts,
        'preferences.theme': settings.theme,
        'preferences.fontSize': settings.fontSize,
        'preferences.colorScheme': settings.colorScheme,
        'preferences.language': settings.language,
        'preferences.currency': settings.currency,
        'preferences.timezone': settings.timezone,
        'security.twoFactorEnabled': settings.twoFactorEnabled,
        'privacy.showProfile': settings.showProfile,
        'privacy.activityStatus': settings.activityStatus,
        'privacy.dataCollection': settings.dataCollection,
        lastUpdated: new Date()
      });
    } catch (error) {
      console.error('Error updating settings:', error);
    }
  };

  return (
    <div className="overlay">
      <div className="overlay-content">
        <button className="close-button" onClick={() => navigate(-1)}>
          <FaTimes />
        </button>

        <h2>Settings</h2>

        <div className="settings-section">
          <h3>Notifications</h3>
          <div className="setting-item">
            <label>
              <input
                type="checkbox"
                checked={settings.marketingEmails}
                onChange={(e) => setSettings({...settings, marketingEmails: e.target.checked})}
              />
              Marketing Emails
            </label>
          </div>
          <div className="setting-item">
            <label>
              <input
                type="checkbox"
                checked={settings.notifications}
                onChange={(e) => setSettings({...settings, notifications: e.target.checked})}
              />
              Push Notifications
            </label>
          </div>
          <div className="setting-item">
            <label>
              <input
                type="checkbox"
                checked={settings.orderUpdates}
                onChange={(e) => setSettings({...settings, orderUpdates: e.target.checked})}
              />
              Order Updates
            </label>
          </div>
          <div className="setting-item">
            <label>
              <input
                type="checkbox"
                checked={settings.newProductAlerts}
                onChange={(e) => setSettings({...settings, newProductAlerts: e.target.checked})}
              />
              New Product Alerts
            </label>
          </div>
        </div>

        <div className="settings-section">
          <h3>Appearance</h3>
          <div className="setting-item">
            <label>Theme</label>
            <select
              value={settings.theme}
              onChange={(e) => setSettings({...settings, theme: e.target.value as 'light' | 'dark'})}
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System Default</option>
            </select>
          </div>
          <div className="setting-item">
            <label>Font Size</label>
            <select
              value={settings.fontSize}
              onChange={(e) => setSettings({...settings, fontSize: e.target.value})}
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </div>
          <div className="setting-item">
            <label>Color Scheme</label>
            <select
              value={settings.colorScheme}
              onChange={(e) => setSettings({...settings, colorScheme: e.target.value})}
            >
              <option value="default">Default</option>
              <option value="high-contrast">High Contrast</option>
              <option value="colorful">Colorful</option>
            </select>
          </div>
        </div>

        <div className="settings-section">
          <h3>Language & Region</h3>
          <div className="setting-item">
            <label>Language</label>
            <select
              value={settings.language}
              onChange={(e) => setSettings({...settings, language: e.target.value})}
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="it">Italian</option>
            </select>
          </div>
          <div className="setting-item">
            <label>Currency</label>
            <select
              value={settings.currency}
              onChange={(e) => setSettings({...settings, currency: e.target.value})}
            >
              <option value="GBP">British Pound (£)</option>
              <option value="EUR">Euro (€)</option>
              <option value="USD">US Dollar ($)</option>
            </select>
          </div>
        </div>

        <div className="settings-section">
          <h3>Privacy & Security</h3>
          <div className="setting-item">
            <label>
              <input
                type="checkbox"
                checked={settings.twoFactorEnabled}
                onChange={(e) => setSettings({...settings, twoFactorEnabled: e.target.checked})}
              />
              Two-Factor Authentication
            </label>
          </div>
          <div className="setting-item">
            <label>
              <input
                type="checkbox"
                checked={settings.showProfile}
                onChange={(e) => setSettings({...settings, showProfile: e.target.checked})}
              />
              Show Profile to Other Users
            </label>
          </div>
          <div className="setting-item">
            <label>
              <input
                type="checkbox"
                checked={settings.activityStatus}
                onChange={(e) => setSettings({...settings, activityStatus: e.target.checked})}
              />
              Show Activity Status
            </label>
          </div>
          <div className="setting-item">
            <label>
              <input
                type="checkbox"
                checked={settings.dataCollection}
                onChange={(e) => setSettings({...settings, dataCollection: e.target.checked})}
              />
              Allow Data Collection for Personalization
            </label>
          </div>
        </div>

        <button onClick={handleSave} className="save-button">
          Save Changes
        </button>
      </div>
    </div>
  );
} 