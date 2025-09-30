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
  FaLock
} from 'react-icons/fa';
import RoleManagementModal from './RoleManagementModal';
import './RoleManagement.css';

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
    color: '#e53e3e'
  },
  {
    key: 'developer',
    name: 'Developer',
    description: 'Access to developer tools and testing features',
    icon: <FaCode />,
    color: '#3182ce'
  },
  {
    key: 'committee',
    name: 'Committee',
    description: 'Committee member with special privileges',
    icon: <FaUserTie />,
    color: '#805ad5'
  },
  {
    key: 'audit',
    name: 'Audit',
    description: 'Access to audit logs and compliance features',
    icon: <FaShieldAlt />,
    color: '#d69e2e'
  },
  {
    key: 'marketing',
    name: 'Marketing',
    description: 'Access to marketing tools and analytics',
    icon: <FaBullhorn />,
    color: '#38a169'
  },
  {
    key: 'vetting-officer',
    name: 'Vetting Officer',
    description: 'Can review and approve mentor applications',
    icon: <FaUserCheck />,
    color: '#dd6b20'
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

export default function RoleManagement() {
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
        if (user.roles.admin === true) stats.admins++;
        if (user.roles.developer === true) stats.developers++;
        if (user.roles.committee === true) stats.committee++;
        if (user.roles.audit === true) stats.audit++;
        if (user.roles.marketing === true) stats.marketing++;
        if (user.roles['vetting-officer'] === true) stats['vetting-officer']++;
        if (user.roles['social-media'] === true) stats['social-media']++;
        if (user.roles.outreach === true) stats.outreach++;
        if (user.roles.events === true) stats.events++;
        if (user.roles.tester === true) stats.tester++;
        
        if (user.dateCreated?.toDate() > thirtyDaysAgo) stats.newThisMonth++;
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
    fetchUsers();
  }, [fetchUsers]);

  const toggleUserRole = async (uid: string, role: keyof UserData['roles'], currentStatus: boolean) => {
    try {
      // Check if user is protected
      const user = users.find(u => u.uid === uid);
      if (user?.isProtected) {
        alert('This account is protected and cannot have its roles modified.');
        return;
      }

      // Add pulse animation
      setPulsingRole(role);
      setTimeout(() => setPulsingRole(null), 600);
      
      const userRef = doc(firestore, 'users', uid);
      await updateDoc(userRef, {
        [`roles.${role}`]: !currentStatus,
        lastUpdated: Timestamp.now()
      });
      
      // Update local state
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.uid === uid 
            ? { ...user, roles: { ...user.roles, [role]: !currentStatus } }
            : user
        )
      );
      
      // Update selectedUser if it's the same user
      if (selectedUser && selectedUser.uid === uid) {
        const updatedUser: UserData = { 
          ...selectedUser, 
          roles: { ...selectedUser.roles, [role]: !currentStatus } 
        };
        setSelectedUser(updatedUser);
      }
      
      // Update stats
      setUserStats(prevStats => {
        const newStats = { ...prevStats };
        
        // Update the specific role count
        switch (role) {
          case 'admin':
            newStats.admins = currentStatus ? newStats.admins - 1 : newStats.admins + 1;
            break;
          case 'developer':
            newStats.developers = currentStatus ? newStats.developers - 1 : newStats.developers + 1;
            break;
          case 'committee':
            newStats.committee = currentStatus ? newStats.committee - 1 : newStats.committee + 1;
            break;
          case 'audit':
            newStats.audit = currentStatus ? newStats.audit - 1 : newStats.audit + 1;
            break;
          case 'marketing':
            newStats.marketing = currentStatus ? newStats.marketing - 1 : newStats.marketing + 1;
            break;
          case 'vetting-officer':
            newStats['vetting-officer'] = currentStatus ? newStats['vetting-officer'] - 1 : newStats['vetting-officer'] + 1;
            break;
          case 'social-media':
            newStats['social-media'] = currentStatus ? newStats['social-media'] - 1 : newStats['social-media'] + 1;
            break;
          case 'outreach':
            newStats.outreach = currentStatus ? newStats.outreach - 1 : newStats.outreach + 1;
            break;
          case 'events':
            newStats.events = currentStatus ? newStats.events - 1 : newStats.events + 1;
            break;
        }
        
        
        return newStats;
      });
    } catch (error) {
      console.error('Error updating user role:', error);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (roleFilter === 'all') return matchesSearch;
    
    return matchesSearch && user.roles[roleFilter as keyof UserData['roles']];
  });

  const getUserRoles = (user: UserData) => {
    return ROLES.filter(role => user.roles[role.key]);
  };

  const getRoleCount = (roleKey: keyof UserData['roles']): number => {
    switch (roleKey) {
      case 'admin': return userStats.admins;
      case 'developer': return userStats.developers;
      case 'committee': return userStats.committee;
      case 'audit': return userStats.audit;
      case 'marketing': return userStats.marketing;
      case 'vetting-officer': return userStats['vetting-officer'];
      case 'social-media': return userStats['social-media'];
      case 'outreach': return userStats.outreach;
      case 'events': return userStats.events;
      case 'tester': return userStats.tester;
      default: return 0;
    }
  };

  if (loading) {
    return (
      <div className="role-management-loading">
        <div className="rm-loading-spinner"></div>
        <p>Loading users...</p>
      </div>
    );
  }

  // Access control check
  if (!canManageRoles) {
    return (
      <div className="role-management-access-denied">
        <div className="rm-access-denied-content">
          <div className="rm-access-denied-icon">
            <FaShieldAlt />
          </div>
          <h2>Access Denied</h2>
          <p>You need administrator or developer privileges to access role management.</p>
          <p>Please contact an administrator if you believe this is an error.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rm-role-management">
      <div className="rm-role-management-header">
        <h2>Role Management</h2>
        <p>Manage user roles and permissions across the platform</p>
      </div>

      {/* Statistics Cards */}
      <div className="rm-role-stats">
        <div className="rm-stat-card rm-total">
          <div className="rm-stat-icon">
            <FaUsers />
          </div>
          <div className="rm-stat-content">
            <h3>Total Users</h3>
            <p>{userStats.total}</p>
          </div>
        </div>
        
        <div className="rm-stat-card rm-new">
          <div className="rm-stat-icon">
            <FaChartBar />
          </div>
          <div className="rm-stat-content">
            <h3>New This Month</h3>
            <p>{userStats.newThisMonth}</p>
          </div>
        </div>

        {ROLES.map(role => (
          <div 
            key={role.key} 
            className={`rm-stat-card ${roleFilter === role.key ? 'active' : ''}`} 
            style={{ borderLeftColor: role.color, cursor: 'pointer' }}
            onClick={() => setRoleFilter(roleFilter === role.key ? 'all' : role.key)}
            title={`Click to filter by ${role.name}`}
          >
            <div className="rm-stat-icon" style={{ color: role.color }}>
              {role.icon}
            </div>
            <div className="rm-stat-content">
              <h3>{role.name}</h3>
              <p>{getRoleCount(role.key)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search and Filter Controls */}
      <div className="rm-role-controls">
        <div className="rm-search-container">
          <FaSearch className="rm-search-icon" />
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="rm-search-input"
          />
        </div>

        <div className="rm-filter-container">
          <FaFilter className="rm-filter-icon" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rm-role-filter"
          >
            <option value="all">All Roles</option>
            {ROLES.map(role => (
              <option key={role.key} value={role.key}>
                {role.name} ({getRoleCount(role.key)})
              </option>
            ))}
          </select>
          {roleFilter !== 'all' && (
            <button
              className="rm-clear-filter-btn"
              onClick={() => setRoleFilter('all')}
              title="Clear filter"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Filter Status */}
      {roleFilter !== 'all' && (
        <div className="rm-filter-status">
          <span className="rm-filter-status-text">
            Showing {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} with {ROLES.find(r => r.key === roleFilter)?.name} role
          </span>
        </div>
      )}

      {/* Users Table */}
      <div className="rm-users-table-container">
        <table className="rm-users-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Roles</th>
              <th>Date Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.uid}>
                <td className="rm-user-info">
                  <div className="rm-user-name">
                    {user.firstName} {user.lastName}
                    {user.isProtected && (
                      <FaLock 
                        className="rm-protected-indicator" 
                        title="Protected Account - Roles cannot be modified"
                        style={{ marginLeft: '8px', color: '#e53e3e' }}
                      />
                    )}
                  </div>
                </td>
                <td className="rm-user-email">{user.email}</td>
                <td className="rm-user-roles">
                  <div className="rm-role-badges">
                    {getUserRoles(user).map(role => (
                      <span
                        key={role.key}
                        className="rm-role-badge"
                        style={{ backgroundColor: role.color }}
                        title={role.description}
                      >
                        {role.icon}
                        {role.name}
                      </span>
                    ))}
                    {getUserRoles(user).length === 0 && (
                      <span className="rm-no-roles">No roles assigned</span>
                    )}
                  </div>
                </td>
                <td className="rm-user-date">
                  {user.dateCreated?.toDate().toLocaleDateString()}
                </td>
                <td className="rm-user-actions">
                  <div className="rm-role-management-container">
                    <div className="rm-role-badges-display">
                      {getUserRoles(user).map(role => (
                        <span
                          key={role.key}
                          className="rm-role-badge-small"
                          style={{ backgroundColor: role.color }}
                          title={role.description}
                        >
                          {role.icon}
                          {role.name}
                        </span>
                      ))}
                      {getUserRoles(user).length === 0 && (
                        <span className="rm-no-roles-small">No roles</span>
                      )}
                    </div>
                    <button
                      className={`rm-manage-roles-btn ${user.isProtected ? 'disabled' : ''}`}
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
                      {user.isProtected ? 'Protected' : 'Manage Roles'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredUsers.length === 0 && (
        <div className="rm-no-users">
          <FaUsers className="rm-no-users-icon" />
          <h3>No users found</h3>
          <p>Try adjusting your search or filter criteria</p>
        </div>
      )}

      {/* Role Management Modal */}
        <RoleManagementModal
          isOpen={showRoleModal}
          onClose={() => setShowRoleModal(false)}
          selectedUser={selectedUser}
          onToggleRole={toggleUserRole}
          pulsingRole={pulsingRole}
          roles={ROLES}
        />
    </div>
  );
}