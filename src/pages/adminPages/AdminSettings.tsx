import { useState } from 'react';
import { FaCog, FaShieldAlt } from 'react-icons/fa';
import PagePermissionsManager from '../../components/admin/PagePermissionsManager';
import '../../styles/adminStyles/AdminSettings.css';

export function AdminSettings() {
  const [activeTab, setActiveTab] = useState<'permissions' | 'general'>('permissions');

  return (
    <div className="admin-settings">
      <div className="admin-settings-header">
        <h2>Admin Settings</h2>
        <p>Configure system settings and permissions</p>
      </div>

      <div className="admin-settings-tabs">
        <button
          className={`admin-settings-tab ${activeTab === 'permissions' ? 'active' : ''}`}
          onClick={() => setActiveTab('permissions')}
        >
          <FaShieldAlt />
          Page Permissions
        </button>
        <button
          className={`admin-settings-tab ${activeTab === 'general' ? 'active' : ''}`}
          onClick={() => setActiveTab('general')}
        >
          <FaCog />
          General Settings
        </button>
      </div>

      <div className="admin-settings-content">
        {activeTab === 'permissions' && (
          <PagePermissionsManager />
        )}
        
        {activeTab === 'general' && (
          <div className="admin-settings-general">
            <div className="settings-section">
              <h3>General Settings</h3>
              <p>General system configuration options will be available here.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 