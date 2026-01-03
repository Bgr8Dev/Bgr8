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
import ResourcesLibrary from '../../../components/widgets/ResourcesLibrary';
import MenteeProgress from '../../../components/widgets/MenteeProgress';
import MessagingWidget from '../../../components/widgets/MessagingWidget';
import { FaComments, FaStar, FaCode, FaSync } from 'react-icons/fa';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { firestore } from '../../../firebase/firebase';
import { loggers } from '../../../utils/logger';

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
  
  // Bookings state
  const [bookings, setBookings] = useState<Array<{
    id: string;
    mentorName: string;
    sessionDate: string;
    startTime: string;
    status: string;
    endTime?: string;
    sessionLink?: string;
  }>>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState<string | null>(null);
  
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
        // Error is already handled gracefully in the service, but log a warning if needed
        loggers.warn.warn('Feedback summary unavailable:', error);
        // Set default empty summary to prevent UI errors
        setFeedbackSummary({
          totalCompletedSessions: 0,
          eligibleForFeedback: [],
          feedbackSubmitted: 0,
          pendingFeedback: 0
        });
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
    fetchMenteeBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.uid, currentUserProfile?.uid]);

  // Fetch mentee bookings from Firebase
  const fetchMenteeBookings = async () => {
    if (!currentUser?.uid) return;
    
    try {
      setLoadingBookings(true);
      const bookingsQuery = query(
        collection(firestore, 'bookings'),
        where('menteeId', '==', currentUser.uid)
      );
      const bookingsSnapshot = await getDocs(bookingsQuery);
      
      const fetchedBookings = bookingsSnapshot.docs.map(doc => {
        const data = doc.data();
        
        // Handle Timestamp conversion for sessionDate
        let sessionDate: string = '';
        if (data.sessionDate) {
          if (data.sessionDate.toDate && typeof data.sessionDate.toDate === 'function') {
            sessionDate = data.sessionDate.toDate().toISOString();
          } else if (data.sessionDate instanceof Date) {
            sessionDate = data.sessionDate.toISOString();
          } else if (typeof data.sessionDate === 'string') {
            sessionDate = data.sessionDate;
          } else if (data.sessionDate.seconds) {
            sessionDate = new Date(data.sessionDate.seconds * 1000).toISOString();
          }
        } else if (data.day) {
          sessionDate = new Date(data.day).toISOString();
        }
        
        return {
          id: doc.id,
          mentorName: data.mentorName || 'Unknown Mentor',
          sessionDate: sessionDate,
          startTime: data.startTime || '',
          endTime: data.endTime || '',
          status: data.status || 'pending',
          sessionLink: data.sessionLink || data.meetLink || ''
        };
      });
      
      setBookings(fetchedBookings);
      loggers.booking.log(`📋 Loaded ${fetchedBookings.length} bookings for mentee ${currentUser.uid}`);
    } catch (error) {
      loggers.booking.error('Error fetching mentee bookings:', error);
    } finally {
      setLoadingBookings(false);
    }
  };

  // Refresh bookings
  const refreshBookings = async () => {
    setIsRefreshing(true);
    setRefreshMessage(null);
    await fetchMenteeBookings();
    setRefreshMessage('Bookings refreshed successfully!');
    setIsRefreshing(false);
    setTimeout(() => setRefreshMessage(null), 3000);
  };

  // Helper function to parse session date safely
  const parseSessionDate = (sessionDate: string): Date => {
    if (!sessionDate) return new Date(0);
    try {
      const date = new Date(sessionDate);
      return isNaN(date.getTime()) ? new Date(0) : date;
    } catch {
      return new Date(0);
    }
  };

  // Helper functions for booking stats
  const getAllBookings = () => {
    return bookings.filter(booking => {
      const date = parseSessionDate(booking.sessionDate);
      return date.getTime() !== 0;
    });
  };

  const getUpcomingBookings = () => {
    const now = new Date();
    return getAllBookings().filter(booking => {
      const bookingDate = parseSessionDate(booking.sessionDate);
      return bookingDate > now;
    });
  };

  const getConfirmedBookings = () => {
    return getAllBookings().filter(booking => 
      (booking.status || '').toLowerCase() === 'confirmed'
    );
  };

  const getPendingBookings = () => {
    return getAllBookings().filter(booking => 
      (booking.status || '').toLowerCase() === 'pending'
    );
  };

  return (
    <BannerWrapper sectionId="mentee-dashboard" bannerType="element" checkVisibility={true}>
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
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button 
                  className="sync-calcom-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    refreshBookings();
                  }}
                  disabled={isRefreshing}
                  title="Refresh bookings from database"
                  style={{ 
                    background: 'rgba(255, 255, 255, 0.2)', 
                    color: 'var(--white)', 
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    cursor: isRefreshing ? 'not-allowed' : 'pointer'
                  }}
                >
                  <FaSync className={isRefreshing ? 'spinning' : ''} style={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }} />
                  {isRefreshing ? 'Refreshing...' : 'Refresh'}
                </button>
                <button 
                  className="profile-edit-btn"
                  onClick={openHistoryModal}
                  disabled={isAnimating}
                  data-tooltip="View your booking history"
                >
                  {isAnimating ? 'Opening...' : 'View History'}
                </button>
              </div>
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
              {refreshMessage && (
                <div className="sync-message success" style={{ marginBottom: '1rem', padding: '0.75rem', borderRadius: '8px', background: 'rgba(76, 175, 80, 0.2)', color: '#4caf50', border: '1px solid rgba(76, 175, 80, 0.3)' }}>
                  {refreshMessage}
                </div>
              )}
              
              {loadingBookings ? (
                <div className="loading-state">
                  <div className="loading-spinner"></div>
                  <p>Loading bookings...</p>
                </div>
              ) : (
                <>
                  <div className="booking-summary">
                    <div className="booking-stat">
                      <span className="stat-number">
                        {getAllBookings().length}
                      </span>
                      <span className="stat-label">Total Bookings</span>
                    </div>
                    <div className="booking-stat">
                      <span className="stat-number">
                        {getConfirmedBookings().length}
                      </span>
                      <span className="stat-label">Confirmed</span>
                    </div>
                    <div className="booking-stat">
                      <span className="stat-number">
                        {getPendingBookings().length}
                      </span>
                      <span className="stat-label">Pending</span>
                    </div>
                    <div className="booking-stat">
                      <span className="stat-number">
                        {getUpcomingBookings().length}
                      </span>
                      <span className="stat-label">Upcoming</span>
                    </div>
                  </div>
                  
                  {getAllBookings().length > 0 ? (
                    <div className="bookings-list" style={{ marginTop: '1.5rem' }}>
                      {getAllBookings()
                        .sort((a, b) => {
                          const dateA = parseSessionDate(a.sessionDate);
                          const dateB = parseSessionDate(b.sessionDate);
                          return dateA.getTime() - dateB.getTime();
                        })
                        .slice(0, 5)
                        .map((booking) => {
                          const bookingDate = parseSessionDate(booking.sessionDate);
                          const formattedDate = bookingDate.getTime() !== 0 
                            ? bookingDate.toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'short', 
                                day: 'numeric' 
                              })
                            : 'Date TBD';
                          
                          return (
                            <div key={booking.id} className="booking-item" style={{ 
                              padding: '1rem', 
                              marginBottom: '0.75rem', 
                              background: 'var(--white)', 
                              borderRadius: '8px',
                              border: '1px solid #e0e0e0'
                            }}>
                              <div className="booking-info">
                                <div className="booking-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '600' }}>{booking.mentorName}</h4>
                                  <span className={`booking-status ${(booking.status || 'pending').toLowerCase()}`} style={{
                                    padding: '0.25rem 0.75rem',
                                    borderRadius: '12px',
                                    fontSize: '0.75rem',
                                    fontWeight: '500',
                                    background: booking.status === 'confirmed' ? '#4caf50' : booking.status === 'pending' ? '#ff9800' : '#f44336',
                                    color: 'white'
                                  }}>
                                    {(booking.status || 'Pending').charAt(0).toUpperCase() + (booking.status || 'Pending').slice(1)}
                                  </span>
                                </div>
                                <div className="booking-details" style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: '#666' }}>
                                  <span className="booking-date">
                                    📅 {formattedDate}
                                  </span>
                                  <span className="booking-time">
                                    🕐 {booking.startTime || 'Time TBD'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  ) : (
                    <div className="no-bookings" style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                      <p>No bookings yet. Your scheduled sessions will appear here.</p>
                      <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
                        Book a session with a mentor to get started!
                      </p>
                    </div>
                  )}
                  
                  <div className="booking-actions" style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem' }}>
                    <button 
                      className="booking-action-btn primary"
                      onClick={openHistoryModal}
                      disabled={isAnimating}
                      style={{
                        flex: 1,
                        padding: '0.75rem 1.5rem',
                        background: 'var(--coral-primary)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: '500'
                      }}
                    >
                      📊 {isAnimating ? 'Opening...' : 'View Full History'}
                    </button>
                  </div>
                </>
              )}
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

      {/* Resources Library Widget */}
      <ResourcesLibrary />

      {/* Mentee Progress Widget */}
      <MenteeProgress />

      {/* Messaging Widget */}
      <MessagingWidget />
      
      </>
    </BannerWrapper>
  );
};
