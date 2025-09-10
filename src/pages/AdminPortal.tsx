import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { hasRole } from '../utils/userProfile';
import { FaUsers, FaChartBar, FaCog, FaArrowLeft, FaEnvelope, FaChalkboardTeacher, FaComments, FaCalendarAlt, FaUserCheck } from 'react-icons/fa';
import '../styles/adminStyles/AdminPortal.css';

import { AdminSettings } from './adminPages/AdminSettings';
import AdminAnalytics from './adminPages/AdminAnalytics';
import { AdminEnquiries } from './adminPages/AdminEnquiries';
import { AdminMentorVerification } from './adminPages/AdminMentorVerification';
import MentorManagement from '../components/admin/MentorManagement';
import FeedbackAnalytics from '../components/admin/FeedbackAnalytics';
import { SessionsManagement } from '../components/admin/SessionsManagement';
import { MobileAdminPortal } from '../components/admin/MobileAdminPortal';
import RoleManagement from '../components/admin/RoleManagement';
import { useIsMobile } from '../hooks/useIsMobile';


export default function AdminPortal() {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [activeSection, setActiveSection] = useState('users');
  const [showMobileAdmin, setShowMobileAdmin] = useState(false);

  useEffect(() => {
    if (!hasRole(userProfile, 'admin')) {
      navigate('/');
      return;
    }
  }, [userProfile, navigate]);

  useEffect(() => {
    if (isMobile && hasRole(userProfile, 'admin')) {
      setShowMobileAdmin(true);
    } else {
      setShowMobileAdmin(false);
    }
  }, [isMobile, userProfile]);

  if (!hasRole(userProfile, 'admin')) {
    return null;
  }

  // Show mobile admin portal on mobile devices
  if (isMobile && window.innerWidth <= 768) {
    return (
      <MobileAdminPortal
        isOpen={showMobileAdmin}
        onClose={() => setShowMobileAdmin(false)}
      />
    );
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
            className={`admin-nav-item ${activeSection === 'verification' ? 'active' : ''}`}
            onClick={() => setActiveSection('verification')}
          >
            <FaUserCheck /> Verification
          </button>
          
          <button 
            className={`admin-nav-item ${activeSection === 'feedback' ? 'active' : ''}`}
            onClick={() => setActiveSection('feedback')}
          >
            <FaComments /> Feedback
          </button>
          
          <button 
            className={`admin-nav-item ${activeSection === 'sessions' ? 'active' : ''}`}
            onClick={() => setActiveSection('sessions')}
          >
            <FaCalendarAlt /> Sessions
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
        {activeSection === 'users' && <RoleManagement />}

        {activeSection === 'analytics' && <AdminAnalytics />}
        {activeSection === 'enquiries' && <AdminEnquiries />}
        {activeSection === 'mentors' && <MentorManagement />}
        {activeSection === 'verification' && <AdminMentorVerification />}
        {activeSection === 'feedback' && <FeedbackAnalytics />}
        {activeSection === 'sessions' && <SessionsManagement />}
        {activeSection === 'settings' && <AdminSettings />}
      </div>
    </div>
  );
} 