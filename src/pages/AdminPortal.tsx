import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, getDocs, updateDoc, doc, orderBy } from 'firebase/firestore';
import { FaUsers, FaChartBar, FaCog, FaUserEdit, FaCheck, FaTimes, FaArrowLeft, FaBullhorn, FaCar, FaTshirt, FaFutbol, FaHandHoldingHeart, FaGraduationCap, FaBriefcase, FaUserPlus } from 'react-icons/fa';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import '../styles/adminStyles/AdminPortal.css';

import { AdminPortalB8Marketing } from './adminPages/AdminPortalB8Marketing';
import { AdminPortalB8CarClub } from './adminPages/AdminPortalB8CarClub';
import { AdminPortalB8Clothing } from './adminPages/AdminPortalB8Clothing';
import { AdminPortalB8League } from './adminPages/AdminPortalB8League';
import { AdminPortalB8Charity } from './adminPages/AdminPortalB8Charity';
import { AdminPortalB8Education } from './adminPages/AdminPortalB8Education';
import { AdminPortalB8Careers } from './adminPages/AdminPortalB8Careers';
import { AdminPortalBgr8 } from './adminPages/AdminPortalBgr8';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface UserData extends Record<string, any> {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  admin: boolean;
  dateCreated: any;
  lastLogin?: Date;
}

interface AnalyticsData {
  userGrowth: {
    labels: string[];
    data: number[];
  };
  activeUsers: {
    labels: string[];
    data: number[];
  };
}

