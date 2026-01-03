import React, { useState, useEffect } from 'react';
import { MentorMenteeProfile } from '../types';
import { ViewBookingsModal } from './ViewBookingsModal';
import { VerificationStatus, canAccessPlatform, isUnderReview, isRejected } from '../../../types/verification';
import { VerificationService } from '../../../services/verificationService';
import { MatchesService, Match } from '../../../services/matchesService';
import { useAuth } from '../../../hooks/useAuth';
import { ProfilePicture } from '../../../components/ui/ProfilePicture';
import { FaComments, FaUser, FaHeart } from 'react-icons/fa';
import BannerWrapper from '../../../components/ui/BannerWrapper';
import ResourcesLibrary from '../../../components/widgets/ResourcesLibrary';
import MenteeProgress from '../../../components/widgets/MenteeProgress';
import MessagingWidget from '../../../components/widgets/MessagingWidget';
import CalComSetupModal from '../../../components/widgets/CalComSetup/CalComSetupModal';
import '../styles/MentorDashboard.css';

interface MentorBooking {
  id: string;
  menteeName: string;
  sessionDate: string;
  startTime: string;
  status: string;
}

interface MentorBookings {
  [key: string]: MentorBooking[];
}

interface MentorDashboardProps {
  currentUserProfile: MentorMenteeProfile;
  mentorBookings: MentorBookings;
  onProfileEdit: (event?: React.MouseEvent<HTMLElement>) => void;
  onViewAllBookings: () => void;
  onAcceptBooking: (bookingId: string) => void;
  onRejectBooking: (bookingId: string) => void;
  onCancelBooking: (bookingId: string) => void;
}

