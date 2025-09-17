import React, { useEffect, useState, useCallback } from 'react';
import { firestore } from '../../../firebase/firebase';
import { collection, query, getDocs, updateDoc, doc, orderBy, Timestamp } from 'firebase/firestore';
import { useAuth } from '../../../hooks/useAuth';
import { hasRole } from '../../../utils/userProfile';
import { 
  FaUsers, 
  FaChartBar, 
  FaSearch, 
  FaFilter,
  FaCode,
  FaUserTie,
  FaShieldAlt,
  FaBullhorn,
  FaUserCheck,
  FaCrown,
  FaShareAlt,
  FaHandshake,
  FaCalendar,
  FaBug,
  FaTimes,
  FaCog,
  FaLock
} from 'react-icons/fa';
import RoleManagementModal from './RoleManagementModal';
import './MobileRoleManagement.css';

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

const ROLES: RoleInfo[] = [
  {
    key: 'admin',
    name: 'Admin',
    description: 'Full system access and user management',
    icon: <FaCrown />,
    color: '#dc2626'
  },
  {
    key: 'developer',
    name: 'Developer',
    description: 'Technical development and system maintenance',
    icon: <FaCode />,
    color: '#2563eb'
  },
  {
    key: 'committee',
    name: 'Committee',
    description: 'Committee member with voting privileges',
    icon: <FaUserTie />,
    color: '#7c3aed'
  },
  {
    key: 'audit',
    name: 'Audit',
    description: 'Audit and compliance oversight',
    icon: <FaShieldAlt />,
    color: '#059669'
  },
  {
    key: 'marketing',
    name: 'Marketing',
    description: 'Marketing and promotional activities',
    icon: <FaBullhorn />,
    color: '#ea580c'
  },
  {
    key: 'vetting-officer',
    name: 'Vetting Officer',
    description: 'Reviews and approves applications',
    icon: <FaUserCheck />,
    color: '#0891b2'
  },
  {
    key: 'social-media',
    name: 'Social Media',
    description: 'Manages social media accounts and content',
    icon: <FaShareAlt />,
    color: '#e91e63'
  },
  {
    key: 'outreach',
    name: 'Outreach',
    description: 'Handles community outreach and partnerships',
    icon: <FaHandshake />,
    color: '#9c27b0'
  },
  {
    key: 'events',
    name: 'Events',
    description: 'Organizes and manages events and workshops',
    icon: <FaCalendar />,
    color: '#ff9800'
  },
  {
    key: 'tester',
    name: 'Tester',
    description: 'Can submit feedback and bug reports',
    icon: <FaBug />,
    color: '#f56565'
  },
  {
    key: 'ambassador',
    name: 'Ambassador',
    description: 'Brand ambassador with outreach privileges',
    icon: <FaHandshake />,
    color: '#10b981'
  }
];

