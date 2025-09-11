import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { usePagePermissions } from '../hooks/usePagePermissions';
import { hasRole } from '../utils/userProfile';
import { FaUsers, FaChartBar, FaCog, FaArrowLeft, FaEnvelope, FaChalkboardTeacher, FaComments, FaCalendarAlt, FaUserCheck, FaBug } from 'react-icons/fa';
import '../styles/adminStyles/AdminPortal.css';

import { AdminSettings } from './adminPages/AdminSettings';
import AdminAnalytics from './adminPages/AdminAnalytics';
import { AdminEnquiries } from './adminPages/AdminEnquiries';
import { AdminMentorVerification } from './adminPages/AdminMentorVerification';
import AdminTestingFeedback from './adminPages/AdminTestingFeedback';
import MentorManagement from '../components/admin/MentorManagement';
import FeedbackAnalytics from '../components/admin/FeedbackAnalytics';
import { SessionsManagement } from '../components/admin/SessionsManagement';
import { MobileAdminPortal } from '../components/admin/MobileAdminPortal';
import RoleManagement from '../components/admin/RoleManagement';
import { useIsMobile } from '../hooks/useIsMobile';


export default function AdminPortal() {
  const { userProfile } = useAuth();
  const { getAccessiblePages, canAccessPage, loading: permissionsLoading } = usePagePermissions();
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

  // Set default active section to first accessible page
  useEffect(() => {
    if (!permissionsLoading) {
      const accessiblePages = getAccessiblePages();
      if (accessiblePages.length > 0 && !canAccessPage(activeSection)) {
        setActiveSection(accessiblePages[0].pageId);
      }
    }
  }, [permissionsLoading, activeSection, getAccessiblePages, canAccessPage]);

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
        <div className="admin-sidebar-header">
          <h1 className="admin-sidebar-title">Admin Portal</h1>
          <p className="admin-sidebar-subtitle">Manage your platform</p>
        </div>

        <button 
          className="back-button"
          onClick={() => navigate(-1)}
        >
          <FaArrowLeft /> Back
        </button>

        <div className="admin-nav">
          {permissionsLoading ? (
            <div className="admin-nav-loading">Loading navigation...</div>
          ) : (
            getAccessiblePages().map((page) => {
              const iconMap: Record<string, React.ComponentType> = {
                'users': FaUsers,
                'analytics': FaChartBar,
                'enquiries': FaEnvelope,
                'mentors': FaChalkboardTeacher,
                'verification': FaUserCheck,
                'feedback': FaComments,
                'testing-feedback': FaBug,
                'sessions': FaCalendarAlt,
                'settings': FaCog
              };
              
              const IconComponent = iconMap[page.pageId];
              
              return (
                <button 
                  key={page.pageId}
                  className={`admin-nav-item ${activeSection === page.pageId ? 'active' : ''}`}
                  onClick={() => setActiveSection(page.pageId)}
                  title={page.description}
                >
                  {IconComponent && <IconComponent />} {page.pageName}
                </button>
              );
            })
          )}
        </div>
      </div>

      <div className="admin-content">
        {canAccessPage('users') && activeSection === 'users' && <RoleManagement />}
        {canAccessPage('analytics') && activeSection === 'analytics' && <AdminAnalytics />}
        {canAccessPage('enquiries') && activeSection === 'enquiries' && <AdminEnquiries />}
        {canAccessPage('mentors') && activeSection === 'mentors' && <MentorManagement />}
        {canAccessPage('verification') && activeSection === 'verification' && <AdminMentorVerification />}
        {canAccessPage('feedback') && activeSection === 'feedback' && <FeedbackAnalytics />}
        {canAccessPage('testing-feedback') && activeSection === 'testing-feedback' && <AdminTestingFeedback />}
        {canAccessPage('sessions') && activeSection === 'sessions' && <SessionsManagement />}
        {canAccessPage('settings') && activeSection === 'settings' && <AdminSettings />}
      </div>
    </div>
  );
} 