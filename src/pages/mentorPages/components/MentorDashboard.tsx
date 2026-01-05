import React, { useState, useEffect } from 'react';
import { MentorMenteeProfile } from '../types';
import { ViewBookingsModal } from './ViewBookingsModal';
import { VerificationStatus, canAccessPlatform, isUnderReview, isRejected } from '../../../types/verification';
import { VerificationService } from '../../../services/verificationService';
import { MatchesService, Match } from '../../../services/matchesService';
import { useAuth } from '../../../hooks/useAuth';
import { ProfilePicture } from '../../../components/ui/ProfilePicture';
import { FaComments, FaUser, FaHeart, FaSync } from 'react-icons/fa';
import BannerWrapper from '../../../components/ui/BannerWrapper';
import ResourcesLibrary from '../../../components/widgets/ResourcesLibrary';
import MenteeProgress from '../../../components/widgets/MenteeProgress';
import MessagingWidget from '../../../components/widgets/MessagingWidget';
import CalComSetupModal from '../../../components/widgets/CalComSetup/CalComSetupModal';
import { CalComService, CalComTokenManager, CalComBookingResponse } from '../../../components/widgets/MentorAlgorithm/CalCom/calComService';
import { collection, query, where, getDocs, addDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { firestore } from '../../../firebase/firebase';
import { SessionsService } from '../../../services/sessionsService';
import { getName } from '../types/mentorTypes';
import { loggers } from '../../../utils/logger';
import { BookingCompletionService } from '../../../services/bookingCompletionService';
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
  
  // Sync bookings state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

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
        loggers.error.error('Error fetching verification status:', error);
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
        loggers.error.error('Error fetching matches:', error);
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

  // Helper function to parse session date safely
  const parseSessionDate = (sessionDate: string): Date => {
    if (!sessionDate) return new Date(0); // Return epoch date if missing
    
    try {
      // Try parsing as ISO string first
      const date = new Date(sessionDate);
      if (!isNaN(date.getTime())) {
        return date;
      }
      // Try parsing as date string
      const date2 = new Date(sessionDate);
      return isNaN(date2.getTime()) ? new Date(0) : date2;
    } catch {
      return new Date(0);
    }
  };

  // Helper function to get all bookings from the object
  const getAllBookings = (): MentorBooking[] => {
    const allBookings = Object.values(mentorBookings).flat();
    // Filter out bookings with invalid dates and ensure proper formatting
    return allBookings.filter(booking => {
      if (!booking.sessionDate) return false;
      const date = parseSessionDate(booking.sessionDate);
      return date.getTime() !== 0; // Filter out invalid dates
    });
  };

  // Helper function to get upcoming bookings
  const getUpcomingBookings = (): MentorBooking[] => {
    const now = new Date();
    return getAllBookings().filter(booking => {
      const bookingDate = parseSessionDate(booking.sessionDate);
      return bookingDate > now;
    });
  };

  // Helper function to get completed bookings
  const getCompletedBookings = (): MentorBooking[] => {
    const now = new Date();
    return getAllBookings().filter(booking => {
      const bookingDate = parseSessionDate(booking.sessionDate);
      return bookingDate <= now;
    });
  };

  // Sync bookings from Cal.com
  const syncCalComBookings = async () => {
    if (!currentUser || !currentUserProfile?.uid) {
      setSyncError('You must be logged in to sync bookings');
      return;
    }

    setIsSyncing(true);
    setSyncError(null);
    setSyncMessage(null);

    try {
      const mentorId = String(currentUserProfile.uid || currentUserProfile.id || '');
      
      // Check if mentor has Cal.com API key
      const hasApiKey = await CalComTokenManager.hasApiKey(mentorId);
      if (!hasApiKey) {
        setSyncError('Cal.com API key not configured. Please set up your Cal.com integration first.');
        setIsSyncing(false);
        return;
      }

      loggers.booking.log('🔄 Starting Cal.com bookings sync...', { mentorId });

      // Fetch bookings from Cal.com (last 90 days to next 90 days)
      const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      const endDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
      
      const calComBookings = await CalComService.getBookings(
        mentorId,
        startDate.toISOString(),
        endDate.toISOString()
      );

      loggers.booking.log(`📋 Found ${calComBookings.length} bookings from Cal.com`);

      // Create a set of Cal.com booking IDs from the API response
      const calComBookingIds = new Set<string>();
      calComBookings.forEach(calBooking => {
        const bookingId = calBooking.id?.toString() || calBooking.uid;
        if (bookingId) {
          calComBookingIds.add(bookingId);
        }
      });

      // Get all existing Firebase bookings for this mentor that are Cal.com bookings
      const existingFirebaseBookingsQuery = query(
        collection(firestore, 'bookings'),
        where('mentorId', '==', mentorId),
        where('isCalComBooking', '==', true)
      );
      const existingFirebaseBookings = await getDocs(existingFirebaseBookingsQuery);

      // Check for bookings that exist in Firebase but not in Cal.com (deleted bookings)
      let deletedBookingsCount = 0;
      for (const firebaseBookingDoc of existingFirebaseBookings.docs) {
        const firebaseBookingData = firebaseBookingDoc.data();
        const calComBookingId = firebaseBookingData.calComBookingId;
        
        if (calComBookingId && !calComBookingIds.has(calComBookingId)) {
          // This booking was deleted from Cal.com, remove it from Firebase
          try {
            await deleteDoc(firebaseBookingDoc.ref);
            deletedBookingsCount++;
            loggers.booking.log(`🗑️ Deleted booking ${calComBookingId} - no longer exists in Cal.com`);
          } catch (error) {
            loggers.booking.error(`Error deleting booking ${calComBookingId}:`, error);
          }
        }
      }

      if (calComBookings.length === 0 && deletedBookingsCount === 0) {
        setSyncMessage('No bookings found in Cal.com. All bookings are up to date.');
        setIsSyncing(false);
        return;
      }

      let newBookingsCount = 0;
      let existingBookingsCount = 0;
      let errorCount = 0;

      // Process each booking from Cal.com
      for (const calBooking of calComBookings) {
        const bookingId = calBooking.id?.toString() || calBooking.uid;
        if (!bookingId) {
          loggers.booking.warn('⚠️ Booking missing ID, skipping:', calBooking);
          continue;
        }

        try {
          // Check if booking already exists in Firestore
          const existingQuery = query(
            collection(firestore, 'bookings'),
            where('calComBookingId', '==', bookingId)
          );
          const existingSnapshot = await getDocs(existingQuery);

          if (!existingSnapshot.empty) {
            existingBookingsCount++;
            continue;
          }

          // Save new booking to Firebase
          await saveBookingToFirebase(calBooking, currentUserProfile);
          newBookingsCount++;
          loggers.booking.log(`✅ Saved new booking: ${bookingId}`);
        } catch (error) {
          errorCount++;
          loggers.booking.error(`❌ Error saving booking ${bookingId}:`, error);
        }
      }

      // Check for completed bookings after sync
      await BookingCompletionService.checkAndMarkCompletedBookings();
      
      // Show success message
      const messages: string[] = [];
      if (newBookingsCount > 0) {
        messages.push(`Synced ${newBookingsCount} new booking${newBookingsCount > 1 ? 's' : ''}`);
      }
      if (deletedBookingsCount > 0) {
        messages.push(`Removed ${deletedBookingsCount} deleted booking${deletedBookingsCount > 1 ? 's' : ''}`);
      }
      if (messages.length > 0) {
        setSyncMessage(`Successfully ${messages.join(', ')} from Cal.com!`);
        // Refresh the page after a short delay to show updated bookings
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else if (existingBookingsCount > 0) {
        setSyncMessage(`All ${existingBookingsCount} booking${existingBookingsCount > 1 ? 's' : ''} are already synced.`);
      } else {
        setSyncMessage('No new bookings to sync.');
      }

      if (errorCount > 0) {
        setSyncError(`${errorCount} booking${errorCount > 1 ? 's' : ''} failed to sync. Please try again.`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      loggers.booking.error('Error syncing Cal.com bookings:', error);
      setSyncError(`Failed to sync bookings: ${errorMessage}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // Save a Cal.com booking to Firebase (similar to CalComModal)
  const saveBookingToFirebase = async (calBooking: CalComBookingResponse, mentor: MentorMenteeProfile) => {
    if (!currentUser || !mentor) return;

    try {
      const startDate = new Date(calBooking.startTime);
      const endDate = new Date(calBooking.endTime);
      
      // Find mentee from attendees (the one who isn't the mentor)
      const mentee = calBooking.attendees?.find(att => 
        att.email?.toLowerCase() !== mentor.email?.toLowerCase()
      ) || calBooking.attendees?.[0];

      // Try to find mentee ID by email
      let menteeId = currentUser.uid; // Default to current user
      if (mentee?.email) {
        try {
          const usersSnapshot = await getDocs(collection(firestore, 'users'));
          for (const userDoc of usersSnapshot.docs) {
            const userData = userDoc.data();
            if (userData.email?.toLowerCase() === mentee.email.toLowerCase()) {
              menteeId = userDoc.id;
              break;
            }
          }
        } catch (error) {
          loggers.booking.error('Error finding mentee by email:', error);
        }
      }

      const mentorId = String(mentor.uid || mentor.id || '');
      
      // Extract meeting URL from references
      let meetingUrl = '';
      if (calBooking.references && Array.isArray(calBooking.references)) {
        const videoRef = calBooking.references.find(ref => 
          ref.type === 'daily_video' && ref.meetingUrl
        ) || calBooking.references.find(ref => 
          ref.type === 'zoom_video' && ref.meetingUrl
        ) || calBooking.references.find(ref => 
          ref.type === 'google_meet' && ref.meetingUrl
        ) || calBooking.references.find(ref => 
          ref.meetingUrl && ref.meetingUrl.trim() !== ''
        );
        if (videoRef?.meetingUrl) {
          meetingUrl = videoRef.meetingUrl;
        }
      }
      if (!meetingUrl && calBooking.metadata?.videoCallUrl) {
        const metaUrl = calBooking.metadata.videoCallUrl;
        if (!metaUrl.includes('app.cal.com/video')) {
          meetingUrl = metaUrl;
        }
      }
      
      // Create booking data
      const bookingData = {
        mentorId: mentorId,
        menteeId: menteeId,
        mentorName: getName(mentor),
        menteeName: mentee?.name || currentUser.displayName || 'Unknown',
        mentorEmail: String(mentor.email || ''),
        menteeEmail: mentee?.email || currentUser.email || '',
        day: startDate.toISOString().split('T')[0],
        startTime: startDate.toTimeString().split(' ')[0].substring(0, 5),
        endTime: endDate.toTimeString().split(' ')[0].substring(0, 5),
        status: calBooking.status === 'ACCEPTED' ? 'confirmed' as const : 
                calBooking.status === 'PENDING' ? 'pending' as const : 'cancelled' as const,
        createdAt: Timestamp.now(),
        sessionDate: Timestamp.fromDate(startDate),
        sessionStartTime: Timestamp.fromDate(startDate),
        sessionEndTime: Timestamp.fromDate(endDate),
        calComBookingId: calBooking.id?.toString() || calBooking.uid,
        calComBookingUid: calBooking.uid || calBooking.id?.toString(),
        eventTypeId: calBooking.eventType?.id,
        eventTypeTitle: calBooking.eventType?.title || '',
        bookingMethod: 'calcom',
        isCalComBooking: true,
        sessionLink: meetingUrl,
        sessionLocation: calBooking.location || 'Virtual',
        calComAttendees: calBooking.attendees || []
      };

      // Save booking to Firestore
      await addDoc(collection(firestore, 'bookings'), bookingData);

      // Create session
      try {
        const sessionData = {
          bookingId: calBooking.id?.toString() || calBooking.uid,
          mentorId: mentorId,
          menteeId: menteeId,
          sessionDate: Timestamp.fromDate(startDate),
          startTime: Timestamp.fromDate(startDate),
          endTime: Timestamp.fromDate(endDate),
          sessionLink: meetingUrl,
          sessionLocation: calBooking.location || 'Virtual',
          status: 'scheduled' as const,
          feedbackSubmitted_mentor: false,
          feedbackSubmitted_mentee: false
        };
        await SessionsService.createSession(sessionData);
      } catch (sessionError) {
        loggers.booking.error('Failed to create session:', sessionError);
        // Don't throw - booking is already saved
      }
    } catch (error) {
      loggers.booking.error('Error saving booking to Firebase:', error);
      throw error;
    }
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
                            loggers.info.log('View profile:', match.matchedUserId);
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
            <div className="bookings-widget-actions">
              <button 
                className="sync-calcom-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  syncCalComBookings();
                }}
                disabled={isSyncing}
                title="Sync bookings from Cal.com"
              >
                <FaSync className={isSyncing ? 'spinning' : ''} />
                {isSyncing ? 'Syncing...' : 'Sync Cal.com'}
              </button>
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
          </div>
          {!isBookingWidgetMinimized && (
            <>
              <p>Manage and view all your scheduled sessions</p>
              {syncMessage && (
                <div className="sync-message success">
                  {syncMessage}
                </div>
              )}
              {syncError && (
                <div className="sync-message error">
                  {syncError}
                </div>
              )}
            </>
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
                  .sort((a: MentorBooking, b: MentorBooking) => {
                    const dateA = parseSessionDate(a.sessionDate);
                    const dateB = parseSessionDate(b.sessionDate);
                    return dateA.getTime() - dateB.getTime();
                  })
                  .slice(0, 5)
                  .map((booking: MentorBooking, index) => {
                    const bookingDate = parseSessionDate(booking.sessionDate);
                    const formattedDate = bookingDate.getTime() !== 0 
                      ? bookingDate.toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })
                      : 'Date TBD';
                    
                    return (
                      <div key={booking.id || index} className="booking-item">
                        <div className="booking-info">
                          <div className="booking-header">
                            <h4>{booking.menteeName || 'Mentee'}</h4>
                            <span className={`booking-status ${(booking.status || 'pending').toLowerCase()}`}>
                              {(booking.status || 'Pending').charAt(0).toUpperCase() + (booking.status || 'Pending').slice(1)}
                            </span>
                          </div>
                          <div className="booking-details">
                            <span className="booking-date">
                              {formattedDate}
                            </span>
                            <span className="booking-time">
                              {booking.startTime || 'Time TBD'}
                            </span>
                          </div>
                        </div>
                        <div className="booking-actions">
                          <button className="booking-action-btn view">View Details</button>
                          {(booking.status || 'pending').toLowerCase() === 'pending' && (
                            <button className="booking-action-btn accept">Accept</button>
                          )}
                        </div>
                      </div>
                    );
                  })
              ) : (
                <div className="no-bookings">
                  <p>No bookings yet. Your scheduled sessions will appear here.</p>
                  <p style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.5rem' }}>
                    Use the "Sync Cal.com" button above to import bookings from your Cal.com calendar.
                  </p>
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
