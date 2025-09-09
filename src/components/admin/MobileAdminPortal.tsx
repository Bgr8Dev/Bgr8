import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { firestore } from '../../firebase/firebase';
import { collection, query, getDocs, updateDoc, doc, orderBy, Timestamp } from 'firebase/firestore';
import { 
  FaTimes, 
  FaUsers, 
  FaChartBar, 
  FaCog, 
  FaUserEdit, 
  FaCheck, 
  FaTimes as FaX, 
  FaEnvelope, 
  FaChalkboardTeacher, 
  FaComments, 
  FaCalendarAlt,
  FaChevronLeft,
  FaChevronRight,
  FaSearch,
  FaArrowLeft
} from 'react-icons/fa';
import '../../styles/adminStyles/MobileAdminPortal.css';

import { AdminSettings } from '../../pages/adminPages/AdminSettings';
import AdminAnalytics from '../../pages/adminPages/AdminAnalytics';
import { AdminEnquiries } from '../../pages/adminPages/AdminEnquiries';
import MentorManagement from './MentorManagement';
import FeedbackAnalytics from './FeedbackAnalytics';
import { SessionsManagement } from './SessionsManagement';

interface UserData {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  admin: boolean;
  dateCreated: Timestamp;
  lastLogin?: Date;
  [key: string]: unknown;
}

