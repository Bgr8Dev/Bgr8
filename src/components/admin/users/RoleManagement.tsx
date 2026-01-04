import React, { useEffect, useState, useCallback } from 'react';
import { firestore } from '../../../firebase/firebase';
import { collection, query, getDocs, updateDoc, doc, orderBy, Timestamp, deleteDoc, where, writeBatch, getDoc } from 'firebase/firestore';
import { useAuth } from '../../../hooks/useAuth';
import { hasRole } from '../../../utils/userProfile';
import { loggers } from '../../../utils/logger';
import { PasswordHistoryService } from '../../../services/passwordHistoryService';
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
  FaLock,
  FaTrash
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
  const [userToDelete, setUserToDelete] = useState<UserData | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingUser, setDeletingUser] = useState(false);
  const [deleteStatus, setDeleteStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Check if user has permission to manage roles
  const canManageRoles = hasRole(userProfile, 'admin') || hasRole(userProfile, 'developer');
  // Check if user is a developer (only developers can delete users)
  const isDeveloper = hasRole(userProfile, 'developer');

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
      loggers.error.error('Error fetching users:', error);
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
      loggers.error.error('Error updating user role:', error);
    }
  };

  const handleDeleteUser = async (user: UserData) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;

    setDeletingUser(true);
    setDeleteStatus(null);
    const userId = userToDelete.uid;

    try {
      loggers.log.log(`Starting deletion of user ${userId} (${userToDelete.email})`);

      // Prevent deleting yourself
      if (userProfile?.uid === userId) {
        setDeleteStatus({ type: 'error', message: 'You cannot delete your own account.' });
        setDeletingUser(false);
        setShowDeleteModal(false);
        setUserToDelete(null);
        return;
      }

      // Prevent deleting protected users
      if (userToDelete.isProtected) {
        setDeleteStatus({ type: 'error', message: 'Protected accounts cannot be deleted.' });
        setDeletingUser(false);
        setShowDeleteModal(false);
        setUserToDelete(null);
        return;
      }

      const batch = writeBatch(firestore);
      let deletedCount = 0;

      // 1. Delete all bookings where user is mentor or mentee
      const mentorBookingsQuery = query(
        collection(firestore, 'bookings'),
        where('mentorId', '==', userId)
      );
      const menteeBookingsQuery = query(
        collection(firestore, 'bookings'),
        where('menteeId', '==', userId)
      );
      
      const [mentorBookingsSnapshot, menteeBookingsSnapshot] = await Promise.all([
        getDocs(mentorBookingsQuery),
        getDocs(menteeBookingsQuery)
      ]);

      mentorBookingsSnapshot.forEach((bookingDoc) => {
        batch.delete(bookingDoc.ref);
        deletedCount++;
      });
      menteeBookingsSnapshot.forEach((bookingDoc) => {
        batch.delete(bookingDoc.ref);
        deletedCount++;
      });

      loggers.log.log(`Found ${mentorBookingsSnapshot.size + menteeBookingsSnapshot.size} bookings to delete`);

      // 2. Delete all sessions where user is mentor or mentee
      const mentorSessionsQuery = query(
        collection(firestore, 'sessions'),
        where('mentorId', '==', userId)
      );
      const menteeSessionsQuery = query(
        collection(firestore, 'sessions'),
        where('menteeId', '==', userId)
      );

      const [mentorSessionsSnapshot, menteeSessionsSnapshot] = await Promise.all([
        getDocs(mentorSessionsQuery),
        getDocs(menteeSessionsQuery)
      ]);

      // Delete session feedback subcollections
      for (const sessionDoc of [...mentorSessionsSnapshot.docs, ...menteeSessionsSnapshot.docs]) {
        try {
          const feedbackRef = collection(firestore, 'sessions', sessionDoc.id, 'feedback');
          const feedbackSnapshot = await getDocs(feedbackRef);
          
          for (const feedbackDoc of feedbackSnapshot.docs) {
            // Delete feedback questions subcollection
            try {
              const questionsRef = collection(firestore, 'sessions', sessionDoc.id, 'feedback', feedbackDoc.id, 'questions');
              const questionsSnapshot = await getDocs(questionsRef);
              questionsSnapshot.forEach((questionDoc) => {
                batch.delete(questionDoc.ref);
              });
            } catch (error) {
              loggers.error.error(`Error deleting questions for feedback ${feedbackDoc.id}:`, error);
            }
            batch.delete(feedbackDoc.ref);
          }
        } catch (error) {
          loggers.error.error(`Error deleting feedback for session ${sessionDoc.id}:`, error);
        }
        batch.delete(sessionDoc.ref);
        deletedCount++;
      }

      loggers.log.log(`Found ${mentorSessionsSnapshot.size + menteeSessionsSnapshot.size} sessions to delete`);

      // 3. Delete all feedback where user is the submitter, mentor, or mentee
      const feedbackAsSubmitterQuery = query(
        collection(firestore, 'feedback'),
        where('submittedBy', '==', userId)
      );
      const feedbackAsMentorQuery = query(
        collection(firestore, 'feedback'),
        where('mentorId', '==', userId)
      );
      const feedbackAsMenteeQuery = query(
        collection(firestore, 'feedback'),
        where('menteeId', '==', userId)
      );

      const [submitterFeedback, mentorFeedback, menteeFeedback] = await Promise.all([
        getDocs(feedbackAsSubmitterQuery),
        getDocs(feedbackAsMentorQuery),
        getDocs(feedbackAsMenteeQuery)
      ]);

      // Combine and deduplicate feedback documents
      const feedbackDocs = new Map();
      [...submitterFeedback.docs, ...mentorFeedback.docs, ...menteeFeedback.docs].forEach((doc) => {
        feedbackDocs.set(doc.id, doc);
      });

      feedbackDocs.forEach((feedbackDoc) => {
        batch.delete(feedbackDoc.ref);
        deletedCount++;
      });

      loggers.log.log(`Found ${feedbackDocs.size} feedback documents to delete`);

      // 4. Delete all messages and conversations where user is a participant
      const messagesAsSenderQuery = query(
        collection(firestore, 'messages'),
        where('senderId', '==', userId)
      );
      const messagesAsRecipientQuery = query(
        collection(firestore, 'messages'),
        where('recipientId', '==', userId)
      );

      const [senderMessages, recipientMessages] = await Promise.all([
        getDocs(messagesAsSenderQuery),
        getDocs(messagesAsRecipientQuery)
      ]);

      // Combine and deduplicate messages
      const messageDocs = new Map();
      [...senderMessages.docs, ...recipientMessages.docs].forEach((doc) => {
        messageDocs.set(doc.id, doc);
      });

      messageDocs.forEach((messageDoc) => {
        batch.delete(messageDoc.ref);
        deletedCount++;
      });

      loggers.log.log(`Found ${messageDocs.size} messages to delete`);

      // Delete conversations where user is a participant
      const conversationsAsParticipant1Query = query(
        collection(firestore, 'conversations'),
        where('participant1Id', '==', userId)
      );
      const conversationsAsParticipant2Query = query(
        collection(firestore, 'conversations'),
        where('participant2Id', '==', userId)
      );

      const [participant1Convs, participant2Convs] = await Promise.all([
        getDocs(conversationsAsParticipant1Query),
        getDocs(conversationsAsParticipant2Query)
      ]);

      // Combine and deduplicate conversations
      const conversationDocs = new Map();
      [...participant1Convs.docs, ...participant2Convs.docs].forEach((doc) => {
        conversationDocs.set(doc.id, doc);
      });

      conversationDocs.forEach((conversationDoc) => {
        batch.delete(conversationDoc.ref);
        deletedCount++;
      });

      loggers.log.log(`Found ${conversationDocs.size} conversations to delete`);

      // 5. Delete enquiries created by the user (if userId field exists)
      try {
        const enquiriesQuery = query(
          collection(firestore, 'enquiries'),
          where('userId', '==', userId)
        );
        const enquiriesSnapshot = await getDocs(enquiriesQuery);
        enquiriesSnapshot.forEach((enquiryDoc) => {
          batch.delete(enquiryDoc.ref);
          deletedCount++;
        });
        loggers.log.log(`Found ${enquiriesSnapshot.size} enquiries to delete`);
      } catch (error) {
        loggers.error.error('Error deleting enquiries (field may not exist):', error);
      }

      // 6. Delete ambassador applications by the user
      try {
        const ambassadorAppsQuery = query(
          collection(firestore, 'ambassadorApplications'),
          where('userId', '==', userId)
        );
        const ambassadorAppsSnapshot = await getDocs(ambassadorAppsQuery);
        ambassadorAppsSnapshot.forEach((appDoc) => {
          batch.delete(appDoc.ref);
          deletedCount++;
        });
        loggers.log.log(`Found ${ambassadorAppsSnapshot.size} ambassador applications to delete`);
      } catch (error) {
        loggers.error.error('Error deleting ambassador applications (field may not exist):', error);
      }

      // 7. Delete user subcollections (mentorProgram, availabilities, etc.)
      try {
        // Delete mentorProgram/profile if it exists
        const mentorProfileRef = doc(firestore, 'users', userId, 'mentorProgram', 'profile');
        const mentorProfileDoc = await getDoc(mentorProfileRef);
        if (mentorProfileDoc.exists()) {
          batch.delete(mentorProfileRef);
          deletedCount++;
        }

        // Delete availabilities/default if it exists
        const availabilitiesRef = doc(firestore, 'users', userId, 'availabilities', 'default');
        const availabilitiesDoc = await getDoc(availabilitiesRef);
        if (availabilitiesDoc.exists()) {
          batch.delete(availabilitiesRef);
          deletedCount++;
        }
      } catch (error) {
        loggers.error.error('Error deleting user subcollections:', error);
      }

      // 8. Delete password history if it exists
      try {
        await PasswordHistoryService.clearPasswordHistory(userId);
        loggers.log.log('Password history cleared');
      } catch (error) {
        loggers.error.error('Error clearing password history (may not exist):', error);
      }

      // 9. Commit batch deletions
      await batch.commit();
      loggers.log.log(`Batch deletion committed: ${deletedCount} documents deleted`);

      // 10. Finally, delete the main user document
      await deleteDoc(doc(firestore, 'users', userId));
      loggers.log.log('User document deleted');

      // Update local state
      setUsers(prev => prev.filter(u => u.uid !== userId));
      
      // Update stats
      setUserStats(prevStats => ({
        ...prevStats,
        total: prevStats.total - 1,
        // Decrement role counts if user had those roles
        admins: userToDelete.roles.admin ? prevStats.admins - 1 : prevStats.admins,
        developers: userToDelete.roles.developer ? prevStats.developers - 1 : prevStats.developers,
        committee: userToDelete.roles.committee ? prevStats.committee - 1 : prevStats.committee,
        audit: userToDelete.roles.audit ? prevStats.audit - 1 : prevStats.audit,
        marketing: userToDelete.roles.marketing ? prevStats.marketing - 1 : prevStats.marketing,
        'vetting-officer': userToDelete.roles['vetting-officer'] ? prevStats['vetting-officer'] - 1 : prevStats['vetting-officer'],
        'social-media': userToDelete.roles['social-media'] ? prevStats['social-media'] - 1 : prevStats['social-media'],
        outreach: userToDelete.roles.outreach ? prevStats.outreach - 1 : prevStats.outreach,
        events: userToDelete.roles.events ? prevStats.events - 1 : prevStats.events,
        tester: userToDelete.roles.tester ? prevStats.tester - 1 : prevStats.tester
      }));

      setDeleteStatus({ 
        type: 'success', 
        message: `User ${userToDelete.firstName} ${userToDelete.lastName} and all related data (${deletedCount + 1} items) have been deleted successfully.` 
      });
      
      // Clear status after 5 seconds
      setTimeout(() => setDeleteStatus(null), 5000);

    } catch (error) {
      loggers.error.error('Error deleting user:', error);
      setDeleteStatus({ 
        type: 'error', 
        message: `Failed to delete user: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    } finally {
      setDeletingUser(false);
      setShowDeleteModal(false);
      setUserToDelete(null);
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
                    <div className="rm-action-buttons">
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
                      {isDeveloper && !user.isProtected && user.uid !== userProfile?.uid && (
                        <button
                          className="rm-delete-user-btn"
                          onClick={() => handleDeleteUser(user)}
                          title="Delete user and all related data (Developer only)"
                        >
                          <FaTrash />
                        </button>
                      )}
                    </div>
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

      {/* Delete Status Message */}
      {deleteStatus && (
        <div className={`rm-delete-status ${deleteStatus.type}`}>
          {deleteStatus.message}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && userToDelete && (
        <div className="rm-delete-modal-overlay" onClick={() => !deletingUser && setShowDeleteModal(false)}>
          <div className="rm-delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="rm-delete-modal-header">
              <FaTrash className="rm-delete-modal-icon" />
              <h2>Delete User</h2>
            </div>
            <div className="rm-delete-modal-content">
              <p className="rm-delete-warning">
                <strong>Warning:</strong> This action cannot be undone. This will permanently delete:
              </p>
              <ul className="rm-delete-list">
                <li>The user account: <strong>{userToDelete.firstName} {userToDelete.lastName} ({userToDelete.email})</strong></li>
                <li>All bookings where the user is a mentor or mentee</li>
                <li>All sessions and session feedback</li>
                <li>All feedback submissions</li>
                <li>All messages and conversations</li>
                <li>All enquiries and ambassador applications</li>
                <li>All user subcollections (mentorProgram, availabilities, etc.)</li>
                <li>Password history</li>
              </ul>
              <p className="rm-delete-confirm">
                Are you sure you want to delete this user and all related data?
              </p>
            </div>
            <div className="rm-delete-modal-actions">
              <button
                className="rm-delete-cancel-btn"
                onClick={() => {
                  setShowDeleteModal(false);
                  setUserToDelete(null);
                }}
                disabled={deletingUser}
              >
                Cancel
              </button>
              <button
                className="rm-delete-confirm-btn"
                onClick={confirmDeleteUser}
                disabled={deletingUser}
              >
                {deletingUser ? 'Deleting...' : 'Delete User'}
              </button>
            </div>
          </div>
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