interface BusinessStats {
  totalMembers: number;
  activeMembers: number;
  revenue: number;
  engagement: number;
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
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    userGrowth: { labels: [], data: [] },
    activeUsers: { labels: [], data: [] }
  });
  const [businessStats, setBusinessStats] = useState<Record<string, BusinessStats>>({
    marketing: { totalMembers: 0, activeMembers: 0, revenue: 0, engagement: 0 },
    carClub: { totalMembers: 0, activeMembers: 0, revenue: 0, engagement: 0 },
    clothing: { totalMembers: 0, activeMembers: 0, revenue: 0, engagement: 0 },
    league: { totalMembers: 0, activeMembers: 0, revenue: 0, engagement: 0 },
    charity: { totalMembers: 0, activeMembers: 0, revenue: 0, engagement: 0 },
    education: { totalMembers: 0, activeMembers: 0, revenue: 0, engagement: 0 },
    careers: { totalMembers: 0, activeMembers: 0, revenue: 0, engagement: 0 },
    bgr8: { totalMembers: 0, activeMembers: 0, revenue: 0, engagement: 0 }
  });

  const businessSections = [
    { id: 'marketing', name: 'B8 Marketing', icon: FaBullhorn },
    { id: 'carClub', name: 'B8 Car Club', icon: FaCar },
    { id: 'clothing', name: 'B8 Clothing', icon: FaTshirt },
    { id: 'league', name: 'B8 League', icon: FaFutbol },
    { id: 'charity', name: 'B8 Charity', icon: FaHandHoldingHeart },
    { id: 'education', name: 'B8 Education', icon: FaGraduationCap },
    { id: 'careers', name: 'B8 Careers', icon: FaBriefcase },
    { id: 'bgr8', name: 'BGr8', icon: FaUserPlus }
  ];

  useEffect(() => {
    if (!userProfile?.admin) {
      navigate('/');
      return;
    }

    fetchUsers();
    calculateAnalytics();
    fetchBusinessStats();
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

  const calculateAnalytics = async () => {
    try {
      // Get all users ordered by creation date
      const usersRef = collection(db, 'users');
      const usersSnapshot = await getDocs(query(usersRef, orderBy('dateCreated', 'asc')));
      
      // Calculate user growth over time
      const userGrowthData: { [key: string]: number } = {};
      const activeUsersData: { [key: string]: number } = {};
      
      // Get last 6 months
      const months = Array.from({length: 6}, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        return date.toLocaleString('default', { month: 'short', year: '2-digit' });
      }).reverse();
      
      // Initialize data objects with 0s
      months.forEach(month => {
        userGrowthData[month] = 0;
        activeUsersData[month] = 0;
      });

      // Calculate user growth
      usersSnapshot.forEach(doc => {
        const userData = doc.data();
        const creationDate = userData.dateCreated?.toDate();
        const month = creationDate.toLocaleString('default', { month: 'short', year: '2-digit' });
        
        if (userGrowthData[month] !== undefined) {
          userGrowthData[month]++;
        }

        // Calculate active users (users who logged in during each month)
        const lastLogin = userData.lastLogin?.toDate();
        if (lastLogin) {
          const loginMonth = lastLogin.toLocaleString('default', { month: 'short', year: '2-digit' });
          if (activeUsersData[loginMonth] !== undefined) {
            activeUsersData[loginMonth]++;
          }
        }
      });

      setAnalyticsData({
        userGrowth: {
          labels: months,
          data: months.map(month => userGrowthData[month])
        },
        activeUsers: {
          labels: months,
          data: months.map(month => activeUsersData[month])
        }
      });
    } catch (error) {
      console.error('Error calculating analytics:', error);
    }
  };

  const fetchBusinessStats = async () => {
    try {
      const usersRef = collection(db, 'users');
      const usersSnapshot = await getDocs(usersRef);
      
      const stats = { ...businessStats };
      
      usersSnapshot.forEach((doc) => {
        const userData = doc.data();
        const memberships = userData.b8Memberships || {};
        
        Object.keys(memberships).forEach((business) => {
          if (memberships[business]) {
            stats[business].totalMembers++;
            if (userData.lastLogin?.toDate() > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) {
              stats[business].activeMembers++;
            }
          }
        });
      });
      
      setBusinessStats(stats);
    } catch (error) {
      console.error('Error fetching business stats:', error);
    }
  };

  const userGrowthOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'New Users per Month',
        color: 'white'
      }
    },
    scales: {
      y: {
        ticks: { color: 'white' },
        grid: { color: 'rgba(255, 255, 255, 0.1)' }
      },
      x: {
        ticks: { color: 'white' },
        grid: { color: 'rgba(255, 255, 255, 0.1)' }
      }
    }
  };

  const activeUsersOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Active Users per Month',
        color: 'white'
      }
    },
    scales: {
      y: {
        ticks: { color: 'white' },
        grid: { color: 'rgba(255, 255, 255, 0.1)' }
      },
      x: {
        ticks: { color: 'white' },
        grid: { color: 'rgba(255, 255, 255, 0.1)' }
      }
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

  const renderBusinessComponent = (section: { id: string; name: string }) => {
    switch (section.id) {
      case 'marketing':
        return <AdminPortalB8Marketing stats={businessStats.marketing} />;
      case 'carClub':
        return <AdminPortalB8CarClub stats={businessStats.carClub} />;
      case 'clothing':
        return <AdminPortalB8Clothing />;
      case 'league':
        return <AdminPortalB8League stats={businessStats.league} />;
      case 'charity':
        return <AdminPortalB8Charity stats={businessStats.charity} />;
      case 'education':
        return <AdminPortalB8Education stats={businessStats.education} />;
      case 'careers':
        return <AdminPortalB8Careers stats={businessStats.careers} />;
      case 'bgr8':
        return <AdminPortalBgr8 stats={businessStats.bgr8} />;
      default:
        return null;
    }
  };

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
        
        <div className="sidebar-section">
          <h3>General</h3>
          <button 
            className={`sidebar-button ${activeSection === 'users' ? 'active' : ''}`}
            onClick={() => setActiveSection('users')}
          >
            <FaUsers /> Users
          </button>
          <button 
            className={`sidebar-button ${activeSection === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveSection('analytics')}
          >
            <FaChartBar /> Analytics
          </button>
          <button 
            className={`sidebar-button ${activeSection === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveSection('settings')}
          >
            <FaCog /> Settings
          </button>
        </div>

        <div className="sidebar-section">
          <h3>Businesses</h3>
          {businessSections.map(section => (
            <button
              key={section.id}
              className={`sidebar-button ${activeSection === section.id ? 'active' : ''}`}
              onClick={() => setActiveSection(section.id)}
            >
              <section.icon /> {section.name}
            </button>
          ))}
        </div>
      </div>

      <div className="admin-content">
        <h1>Admin Portal</h1>

        {activeSection === 'users' && (
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

        {activeSection === 'analytics' && (
          <div className="admin-section">
            <h2>Analytics</h2>
            <div className="analytics-cards">
              <div className="analytics-card">
                <h3>User Growth</h3>
                <Line
                  data={{
                    labels: analyticsData.userGrowth.labels,
                    datasets: [
                      {
                        label: 'New Users',
                        data: analyticsData.userGrowth.data,
                        borderColor: '#4CAF50',
                        backgroundColor: 'rgba(76, 175, 80, 0.5)',
                        tension: 0.4
                      }
                    ]
                  }}
                  options={userGrowthOptions}
                />
              </div>
              <div className="analytics-card">
                <h3>Active Users</h3>
                <Bar
                  data={{
                    labels: analyticsData.activeUsers.labels,
                    datasets: [
                      {
                        label: 'Active Users',
                        data: analyticsData.activeUsers.data,
                        backgroundColor: 'rgba(33, 150, 243, 0.5)',
                        borderColor: '#2196F3',
                        borderWidth: 1
                      }
                    ]
                  }}
                  options={activeUsersOptions}
                />
              </div>
            </div>
          </div>
        )}

        {activeSection === 'settings' && (
          <div className="admin-section">
            <h2>Admin Settings</h2>
            {/* Add admin settings here */}
          </div>
        )}

        {businessSections.map(section => (
          activeSection === section.id && (
            <div key={section.id}>
              {renderBusinessComponent(section)}
            </div>
          )
        ))}
      </div>
    </div>
  );
} 