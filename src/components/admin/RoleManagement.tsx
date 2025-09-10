import React, { useState, useEffect } from 'react';
import { FaUser, FaCrown, FaCode, FaUsers, FaShieldAlt, FaBullhorn, FaUserCheck, FaSave, FaTimes } from 'react-icons/fa';
import { UserProfile, hasRole, hasAnyRole, getUserRoles } from '../../utils/userProfile';
import { doc, updateDoc } from 'firebase/firestore';
import { firestore } from '../../firebase/firebase';
import './RoleManagement.css';

interface RoleManagementProps {
  userProfile: UserProfile;
  onClose: () => void;
}

const roleConfig = {
  admin: {
    name: 'Administrator',
    description: 'Full system access and management capabilities',
    icon: FaCrown,
    color: '#e74c3c',
    level: 5
  },
  developer: {
    name: 'Developer',
    description: 'Access to development tools and testing features',
    icon: FaCode,
    color: '#f39c12',
    level: 4
  },
  committee: {
    name: 'Committee Member',
    description: 'Strategic decision making and oversight',
    icon: FaUsers,
    color: '#9b59b6',
    level: 3
  },
  'vetting-officer': {
    name: 'Vetting Officer',
    description: 'Responsible for mentor verification and background checks',
    icon: FaUserCheck,
    color: '#3498db',
    level: 3
  },
  audit: {
    name: 'Audit Officer',
    description: 'Access to audit logs and compliance monitoring',
    icon: FaShieldAlt,
    color: '#2ecc71',
    level: 2
  },
  marketing: {
    name: 'Marketing Officer',
    description: 'Access to marketing tools and campaign management',
    icon: FaBullhorn,
    color: '#e67e22',
    level: 2
  }
};

export const RoleManagement: React.FC<RoleManagementProps> = ({ userProfile, onClose }) => {
  const [roles, setRoles] = useState(userProfile.roles);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRoleChange = (roleKey: keyof UserProfile['roles'], value: boolean) => {
    setRoles(prev => ({
      ...prev,
      [roleKey]: value
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const userRef = doc(firestore, 'users', userProfile.uid);
      await updateDoc(userRef, {
        roles: roles,
        lastUpdated: new Date()
      });

      // Update the userProfile in the parent component
      // This would typically be done through a callback or context update
      onClose();
    } catch (err) {
      setError('Failed to update user roles. Please try again.');
      console.error('Error updating roles:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setRoles(userProfile.roles);
    onClose();
  };

  const currentRoles = getUserRoles({ ...userProfile, roles });
  const hasChanges = JSON.stringify(roles) !== JSON.stringify(userProfile.roles);

  return (
    <div className="role-management-overlay">
      <div className="role-management-modal">
        <div className="role-management-header">
          <div className="role-management-title">
            <FaUser className="title-icon" />
            <h2>Manage Roles for {userProfile.firstName} {userProfile.lastName}</h2>
          </div>
          <button 
            className="role-management-close" 
            onClick={handleCancel}
            title="Close role management"
          >
            <FaTimes />
          </button>
        </div>

        <div className="role-management-content">
          <div className="current-roles">
            <h3>Current Roles</h3>
            <div className="current-roles-list">
              {currentRoles.length > 0 ? (
                currentRoles.map(roleKey => {
                  const role = roleConfig[roleKey];
                  const Icon = role.icon;
                  return (
                    <div key={roleKey} className="current-role-item">
                      <Icon style={{ color: role.color }} />
                      <span>{role.name}</span>
                    </div>
                  );
                })
              ) : (
                <p className="no-roles">No roles assigned</p>
              )}
            </div>
          </div>

          <div className="role-assignment">
            <h3>Assign Roles</h3>
            <div className="roles-grid">
              {Object.entries(roleConfig).map(([roleKey, role]) => {
                const Icon = role.icon;
                const isAssigned = roles[roleKey as keyof UserProfile['roles']];
                
                return (
                  <div 
                    key={roleKey} 
                    className={`role-card ${isAssigned ? 'assigned' : ''}`}
                    style={{ borderColor: role.color }}
                  >
                    <div className="role-card-header">
                      <Icon style={{ color: role.color }} />
                      <h4>{role.name}</h4>
                      <div className="role-level">Level {role.level}</div>
                    </div>
                    <p className="role-description">{role.description}</p>
                    <label className="role-toggle">
                      <input
                        type="checkbox"
                        checked={isAssigned}
                        onChange={(e) => handleRoleChange(roleKey as keyof UserProfile['roles'], e.target.checked)}
                      />
                      <span className="toggle-slider"></span>
                      <span className="toggle-label">
                        {isAssigned ? 'Assigned' : 'Not Assigned'}
                      </span>
                    </label>
                  </div>
                );
              })}
            </div>
          </div>

          {error && (
            <div className="role-management-error">
              {error}
            </div>
          )}
        </div>

        <div className="role-management-footer">
          <button 
            className="role-cancel-btn" 
            onClick={handleCancel}
            disabled={saving}
          >
            Cancel
          </button>
          <button 
            className="role-save-btn" 
            onClick={handleSave}
            disabled={saving || !hasChanges}
          >
            {saving ? (
              <>
                <div className="spinner"></div>
                Saving...
              </>
            ) : (
              <>
                <FaSave />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
