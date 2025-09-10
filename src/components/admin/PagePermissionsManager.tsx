import React, { useState, useEffect } from 'react';
import { 
  FaUsers, 
  FaChartBar, 
  FaEnvelope, 
  FaChalkboardTeacher, 
  FaUserCheck, 
  FaComments, 
  FaBug,
  FaCalendarAlt, 
  FaCog,
  FaSave,
  FaUndo,
  FaCheck,
  FaTimes
} from 'react-icons/fa';
import { PagePermissionsService, PagePermission } from '../../services/pagePermissionsService';
import './PagePermissionsManager.css';

interface PagePermissionsManagerProps {
  onPermissionsChange?: (permissions: PagePermission[]) => void;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  'users': FaUsers,
  'analytics': FaChartBar,
  'enquiries': FaEnvelope,
  'mentors': FaChalkboardTeacher,
  'verification': FaUserCheck,
  'feedback': FaComments,
  'testing-feedback': FaBug,
  'sessions': FaCalendarAlt,
  'settings': FaCog
};

export const PagePermissionsManager: React.FC<PagePermissionsManagerProps> = ({ 
  onPermissionsChange 
}) => {
  const [permissions, setPermissions] = useState<PagePermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalPermissions, setOriginalPermissions] = useState<PagePermission[]>([]);

  const allRoles = PagePermissionsService.getAllRoles();

  useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const config = await PagePermissionsService.getPagePermissions();
      setPermissions(config.permissions);
      setOriginalPermissions(JSON.parse(JSON.stringify(config.permissions)));
    } catch (err) {
      setError('Failed to load page permissions');
      console.error('Error loading permissions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionChange = (pageId: string, field: keyof PagePermission, value: boolean | string[]) => {
    setPermissions(prev => {
      const updated = prev.map(permission => 
        permission.pageId === pageId 
          ? { ...permission, [field]: value }
          : permission
      );
      
      // Check if there are changes
      const hasChanges = JSON.stringify(updated) !== JSON.stringify(originalPermissions);
      setHasChanges(hasChanges);
      
      return updated;
    });
  };

  const handleRoleToggle = (pageId: string, role: string) => {
    const permission = permissions.find(p => p.pageId === pageId);
    if (!permission) return;

    const newAllowedRoles = permission.allowedRoles.includes(role)
      ? permission.allowedRoles.filter(r => r !== role)
      : [...permission.allowedRoles, role];

    handlePermissionChange(pageId, 'allowedRoles', newAllowedRoles);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      
      await PagePermissionsService.updatePagePermissions(permissions, 'admin');
      
      setOriginalPermissions(JSON.parse(JSON.stringify(permissions)));
      setHasChanges(false);
      setSuccess('Page permissions updated successfully!');
      
      if (onPermissionsChange) {
        onPermissionsChange(permissions);
      }
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to save page permissions');
      console.error('Error saving permissions:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setPermissions(JSON.parse(JSON.stringify(originalPermissions)));
    setHasChanges(false);
  };

  if (loading) {
    return (
      <div className="page-permissions-manager">
        <div className="page-permissions-loading">
          <div className="loading-spinner"></div>
          <span>Loading page permissions...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="page-permissions-manager">
      <div className="page-permissions-header">
        <h2>Page Access Permissions</h2>
        <p>Configure which roles can access which admin portal pages</p>
        
        <div className="page-permissions-actions">
          <button
            className="page-permissions-btn page-permissions-btn--save"
            onClick={handleSave}
            disabled={!hasChanges || saving}
          >
            <FaSave />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          
          <button
            className="page-permissions-btn page-permissions-btn--reset"
            onClick={handleReset}
            disabled={!hasChanges || saving}
          >
            <FaUndo />
            Reset
          </button>
        </div>
      </div>

      {error && (
        <div className="page-permissions-error">
          <FaTimes />
          {error}
        </div>
      )}

      {success && (
        <div className="page-permissions-success">
          <FaCheck />
          {success}
        </div>
      )}

      <div className="page-permissions-content">
        <div className="page-permissions-table">
          <div className="page-permissions-table-header">
            <div className="page-permissions-table-cell page-permissions-table-cell--page">Page</div>
            <div className="page-permissions-table-cell page-permissions-table-cell--enabled">Enabled</div>
            <div className="page-permissions-table-cell page-permissions-table-cell--roles">Allowed Roles</div>
          </div>
          
          {permissions.map((permission) => {
            const IconComponent = iconMap[permission.pageId];
            
            return (
              <div key={permission.pageId} className="page-permissions-table-row">
                <div className="page-permissions-table-cell page-permissions-table-cell--page">
                  <div className="page-permissions-page-info">
                    {IconComponent && <IconComponent className="page-permissions-page-icon" />}
                    <div className="page-permissions-page-details">
                      <div className="page-permissions-page-name">{permission.pageName}</div>
                      <div className="page-permissions-page-description">{permission.description}</div>
                    </div>
                  </div>
                </div>
                
                <div className="page-permissions-table-cell page-permissions-table-cell--enabled">
                  <label className="page-permissions-toggle">
                    <input
                      type="checkbox"
                      checked={permission.isEnabled}
                      onChange={(e) => handlePermissionChange(permission.pageId, 'isEnabled', e.target.checked)}
                    />
                    <span className="page-permissions-toggle-slider"></span>
                  </label>
                </div>
                
                <div className="page-permissions-table-cell page-permissions-table-cell--roles">
                  <div className="page-permissions-roles">
                    {allRoles.map((role) => (
                      <label key={role} className="page-permissions-role-checkbox">
                        <input
                          type="checkbox"
                          checked={permission.allowedRoles.includes(role)}
                          onChange={() => handleRoleToggle(permission.pageId, role)}
                          disabled={!permission.isEnabled}
                        />
                        <span className="page-permissions-role-label">
                          {role.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PagePermissionsManager;
