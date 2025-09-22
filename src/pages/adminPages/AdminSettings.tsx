import { useState } from 'react';
import { FaCog, FaShieldAlt, FaSync, FaExclamationTriangle } from 'react-icons/fa';
import PagePermissionsManager from '../../components/admin/settings/PagePermissionsManager';
import BlueLocked from '../../components/admin/settings/BlueLocked';
import { PagePermissionsService } from '../../services/pagePermissionsService';
import '../../styles/adminStyles/AdminSettings.css';

export function AdminSettings() {
  const [activeTab, setActiveTab] = useState<'permissions' | 'general'>('permissions');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);

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
                <div>
                  <div className="permissions-update-section">
                    <div className="permissions-update-header">
                      <FaExclamationTriangle className="warning-icon" />
                      <h3>Page Permissions Update</h3>
                    </div>
                    <p>
                      If you're seeing missing pages in the admin portal, click the button below to 
                      update the page permissions in Firebase with all available pages.
                    </p>
                    <button
                      className="permissions-update-btn"
                      onClick={handleForceUpdatePermissions}
                      disabled={isUpdating}
                    >
                      {isUpdating ? <FaSync className="spinner" /> : <FaSync />}
                      {isUpdating ? 'Updating...' : 'Update Page Permissions'}
                    </button>
                    {updateMessage && (
                      <div className={`update-message ${updateMessage.includes('successfully') ? 'success' : 'error'}`}>
                        {updateMessage}
                      </div>
                    )}
                  </div>
                  <PagePermissionsManager />
                </div>
              )}

              {activeTab === 'general' && (
                <div className="admin-settings-general">
                  <BlueLocked />
                </div>
              )}
            </div>
    </div>
  );
} 