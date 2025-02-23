import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { FaTimes } from 'react-icons/fa';
import '../../styles/Overlay.css';

interface SettingsState {
  marketingEmails: boolean;
  notifications: boolean;
  orderUpdates: boolean;
  newProductAlerts: boolean;
  theme: 'light' | 'dark' | 'system';
  fontSize: 'small' | 'medium' | 'large';
  colorScheme: 'default' | 'high-contrast' | 'colorful';
  language: string;
  currency: string;
  timezone: string;
  twoFactorEnabled: boolean;
  showProfile: boolean;
  activityStatus: boolean;
  dataCollection: boolean;
}

export default function Settings() {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  
  const defaultSettings: SettingsState = {
    marketingEmails: false,
    notifications: false,
    orderUpdates: true,
    newProductAlerts: false,
    theme: 'dark',
    fontSize: 'medium',
    colorScheme: 'default',
    language: 'en',
    currency: 'GBP',
    timezone: 'UTC',
    twoFactorEnabled: false,
    showProfile: true,
    activityStatus: true,
    dataCollection: true
  };

  const [settings, setSettings] = useState<SettingsState>({
    marketingEmails: userProfile?.preferences?.marketingEmails ?? defaultSettings.marketingEmails,
    notifications: userProfile?.preferences?.notifications ?? defaultSettings.notifications,
    orderUpdates: userProfile?.preferences?.orderUpdates ?? defaultSettings.orderUpdates,
    newProductAlerts: userProfile?.preferences?.newProductAlerts ?? defaultSettings.newProductAlerts,
    theme: userProfile?.preferences?.theme ?? defaultSettings.theme,
    fontSize: userProfile?.preferences?.fontSize ?? defaultSettings.fontSize,
    colorScheme: userProfile?.preferences?.colorScheme ?? defaultSettings.colorScheme,
    language: userProfile?.preferences?.language ?? defaultSettings.language,
    currency: userProfile?.preferences?.currency ?? defaultSettings.currency,
    timezone: userProfile?.preferences?.timezone ?? defaultSettings.timezone,
    twoFactorEnabled: userProfile?.security?.twoFactorEnabled ?? defaultSettings.twoFactorEnabled,
    showProfile: userProfile?.privacy?.showProfile ?? defaultSettings.showProfile,
    activityStatus: userProfile?.privacy?.activityStatus ?? defaultSettings.activityStatus,
    dataCollection: userProfile?.privacy?.dataCollection ?? defaultSettings.dataCollection
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
              onChange={(e) => setSettings({...settings, theme: e.target.value as 'light' | 'dark' | 'system'})}
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
              onChange={(e) => setSettings({...settings, fontSize: e.target.value as 'small' | 'medium' | 'large'})}
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
              onChange={(e) => setSettings({...settings, colorScheme: e.target.value as 'default' | 'high-contrast' | 'colorful'})}
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