export const MentorDashboard: React.FC<MentorDashboardProps> = ({
  currentUserProfile,
  mentorBookings,
  onProfileEdit,
  onViewAllBookings,
  onAcceptBooking,
  onRejectBooking,
  onCancelBooking
}) => {
  const { currentUser } = useAuth();
  const [isProfileCardExpanded, setIsProfileCardExpanded] = useState(false);
  const [isMatchesCardExpanded, setIsMatchesCardExpanded] = useState(false);
  const [isBookingWidgetMinimized, setIsBookingWidgetMinimized] = useState(false);
  const [showViewBookingsModal, setShowViewBookingsModal] = useState(false);
  const [matches, setMatches] = useState<Match[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(true);
  
  // Verification state
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | null>(null);
  const [verificationLoading, setVerificationLoading] = useState(true);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  
  // Cal.com setup state
  const [showCalComSetup, setShowCalComSetup] = useState(false);
  const [calComSetupLoading, setCalComSetupLoading] = useState(true);

  // Fetch verification status and check Cal.com setup on component mount
  useEffect(() => {
    const fetchVerificationStatus = async () => {
      if (!currentUserProfile?.uid) return;
      
      try {
        setVerificationLoading(true);
        setCalComSetupLoading(true);
        setVerificationError(null);
        
        const verificationData = await VerificationService.getVerificationData(currentUserProfile.uid);
        const status = verificationData?.status || null;
        setVerificationStatus(status);
        
        // Only show Cal.com setup if verification status is 'approved' (manually verified)
        // This ensures Cal.com setup comes AFTER verification, not immediately after signup
        if (status === 'approved') {
          // Check if Cal.com is already set up
          const hasCalCom = currentUserProfile.calCom && 
                           currentUserProfile.calCom.trim() !== '' &&
                           currentUserProfile.calCom !== 'Connect your Cal.com public page to enable video call scheduling' &&
                           !currentUserProfile.calCom.includes('Connect your Cal.com');
          
          // Only show setup if verified AND Cal.com not set up
          if (!hasCalCom) {
            setShowCalComSetup(true);
          }
        } else {
          // If not approved yet, don't show Cal.com setup
          setShowCalComSetup(false);
        }
      } catch (error) {
        console.error('Error fetching verification status:', error);
        setVerificationError('Failed to load verification status');
      } finally {
        setVerificationLoading(false);
        setCalComSetupLoading(false);
      }
    };

    fetchVerificationStatus();
  }, [currentUserProfile?.uid, currentUserProfile?.calCom]);

  // Fetch matches for the mentor
  useEffect(() => {
    const fetchMatches = async () => {
      if (!currentUser?.uid) return;
      
      try {
        setMatchesLoading(true);
        const userMatches = await MatchesService.getMatches(currentUser.uid);
        setMatches(userMatches);
      } catch (error) {
        console.error('Error fetching matches:', error);
      } finally {
        setMatchesLoading(false);
      }
    };

    fetchMatches();
  }, [currentUser?.uid]);
  
  // Handle Cal.com setup completion
  const handleCalComSetupComplete = () => {
    setShowCalComSetup(false);
    // Reload the page to refresh the profile data
    window.location.reload();
  };

  const toggleBookingWidget = () => {
    setIsBookingWidgetMinimized(!isBookingWidgetMinimized);
  };

  const handleViewAllBookings = () => {
    onViewAllBookings();
  };

  // Helper function to get all bookings from the object
  const getAllBookings = (): MentorBooking[] => {
    return Object.values(mentorBookings).flat();
  };

  // Helper function to get upcoming bookings
  const getUpcomingBookings = (): MentorBooking[] => {
    return getAllBookings().filter(booking => 
      new Date(booking.sessionDate) > new Date()
    );
  };

  // Helper function to get completed bookings
  const getCompletedBookings = (): MentorBooking[] => {
    return getAllBookings().filter(booking => 
      new Date(booking.sessionDate) <= new Date()
    );
  };

  // Show Cal.com setup if verified but Cal.com not set up
  if (showCalComSetup && verificationStatus === 'approved' && !calComSetupLoading) {
    return (
      <>
        <CalComSetupModal 
          isOpen={true} 
          onComplete={handleCalComSetupComplete}
        />
      </>
    );
  }

  // Show verification status if not approved
  if (verificationLoading) {
    return (
      <div className="verification-loading">
        <div className="loading-spinner"></div>
        <p>Loading verification status...</p>
      </div>
    );
  }

  if (verificationError) {
    return (
      <div className="verification-error">
        <h2>Verification Error</h2>
        <p>{verificationError}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  // If verification status is not approved, show verification status page
  if (verificationStatus && !canAccessPlatform(verificationStatus)) {
    return (
      <div className="verification-status-page">
        <div className="verification-status-card">
          <h2>Verification Status</h2>
          <div className={`verification-status-badge ${verificationStatus}`}>
            {verificationStatus.replace('_', ' ').toUpperCase()}
          </div>
          
          {isUnderReview(verificationStatus) && (
            <div className="verification-message">
              <h3>Your profile is under review</h3>
              <p>Thank you for submitting your mentor profile. Our team is currently reviewing your application. You'll receive an email notification once the review is complete.</p>
              <div className="verification-timeline">
                <div className="timeline-item active">
                  <div className="timeline-dot"></div>
                  <div className="timeline-content">
                    <h4>Profile Submitted</h4>
                    <p>Your profile has been submitted for verification</p>
                  </div>
                </div>
                <div className="timeline-item">
                  <div className="timeline-dot"></div>
                  <div className="timeline-content">
                    <h4>Under Review</h4>
                    <p>Our team is reviewing your qualifications</p>
                  </div>
                </div>
                <div className="timeline-item">
                  <div className="timeline-dot"></div>
                  <div className="timeline-content">
                    <h4>Verification Complete</h4>
                    <p>You'll gain access to the mentor dashboard</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {isRejected(verificationStatus) && (
            <div className="verification-message">
              <h3>Application Not Approved</h3>
              <p>Unfortunately, your mentor application was not approved at this time. Please review the requirements and consider reapplying in the future.</p>
              <button onClick={onProfileEdit} className="edit-profile-btn">
                Edit Profile
              </button>
            </div>
          )}

          {verificationStatus === 'suspended' && (
            <div className="verification-message">
              <h3>Account Suspended</h3>
              <p>Your mentor account has been temporarily suspended. Please contact support for more information.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <BannerWrapper sectionId="mentor-dashboard" bannerType="element" checkVisibility={true}>
      <>
        {/* Dashboard Header */}
        <div className="dashboard-header">
        <div className="dashboard-title">
          <h1>Mentor Dashboard</h1>
          <p>Find mentees who can benefit from your knowledge and experience</p>
        </div>
        
        {/* Mentor-specific info */}
        <div className="generated-profiles-info">
          <p className="info-text">
            💡 <strong>Welcome to your Mentor Dashboard!</strong> Here you can manage your profile, 
            view mentees who have matched with you, and see your upcoming sessions.
          </p>
        </div>
      </div>

      {/* User Profile Summary Cards */}
      <div className="profile-summary-cards">
        <div className="profile-card">
          <div className="profile-card-header">
            <div className="profile-info">
              <div className="profile-role mentor">Mentor</div>
              <div className="profile-name">
                {currentUserProfile.firstName} {currentUserProfile.lastName}
              </div>
            </div>
            <div className="profile-card-actions">
              <button 
                className="mentor-profile-edit-btn"
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
                  <span className="detail-value">{(currentUserProfile.industry || 'Not specified') as string}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Experience:</span>
                  <span className="detail-value">{(currentUserProfile.yearsOfExperience || 'Not specified') as string} years</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Skills:</span>
                  <span className="detail-value">
                    {currentUserProfile.skills && currentUserProfile.skills.length > 0 
                      ? currentUserProfile.skills.slice(0, 3).join(', ') + (currentUserProfile.skills.length > 3 ? '...' : '')
                      : 'No skills listed'
                    }
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="profile-card">
          <div className="profile-card-header">
            <div className="profile-info">
              <div className="profile-role mentor">Mentor</div>
              <div className="profile-name">Matched Mentees</div>
            </div>
            <div className="profile-card-actions">
              <button 
                className="expand-toggle-btn"
                onClick={() => setIsMatchesCardExpanded(!isMatchesCardExpanded)}
                title={isMatchesCardExpanded ? "Collapse matches" : "Expand matches"}
              >
                {isMatchesCardExpanded ? '▼' : '▶'}
              </button>
            </div>
          </div>
          
          {/* Expandable Matches Content */}
          {isMatchesCardExpanded && (
            <div className="profile-card-content">
              {matchesLoading ? (
                <div className="matches-loading">
                  <p>Loading matches...</p>
                </div>
              ) : matches.length === 0 ? (
                <div className="no-matches">
                  <FaHeart style={{ fontSize: '2rem', color: '#ccc', marginBottom: '12px' }} />
                  <p>No mentees have matched with you yet.</p>
                  <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '8px' }}>
                    Once mentees match with you, they'll appear here.
                  </p>
                </div>
              ) : (
                <div className="matches-list">
                  {matches.map((match) => (
                    <div key={match.id} className="match-item">
                      <div className="match-item-header">
                        <div className="match-avatar">
                          <ProfilePicture
                            src={
                              match.matchedUserProfile?.profilePicture
                                ? (typeof match.matchedUserProfile.profilePicture === 'string'
                                    ? match.matchedUserProfile.profilePicture
                                    : Array.isArray(match.matchedUserProfile.profilePicture)
                                    ? match.matchedUserProfile.profilePicture[0]
                                    : null)
                                : null
                            }
                            alt={match.matchedUserName}
                            role="mentee"
                            size={48}
                          />
                        </div>
                        <div className="match-info">
                          <h4>{match.matchedUserName}</h4>
                          <p>
                            {match.matchedUserProfile?.profession ||
                              match.matchedUserProfile?.educationLevel ||
                              'Mentee'}
                          </p>
                          {match.matchedUserProfile?.county && (
                            <p className="match-location">{match.matchedUserProfile.county}</p>
                          )}
                        </div>
                        {match.unreadCount && match.unreadCount > 0 && (
                          <div className="match-unread-badge">{match.unreadCount}</div>
                        )}
                      </div>
                      <div className="match-actions">
                        <button
                          className="match-action-btn message-btn"
                          onClick={() => {
                            const event = new CustomEvent('openMessaging', {
                              detail: { userId: match.matchedUserId }
                            });
                            window.dispatchEvent(event);
                          }}
                          title="Message this mentee"
                        >
                          <FaComments />
                          Message
                        </button>
                        <button
                          className="match-action-btn profile-btn"
                          onClick={() => {
                            // Could open profile modal here if needed
                            console.log('View profile:', match.matchedUserId);
                          }}
                          title="View profile"
                        >
                          <FaUser />
                          Profile
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bookings Widget */}
      <div className={`bookings-widget-section ${isBookingWidgetMinimized ? 'minimized' : ''}`}>
        <div 
          className="bookings-widget-header"
          onClick={toggleBookingWidget}
          style={{ cursor: 'pointer' }}
        >
          <div className="bookings-widget-title">
            <h2>Your Bookings</h2>
            <button 
              className="minimize-toggle-btn"
              onClick={(e) => {
                e.stopPropagation();
                toggleBookingWidget();
              }}
              title={isBookingWidgetMinimized ? "Expand widget" : "Minimize widget"}
            >
              {isBookingWidgetMinimized ? '▼' : '▲'}
            </button>
          </div>
          {!isBookingWidgetMinimized && (
            <p>Manage and view all your scheduled sessions</p>
          )}
        </div>
        
        {!isBookingWidgetMinimized && (
          <div className="bookings-widget-content">
            <div className="bookings-summary">
                              <div className="booking-stat">
                  <span className="stat-number">
                    {getAllBookings().length}
                  </span>
                  <span className="stat-label">Total Bookings</span>
                </div>
                <div className="booking-stat">
                  <span className="stat-number">
                    {getUpcomingBookings().length}
                  </span>
                  <span className="stat-label">Upcoming</span>
                </div>
                <div className="booking-stat">
                  <span className="stat-number">
                    {getCompletedBookings().length}
                  </span>
                  <span className="stat-label">Completed</span>
                </div>
            </div>
            
            <div className="bookings-list">
              {getAllBookings().length > 0 ? (
                getAllBookings()
                  .sort((a: MentorBooking, b: MentorBooking) => new Date(a.sessionDate).getTime() - new Date(b.sessionDate).getTime())
                  .slice(0, 5)
                  .map((booking: MentorBooking, index) => (
                    <div key={index} className="booking-item">
                      <div className="booking-info">
                        <div className="booking-header">
                          <h4>{booking.menteeName || 'Mentee'}</h4>
                          <span className={`booking-status ${booking.status || 'pending'}`}>
                            {booking.status || 'Pending'}
                          </span>
                        </div>
                        <div className="booking-details">
                          <span className="booking-date">
                            {new Date(booking.sessionDate).toLocaleDateString()}
                          </span>
                          <span className="booking-time">
                            {booking.startTime || 'Time TBD'}
                          </span>
                        </div>
                      </div>
                      <div className="booking-actions">
                        <button className="booking-action-btn view">View Details</button>
                        {booking.status === 'pending' && (
                          <button className="booking-action-btn accept">Accept</button>
                        )}
                      </div>
                    </div>
                  ))
              ) : (
                <div className="no-bookings">
                  <p>No bookings yet. Your scheduled sessions will appear here.</p>
                </div>
              )}
            </div>
            
            <div className="bookings-widget-footer">
              <button className="view-all-bookings-btn" onClick={handleViewAllBookings}>
                View All Bookings
              </button>
            </div>
          </div>
        )}
      </div>

      {/* View Bookings Modal */}
      {showViewBookingsModal && (
        <ViewBookingsModal
          isOpen={showViewBookingsModal}
          onClose={() => setShowViewBookingsModal(false)}
          bookings={getAllBookings()}
          onAcceptBooking={onAcceptBooking}
          onRejectBooking={onRejectBooking}
          onCancelBooking={onCancelBooking}
        />
      )}

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
