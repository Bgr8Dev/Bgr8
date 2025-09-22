import React from 'react';
import { createPortal } from 'react-dom';
import { FaTimes, FaShieldAlt } from 'react-icons/fa';
import { useAuth } from '../../../hooks/useAuth';
import { hasRole } from '../../../utils/userProfile';
import { Timestamp } from 'firebase/firestore';
import './RoleManagementModal.css';

interface UserData {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: {
    admin: boolean;
    developer: boolean;
    committee: boolean;
    audit: boolean;
    marketing: boolean;
    'vetting-officer': boolean;
    'social-media': boolean;
    outreach: boolean;
    events: boolean;
    tester: boolean;
    ambassador: boolean;
  };
  isProtected?: boolean;
  dateCreated: Timestamp;
  lastLogin?: Date;
  [key: string]: unknown;
}

interface RoleInfo {
  key: keyof UserData['roles'];
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

interface RoleManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedUser: UserData | null;
  onToggleRole: (uid: string, role: keyof UserData['roles'], currentStatus: boolean) => void;
  pulsingRole: string | null;
  roles: RoleInfo[];
}

export default function RoleManagementModal({
  isOpen,
  onClose,
  selectedUser,
  onToggleRole,
  pulsingRole,
  roles
}: RoleManagementModalProps) {
  const { userProfile } = useAuth();
  
  // Check if user has permission to manage roles
  const canManageRoles = hasRole(userProfile, 'admin') || hasRole(userProfile, 'developer');
  
  if (!isOpen || !selectedUser) return null;
  
  // Access control check
  if (!canManageRoles) {
    return createPortal(
      <div className="role-modal-overlay" onClick={onClose}>
        <div className="role-modal" onClick={(e) => e.stopPropagation()}>
          <div className="role-modal-header">
            <h3>Access Denied</h3>
            <button 
              className="role-modal-close"
              onClick={onClose}
              aria-label="Close modal"
            >
              <FaTimes />
            </button>
          </div>
          <div className="role-modal-content">
            <div className="access-denied-modal">
              <div className="access-denied-icon">
                <FaShieldAlt />
              </div>
              <h4>Insufficient Permissions</h4>
              <p>You need administrator or developer privileges to manage user roles.</p>
              <p>Please contact an administrator if you believe this is an error.</p>
            </div>
          </div>
          <div className="role-modal-footer">
            <button className="role-modal-btn" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  return createPortal(
    <div className="role-modal-overlay" onClick={onClose}>
      <div className="role-modal" onClick={(e) => e.stopPropagation()}>
        <div className="role-modal-header">
          <h3>Manage Roles for {selectedUser.firstName} {selectedUser.lastName}</h3>
          <button 
            className="role-modal-close"
            onClick={onClose}
            aria-label="Close modal"
          >
            <FaTimes />
          </button>
        </div>
        <div className="role-modal-content">
          <p className="role-modal-email">{selectedUser.email}</p>
          {selectedUser.isProtected && (
            <div className="protected-account-warning">
              <FaShieldAlt />
              <span>This account is protected and roles cannot be modified.</span>
            </div>
          )}
          <div className="role-modal-roles">
            {roles.map(role => (
              <label 
                key={role.key} 
                className={`role-modal-toggle ${selectedUser.roles[role.key] ? 'active' : ''} ${pulsingRole === role.key ? 'pulse' : ''} ${selectedUser.isProtected ? 'disabled' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={selectedUser.roles[role.key]}
                  onChange={() => onToggleRole(selectedUser.uid, role.key, selectedUser.roles[role.key])}
                  disabled={selectedUser.isProtected}
                />
                <span className="role-modal-slider" style={{ '--role-color': role.color } as React.CSSProperties}>
                  <span className="role-modal-icon">{role.icon}</span>
                </span>
                <div className="role-modal-info">
                  <span className="role-modal-name">{role.name}</span>
                  <span className="role-modal-description">{role.description}</span>
                </div>
              </label>
            ))}
          </div>
        </div>
        <div className="role-modal-footer">
          <button 
            className="role-modal-save"
            onClick={onClose}
          >
            Done
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
