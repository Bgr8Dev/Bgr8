import React from 'react';
import { FaCrown, FaCode, FaUsers, FaShieldAlt, FaBullhorn, FaUserCheck } from 'react-icons/fa';
import { UserProfile, getUserRoles } from '../../utils/userProfile';
import './UserRoleBadge.css';

interface UserRoleBadgeProps {
  userProfile: UserProfile | null;
  showAll?: boolean;
  maxDisplay?: number;
}

const roleIcons = {
  admin: FaCrown,
  developer: FaCode,
  committee: FaUsers,
  'vetting-officer': FaUserCheck,
  audit: FaShieldAlt,
  marketing: FaBullhorn,
  'social-media': FaBullhorn,
  outreach: FaUsers,
  events: FaUsers,
  ambassador: FaUserCheck
};

const roleColors = {
  admin: '#e74c3c',
  developer: '#f39c12',
  committee: '#9b59b6',
  'vetting-officer': '#3498db',
  audit: '#2ecc71',
  marketing: '#e67e22',
  'social-media': '#1abc9c',
  outreach: '#34495e',
  events: '#8e44ad',
  ambassador: '#16a085'
};

const roleNames = {
  admin: 'Admin',
  developer: 'Dev',
  committee: 'Committee',
  'vetting-officer': 'Vetting',
  audit: 'Audit',
  marketing: 'Marketing',
  'social-media': 'Social Media',
  outreach: 'Outreach',
  events: 'Events',
  ambassador: 'Ambassador'
};

export const UserRoleBadge: React.FC<UserRoleBadgeProps> = ({ 
  userProfile, 
  showAll = false, 
  maxDisplay = 3 
}) => {
  if (!userProfile) return null;

  const roles = getUserRoles(userProfile);
  
  if (roles.length === 0) return null;

  const displayRoles = showAll ? roles : roles.slice(0, maxDisplay);
  const remainingCount = roles.length - displayRoles.length;

  return (
    <div className="user-role-badges">
      {displayRoles.map(role => {
        const Icon = roleIcons[role];
        const color = roleColors[role];
        const name = roleNames[role];
        
        return (
          <div 
            key={role} 
            className="user-role-badge"
            style={{ borderColor: color, color: color }}
            title={`${name} role`}
          >
            <Icon className="role-icon" />
            <span className="role-name">{name}</span>
          </div>
        );
      })}
      {remainingCount > 0 && (
        <div className="user-role-badge more-roles" title={`+${remainingCount} more roles`}>
          +{remainingCount}
        </div>
      )}
    </div>
  );
};
