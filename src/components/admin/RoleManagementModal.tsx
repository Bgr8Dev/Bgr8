import React from 'react';
import { createPortal } from 'react-dom';
import { FaTimes } from 'react-icons/fa';
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
  };
  dateCreated?: any;
}

interface Role {
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
  roles: Role[];
}

export default function RoleManagementModal({
  isOpen,
  onClose,
  selectedUser,
  onToggleRole,
  pulsingRole,
  roles
}: RoleManagementModalProps) {
  if (!isOpen || !selectedUser) return null;

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
          <div className="role-modal-roles">
            {roles.map(role => (
              <label 
                key={role.key} 
                className={`role-modal-toggle ${selectedUser.roles[role.key] ? 'active' : ''} ${pulsingRole === role.key ? 'pulse' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={selectedUser.roles[role.key]}
                  onChange={() => onToggleRole(selectedUser.uid, role.key, selectedUser.roles[role.key])}
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