export default function MobileRoleManagement() {
  const { userProfile } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [userStats, setUserStats] = useState({
    total: 0,
    admins: 0,
    developers: 0,
    committee: 0,
    audit: 0,
    marketing: 0,
    'vetting-officer': 0,
    'social-media': 0,
    outreach: 0,
    events: 0,
    tester: 0,
    newThisMonth: 0
  });
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [pulsingRole, setPulsingRole] = useState<string | null>(null);

  // Check if user has permission to manage roles
  const canManageRoles = hasRole(userProfile, 'admin') || hasRole(userProfile, 'developer');

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const usersRef = collection(firestore, 'users');
      const q = query(usersRef, orderBy('dateCreated', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const userData: UserData[] = [];
      const stats = {
        total: 0,
        admins: 0,
        developers: 0,
        committee: 0,
        audit: 0,
        marketing: 0,
        'vetting-officer': 0,
        'social-media': 0,
        outreach: 0,
        events: 0,
        tester: 0,
        newThisMonth: 0
      };

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      querySnapshot.forEach((doc) => {
        const user = doc.data() as UserData;
        
        // Ensure roles object exists with default values
        if (!user.roles) {
          user.roles = {
            admin: false,
            developer: false,
            committee: false,
            audit: false,
            marketing: false,
            'vetting-officer': false,
            'social-media': false,
            outreach: false,
            events: false,
            tester: false,
            ambassador: false
          };
        }

        userData.push(user);
        stats.total++;

        // Count roles
        Object.keys(user.roles).forEach(roleKey => {
          if (user.roles[roleKey as keyof typeof user.roles]) {
            stats[roleKey as keyof typeof stats]++;
          }
        });

        // Count new users this month
        if (user.dateCreated && user.dateCreated.toDate() > thirtyDaysAgo) {
          stats.newThisMonth++;
        }
      });

      setUsers(userData);
      setUserStats(stats);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (canManageRoles) {
      fetchUsers();
    }
  }, [canManageRoles, fetchUsers]);

  const getUserRoles = (user: UserData): RoleInfo[] => {
    return ROLES.filter(role => user.roles[role.key]);
  };

  const getRoleCount = (roleKey: string): number => {
    return users.filter(user => user.roles[roleKey as keyof UserData['roles']]).length;
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = searchTerm === '' || 
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.roles[roleFilter as keyof UserData['roles']];
    
    return matchesSearch && matchesRole;
  });

  const handleRoleUpdate = async (userId: string, roleKey: string, value: boolean) => {
    try {
      // Check if user is protected
      const user = users.find(u => u.uid === userId);
      if (user?.isProtected) {
        alert('This account is protected and cannot have its roles modified.');
        return;
      }

      const userRef = doc(firestore, 'users', userId);
      await updateDoc(userRef, {
        [`roles.${roleKey}`]: value
      });
      
      // Update local state
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.uid === userId 
            ? { ...user, roles: { ...user.roles, [roleKey]: value } }
            : user
        )
      );
      
      // Trigger pulse animation
      setPulsingRole(roleKey);
      setTimeout(() => setPulsingRole(null), 1000);
      
    } catch (error) {
      console.error('Error updating role:', error);
    }
  };

  if (!canManageRoles) {
    return (
      <div className="mobile-role-management">
        <div className="access-denied">
          <FaShieldAlt className="access-denied-icon" />
          <h3>Access Denied</h3>
          <p>You don't have permission to manage user roles.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mobile-role-management">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-role-management">
      {/* Header Stats */}
      <div className="mobile-stats-grid">
        <div className="mobile-stat-card total">
          <div className="stat-icon">
            <FaUsers />
          </div>
          <div className="stat-content">
            <h3>Total Users</h3>
            <p>{userStats.total}</p>
          </div>
        </div>
        
        <div className="mobile-stat-card new">
          <div className="stat-icon">
            <FaChartBar />
          </div>
          <div className="stat-content">
            <h3>New This Month</h3>
            <p>{userStats.newThisMonth}</p>
          </div>
        </div>
        
        <div className="mobile-stat-card admin">
          <div className="stat-icon">
            <FaCrown />
          </div>
          <div className="stat-content">
            <h3>Admins</h3>
            <p>{userStats.admins}</p>
          </div>
        </div>
      </div>

      {/* Role Filter Cards */}
      <div className="mobile-role-filters">
        <h4>Filter by Role</h4>
        <div className="role-filter-grid">
          {ROLES.map(role => (
            <div 
              key={role.key} 
              className={`mobile-role-filter-card ${roleFilter === role.key ? 'active' : ''}`} 
              style={{ borderLeftColor: role.color }}
              onClick={() => setRoleFilter(roleFilter === role.key ? 'all' : role.key)}
            >
              <div className="role-icon" style={{ color: role.color }}>
                {role.icon}
              </div>
              <div className="role-info">
                <span className="role-name">{role.name}</span>
                <span className="role-count">{getRoleCount(role.key)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="mobile-search-container">
        <FaSearch className="search-icon" />
        <input
          type="text"
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mobile-search-input"
        />
        {searchTerm && (
          <button 
            className="clear-search-btn"
            onClick={() => setSearchTerm('')}
            title="Clear search"
            aria-label="Clear search"
          >
            <FaTimes />
          </button>
        )}
      </div>

      {/* Active Filter */}
      {roleFilter !== 'all' && (
        <div className="mobile-filter-status">
          <div className="filter-tag">
            <FaFilter />
            <span>{ROLES.find(r => r.key === roleFilter)?.name} ({filteredUsers.length})</span>
            <button
              className="clear-filter-btn"
              onClick={() => setRoleFilter('all')}
              title="Clear filter"
              aria-label="Clear filter"
            >
              <FaTimes />
            </button>
          </div>
          <p>Showing {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} with {ROLES.find(r => r.key === roleFilter)?.name} role</p>
        </div>
      )}

      {/* Users List */}
      <div className="mobile-users-list">
        {filteredUsers.map((user) => (
          <div key={user.uid} className="mobile-user-card">
            <div className="user-header">
              <div className="user-info">
                <h4 className="user-name">
                  {user.firstName} {user.lastName}
                  {user.isProtected && (
                    <FaLock 
                      className="protected-indicator" 
                      title="Protected Account - Roles cannot be modified"
                      style={{ marginLeft: '8px', color: '#e53e3e' }}
                    />
                  )}
                </h4>
                <p className="user-email">{user.email}</p>
                <p className="user-date">
                  Joined: {user.dateCreated?.toDate().toLocaleDateString()}
                </p>
              </div>
              <button
                className={`manage-roles-btn ${user.isProtected ? 'disabled' : ''}`}
                onClick={() => {
                  if (user.isProtected) {
                    alert('This account is protected and cannot have its roles modified.');
                    return;
                  }
                  setSelectedUser(user);
                  setShowRoleModal(true);
                }}
                disabled={user.isProtected}
                title={user.isProtected ? 'Protected Account - Roles cannot be modified' : 'Manage user roles'}
              >
                <FaCog />
                {user.isProtected ? 'Protected' : 'Manage'}
              </button>
            </div>
            
            <div className="user-roles">
              {getUserRoles(user).length > 0 ? (
                <div className="role-badges">
                  {getUserRoles(user).map(role => (
                    <span
                      key={role.key}
                      className={`role-badge ${pulsingRole === role.key ? 'pulse' : ''}`}
                      style={{ backgroundColor: role.color }}
                      title={role.description}
                    >
                      {role.icon}
                      {role.name}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="no-roles">
                  <span className="no-roles-text">No roles assigned</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <div className="mobile-no-users">
          <FaUsers className="no-users-icon" />
          <h3>No users found</h3>
          <p>Try adjusting your search or filter criteria</p>
        </div>
      )}

      {/* Role Management Modal */}
      {selectedUser && (
        <RoleManagementModal
          selectedUser={selectedUser}
          isOpen={showRoleModal}
          onClose={() => {
            setShowRoleModal(false);
            setSelectedUser(null);
          }}
          onToggleRole={handleRoleUpdate}
          pulsingRole={pulsingRole}
          roles={ROLES}
        />
      )}
    </div>
  );
}
