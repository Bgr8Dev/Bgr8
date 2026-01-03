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
import { FaComments, FaStar, FaCode, FaSync, FaUserFriends, FaVideo, FaExternalLinkAlt, FaCalendarAlt, FaClock, FaUser } from 'react-icons/fa';
import { collection, query, getDocs } from 'firebase/firestore';
import { firestore } from '../../../firebase/firebase';
import { loggers } from '../../../utils/logger';
import { MatchesService, Match } from '../../../services/matchesService';
import { ProfilePicture } from '../../../components/ui/ProfilePicture';
import { BookingCompletionService } from '../../../services/bookingCompletionService';
import { CalComService, CalComTokenManager, CalComBookingResponse } from '../../../components/widgets/MentorAlgorithm/CalCom/calComService';
import { SessionsService } from '../../../services/sessionsService';
import { addDoc, Timestamp, getDoc, doc, where as whereClause } from 'firebase/firestore';
import { getName } from '../types/mentorTypes';

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
  const [isSyncingCalCom, setIsSyncingCalCom] = useState(false);
  const [syncCalComMessage, setSyncCalComMessage] = useState<string | null>(null);
  const [syncCalComError, setSyncCalComError] = useState<string | null>(null);
  
  // Matched mentors state
  const [matchedMentors, setMatchedMentors] = useState<Match[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [isMatchesCardExpanded, setIsMatchesCardExpanded] = useState(false);
  
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
    fetchMatchedMentors();
    
    // Check for completed bookings when dashboard loads
    BookingCompletionService.checkAndMarkCompletedBookings();
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.uid, currentUserProfile?.uid]);

  // Fetch matched mentors
  const fetchMatchedMentors = async () => {
    if (!currentUser?.uid) return;
    
    try {
      setLoadingMatches(true);
      const matches = await MatchesService.getMatches(currentUser.uid);
      // Filter to only show mentors (since mentees can match with mentors)
      const mentorMatches = matches.filter(match => {
        // If we have the profile, check if they're a mentor
        if (match.matchedUserProfile) {
          return match.matchedUserProfile.isMentor === true;
        }
        // Otherwise, assume they're mentors (since mentees match with mentors)
        return true;
      });
      setMatchedMentors(mentorMatches);
      loggers.info.log(`📋 Loaded ${mentorMatches.length} matched mentors for mentee ${currentUser.uid}`);
    } catch (error) {
      loggers.error.error('Error fetching matched mentors:', error);
    } finally {
      setLoadingMatches(false);
    }
  };

  // Fetch mentee bookings from Firebase
  const fetchMenteeBookings = async () => {
    if (!currentUser?.uid) {
      loggers.booking.warn('No currentUser.uid available for fetching mentee bookings');
      return;
    }
    
    try {
      setLoadingBookings(true);
      const userEmail = currentUser.email || '';
      const userDisplayName = currentUser.displayName || '';
      const userNameParts = userDisplayName.toLowerCase().split(' ').filter(p => p.length > 0);
      
      loggers.booking.log(`🔍 Fetching bookings for mentee: ${currentUser.uid}, email: ${userEmail}, name: ${userDisplayName}`);
      
      // Get all bookings and filter in memory (most reliable method)
      // This handles cases where menteeId/menteeEmail don't match but user is in calComAttendees
      loggers.booking.log(`🔍 Fetching all bookings to check multiple matching criteria...`);
      const allBookingsQuery = query(collection(firestore, 'bookings'));
      const allBookingsSnapshot = await getDocs(allBookingsQuery);
      
      loggers.booking.log(`📊 Total bookings in database: ${allBookingsSnapshot.docs.length}`);
      
      const matchedBookings: typeof allBookingsSnapshot.docs = [];
      const matchReasons: string[] = [];
      
      allBookingsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        let isMatch = false;
        let matchReason = '';
        
        // Check 1: menteeId matches
        if (data.menteeId === currentUser.uid) {
          isMatch = true;
          matchReason = 'menteeId';
        }
        // Check 2: menteeEmail matches
        else if (userEmail && data.menteeEmail === userEmail) {
          isMatch = true;
          matchReason = 'menteeEmail';
        }
        // Check 3: Check calComAttendees array
        else if (Array.isArray(data.calComAttendees) && data.calComAttendees.length > 0) {
          const attendeeMatch = data.calComAttendees.some((attendee: { 
            email?: string; 
            name?: string; 
            id?: number | string;
            user?: { 
              email?: string; 
              name?: string; 
            };
          }) => {
            // Match by email
            if (userEmail && attendee.email && attendee.email.toLowerCase() === userEmail.toLowerCase()) {
              matchReason = 'calComAttendees.email';
              return true;
            }
            // Match by attendee.user.email (nested email)
            if (userEmail && attendee.user?.email && attendee.user.email.toLowerCase() === userEmail.toLowerCase()) {
              matchReason = 'calComAttendees.user.email';
              return true;
            }
            // Match by name (if display name matches)
            if (userDisplayName && attendee.name) {
              const attendeeNameLower = attendee.name.toLowerCase();
              const userDisplayNameLower = userDisplayName.toLowerCase();
              // Exact match
              if (attendeeNameLower === userDisplayNameLower) {
                matchReason = 'calComAttendees.name';
                return true;
              }
              // Partial match (check if all name parts are present)
              if (userNameParts.length > 0) {
                const attendeeNameParts = attendeeNameLower.split(' ').filter((p: string) => p.length > 0);
                const allPartsMatch = userNameParts.every(part => 
                  attendeeNameParts.some((ap: string) => ap.includes(part) || part.includes(ap))
                );
                if (allPartsMatch && attendeeNameParts.length === userNameParts.length) {
                  matchReason = 'calComAttendees.name.partial';
                  return true;
                }
              }
            }
            // Match by attendee.user.name (nested name)
            if (userDisplayName && attendee.user?.name) {
              const attendeeUserNameLower = attendee.user.name.toLowerCase();
              const userDisplayNameLower = userDisplayName.toLowerCase();
              if (attendeeUserNameLower === userDisplayNameLower) {
                matchReason = 'calComAttendees.user.name';
                return true;
              }
            }
            return false;
          });
          
          if (attendeeMatch) {
            isMatch = true;
          }
        }
        
        if (isMatch) {
          matchedBookings.push(doc);
          matchReasons.push(`${doc.id}: ${matchReason}`);
        }
      });
      
      loggers.booking.log(`📊 Found ${matchedBookings.length} matching bookings`);
      if (matchedBookings.length > 0) {
        loggers.booking.debug('Match reasons:', matchReasons.slice(0, 5)); // Log first 5
      }
      
      const bookingsSnapshot = { docs: matchedBookings };
      
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
      loggers.booking.log(`📋 Loaded ${fetchedBookings.length} bookings for mentee ${currentUser.uid} (expected: 16)`);
      
      // Log details if count doesn't match
      if (fetchedBookings.length !== 16) {
        loggers.booking.warn(`⚠️ Expected 16 bookings but found ${fetchedBookings.length}. Checking booking data...`);
        loggers.booking.debug('Sample booking data:', bookingsSnapshot.docs[0]?.data());
      }
      
      // Check for completed bookings after fetching
      BookingCompletionService.checkAndMarkCompletedBookings();
    } catch (error) {
      loggers.booking.error('Error fetching mentee bookings:', error);
      // If query fails due to missing index, try a simpler approach
      if (error instanceof Error && error.message.includes('index')) {
        loggers.booking.warn('⚠️ Firestore index missing, trying alternative query method...');
        try {
          // Fallback: Get all bookings and filter in memory
          const allBookingsQuery = query(collection(firestore, 'bookings'));
          const allBookingsSnapshot = await getDocs(allBookingsQuery);
          
          const filteredBookings = allBookingsSnapshot.docs
            .filter(doc => {
              const data = doc.data();
              return data.menteeId === currentUser.uid || 
                     data.menteeEmail === currentUser.email ||
                     (Array.isArray(data.calComAttendees) && 
                      data.calComAttendees.some((att: { email?: string }) => att.email === currentUser.email));
            })
            .map(doc => {
              const data = doc.data();
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
          
          setBookings(filteredBookings);
          loggers.booking.log(`📋 Loaded ${filteredBookings.length} bookings using fallback method`);
        } catch (fallbackError) {
          loggers.booking.error('Fallback query also failed:', fallbackError);
        }
      }
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

  // Sync bookings from Cal.com for all mentors
  const syncCalComBookingsForMentors = async () => {
    if (!currentUser?.uid) {
      setSyncCalComError('You must be logged in to sync bookings');
      return;
    }

    setIsSyncingCalCom(true);
    setSyncCalComError(null);
    setSyncCalComMessage(null);

    try {
      loggers.booking.log('🔄 Starting Cal.com sync for mentee bookings...');

      // Get all bookings for the mentee to find unique mentors
      const allBookingsQuery = query(collection(firestore, 'bookings'));
      const allBookingsSnapshot = await getDocs(allBookingsQuery);
      
      const userEmail = currentUser.email || '';
      const userDisplayName = currentUser.displayName || '';
      const userNameParts = userDisplayName.toLowerCase().split(' ').filter(p => p.length > 0);

      // Find bookings that match the mentee
      const menteeBookings = allBookingsSnapshot.docs.filter(doc => {
        const data = doc.data();
        let isMatch = false;

        if (data.menteeId === currentUser.uid) {
          isMatch = true;
        } else if (userEmail && data.menteeEmail === userEmail) {
          isMatch = true;
        } else if (Array.isArray(data.calComAttendees)) {
          const attendeeMatch = data.calComAttendees.some((attendee: { 
            email?: string; 
            name?: string; 
            user?: { email?: string; name?: string; }
          }) => 
            attendee.email === userEmail || 
            (attendee.user && attendee.user.email === userEmail) ||
            (userNameParts.length > 0 && attendee.name && 
             userNameParts.every(part => attendee.name?.toLowerCase().includes(part) || false))
          );
          if (attendeeMatch) {
            isMatch = true;
          }
        }
        return isMatch;
      });

      // Extract unique mentor IDs
      const mentorIds = new Set<string>();
      menteeBookings.forEach(doc => {
        const data = doc.data();
        if (data.mentorId) {
          mentorIds.add(data.mentorId);
        }
      });

      loggers.booking.log(`📊 Found ${mentorIds.size} unique mentors to sync from`);

      if (mentorIds.size === 0) {
        setSyncCalComMessage('No bookings found. Nothing to sync.');
        setIsSyncingCalCom(false);
        return;
      }

      let totalNewBookings = 0;
      let totalExistingBookings = 0;
      let totalErrors = 0;
      let mentorsProcessed = 0;

      // Sync bookings for each mentor
      for (const mentorId of Array.from(mentorIds)) {
        try {
          // Check if mentor has Cal.com API key
          const hasApiKey = await CalComTokenManager.hasApiKey(mentorId);
          if (!hasApiKey) {
            loggers.booking.log(`⏭️ Skipping mentor ${mentorId} - no Cal.com API key`);
            continue;
          }

          // Get mentor profile
          let mentorProfile: MentorMenteeProfile | null = null;
          try {
            const mentorDoc = await getDoc(doc(firestore, 'users', mentorId, 'mentorProgram', 'profile'));
            if (mentorDoc.exists()) {
              const profileData = mentorDoc.data();
              mentorProfile = { 
                ...profileData, 
                uid: mentorId, 
                id: mentorId 
              } as unknown as MentorMenteeProfile;
            }
          } catch (error) {
            loggers.booking.warn(`Could not fetch mentor profile for ${mentorId}:`, error);
            continue;
          }

          if (!mentorProfile) {
            loggers.booking.warn(`Mentor profile not found for ${mentorId}`);
            continue;
          }

          loggers.booking.log(`🔄 Syncing bookings from mentor: ${getName(mentorProfile)} (${mentorId})`);

          // Fetch bookings from Cal.com (last 90 days to next 90 days)
          const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
          const endDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

          const calComBookings = await CalComService.getBookings(
            mentorId,
            startDate.toISOString(),
            endDate.toISOString()
          );

          loggers.booking.log(`📋 Found ${calComBookings.length} bookings from Cal.com for mentor ${mentorId}`);

          // Process each booking
          for (const calBooking of calComBookings) {
            const bookingId = calBooking.id?.toString() || calBooking.uid;
            if (!bookingId) {
              continue;
            }

            try {
              // Check if booking already exists
              const existingQuery = query(
                collection(firestore, 'bookings'),
                whereClause('calComBookingId', '==', bookingId)
              );
              const existingSnapshot = await getDocs(existingQuery);

              if (!existingSnapshot.empty) {
                totalExistingBookings++;
                continue;
              }

              // Save new booking to Firebase
              await saveBookingToFirebase(calBooking, mentorProfile, currentUser);
              totalNewBookings++;
              loggers.booking.log(`✅ Saved new booking: ${bookingId}`);
            } catch (error) {
              totalErrors++;
              loggers.booking.error(`❌ Error saving booking ${bookingId}:`, error);
            }
          }

          mentorsProcessed++;
        } catch (error) {
          totalErrors++;
          loggers.booking.error(`Error syncing bookings for mentor ${mentorId}:`, error);
        }
      }

      // Check for completed bookings after sync
      await BookingCompletionService.checkAndMarkCompletedBookings();

      // Show results
      if (totalNewBookings > 0) {
        setSyncCalComMessage(`✅ Synced ${totalNewBookings} new booking${totalNewBookings > 1 ? 's' : ''} from ${mentorsProcessed} mentor${mentorsProcessed > 1 ? 's' : ''}!`);
      } else if (totalExistingBookings > 0) {
        setSyncCalComMessage(`ℹ️ All bookings are already synced from ${mentorsProcessed} mentor${mentorsProcessed > 1 ? 's' : ''}.`);
      } else {
        setSyncCalComMessage('ℹ️ No new bookings found to sync.');
      }

      if (totalErrors > 0) {
        setSyncCalComError(`${totalErrors} error${totalErrors > 1 ? 's' : ''} occurred during sync.`);
      }

      // Refresh bookings display
      await fetchMenteeBookings();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      loggers.booking.error('Error syncing Cal.com bookings:', error);
      setSyncCalComError(`Failed to sync bookings: ${errorMessage}`);
    } finally {
      setIsSyncingCalCom(false);
    }
  };

  // Save a Cal.com booking to Firebase (similar to CalComModal)
  const saveBookingToFirebase = async (
    calBooking: CalComBookingResponse, 
    mentor: MentorMenteeProfile,
    menteeUser: { uid: string; email?: string | null; displayName?: string | null }
  ) => {
    try {
      const startDate = new Date(calBooking.startTime);
      const endDate = new Date(calBooking.endTime);
      
      // Find mentee from attendees (the one who isn't the mentor)
      const mentee = calBooking.attendees?.find(att => 
        att.email?.toLowerCase() !== mentor.email?.toLowerCase()
      ) || calBooking.attendees?.[0];

      // Use current user as mentee
      const menteeId = menteeUser.uid;
      const mentorId = String(mentor.uid || mentor.id || '');
      
      // Extract meeting URL
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
        menteeName: mentee?.name || menteeUser.displayName || 'Unknown',
        mentorEmail: String(mentor.email || ''),
        menteeEmail: mentee?.email || menteeUser.email || '',
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
      }
    } catch (error) {
      loggers.booking.error('Error saving booking to Firebase:', error);
      throw error;
    }
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
                  className="sync-calcom-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    syncCalComBookingsForMentors();
                  }}
                  disabled={isSyncingCalCom}
                  title="Sync bookings from Cal.com for all your mentors"
                  style={{ 
                    background: 'rgba(59, 130, 246, 0.2)', 
                    color: 'var(--white)', 
                    border: '1px solid rgba(59, 130, 246, 0.4)',
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    cursor: isSyncingCalCom ? 'not-allowed' : 'pointer'
                  }}
                >
                  <FaSync className={isSyncingCalCom ? 'spinning' : ''} style={{ animation: isSyncingCalCom ? 'spin 1s linear infinite' : 'none' }} />
                  {isSyncingCalCom ? 'Syncing...' : 'Sync Cal.com'}
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
              {(refreshMessage || syncCalComMessage) && (
                <div className="sync-message success" style={{ marginBottom: '1rem', padding: '0.75rem', borderRadius: '8px', background: 'rgba(76, 175, 80, 0.2)', color: '#4caf50', border: '1px solid rgba(76, 175, 80, 0.3)' }}>
                  {syncCalComMessage || refreshMessage}
                </div>
              )}
              {syncCalComError && (
                <div className="sync-message error" style={{ marginBottom: '1rem', padding: '0.75rem', borderRadius: '8px', background: 'rgba(244, 67, 54, 0.2)', color: '#f44336', border: '1px solid rgba(244, 67, 54, 0.3)' }}>
                  {syncCalComError}
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
                      <span className="stat-number" style={{ color: '#333' }}>
                        {getAllBookings().length}
                      </span>
                      <span className="stat-label" style={{ color: '#333' }}>Total Bookings</span>
                    </div>
                    <div className="booking-stat">
                      <span className="stat-number" style={{ color: '#333' }}>
                        {getConfirmedBookings().length}
                      </span>
                      <span className="stat-label" style={{ color: '#333' }}>Confirmed</span>
                    </div>
                    <div className="booking-stat">
                      <span className="stat-number" style={{ color: '#333' }}>
                        {getPendingBookings().length}
                      </span>
                      <span className="stat-label" style={{ color: '#333' }}>Pending</span>
                    </div>
                    <div className="booking-stat">
                      <span className="stat-number" style={{ color: '#333' }}>
                        {getUpcomingBookings().length}
                      </span>
                      <span className="stat-label" style={{ color: '#333' }}>Upcoming</span>
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
                              padding: '0.875rem 1rem', 
                              marginBottom: '0.75rem', 
                              background: 'var(--white)', 
                              borderRadius: '8px',
                              border: '1px solid #e0e0e0',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '0.75rem'
                            }}>
                              {/* Header with mentor name and status */}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
                                  <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, var(--coral-primary) 0%, var(--coral-accent) 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    fontWeight: '600',
                                    fontSize: '0.875rem',
                                    flexShrink: 0
                                  }}>
                                    <FaUser />
                                  </div>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <h4 style={{ 
                                      margin: 0, 
                                      fontSize: '0.95rem', 
                                      fontWeight: '600', 
                                      color: '#333',
                                      whiteSpace: 'nowrap',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis'
                                    }}>
                                      {booking.mentorName}
                                    </h4>
                                  </div>
                                </div>
                                <span className={`booking-status ${(booking.status || 'pending').toLowerCase()}`} style={{
                                  padding: '0.35rem 0.75rem',
                                  borderRadius: '12px',
                                  fontSize: '0.7rem',
                                  fontWeight: '600',
                                  background: booking.status === 'confirmed' ? '#4caf50' : booking.status === 'pending' ? '#ff9800' : '#f44336',
                                  color: 'white',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.5px',
                                  flexShrink: 0,
                                  whiteSpace: 'nowrap'
                                }}>
                                  {(booking.status || 'Pending').charAt(0).toUpperCase() + (booking.status || 'Pending').slice(1)}
                                </span>
                              </div>

                              {/* Date and Time in a compact row */}
                              <div style={{ 
                                display: 'flex', 
                                gap: '1rem', 
                                alignItems: 'center',
                                flexWrap: 'wrap'
                              }}>
                                <div style={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  gap: '0.5rem',
                                  fontSize: '0.8rem',
                                  color: '#666'
                                }}>
                                  <FaCalendarAlt style={{ fontSize: '0.75rem', color: '#888' }} />
                                  <span style={{ color: '#333', fontWeight: '500' }}>{formattedDate}</span>
                                </div>
                                <div style={{ 
                                  display: 'inline-flex',
                                  alignItems: 'center', 
                                  gap: '0.5rem',
                                  fontSize: '0.8rem',
                                  padding: '0.35rem 0.65rem',
                                  background: 'rgba(59, 130, 246, 0.1)',
                                  borderRadius: '6px',
                                  border: '1px solid rgba(59, 130, 246, 0.2)'
                                }}>
                                  <FaClock style={{ fontSize: '0.7rem', color: '#3b82f6' }} />
                                  <span style={{ color: '#1e40af', fontWeight: '600' }}>{booking.startTime || 'Time TBD'}</span>
                                </div>
                              </div>

                              {/* Meeting Link */}
                              {booking.sessionLink && (
                                <a 
                                  href={booking.sessionLink} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem',
                                    color: '#3b82f6',
                                    textDecoration: 'none',
                                    fontSize: '0.85rem',
                                    fontWeight: '600',
                                    padding: '0.6rem 1rem',
                                    background: 'rgba(59, 130, 246, 0.1)',
                                    borderRadius: '6px',
                                    border: '1px solid rgba(59, 130, 246, 0.3)',
                                    transition: 'all 0.2s ease',
                                    width: '100%'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)';
                                    e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.5)';
                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
                                    e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                  }}
                                >
                                  <FaVideo style={{ fontSize: '0.875rem' }} />
                                  <span>Join Meeting</span>
                                  <FaExternalLinkAlt style={{ fontSize: '0.7rem', opacity: 0.7 }} />
                                </a>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  ) : (
                    <div className="no-bookings" style={{ textAlign: 'center', padding: '2rem', color: '#333' }}>
                      <p style={{ color: '#333' }}>No bookings yet. Your scheduled sessions will appear here.</p>
                      <p style={{ fontSize: '0.875rem', marginTop: '0.5rem', color: '#666' }}>
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

        {/* Matched Mentors Card */}
        <div className="profile-card">
          <div className="profile-card-header">
            <div className="profile-info">
              <div className="profile-role mentee">Mentee</div>
              <div className="profile-name">Matched Mentors</div>
            </div>
            <div className="profile-card-actions">
              <button 
                className="expand-toggle-btn"
                onClick={() => setIsMatchesCardExpanded(!isMatchesCardExpanded)}
                title={isMatchesCardExpanded ? "Collapse matched mentors" : "Expand matched mentors"}
              >
                {isMatchesCardExpanded ? '▼' : '▶'}
              </button>
            </div>
          </div>
          
          {/* Expandable Matched Mentors Content */}
          {isMatchesCardExpanded && (
            <div className="profile-card-content">
              {loadingMatches ? (
                <div className="loading-state">
                  <div className="loading-spinner"></div>
                  <p style={{ color: '#333' }}>Loading matched mentors...</p>
                </div>
              ) : matchedMentors.length > 0 ? (
                <>
                  <div style={{ marginBottom: '1rem', color: '#333' }}>
                    <p style={{ fontSize: '0.9rem', margin: 0, color: '#666' }}>
                      You have matched with {matchedMentors.length} mentor{matchedMentors.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  
                  <div className="bookings-list" style={{ marginTop: '1rem' }}>
                    {matchedMentors.slice(0, 6).map((match) => {
                      const mentor = match.matchedUserProfile;
                      const mentorName = mentor 
                        ? `${mentor.firstName || ''} ${mentor.lastName || ''}`.trim() || 'Unknown Mentor'
                        : match.matchedUserName || 'Unknown Mentor';
                      const mentorIndustry = (mentor && mentor.industry && typeof mentor.industry === 'string') 
                        ? mentor.industry 
                        : 'Not specified';
                      const mentorSkills = (mentor && Array.isArray(mentor.skills)) 
                        ? mentor.skills.filter((s): s is string => typeof s === 'string')
                        : [];
                      const mentorPhotoURL = (mentor && mentor.photoURL && typeof mentor.photoURL === 'string')
                        ? mentor.photoURL
                        : undefined;
                      
                      return (
                        <div key={match.id} className="booking-item" style={{ 
                          padding: '1rem', 
                          marginBottom: '0.75rem', 
                          background: 'var(--white)', 
                          borderRadius: '8px',
                          border: '1px solid #e0e0e0'
                        }}>
                          <div className="booking-info" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <div style={{ flexShrink: 0 }}>
                              <ProfilePicture
                                src={mentorPhotoURL}
                                alt={mentorName}
                                size={50}
                              />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div className="booking-header" style={{ marginBottom: '0.5rem' }}>
                                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '600', color: '#333' }}>
                                  {mentorName}
                                </h4>
                              </div>
                              <div className="booking-details" style={{ fontSize: '0.875rem', color: '#666' }}>
                                <div style={{ marginBottom: '0.25rem' }}>
                                  <strong style={{ color: '#333' }}>Industry:</strong> {mentorIndustry}
                                </div>
                                {mentorSkills.length > 0 && (
                                  <div>
                                    <strong style={{ color: '#333' }}>Skills:</strong> {mentorSkills.slice(0, 3).join(', ')}
                                    {mentorSkills.length > 3 && ` +${mentorSkills.length - 3} more`}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                              <button 
                                className="booking-action-btn view"
                                style={{
                                  padding: '0.5rem 1rem',
                                  background: 'var(--coral-primary)',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontSize: '0.875rem',
                                  fontWeight: '500'
                                }}
                                onClick={() => {
                                  // Navigate to mentor profile or open messaging
                                  loggers.info.log('View mentor profile:', match.matchedUserId);
                                }}
                              >
                                View Profile
                              </button>
                              <button 
                                className="booking-action-btn view"
                                style={{
                                  padding: '0.5rem 1rem',
                                  background: 'transparent',
                                  color: 'var(--coral-primary)',
                                  border: '1px solid var(--coral-primary)',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontSize: '0.875rem',
                                  fontWeight: '500'
                                }}
                                onClick={() => {
                                  // Open messaging with this mentor
                                  loggers.info.log('Message mentor:', match.matchedUserId);
                                }}
                              >
                                <FaComments style={{ marginRight: '0.25rem' }} />
                                Message
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {matchedMentors.length > 6 && (
                    <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                      <p style={{ color: '#666', fontSize: '0.875rem' }}>
                        Showing 6 of {matchedMentors.length} matched mentors
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="no-bookings" style={{ textAlign: 'center', padding: '2rem', color: '#333' }}>
                  <FaUserFriends style={{ fontSize: '3rem', color: '#ccc', marginBottom: '1rem' }} />
                  <p style={{ color: '#333', marginBottom: '0.5rem' }}>No matched mentors yet</p>
                  <p style={{ fontSize: '0.875rem', color: '#666' }}>
                    Browse mentors and create matches to see them here!
                  </p>
                </div>
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
