import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, getDocs, updateDoc, doc, orderBy } from 'firebase/firestore';
import { FaUsers, FaChartBar, FaCog, FaUserEdit, FaCheck, FaTimes } from 'react-icons/fa';
import '../styles/AdminPortal.css';

interface UserData extends Record<string, any> {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  admin: boolean;
  dateCreated: any;
  lastLogin?: Date;
}

export default function AdminPortal() {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users');
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
          className={`sidebar-button ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <FaUsers /> Users
        </button>
        <button 
          className={`sidebar-button ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <FaChartBar /> Analytics
        </button>
        <button 
          className={`sidebar-button ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          <FaCog /> Settings
        </button>
      </div>

      <div className="admin-content">
        <h1>Admin Portal</h1>

        {activeTab === 'users' && (
          <div className="admin-section">
            <div className="admin-header">
              <h2>User Management</h2>
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>

            <div className="stats-cards">
              <div className="stat-card">
                <h3>Total Users</h3>
                <p>{userStats.total}</p>
              </div>
              <div className="stat-card">
                <h3>Admin Users</h3>
                <p>{userStats.admins}</p>
              </div>
              <div className="stat-card">
                <h3>New Users (30d)</h3>
                <p>{userStats.newThisMonth}</p>
              </div>
            </div>

            <div className="users-table">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Join Date</th>
                    <th>Admin</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(user => (
                    <tr key={user.uid}>
                      <td>{`${user.firstName} ${user.lastName}`}</td>
                      <td>{user.email}</td>
                      <td>{user.dateCreated?.toDate().toLocaleDateString()}</td>
                      <td>
                        {user.admin ? 
                          <FaCheck className="icon-check" /> : 
                          <FaTimes className="icon-times" />
                        }
                      </td>
                      <td>
                        <button
                          className="action-button"
                          onClick={() => toggleUserAdmin(user.uid, user.admin)}
                        >
                          <FaUserEdit /> Toggle Admin
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="admin-section">
            <h2>Analytics</h2>
            <div className="analytics-cards">
              <div className="analytics-card">
                <h3>User Growth</h3>
                {/* Add chart component here */}
              </div>
              <div className="analytics-card">
                <h3>Active Users</h3>
                {/* Add chart component here */}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="admin-section">
            <h2>Admin Settings</h2>
            {/* Add admin settings here */}
          </div>
        )}
      </div>
    </div>
  );
} 