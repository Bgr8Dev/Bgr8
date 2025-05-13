import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase/firebase';
import { collection, query, getDocs, updateDoc, doc, orderBy, Timestamp } from 'firebase/firestore';
import { FaUsers, FaChartBar, FaCog, FaUserEdit, FaCheck, FaTimes, FaArrowLeft, FaBullhorn, FaCar, FaTshirt, FaFutbol, FaHandHoldingHeart, FaGraduationCap, FaBriefcase, FaUserPlus, FaEnvelope } from 'react-icons/fa';
import '../styles/adminStyles/AdminPortal.css';

import { AdminPortalB8Marketing } from './adminPages/AdminPortalB8Marketing';
import { AdminPortalB8CarClub } from './adminPages/AdminPortalB8CarClub';
import { AdminPortalB8Clothing } from './adminPages/AdminPortalB8Clothing';
import { AdminPortalB8World } from './adminPages/AdminPortalB8World';
import { AdminPortalBgr8r } from './adminPages/AdminPortalBgr8r';
import { AdminPortalB8Careers } from './adminPages/AdminPortalB8Careers';
import { AdminPortalB8League } from './adminPages/AdminPortalB8League';
import { AdminPortalBgr8 } from './adminPages/AdminPortalBgr8';
import { AdminSettings } from './adminPages/AdminSettings';
import AdminAnalytics from './adminPages/AdminAnalytics';
import { AdminEnquiries } from './adminPages/AdminEnquiries';
import { AdminPortalB8Podcast } from './adminPages/AdminPortalB8Podcast';

interface UserData {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  admin: boolean;
  dateCreated: Timestamp;
  lastLogin?: Date;
  b8Memberships?: Record<string, boolean>;
  [key: string]: unknown; // For other potential properties
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
  const [businessStats, setBusinessStats] = useState<Record<string, BusinessStats>>({
    marketing: { totalMembers: 0, activeMembers: 0, revenue: 0, engagement: 0 },
    carClub: { totalMembers: 0, activeMembers: 0, revenue: 0, engagement: 0 },
    clothing: { totalMembers: 0, activeMembers: 0, revenue: 0, engagement: 0 },
    league: { totalMembers: 0, activeMembers: 0, revenue: 0, engagement: 0 },
    world: { totalMembers: 0, activeMembers: 0, revenue: 0, engagement: 0 },
    bgr8r: { totalMembers: 0, activeMembers: 0, revenue: 0, engagement: 0 },
    careers: { totalMembers: 0, activeMembers: 0, revenue: 0, engagement: 0 },
    bgr8: { totalMembers: 0, activeMembers: 0, revenue: 0, engagement: 0 },
    podcast: { totalMembers: 0, activeMembers: 0, revenue: 0, engagement: 0 }
  });

  const businessSections = [
    { id: 'marketing', name: 'Innov8', icon: FaBullhorn },
    { id: 'carClub', name: 'B8 Car Club', icon: FaCar },
    { id: 'clothing', name: 'B8 Clothing', icon: FaTshirt },
    { id: 'league', name: 'B8 League', icon: FaFutbol },
    { id: 'world', name: 'B8 World', icon: FaHandHoldingHeart },
    { id: 'bgr8r', name: 'Bgr8r', icon: FaGraduationCap },
    { id: 'careers', name: 'B8 Careers', icon: FaBriefcase },
    { id: 'bgr8', name: 'BGr8', icon: FaUserPlus },
    { id: 'podcast', name: 'B8 Podcast', icon: FaBriefcase }
  ];

  useEffect(() => {
    if (!userProfile?.admin) {
      navigate('/');
      return;
    }

    fetchUsers();
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
      case 'world':
        return <AdminPortalB8World stats={businessStats.world} />;
      case 'bgr8r':
        return <AdminPortalBgr8r stats={businessStats.bgr8r} />;
      case 'careers':
        return <AdminPortalB8Careers stats={businessStats.careers} />;
      case 'bgr8':
        return <AdminPortalBgr8 stats={businessStats.bgr8} />;
      case 'podcast':
        return <AdminPortalB8Podcast stats={businessStats.podcast} />;
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
            className={`sidebar-button ${activeSection === 'enquiries' ? 'active' : ''}`}
            onClick={() => setActiveSection('enquiries')}
          >
            <FaEnvelope /> Enquiries
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

        {activeSection === 'enquiries' && (
          <div className="admin-section">
            <AdminEnquiries />
          </div>
        )}

        {activeSection === 'analytics' && (
          <div className="admin-section">
            <AdminAnalytics />
          </div>
        )}

        {activeSection === 'settings' && (
          <div className="admin-section">
            <h2>Admin Settings</h2>
            <AdminSettings />
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