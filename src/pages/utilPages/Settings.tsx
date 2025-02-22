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
    marketingEmails: userProfile?.preferences?.marketingEmails || false,
    notifications: userProfile?.preferences?.notifications || false,
    theme: userProfile?.preferences?.theme || 'dark',
    language: userProfile?.preferences?.language || 'en',
    twoFactorEnabled: userProfile?.security?.twoFactorEnabled || false
  });

  const handleSave = async () => {
    if (!userProfile?.uid) return;

    try {
      const userRef = doc(db, 'users', userProfile.uid);
      await updateDoc(userRef, {
        'preferences.marketingEmails': settings.marketingEmails,
        'preferences.notifications': settings.notifications,
        'preferences.theme': settings.theme,
        'preferences.language': settings.language,
        'security.twoFactorEnabled': settings.twoFactorEnabled,
        lastUpdated: new Date()
      });
    } catch (error) {
      console.error('Error updating settings:', error);
    }
  };

  return (
    <div className="overlay">
      <div className="overlay-content">
        <button 
          className="close-button"
          onClick={() => navigate(-1)}
        >
          <FaTimes />
        </button>

        <h2>Settings</h2>

        <div className="settings-section">
          <h3>Preferences</h3>
          
          <div className="setting-item">
            <label>
              <input
                type="checkbox"
                checked={settings.marketingEmails}
                onChange={(e) => setSettings({...settings, marketingEmails: e.target.checked})}
              />
              Receive Marketing Emails
            </label>
          </div>

          <div className="setting-item">
            <label>
              <input
                type="checkbox"
                checked={settings.notifications}
                onChange={(e) => setSettings({...settings, notifications: e.target.checked})}
              />
              Enable Notifications
            </label>
          </div>

          <div className="setting-item">
            <label>Theme</label>
            <select
              value={settings.theme}
              onChange={(e) => setSettings({...settings, theme: e.target.value as 'light' | 'dark'})}
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>

          <div className="setting-item">
            <label>Language</label>
            <select
              value={settings.language}
              onChange={(e) => setSettings({...settings, language: e.target.value})}
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
            </select>
          </div>
        </div>

        <div className="settings-section">
          <h3>Security</h3>
          
          <div className="setting-item">
            <label>
              <input
                type="checkbox"
                checked={settings.twoFactorEnabled}
                onChange={(e) => setSettings({...settings, twoFactorEnabled: e.target.checked})}
              />
              Enable Two-Factor Authentication
            </label>
          </div>
        </div>

        <button onClick={handleSave} className="save-button">Save Changes</button>
      </div>
    </div>
  );
} 