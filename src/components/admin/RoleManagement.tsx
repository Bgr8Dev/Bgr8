import React, { useEffect, useState, useCallback } from 'react';
import { firestore } from '../../firebase/firebase';
import { collection, query, getDocs, updateDoc, doc, orderBy, Timestamp } from 'firebase/firestore';
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
  FaCalendar
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
  };
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
  }
];

export default function RoleManagement() {
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
    newThisMonth: 0
  });
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [pulsingRole, setPulsingRole] = useState<string | null>(null);

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
            events: false
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
      default: return 0;
    }
  };

  if (loading) {
    return (
      <div className="role-management-loading">
        <div className="loading-spinner"></div>
        <p>Loading users...</p>
      </div>
    );
  }

  return (
    <div className="role-management">
      <div className="role-management-header">
        <h2>Role Management</h2>
        <p>Manage user roles and permissions across the platform</p>
      </div>

      {/* Statistics Cards */}
      <div className="role-stats">
        <div className="stat-card total">
          <div className="stat-icon">
            <FaUsers />
          </div>
          <div className="stat-content">
            <h3>Total Users</h3>
            <p>{userStats.total}</p>
          </div>
        </div>
        
        <div className="stat-card new">
          <div className="stat-icon">
            <FaChartBar />
          </div>
          <div className="stat-content">
            <h3>New This Month</h3>
            <p>{userStats.newThisMonth}</p>
          </div>
        </div>

        {ROLES.map(role => (
          <div 
            key={role.key} 
            className={`stat-card ${roleFilter === role.key ? 'active' : ''}`} 
            style={{ borderLeftColor: role.color, cursor: 'pointer' }}
            onClick={() => setRoleFilter(roleFilter === role.key ? 'all' : role.key)}
            title={`Click to filter by ${role.name}`}
          >
            <div className="stat-icon" style={{ color: role.color }}>
              {role.icon}
            </div>
            <div className="stat-content">
              <h3>{role.name}</h3>
              <p>{getRoleCount(role.key)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search and Filter Controls */}
      <div className="role-controls">
        <div className="search-container">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-container">
          <FaFilter className="filter-icon" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="role-filter"
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
              className="clear-filter-btn"
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
        <div className="filter-status">
          <span className="filter-status-text">
            Showing {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} with {ROLES.find(r => r.key === roleFilter)?.name} role
          </span>
        </div>
      )}

      {/* Users Table */}
      <div className="users-table-container">
        <table className="users-table">
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
                <td className="user-info">
                  <div className="user-name">
                    {user.firstName} {user.lastName}
                  </div>
                </td>
                <td className="user-email">{user.email}</td>
                <td className="user-roles">
                  <div className="role-badges">
                    {getUserRoles(user).map(role => (
                      <span
                        key={role.key}
                        className="role-badge"
                        style={{ backgroundColor: role.color }}
                        title={role.description}
                      >
                        {role.icon}
                        {role.name}
                      </span>
                    ))}
                    {getUserRoles(user).length === 0 && (
                      <span className="no-roles">No roles assigned</span>
                    )}
                  </div>
                </td>
                <td className="user-date">
                  {user.dateCreated?.toDate().toLocaleDateString()}
                </td>
                <td className="user-actions">
                  <div className="role-management-container">
                    <div className="role-badges-display">
                      {getUserRoles(user).map(role => (
                        <span
                          key={role.key}
                          className="role-badge-small"
                          style={{ backgroundColor: role.color }}
                          title={role.description}
                        >
                          {role.icon}
                          {role.name}
                        </span>
                      ))}
                      {getUserRoles(user).length === 0 && (
                        <span className="no-roles-small">No roles</span>
                      )}
                    </div>
                    <button
                      className="manage-roles-btn"
                      onClick={() => {
                        setSelectedUser(user);
                        setShowRoleModal(true);
                      }}
                    >
                      Manage Roles
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredUsers.length === 0 && (
        <div className="no-users">
          <FaUsers className="no-users-icon" />
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