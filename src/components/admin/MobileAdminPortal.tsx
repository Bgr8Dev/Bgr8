import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useBanner } from '../../contexts/BannerContext';
import { hasRole } from '../../utils/userProfile';
import { 
  FaChevronLeft, 
  FaChevronRight, 
  FaArrowLeft,
  FaArrowUp,
  FaArrowDown,
  FaMinus,
  FaUsers,
  FaChalkboardTeacher,
  FaCalendarAlt,
  FaComments,
  FaChartBar,
  FaCog
} from 'react-icons/fa';
import '../../styles/adminStyles/MobileAdminPortal.css';

import { MobileAdminSettings } from './settings/MobileAdminSettings';
// import MobileAnalytics from './analytics/MobileAnalytics';

// Inline MobileAnalytics component to avoid import issues
const MobileAnalytics: React.FC = () => {
  // Mock data - in a real app, this would come from your backend
  const analyticsData = {
    totalUsers: 1247,
    newUsersThisMonth: 89,
    totalMentors: 156,
    activeMentors: 142,
    totalSessions: 2341,
    sessionsThisMonth: 187,
    totalEnquiries: 456,
    pendingEnquiries: 23,
    totalFeedback: 1892,
    averageRating: 4.7,
    totalTestingFeedback: 234,
    pendingTestingFeedback: 12,
    totalAmbassadors: 45,
    pendingAmbassadors: 8
  };

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) return <FaArrowUp className="trend-up" />;
    if (current < previous) return <FaArrowDown className="trend-down" />;
    return <FaMinus className="trend-neutral" />;
  };

  const getTrendPercentage = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  return (
    <div className="mobile-analytics">
      {/* Overview Cards */}
      <div className="analytics-overview">
        <h3>Platform Overview</h3>
        <div className="overview-grid">
          <div className="overview-card users">
            <div className="card-icon">
              <FaUsers />
            </div>
            <div className="card-content">
              <h4>Total Users</h4>
              <p className="card-number">{analyticsData.totalUsers.toLocaleString()}</p>
              <div className="card-trend">
                {getTrendIcon(analyticsData.newUsersThisMonth, 75)}
                <span>+{analyticsData.newUsersThisMonth} this month</span>
              </div>
            </div>
          </div>

          <div className="overview-card mentors">
            <div className="card-icon">
              <FaChalkboardTeacher />
            </div>
            <div className="card-content">
              <h4>Active Mentors</h4>
              <p className="card-number">{analyticsData.activeMentors}</p>
              <div className="card-trend">
                {getTrendIcon(analyticsData.activeMentors, 138)}
                <span>{getTrendPercentage(analyticsData.activeMentors, 138)}% vs last month</span>
              </div>
            </div>
          </div>

          <div className="overview-card sessions">
            <div className="card-icon">
              <FaCalendarAlt />
            </div>
            <div className="card-content">
              <h4>Sessions</h4>
              <p className="card-number">{analyticsData.sessionsThisMonth}</p>
              <div className="card-trend">
                {getTrendIcon(analyticsData.sessionsThisMonth, 165)}
                <span>{getTrendPercentage(analyticsData.sessionsThisMonth, 165)}% vs last month</span>
              </div>
            </div>
          </div>

          <div className="overview-card rating">
            <div className="card-icon">
              <FaComments />
            </div>
            <div className="card-content">
              <h4>Avg Rating</h4>
              <p className="card-number">{analyticsData.averageRating}</p>
              <div className="card-trend">
                {getTrendIcon(analyticsData.averageRating, 4.6)}
                <span>{getTrendPercentage(analyticsData.averageRating * 10, 4.6 * 10)}% vs last month</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="analytics-actions">
        <h3>Quick Actions</h3>
        <div className="actions-grid">
          <button className="action-btn primary">
            <FaChartBar />
            <span>View Detailed Reports</span>
          </button>
          <button className="action-btn secondary">
            <FaUsers />
            <span>User Analytics</span>
          </button>
          <button className="action-btn secondary">
            <FaComments />
            <span>Feedback Analysis</span>
          </button>
          <button className="action-btn secondary">
            <FaCog />
            <span>Export Data</span>
          </button>
        </div>
      </div>
    </div>
  );
};
import { MobileEnquiries } from './enquiries/MobileEnquiries';
import { MobileAdminEmails } from './emails/MobileAdminEmails';
import MobileAdminAnnouncements from './announcements/MobileAdminAnnouncements';
import { MobileMentorVerification } from './verification/MobileMentorVerification';
import AdminTestingFeedback from '../../pages/adminPages/AdminTestingFeedback';
import { MobileMentorManagement } from './mentors/MobileMentorManagement';
import FeedbackAnalytics from './feedback/FeedbackAnalytics';
import { SessionsManagement } from './sessions/SessionsManagement';
import MobileRoleManagement from './users/MobileRoleManagement';
import AmbassadorApplications from './ambassadors/AmbassadorApplications';


