import React, { useState, useEffect, useCallback } from 'react';
import { firestore } from '../../../firebase/firebase';
import { collection, query, getDocs, updateDoc, doc, orderBy, Timestamp } from 'firebase/firestore';
import { useAuth } from '../../../hooks/useAuth';
import { hasRole } from '../../../utils/userProfile';
import { 
  FaLock, 
  FaUnlock, 
  FaSearch, 
  FaUsers, 
  FaShieldAlt,
  FaExclamationTriangle,
  FaCheck,
  FaTimes,
  FaChevronDown,
  FaChevronRight,
  FaFilter
} from 'react-icons/fa';
import './BlueLocked.css';

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

export default function BlueLocked() {
  const { userProfile } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingUsers, setUpdatingUsers] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isWidgetExpanded, setIsWidgetExpanded] = useState(true);
  const [expandedSections, setExpandedSections] = useState<{
    stats: boolean;
    search: boolean;
    users: boolean;
    info: boolean;
  }>({
    stats: true,
    search: true,
    users: true,
    info: false
  });
  const [filterStatus, setFilterStatus] = useState<'all' | 'protected' | 'unprotected'>('all');

  // Check if user has permission to manage protected accounts
  const canManageProtected = hasRole(userProfile, 'admin') || hasRole(userProfile, 'developer');

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const usersRef = collection(firestore, 'users');
      const q = query(usersRef, orderBy('dateCreated', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const userData: UserData[] = [];
      querySnapshot.forEach((doc) => {
        const user = doc.data() as UserData;
        userData.push(user);
      });
      
      setUsers(userData);
    } catch (error) {
      console.error('Error fetching users:', error);
      setMessage({ type: 'error', text: 'Failed to fetch users. Please try again.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (canManageProtected) {
      fetchUsers();
    }
  }, [canManageProtected, fetchUsers]);

  const toggleProtection = async (uid: string, currentStatus: boolean) => {
    try {
      setUpdatingUsers(prev => new Set(prev).add(uid));
      setMessage(null);

      const userRef = doc(firestore, 'users', uid);
      await updateDoc(userRef, {
        isProtected: !currentStatus,
        lastUpdated: Timestamp.now()
      });
      
      // Update local state
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.uid === uid 
            ? { ...user, isProtected: !currentStatus }
            : user
        )
      );
      
      setMessage({ 
        type: 'success', 
        text: `Account ${!currentStatus ? 'protected' : 'unprotected'} successfully!` 
      });
      
    } catch (error) {
      console.error('Error updating protection status:', error);
      setMessage({ type: 'error', text: 'Failed to update protection status. Please try again.' });
    } finally {
      setUpdatingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(uid);
        return newSet;
      });
    }
  };

  const toggleWidget = () => {
    setIsWidgetExpanded(!isWidgetExpanded);
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = searchTerm === '' || 
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || 
      (filterStatus === 'protected' && user.isProtected) ||
      (filterStatus === 'unprotected' && !user.isProtected);
    
    return matchesSearch && matchesFilter;
  });

  const protectedCount = users.filter(user => user.isProtected).length;
  const unprotectedCount = users.length - protectedCount;

  if (!canManageProtected) {
    return (
      <div className="blue-locked">
        <div className="access-denied">
          <FaShieldAlt className="access-denied-icon" />
          <h3>Access Denied</h3>
          <p>You don't have permission to manage protected accounts.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="blue-locked">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="blue-locked-widget">
      {/* Widget Header */}
      <div className="widget-header" onClick={toggleWidget}>
        <div className="widget-title">
          <FaLock className="widget-icon" />
          <h3>Blue Locked Accounts</h3>
          <span className="widget-summary">
            {protectedCount} protected, {unprotectedCount} unprotected
          </span>
        </div>
        <div className="widget-expand-icon">
          {isWidgetExpanded ? <FaChevronDown /> : <FaChevronRight />}
        </div>
      </div>

      {/* Widget Content */}
      {isWidgetExpanded && (
        <div className="widget-content">
          {/* Compact Header */}
          <div className="blue-locked-header">
            <div className="header-title" onClick={() => toggleSection('stats')}>
              <div className="title-content">
                <FaLock className="header-icon" />
                <h4>Protection Statistics</h4>
                <span className="user-count">({users.length} users)</span>
              </div>
              <div className="expand-icon">
                {expandedSections.stats ? <FaChevronDown /> : <FaChevronRight />}
              </div>
            </div>
            
            {expandedSections.stats && (
              <div className="protection-stats-compact">
                <div className="stat-item protected">
                  <FaLock />
                  <span>{protectedCount}</span>
                </div>
                <div className="stat-item unprotected">
                  <FaUnlock />
                  <span>{unprotectedCount}</span>
                </div>
              </div>
            )}
          </div>

          {message && (
            <div className={`message ${message.type}`}>
              <div className="message-icon">
                {message.type === 'success' ? <FaCheck /> : <FaExclamationTriangle />}
              </div>
              <span>{message.text}</span>
              <button 
                className="message-close"
                onClick={() => setMessage(null)}
                aria-label="Close message"
              >
                <FaTimes />
              </button>
            </div>
          )}

          {/* Expandable Search & Filter Section */}
          <div className="search-section">
            <div className="search-header" onClick={() => toggleSection('search')}>
              <div className="search-title">
                <FaSearch />
                <span>Search & Filter</span>
                <span className="filter-count">({filteredUsers.length} results)</span>
              </div>
              <div className="expand-icon">
                {expandedSections.search ? <FaChevronDown /> : <FaChevronRight />}
              </div>
            </div>
            
            {expandedSections.search && (
              <div className="search-controls">
                <div className="search-container">
                  <FaSearch className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                </div>
                <div className="filter-container">
                  <FaFilter className="filter-icon" />
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as 'all' | 'protected' | 'unprotected')}
                    className="filter-select"
                  >
                    <option value="all">All Users</option>
                    <option value="protected">Protected Only</option>
                    <option value="unprotected">Unprotected Only</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Expandable Users List */}
          <div className="users-section">
            <div className="users-header" onClick={() => toggleSection('users')}>
              <div className="users-title">
                <FaUsers />
                <span>Users ({filteredUsers.length})</span>
              </div>
              <div className="expand-icon">
                {expandedSections.users ? <FaChevronDown /> : <FaChevronRight />}
              </div>
            </div>
            
            {expandedSections.users && (
              <div className="users-list-compact">
                {filteredUsers.length === 0 ? (
                  <div className="no-users">
                    <FaUsers className="no-users-icon" />
                    <h4>No users found</h4>
                    <p>Try adjusting your search criteria</p>
                  </div>
                ) : (
                  filteredUsers.map((user) => (
                    <div key={user.uid} className={`user-card-compact ${user.isProtected ? 'protected' : 'unprotected'}`}>
                      <div className="user-info-compact">
                        <div className="user-avatar-compact">
                          {user.isProtected ? <FaLock /> : <FaUnlock />}
                        </div>
                        <div className="user-details-compact">
                          <div className="user-name-compact">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="user-email-compact">{user.email}</div>
                          <div className="user-roles-compact">
                            {Object.entries(user.roles)
                              .filter(([, hasRole]) => hasRole)
                              .slice(0, 3)
                              .map(([role]) => (
                                <span key={role} className="role-badge-compact">
                                  {role}
                                </span>
                              ))
                            }
                            {Object.entries(user.roles).filter(([, hasRole]) => hasRole).length > 3 && (
                              <span className="role-badge-compact more">
                                +{Object.entries(user.roles).filter(([, hasRole]) => hasRole).length - 3}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="user-actions-compact">
                        <button
                          className={`protection-toggle-compact ${user.isProtected ? 'protected' : 'unprotected'}`}
                          onClick={() => toggleProtection(user.uid, user.isProtected || false)}
                          disabled={updatingUsers.has(user.uid)}
                          title={user.isProtected ? 'Remove protection' : 'Add protection'}
                        >
                          {updatingUsers.has(user.uid) ? (
                            <div className="loading-spinner-small" />
                          ) : user.isProtected ? (
                            <FaUnlock />
                          ) : (
                            <FaLock />
                          )}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Expandable Info Section */}
          <div className="info-section">
            <div className="info-header" onClick={() => toggleSection('info')}>
              <div className="info-title">
                <FaShieldAlt />
                <span>About Blue Locked Accounts</span>
              </div>
              <div className="expand-icon">
                {expandedSections.info ? <FaChevronDown /> : <FaChevronRight />}
              </div>
            </div>
            
            {expandedSections.info && (
              <div className="info-content">
                <p>
                  Protected accounts cannot have their roles modified through the admin interface. 
                  This provides an additional security layer for critical accounts.
                </p>
                <div className="info-tips">
                  <h6>Quick Tips:</h6>
                  <ul>
                    <li>Use the search to find specific users quickly</li>
                    <li>Filter by protection status to see only protected or unprotected accounts</li>
                    <li>Click the lock/unlock button to toggle protection</li>
                    <li>Protected accounts show a red lock icon in the role management interface</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
