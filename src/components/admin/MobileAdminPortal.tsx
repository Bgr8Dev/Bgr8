import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { hasRole } from '../../utils/userProfile';
import { 
  FaChevronLeft, 
  FaChevronRight, 
  FaArrowLeft
} from 'react-icons/fa';
import '../../styles/adminStyles/MobileAdminPortal.css';

import { MobileAdminSettings } from './settings/MobileAdminSettings';
import MobileAnalytics from './analytics/MobileAnalytics';
import { MobileEnquiries } from './enquiries/MobileEnquiries';
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
  const navigate = useNavigate();
  const [currentSection, setCurrentSection] = useState(0);
  const [showMobileMentorManagement, setShowMobileMentorManagement] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Define sections for mobile navigation
  const sections = [
    { id: 'users', name: 'Roles', icon: '👥' },
    { id: 'analytics', name: 'Analytics', icon: '📊' },
    { id: 'enquiries', name: 'Enquiries', icon: '📧' },
    { id: 'mentors', name: 'Mentors', icon: '👨‍🏫' },
    { id: 'verification', name: 'Verification', icon: '✅' },
    { id: 'feedback', name: 'Feedback', icon: '💬' },
    { id: 'testing-feedback', name: 'Testing', icon: '🐛' },
    { id: 'sessions', name: 'Sessions', icon: '📅' },
    { id: 'ambassadors', name: 'Ambassadors', icon: '🤝' },
    { id: 'settings', name: 'Settings', icon: '⚙️' }
  ];

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

      case 9: // Settings
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
