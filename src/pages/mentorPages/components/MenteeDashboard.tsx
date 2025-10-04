import React, { useState, useEffect } from 'react';
import { MentorMenteeProfile } from '../types';
import { MenteeBookingHistoryModal } from './MenteeBookingHistoryModal';
import { MentorFeedbackModal } from '../../../components/modals/MentorFeedbackModal';
import { DeveloperFeedbackModal } from '../../../components/modals/DeveloperFeedbackModal';
import { useButtonEmergeModal } from '../../../hooks/useButtonEmergeModal';
import { useAuth } from '../../../hooks/useAuth';
import { MentorFeedbackService, MenteeFeedbackSummary } from '../../../services/mentorFeedbackService';
import { DeveloperFeedbackService } from '../../../services/developerFeedbackService';
import BannerWrapper from '../../../components/ui/BannerWrapper';
import { FaComments, FaStar, FaCode } from 'react-icons/fa';

interface MenteeDashboardProps {
  currentUserProfile: MentorMenteeProfile;
  onProfileEdit: (event?: React.MouseEvent<HTMLElement>) => void;
}

export const MenteeDashboard: React.FC<MenteeDashboardProps> = ({
  currentUserProfile,
  onProfileEdit
}) => {
  const { currentUser, userProfile } = useAuth();
  const [isProfileCardExpanded, setIsProfileCardExpanded] = useState(false);
  const [isBookingCardExpanded, setIsBookingCardExpanded] = useState(false);
  const [isFeedbackCardExpanded, setIsFeedbackCardExpanded] = useState(false);
  
  // Feedback state
  const [feedbackSummary, setFeedbackSummary] = useState<MenteeFeedbackSummary | null>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showDeveloperModal, setShowDeveloperModal] = useState(false);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [developerMode, setDeveloperMode] = useState(false);
  
  // Use button-emerge modal hook for booking history
  const { 
    isModalOpen: showHistoryModal, 
    isAnimating, 
    openModalWithAnimation: openHistoryModal, 
    closeModal: closeHistoryModal 
  } = useButtonEmergeModal({ 
    modalSelector: '.modal-content' 
  });

  // Load feedback summary and developer mode status when component mounts
  useEffect(() => {
    const loadFeedbackSummary = async () => {
      if (!currentUser) return;
      
      try {
        setLoadingFeedback(true);
        const summary = await MentorFeedbackService.getMenteeFeedbackSummary(currentUser.uid);
        setFeedbackSummary(summary);
      } catch (error) {
        console.error('Error loading feedback summary:', error);
      } finally {
        setLoadingFeedback(false);
      }
    };

    const checkDeveloperMode = () => {
      // Check if user has developer role using the service method
      const isDeveloperMode = DeveloperFeedbackService.isDeveloperModeEnabledForUser(userProfile);
      setDeveloperMode(isDeveloperMode);
    };

    loadFeedbackSummary();
    checkDeveloperMode();
  }, [currentUser, userProfile]);

  return (
    <BannerWrapper sectionId="mentee-dashboard" bannerType="element">
      <>
        {/* Dashboard Header */}
        <div className="dashboard-header">
        <div className="dashboard-title">
          <h1>Mentee Dashboard</h1>
          <p>Connect with experienced professionals who can guide you on your journey to success</p>
        </div>
        
        {/* Generated Profiles Info */}
        <div className="generated-profiles-info">
          <p className="info-text">
            💡 <strong>Tip:</strong> This platform includes both real user profiles and generated test profiles 
            (marked with 🎲) to help you explore the matching system and test features.
          </p>
          <p className="info-text" style={{ marginTop: '8px', fontSize: '0.9rem', opacity: '0.9' }}>
            🎯 <strong>Smart Matching:</strong> Your matches are automatically calculated and ranked by compatibility percentage.
          </p>
          
          {/* Developer Mode Toggle */}
          {developerMode && (
            <div className="developer-mode-notice">
              <FaCode className="dev-icon" />
              <span><strong>Developer Mode:</strong> You can provide feedback to any mentor for testing purposes.</span>
            </div>
          )}
        </div>
      </div>

      {/* User Profile Summary Cards */}
      <div className="profile-summary-cards">
        <div className="profile-card">
          <div className="profile-card-header">
            <div className="profile-info">
              <div className="profile-role mentee">Mentee</div>
              <div className="profile-name">
                {currentUserProfile.firstName} {currentUserProfile.lastName}
              </div>
            </div>
            <div className="profile-card-actions">
              <button 
                className="profile-edit-btn"
                onClick={(e) => onProfileEdit(e)}
                data-tooltip="Edit your profile information"
              >
                Edit Profile
              </button>
              <button 
                className="expand-toggle-btn"
                onClick={() => setIsProfileCardExpanded(!isProfileCardExpanded)}
                title={isProfileCardExpanded ? "Collapse profile details" : "Expand profile details"}
              >
                {isProfileCardExpanded ? '▼' : '▶'}
              </button>
            </div>
          </div>
          
          {/* Expandable Profile Content */}
          {isProfileCardExpanded && (
            <div className="profile-card-content">
              <div className="profile-details">
                <div className="detail-item">
                  <span className="detail-label">Email:</span>
                  <span className="detail-value">{currentUserProfile.email || 'Not provided'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Industry:</span>
                  <span className="detail-value">{(currentUserProfile.industry  || 'Not specified') as string}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Experience:</span>
                  <span className="detail-value">{(currentUserProfile.yearsOfExperience || 'Not specified') as string} years</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Skills:</span>
                  <span className="detail-value">
                    {Array.isArray(currentUserProfile.skills) && currentUserProfile.skills.length > 0 
                      ? currentUserProfile.skills.slice(0, 3).join(', ') + (currentUserProfile.skills.length > 3 ? '...' : '')
                      : 'No skills listed'
                    }
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Goals:</span>
                  <span className="detail-value">
                    {Array.isArray(currentUserProfile.goals) && currentUserProfile.goals.length > 0 
                      ? currentUserProfile.goals.slice(0, 2).join(', ') + (currentUserProfile.goals.length > 2 ? '...' : '')
                      : 'No goals specified'
                    }
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Learning Areas:</span>
                  <span className="detail-value">
                    {Array.isArray(currentUserProfile.learningAreas) && currentUserProfile.learningAreas.length > 0 
                      ? currentUserProfile.learningAreas.slice(0, 2).join(', ') + (currentUserProfile.learningAreas.length > 2 ? '...' : '')
                      : 'No learning areas specified'
                    }
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Mentee-specific booking history card */}
        <div className="profile-card">
          <div className="profile-card-header">
            <div className="profile-info">
              <div className="profile-role mentee">Mentee</div>
                             <div className="profile-name">Session Bookings</div>
            </div>
            <div className="profile-card-actions">
                             <button 
                 className="profile-edit-btn"
                 onClick={openHistoryModal}
                 disabled={isAnimating}
                 data-tooltip="View your booking history"
               >
                 {isAnimating ? 'Opening...' : 'View History'}
               </button>
              <button 
                className="expand-toggle-btn"
                onClick={() => setIsBookingCardExpanded(!isBookingCardExpanded)}
                title={isBookingCardExpanded ? "Collapse booking details" : "Expand booking details"}
              >
                {isBookingCardExpanded ? '▼' : '▶'}
              </button>
            </div>
          </div>
          
          {/* Expandable Booking Content */}
          {isBookingCardExpanded && (
            <div className="profile-card-content">
                             <div className="booking-summary">
                 <div className="booking-stat">
                   <span className="stat-number">
                     📚
                   </span>
                   <span className="stat-label">Total Bookings</span>
                 </div>
                 <div className="booking-stat">
                   <span className="stat-number">
                     ✅
                   </span>
                   <span className="stat-label">Confirmed</span>
                 </div>
                 <div className="booking-stat">
                   <span className="stat-number">
                     ⏳
                   </span>
                   <span className="stat-label">Pending</span>
                 </div>
               </div>
              
              <div className="booking-actions">
                                 <button 
                   className="booking-action-btn primary"
                   onClick={openHistoryModal}
                   disabled={isAnimating}
                 >
                   📊 {isAnimating ? 'Opening...' : 'View Full History'}
                 </button>
                <button 
                  className="booking-action-btn secondary"
                  onClick={() => {/* TODO: Export booking data */}}
                >
                  📥 Export Data
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Mentor Feedback Card */}
        <div className="profile-card">
          <div className="profile-card-header">
            <div className="profile-info">
              <div className="profile-role mentee">Mentee</div>
              <div className="profile-name">Mentor Feedback</div>
            </div>
            <div className="profile-card-actions">
              <button 
                className="profile-edit-btn"
                onClick={() => setShowFeedbackModal(true)}
                disabled={!feedbackSummary || feedbackSummary.pendingFeedback === 0}
                data-tooltip={feedbackSummary?.pendingFeedback === 0 ? "No pending feedback to provide" : "Provide feedback to your mentors"}
              >
                <FaComments />
                {feedbackSummary?.pendingFeedback === 0 ? 'No Pending' : `Provide Feedback (${feedbackSummary?.pendingFeedback || 0})`}
              </button>
              {developerMode && (
                <button 
                  className="profile-edit-btn developer-btn"
                  onClick={() => setShowDeveloperModal(true)}
                  data-tooltip="Developer mode: Provide feedback to any mentor for testing"
                >
                  <FaCode />
                  Dev Mode
                </button>
              )}
              <button 
                className="expand-toggle-btn"
                onClick={() => setIsFeedbackCardExpanded(!isFeedbackCardExpanded)}
                title={isFeedbackCardExpanded ? "Collapse feedback details" : "Expand feedback details"}
              >
                {isFeedbackCardExpanded ? '▼' : '▶'}
              </button>
            </div>
          </div>
          
          {/* Expandable Feedback Content */}
          {isFeedbackCardExpanded && (
            <div className="profile-card-content">
              {loadingFeedback ? (
                <div className="loading-state">
                  <div className="loading-spinner"></div>
                  <p>Loading feedback information...</p>
                </div>
              ) : feedbackSummary ? (
                <>
                  <div className="feedback-summary">
                    <div className="feedback-stat">
                      <span className="stat-number">
                        <FaStar />
                      </span>
                      <span className="stat-label">Completed Sessions</span>
                      <span className="stat-value">{feedbackSummary.totalCompletedSessions}</span>
                    </div>
                    <div className="feedback-stat">
                      <span className="stat-number">
                        <FaComments />
                      </span>
                      <span className="stat-label">Feedback Provided</span>
                      <span className="stat-value">{feedbackSummary.feedbackSubmitted}</span>
                    </div>
                    <div className="feedback-stat">
                      <span className="stat-number">
                        ⏳
                      </span>
                      <span className="stat-label">Pending Feedback</span>
                      <span className="stat-value">{feedbackSummary.pendingFeedback}</span>
                    </div>
                  </div>
                  
                  <div className="feedback-actions">
                    <button 
                      className="feedback-action-btn primary"
                      onClick={() => setShowFeedbackModal(true)}
                      disabled={feedbackSummary.pendingFeedback === 0}
                    >
                      <FaComments /> {feedbackSummary.pendingFeedback === 0 ? 'No Pending Feedback' : `Provide Feedback (${feedbackSummary.pendingFeedback})`}
                    </button>
                    {developerMode && (
                      <button 
                        className="feedback-action-btn developer"
                        onClick={() => setShowDeveloperModal(true)}
                      >
                        <FaCode /> Developer Mode
                      </button>
                    )}
                    {feedbackSummary.feedbackSubmitted > 0 && (
                      <button 
                        className="feedback-action-btn secondary"
                        onClick={() => {/* TODO: View feedback history */}}
                      >
                        📊 View Feedback History
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <div className="no-feedback-data">
                  <p>Unable to load feedback information. Please try again later.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Booking History Modal */}
      <MenteeBookingHistoryModal
        isOpen={showHistoryModal}
        onClose={closeHistoryModal}
        currentUserProfile={currentUserProfile}
      />

      {/* Mentor Feedback Modal */}
      {feedbackSummary && (
        <MentorFeedbackModal
          isOpen={showFeedbackModal}
          onClose={() => setShowFeedbackModal(false)}
          eligibleMentors={feedbackSummary.eligibleForFeedback}
        />
      )}

      {/* Developer Feedback Modal */}
      <DeveloperFeedbackModal
        isOpen={showDeveloperModal}
        onClose={() => setShowDeveloperModal(false)}
      />
      
      
      </>
    </BannerWrapper>
  );
};
