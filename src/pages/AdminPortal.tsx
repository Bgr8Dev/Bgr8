import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { db } from '../firebase/firebase';
import { collection, query, getDocs, updateDoc, doc, orderBy, Timestamp } from 'firebase/firestore';
import { FaUsers, FaChartBar, FaCog, FaUserEdit, FaCheck, FaTimes, FaArrowLeft, FaEnvelope, FaChalkboardTeacher, FaComments } from 'react-icons/fa';
import '../styles/adminStyles/AdminPortal.css';

import { AdminSettings } from './adminPages/AdminSettings';
import AdminAnalytics from './adminPages/AdminAnalytics';
import { AdminEnquiries } from './adminPages/AdminEnquiries';
import MentorManagement from '../components/admin/MentorManagement';
import FeedbackAnalytics from '../components/admin/FeedbackAnalytics';

interface UserData {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  admin: boolean;
  dateCreated: Timestamp;
  lastLogin?: Date;
  bgr8Memberships?: Record<string, boolean>;
  [key: string]: unknown; // For other potential properties
}

export default function AdminPortal() {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserData[]>([]);
  const [, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [userStats, setUserStats] = useState({
    total: 0,
    admins: 0,
    newThisMonth: 0
  });

  useEffect(() => {
    if (!userProfile?.admin) {
      navigate('/');
      return;
    }

    fetchUsers();
  }, [userProfile, navigate]);

  const fetchUsers = async () => {
    try {
      const usersRef = collection(db, 'users');
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
      const userRef = doc(db, 'users', uid);
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

  if (!userProfile?.admin) {
    return null;
  }

  return (
    <div className="admin-portal">
      <div className="admin-sidebar">
        <button 
          className="back-button"
          onClick={() => navigate(-1)}
        >
          <FaArrowLeft /> Back
        </button>

        <div className="admin-nav">
          <button 
            className={`admin-nav-item ${activeSection === 'users' ? 'active' : ''}`}
            onClick={() => setActiveSection('users')}
          >
            <FaUsers /> Users
          </button>
          
          <button 
            className={`admin-nav-item ${activeSection === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveSection('analytics')}
          >
            <FaChartBar /> Analytics
          </button>
          
          <button 
            className={`admin-nav-item ${activeSection === 'enquiries' ? 'active' : ''}`}
            onClick={() => setActiveSection('enquiries')}
          >
            <FaEnvelope /> Enquiries
          </button>
          
          <button 
            className={`admin-nav-item ${activeSection === 'mentors' ? 'active' : ''}`}
            onClick={() => setActiveSection('mentors')}
          >
            <FaChalkboardTeacher /> Mentors
          </button>
          
          <button 
            className={`admin-nav-item ${activeSection === 'feedback' ? 'active' : ''}`}
            onClick={() => setActiveSection('feedback')}
          >
            <FaComments /> Feedback
          </button>
          
          <button 
            className={`admin-nav-item ${activeSection === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveSection('settings')}
          >
            <FaCog /> Settings
          </button>
        </div>
      </div>

      <div className="admin-content">
        {activeSection === 'users' && (
          <div className="admin-section">
            <h2>User Management</h2>
            <div className="user-stats">
              <div className="stat-card">
                <h3>Total Users</h3>
                <p>{userStats.total}</p>
              </div>
              <div className="stat-card">
                <h3>Admins</h3>
                <p>{userStats.admins}</p>
              </div>
              <div className="stat-card">
                <h3>New This Month</h3>
                <p>{userStats.newThisMonth}</p>
              </div>
            </div>
            
            <div className="search-bar">
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="users-table">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Admin</th>
                    <th>Date Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.uid}>
                      <td>{user.firstName} {user.lastName}</td>
                      <td>{user.email}</td>
                      <td>
                        <span className={`admin-badge ${user.admin ? 'admin' : 'user'}`}>
                          {user.admin ? <FaCheck style={{ marginRight: 4 }} /> : <FaTimes style={{ marginRight: 4 }} />}
                          {user.admin ? 'Admin' : 'User'}
                        </span>
                      </td>
                      <td>{user.dateCreated?.toDate().toLocaleDateString()}</td>
                      <td>
                        <button
                          className={`toggle-admin-btn ${user.admin ? 'remove' : 'add'}`}
                          onClick={() => toggleUserAdmin(user.uid, user.admin)}
                        >
                          <FaUserEdit style={{ marginRight: 4 }} />
                          {user.admin ? 'Remove Admin' : 'Make Admin'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeSection === 'analytics' && <AdminAnalytics />}
        {activeSection === 'enquiries' && <AdminEnquiries />}
        {activeSection === 'mentors' && <MentorManagement />}
        {activeSection === 'feedback' && <FeedbackAnalytics />}
        {activeSection === 'settings' && <AdminSettings />}
      </div>
    </div>
  );
} 