interface MobileAdminPortalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileAdminPortal: React.FC<MobileAdminPortalProps> = ({
  isOpen,
  onClose
}) => {
  const { userProfile } = useAuth();
  const { isVisible } = useBanner();
  const navigate = useNavigate();
  const [currentSection, setCurrentSection] = useState(0);
  const [showMobileMentorManagement, setShowMobileMentorManagement] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Define sections for mobile navigation - filter by visibility
  const allSections = [
    { id: 'users', name: 'Roles', icon: '👥' },
    { id: 'analytics', name: 'Analytics', icon: '📊' },
    { id: 'enquiries', name: 'Enquiries', icon: '📧' },
    { id: 'mentors', name: 'Mentors', icon: '👨‍🏫' },
    { id: 'verification', name: 'Verification', icon: '✅' },
    { id: 'feedback', name: 'Feedback', icon: '💬' },
    { id: 'testing-feedback', name: 'Testing', icon: '🐛' },
    { id: 'sessions', name: 'Sessions', icon: '📅' },
    { id: 'ambassadors', name: 'Ambassadors', icon: '🤝' },
    { id: 'emails', name: 'Emails', icon: '📬' },
    { id: 'announcements', name: 'Announcements', icon: '📢' },
    { id: 'settings', name: 'Settings', icon: '⚙️' }
  ];
  
  // Filter sections based on visibility
  const sections = allSections.filter(section => isVisible(section.id));

  useEffect(() => {
    if (!hasRole(userProfile, 'admin')) {
      navigate('/');
      return;
    }
  }, [userProfile, navigate]);

  // Initialize scroll state when component mounts
  useEffect(() => {
    const container = document.querySelector('.map-section-indicators') as HTMLElement;
    if (container) {
      const { scrollLeft, scrollWidth, clientWidth } = container;
      setCanScrollLeft(scrollLeft > 5);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5);
    }
  }, [isOpen]);

  if (!isOpen || !hasRole(userProfile, 'admin')) return null;

  const nextSection = () => {
    if (currentSection < sections.length - 1) {
      const newSection = currentSection + 1;
      setCurrentSection(newSection);
      scrollToActiveTab(newSection);
    }
  };

  const prevSection = () => {
    if (currentSection > 0) {
      const newSection = currentSection - 1;
      setCurrentSection(newSection);
      scrollToActiveTab(newSection);
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollLeft, scrollWidth, clientWidth } = e.currentTarget;
    setCanScrollLeft(scrollLeft > 5);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5);
  };

  const scrollToActiveTab = (index: number) => {
    const container = document.querySelector('.map-section-indicators') as HTMLElement;
    if (container) {
      const tabWidth = 70; // Approximate width of each tab
      const containerWidth = container.clientWidth;
      const scrollPosition = (index * tabWidth) - (containerWidth / 2) + (tabWidth / 2);
      container.scrollTo({
        left: Math.max(0, scrollPosition),
        behavior: 'smooth'
      });
    }
  };

  const renderSection = () => {
    switch (currentSection) {
      case 0: // Users
        return (
          <div className="map-section">
            <h3 className="map-section-title">Role Management</h3>
            <div className="map-form-fields">
              <MobileRoleManagement />
            </div>
          </div>
        );

      case 1: // Analytics
        return (
          <div className="map-section">
            <h3 className="map-section-title">Analytics</h3>
            <div className="map-form-fields">
              <MobileAnalytics />
            </div>
          </div>
        );

      case 2: // Enquiries
        return (
          <div className="map-section">
            <h3 className="map-section-title">Enquiries</h3>
            <div className="map-form-fields">
              <MobileEnquiries />
            </div>
          </div>
        );

      case 3: // Mentors
        return (
          <div className="map-section">
            <h3 className="map-section-title">Mentor Management</h3>
            <div className="map-form-fields">
              <div className="map-mentor-management-card">
                <div className="map-mentor-icon">👨‍🏫</div>
                <div className="map-mentor-content">
                  <h4>Mentor Program Management</h4>
                  <p>Manage mentors, mentees, bookings, availability, and analytics</p>
                  <button
                    className="map-mentor-open-btn"
                    onClick={() => setShowMobileMentorManagement(true)}
                  >
                    Open Mentor Management
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 4: // Verification
        return (
          <div className="map-section">
            <h3 className="map-section-title">Mentor Verification</h3>
            <div className="map-form-fields">
              <MobileMentorVerification />
            </div>
          </div>
        );

      case 5: // Feedback
        return (
          <div className="map-section">
            <h3 className="map-section-title">Feedback Analytics</h3>
            <div className="map-form-fields">
              <FeedbackAnalytics />
            </div>
          </div>
        );

      case 6: // Testing Feedback
        return (
          <div className="map-section">
            <h3 className="map-section-title">Testing Feedback</h3>
            <div className="map-form-fields">
              <AdminTestingFeedback />
            </div>
          </div>
        );

      case 7: // Sessions
        return (
          <div className="map-section">
            <h3 className="map-section-title">Sessions Management</h3>
            <div className="map-form-fields">
              <SessionsManagement />
            </div>
          </div>
        );

      case 8: // Ambassadors
        return (
          <div className="map-section">
            <h3 className="map-section-title">Ambassador Applications</h3>
            <div className="map-form-fields">
              <AmbassadorApplications />
            </div>
          </div>
        );

        case 9: // Emails
          return (
            <div className="map-section">
              <h3 className="map-section-title">Email Management</h3>
              <div className="map-form-fields">
                <MobileAdminEmails />
              </div>
            </div>
          );

        case 10: // Announcements
          return (
            <div className="map-section">
              <h3 className="map-section-title">Announcement Management</h3>
              <div className="map-form-fields">
                <MobileAdminAnnouncements />
              </div>
            </div>
          );

        case 11: // Settings
          return (
            <div className="map-section">
              <h3 className="map-section-title">Admin Settings</h3>
              <div className="map-form-fields">
                <MobileAdminSettings />
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
                <div className="map-title-section">
                  <h2 className="map-title">Admin Portal</h2>
                  <p className="map-progress-text">
                    {sections[currentSection]?.name} • {currentSection + 1} of {sections.length}
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

              <div 
                className={`map-section-indicators ${canScrollLeft ? 'scroll-left' : ''} ${!canScrollRight ? 'scroll-right' : ''}`}
                onScroll={handleScroll}
              >
                {sections.map((section, index) => (
                  <button
                    key={section.id}
                    className={`map-section-indicator ${index === currentSection ? 'active' : ''}`}
                    onClick={() => {
                      setCurrentSection(index);
                      scrollToActiveTab(index);
                    }}
                    title={section.name}
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

      {/* Mobile Mentor Management Modal */}
      <MobileMentorManagement
        isOpen={showMobileMentorManagement}
        onClose={() => setShowMobileMentorManagement(false)}
      />
    </>
  );

  // Use createPortal to render the modal at the document root
  return createPortal(modalContent, document.body);
};