interface MobileAdminPortalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileAdminPortal: React.FC<MobileAdminPortalProps> = ({
  isOpen,
  onClose
}) => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSection, setCurrentSection] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [userStats, setUserStats] = useState({
    total: 0,
    admins: 0,
    newThisMonth: 0
  });

  // Define sections for mobile navigation
  const sections = [
    { id: 'users', name: 'Users', icon: '👥' },
    { id: 'analytics', name: 'Analytics', icon: '📊' },
    { id: 'enquiries', name: 'Enquiries', icon: '📧' },
    { id: 'mentors', name: 'Mentors', icon: '👨‍🏫' },
    { id: 'feedback', name: 'Feedback', icon: '💬' },
    { id: 'sessions', name: 'Sessions', icon: '📅' },
    { id: 'settings', name: 'Settings', icon: '⚙️' }
  ];

  useEffect(() => {
    if (!userProfile?.admin) {
      navigate('/');
      return;
    }

    fetchUsers();
  }, [userProfile, navigate]);

  const fetchUsers = async () => {
    try {
      const usersRef = collection(firestore, 'users');
      const q = query(usersRef, orderBy('dateCreated', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const userData: UserData[] = [];
      let adminCount = 0;
      let newThisMonth = 0;
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      querySnapshot.forEach((doc) => {
        const user = doc.data() as UserData;
        userData.push(user);
        
        if (user.admin) adminCount++;
        if (user.dateCreated?.toDate() > thirtyDaysAgo) newThisMonth++;
      });

      setUsers(userData);
      setUserStats({
        total: userData.length,
        admins: adminCount,
        newThisMonth
      });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      setLoading(false);
    }
  };

  const toggleUserAdmin = async (uid: string, currentAdminStatus: boolean) => {
    try {
      const userRef = doc(firestore, 'users', uid);
      await updateDoc(userRef, {
        admin: !currentAdminStatus
      });
      await fetchUsers(); // Refresh user list
    } catch (error) {
      console.error('Error updating user admin status:', error);
    }
  };

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lastName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen || !userProfile?.admin) return null;

  const nextSection = () => {
    if (currentSection < sections.length - 1) {
      setCurrentSection(currentSection + 1);
    }
  };

  const prevSection = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
    }
  };

  const renderSection = () => {
    switch (currentSection) {
      case 0: // Users
        return (
          <div className="map-section">
            <h3 className="map-section-title">User Management</h3>
            <div className="map-form-fields">
              {/* User Stats */}
              <div className="map-stats-grid">
                <div className="map-stat-card">
                  <div className="map-stat-icon">👥</div>
                  <div className="map-stat-content">
                    <h4>Total Users</h4>
                    <p>{userStats.total}</p>
                  </div>
                </div>
                <div className="map-stat-card">
                  <div className="map-stat-icon">👑</div>
                  <div className="map-stat-content">
                    <h4>Admins</h4>
                    <p>{userStats.admins}</p>
                  </div>
                </div>
                <div className="map-stat-card">
                  <div className="map-stat-icon">🆕</div>
                  <div className="map-stat-content">
                    <h4>New This Month</h4>
                    <p>{userStats.newThisMonth}</p>
                  </div>
                </div>
              </div>

              {/* Search */}
              <div className="map-input-group">
                <label htmlFor="userSearch" className="map-field-label">
                  Search Users
                </label>
                <div className="map-search-container">
                  <FaSearch className="map-search-icon" />
                  <input
                    id="userSearch"
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="map-search-input"
                  />
                </div>
              </div>

              {/* Users List */}
              <div className="map-users-list">
                {loading ? (
                  <div className="map-loading">Loading users...</div>
                ) : (
                  filteredUsers.map((user) => (
                    <div key={user.uid} className="map-user-card">
                      <div className="map-user-info">
                        <div className="map-user-name">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="map-user-email">{user.email}</div>
                        <div className="map-user-date">
                          Joined: {user.dateCreated?.toDate().toLocaleDateString()}
                        </div>
                      </div>
                      <div className="map-user-actions">
                        <div className={`map-admin-badge ${user.admin ? 'admin' : 'user'}`}>
                          {user.admin ? <FaCheck /> : <FaX />}
                          {user.admin ? 'Admin' : 'User'}
                        </div>
                        <button
                          className={`map-toggle-admin-btn ${user.admin ? 'remove' : 'add'}`}
                          onClick={() => toggleUserAdmin(user.uid, user.admin)}
                        >
                          <FaUserEdit />
                          {user.admin ? 'Remove Admin' : 'Make Admin'}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        );

      case 1: // Analytics
        return (
          <div className="map-section">
            <h3 className="map-section-title">Analytics</h3>
            <div className="map-form-fields">
              <AdminAnalytics />
            </div>
          </div>
        );

      case 2: // Enquiries
        return (
          <div className="map-section">
            <h3 className="map-section-title">Enquiries</h3>
            <div className="map-form-fields">
              <AdminEnquiries />
            </div>
          </div>
        );

      case 3: // Mentors
        return (
          <div className="map-section">
            <h3 className="map-section-title">Mentor Management</h3>
            <div className="map-form-fields">
              <MentorManagement />
            </div>
          </div>
        );

      case 4: // Feedback
        return (
          <div className="map-section">
            <h3 className="map-section-title">Feedback Analytics</h3>
            <div className="map-form-fields">
              <FeedbackAnalytics />
            </div>
          </div>
        );

      case 5: // Sessions
        return (
          <div className="map-section">
            <h3 className="map-section-title">Sessions Management</h3>
            <div className="map-form-fields">
              <SessionsManagement />
            </div>
          </div>
        );

      case 6: // Settings
        return (
          <div className="map-section">
            <h3 className="map-section-title">Admin Settings</h3>
            <div className="map-form-fields">
              <AdminSettings />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const modalContent = (
    <>
      {/* Mobile Admin Modal Overlay */}
      <div 
        className="map-overlay"
        onClick={onClose}
      >
        <div 
          className="map-modal"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="map-header">
            <div className="map-header-content">
              <div className="map-header-left">
                <button
                  className="map-close-btn"
                  onClick={onClose}
                  title="Close admin portal"
                  aria-label="Close admin portal"
                >
                  <FaTimes />
                </button>
                <div className="map-title-section">
                  <h2 className="map-title">Admin Portal</h2>
                  <p className="map-progress-text">
                    Section {currentSection + 1} of {sections.length}
                  </p>
                </div>
              </div>
              <button
                className="map-back-btn"
                onClick={() => navigate(-1)}
                title="Go back"
                aria-label="Go back"
              >
                <FaArrowLeft />
              </button>
            </div>

            {/* Section Navigation */}
            <div className="map-navigation">
              <button
                className="map-nav-btn"
                onClick={prevSection}
                disabled={currentSection === 0}
              >
                <FaChevronLeft />
                Previous
              </button>

              <div className="map-section-indicators">
                {sections.map((section, index) => (
                  <button
                    key={section.id}
                    className={`map-section-indicator ${index === currentSection ? 'active' : ''}`}
                    onClick={() => setCurrentSection(index)}
                  >
                    <span className="map-section-icon">{section.icon}</span>
                    <span className="map-section-name">{section.name}</span>
                  </button>
                ))}
              </div>

              <button
                className="map-nav-btn"
                onClick={nextSection}
                disabled={currentSection === sections.length - 1}
              >
                Next
                <FaChevronRight />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="map-content">
            {renderSection()}
          </div>

          {/* Footer */}
          <div className="map-footer">
            <div className="map-footer-info">
              <p className="map-footer-text">
                Welcome, {userProfile?.firstName} {userProfile?.lastName}
              </p>
              <p className="map-footer-role">Administrator</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  // Use createPortal to render the modal at the document root
  return createPortal(modalContent, document.body);
};
