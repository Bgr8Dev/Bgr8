import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/AdminPortal.css';

export default function AdminPortal() {
  const { userProfile } = useAuth();
  const navigate = useNavigate();

  // Redirect non-admin users
  useEffect(() => {
    if (!userProfile?.admin) {
      navigate('/');
    }
  }, [userProfile, navigate]);

  if (!userProfile?.admin) {
    return null;
  }

  return (
    <div className="admin-portal">
      <h1>Admin Portal</h1>
      <div className="admin-dashboard">
        <div className="admin-section">
          <h2>User Management</h2>
          {/* Add user management features */}
        </div>
        
        <div className="admin-section">
          <h2>Content Management</h2>
          {/* Add content management features */}
        </div>
        
        <div className="admin-section">
          <h2>Analytics</h2>
          {/* Add analytics features */}
        </div>
        
        <div className="admin-section">
          <h2>Settings</h2>
          {/* Add admin settings */}
        </div>
      </div>
    </div>
  );
} 