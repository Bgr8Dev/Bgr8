import React, { useEffect, useRef, useState, useCallback } from 'react';
import { FaTimes, FaExternalLinkAlt, FaCalendarAlt, FaCheckCircle, FaSpinner } from 'react-icons/fa';
import { getName, MentorMenteeProfile } from '../algorithm/matchUsers';
import { useAuth } from '../../../../hooks/useAuth';
import { collection, query, where, getDocs, Timestamp, addDoc } from 'firebase/firestore';
import { firestore } from '../../../../firebase/firebase';
import { CalComService, CalComBookingResponse, CalComTokenManager } from './calComService';
import { SessionsService } from '../../../../services/sessionsService';
import BannerWrapper from '../../../../components/ui/BannerWrapper';
import Modal from '../../../ui/Modal';
import { loggers } from '../../../../utils/logger';
import './CalComModal.css';

interface CalComModalProps {
  open: boolean;
  onClose: () => void;
  mentor: MentorMenteeProfile | null;
}

const CalComModal: React.FC<CalComModalProps> = ({ open, onClose, mentor }) => {
  const { currentUser } = useAuth();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [bookingStatus, setBookingStatus] = useState<'idle' | 'checking' | 'saved' | 'error'>('idle');
  const [bookingMessage, setBookingMessage] = useState<string>('');
  const [showBookingStatus, setShowBookingStatus] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastCheckedBookingsRef = useRef<Set<string>>(new Set());
  const [isPolling, setIsPolling] = useState(false);
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
  const [pollingError, setPollingError] = useState<string | null>(null);

  // Save a Cal.com booking to Firebase
  const saveBookingToFirebase = useCallback(async (calBooking: CalComBookingResponse, mentor: MentorMenteeProfile) => {
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
      
      // Extract meeting URL from references (daily_video, zoom, etc.) or metadata
      let meetingUrl = '';
      if (calBooking.references && Array.isArray(calBooking.references)) {
        // Prioritize daily_video, then zoom, then google_meet, then any with meetingUrl
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
      // Fallback to metadata videoCallUrl only if it's not Cal.com's own video interface
      // (Cal.com video URLs are like https://app.cal.com/video/...)
      if (!meetingUrl && calBooking.metadata?.videoCallUrl) {
        const metaUrl = calBooking.metadata.videoCallUrl;
        // Only use metadata URL if it's not Cal.com's video interface
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

      // Save booking to Firestore collection: /bookings/{documentId}
      loggers.booking.log('💾 Saving booking to Firebase collection: bookings', {
        calComBookingId: bookingData.calComBookingId,
        mentorId: bookingData.mentorId,
        menteeId: bookingData.menteeId,
        meetingUrl: bookingData.sessionLink
      });
      
      const bookingRef = await addDoc(collection(firestore, 'bookings'), bookingData);
      loggers.booking.log('✅ Booking saved to Firebase:', {
        firestoreDocumentId: bookingRef.id,
        collection: 'bookings',
        path: `bookings/${bookingRef.id}`,
        calComBookingId: bookingData.calComBookingId
      });

      // Create session in Firestore collection: /sessions/{documentId}
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

        loggers.booking.log('💾 Creating session in Firebase collection: sessions', {
          bookingId: sessionData.bookingId,
          mentorId: sessionData.mentorId,
          menteeId: sessionData.menteeId
        });

        const sessionId = await SessionsService.createSession(sessionData);
        loggers.booking.log('✅ Session created in Firebase:', {
          firestoreDocumentId: sessionId,
          collection: 'sessions',
          path: `sessions/${sessionId}`,
          bookingId: sessionData.bookingId
        });
      } catch (sessionError) {
        loggers.booking.error('❌ Failed to create session:', sessionError);
        // Don't throw - booking is already saved
      }
    } catch (error) {
      loggers.booking.error('Error saving booking to Firebase:', error);
      throw error;
    }
  }, [currentUser]);

  // Poll for new bookings when modal is open
  useEffect(() => {
    if (!open || !mentor || !currentUser) return;

    // Check if mentor has Cal.com API key
    const checkApiKey = async () => {
      try {
        const mentorId = String(mentor.uid || mentor.id || '');
        const hasKey = await CalComTokenManager.hasApiKey(mentorId);
        setHasApiKey(hasKey);
        if (!hasKey) {
          setPollingError('Mentor does not have Cal.com API key configured. Automatic booking detection is disabled. Bookings will be saved via webhook instead.');
          loggers.booking.warn('⚠️ Mentor does not have Cal.com API key - polling disabled');
        }
      } catch (error) {
        loggers.booking.error('Error checking for API key:', error);
        setHasApiKey(false);
      }
    };

    checkApiKey();

    // Get existing bookings to track what we've already saved
    const initializeExistingBookings = async () => {
      try {
        const mentorId = String(mentor.uid || mentor.id || '');
        const bookingsQuery = query(
          collection(firestore, 'bookings'),
          where('mentorId', '==', mentorId),
          where('isCalComBooking', '==', true)
        );
        const snapshot = await getDocs(bookingsQuery);
        lastCheckedBookingsRef.current = new Set(
          snapshot.docs.map(doc => doc.data().calComBookingId).filter(Boolean)
        );
        loggers.booking.log(`📚 Initialized with ${lastCheckedBookingsRef.current.size} existing bookings`);
      } catch (error) {
        loggers.booking.error('Error initializing existing bookings:', error);
      }
    };

    initializeExistingBookings();

    // Start polling for new bookings
    const checkForNewBookings = async () => {
      const mentorId = String(mentor.uid || mentor.id || '');
      if (!mentorId) {
        loggers.booking.warn('⚠️ Cannot check bookings: mentorId is missing');
        setPollingError('Mentor ID is missing');
        return;
      }

      // Skip polling if no API key
      if (hasApiKey === false) {
        return;
      }
      
      try {
        setPollingError(null);
        loggers.booking.log('🔍 Polling Cal.com for bookings...', { mentorId });
        
        // Fetch bookings from Cal.com API
        // Expand date range to include more past bookings (last 90 days) and future bookings (next 90 days)
        const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // Last 90 days
        const endDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // Next 90 days
        
        loggers.booking.log('📅 Date range for booking fetch:', {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          startDateLocal: startDate.toLocaleString(),
          endDateLocal: endDate.toLocaleString()
        });
        
        const calComBookings = await CalComService.getBookings(
          mentorId,
          startDate.toISOString(),
          endDate.toISOString()
        );

        loggers.booking.log(`📋 Found ${calComBookings.length} Cal.com bookings to check`);
        
        if (calComBookings.length > 0) {
          loggers.booking.log('📋 Sample booking data:', {
            firstBooking: calComBookings[0],
            bookingIds: calComBookings.map(b => b.id || b.uid).slice(0, 5)
          });
        }

        // Check for new bookings
        for (const calBooking of calComBookings) {
          const bookingId = calBooking.id?.toString() || calBooking.uid;
          
          // Skip if we've already processed this booking
          if (!bookingId || lastCheckedBookingsRef.current.has(bookingId)) {
            continue;
          }

          // Check if booking already exists in Firestore
          const existingQuery = query(
            collection(firestore, 'bookings'),
            where('calComBookingId', '==', bookingId)
          );
          const existingSnapshot = await getDocs(existingQuery);
          
          if (!existingSnapshot.empty) {
            // Already saved, just mark as checked
            lastCheckedBookingsRef.current.add(bookingId);
            continue;
          }

          // This is a new booking - save it
          loggers.booking.log('🆕 New Cal.com booking detected, saving to Firebase:', {
            calComBookingId: bookingId,
            startTime: calBooking.startTime,
            status: calBooking.status,
            mentorId: mentor.uid,
            menteeEmail: calBooking.attendees?.[0]?.email
          });
          await saveBookingToFirebase(calBooking, mentor);
          lastCheckedBookingsRef.current.add(bookingId);
          loggers.booking.log('✅ Booking processing complete');
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        loggers.booking.error('Error checking for new bookings:', error);
        
        // Set user-friendly error message
        if (errorMessage.includes('No Cal.com API key')) {
          setPollingError('Mentor does not have Cal.com API key configured. Bookings will be saved via webhook instead.');
          setHasApiKey(false);
        } else if (errorMessage.includes('401') || errorMessage.includes('403')) {
          setPollingError('Cal.com API authentication failed. Please check the API key configuration.');
        } else {
          setPollingError(`Error fetching bookings: ${errorMessage}`);
        }
      }
    };

    // Poll every 10 seconds while modal is open (only if API key exists)
    if (hasApiKey) {
      setIsPolling(true);
      pollingIntervalRef.current = setInterval(checkForNewBookings, 10000);
      
      // Also check immediately
      checkForNewBookings();
    } else {
      setIsPolling(false);
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      setIsPolling(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mentor?.uid, mentor?.id, currentUser?.uid, hasApiKey, saveBookingToFirebase]);

  // Listen for postMessage events from Cal.com iframe
  useEffect(() => {
    if (!open || !mentor) return;

    const handleMessage = (event: MessageEvent) => {
      // Strict origin validation - only accept messages from legitimate Cal.com domains
      // Must be exact match: https://cal.com, https://*.cal.com, https://cal.dev, or https://*.cal.dev
      let isValidOrigin = false;
      try {
        const originUrl = new URL(event.origin);
        const hostname = originUrl.hostname.toLowerCase();
        
        // Validate hostname matches cal.com or cal.dev pattern
        const allowedHostPattern = /^(?:[a-z0-9-]+\.)?(?:cal\.com|cal\.dev)$/;
        if (allowedHostPattern.test(hostname) && (originUrl.protocol === 'https:' || (originUrl.protocol === 'http:' && originUrl.hostname.includes('localhost')))) {
          isValidOrigin = true;
        }
      } catch {
        // Invalid origin format
        isValidOrigin = false;
      }
      
      if (!isValidOrigin) {
        // Sanitize origin before logging to prevent log injection
        const sanitizedOrigin = typeof event.origin === 'string' ? event.origin.substring(0, 100).replace(/[\x00-\x1F\x7F]/g, '') : '[invalid]';
        loggers.booking.warn('⚠️  Rejected message from invalid origin:', sanitizedOrigin);
        return;
      }
      
      // Origin is valid, process the message
      const messageData = event.data;
      const messageType = messageData?.type || messageData?.fullType || '';
      
      loggers.booking.log('📨 Received message from Cal.com iframe:', {
        type: messageType,
        originator: messageData?.originator,
        data: messageData?.data
      });
      
      // Check if it's a booking success event (Cal.com sends bookingSuccessful and bookingSuccessfulV2)
      const isBookingSuccess = 
        messageType === 'bookingSuccessful' ||
        messageType === 'bookingSuccessfulV2' ||
        messageType === 'CAL::bookingSuccessful' ||
        messageType === 'CAL::bookingSuccessfulV2' ||
        messageData?.type === 'bookingConfirmed' ||
        messageData?.event === 'bookingConfirmed' ||
        messageData?.bookingId ||
        (messageData?.data && (messageData.data.bookingId || messageData.data.booking));
      
      if (isBookingSuccess) {
        loggers.booking.log('✅ Booking success event detected from iframe!', {
          messageType,
          hasBookingData: !!(messageData?.data?.booking || messageData?.data?.bookingId),
          bookingId: messageData?.data?.bookingId || messageData?.data?.booking?.id || messageData?.bookingId
        });
        
        // Extract booking ID from the message if available
        const bookingIdFromMessage = 
          messageData?.data?.bookingId || 
          messageData?.data?.booking?.id || 
          messageData?.data?.booking?.uid ||
          messageData?.bookingId;
        
        // Trigger immediate check for new bookings after a short delay
        // This ensures the booking is fully processed by Cal.com's API
        setTimeout(async () => {
          const mentorId = String(mentor.uid || mentor.id || '');
          if (!mentorId || hasApiKey === false) {
            loggers.booking.warn('⚠️ Cannot check bookings: missing mentorId or API key');
            return;
          }
          
          try {
            loggers.booking.log('🔍 Checking for new bookings after success event...');
            
            // Fetch recent bookings (last 5 minutes to catch the new one)
            const calComBookings = await CalComService.getBookings(
              mentorId,
              new Date(Date.now() - 5 * 60 * 1000).toISOString(), // Last 5 minutes
              new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // Next 30 days
            );
            
            loggers.booking.log(`📋 Found ${calComBookings.length} bookings to check after success event`);
            
            let newBookingFound = false;
            
            for (const calBooking of calComBookings) {
              const bookingId = calBooking.id?.toString() || calBooking.uid;
              if (!bookingId) {
                loggers.booking.warn('⚠️ Booking missing ID, skipping:', calBooking);
                continue;
              }
              
              // If we have a booking ID from the message, prioritize checking that one
              if (bookingIdFromMessage && bookingId !== bookingIdFromMessage.toString()) {
                continue; // Skip if we're looking for a specific booking
              }
              
              // Skip if we've already processed this booking
              if (lastCheckedBookingsRef.current.has(bookingId)) {
                loggers.booking.log(`⏭️ Booking ${bookingId} already processed, skipping`);
                continue;
              }
              
              // Check if booking already exists in Firestore
              const existingQuery = query(
                collection(firestore, 'bookings'),
                where('calComBookingId', '==', bookingId)
              );
              const existingSnapshot = await getDocs(existingQuery);
              
              if (existingSnapshot.empty) {
                loggers.booking.log('🆕 New booking detected from iframe event, saving to Firebase...', {
                  bookingId,
                  startTime: calBooking.startTime,
                  status: calBooking.status
                });
                
                try {
                  await saveBookingToFirebase(calBooking, mentor);
                  lastCheckedBookingsRef.current.add(bookingId);
                  newBookingFound = true;
                  loggers.booking.log('✅ Booking saved successfully to Firebase!', { bookingId });
                  
                  // Show success message to user
                  setBookingStatus('saved');
                  setBookingMessage('Your booking has been saved successfully!');
                  setShowBookingStatus(true);
                } catch (saveError) {
                  loggers.booking.error('❌ Error saving booking to Firebase:', saveError);
                }
              } else {
                loggers.booking.log(`✓ Booking ${bookingId} already exists in Firestore`);
                lastCheckedBookingsRef.current.add(bookingId);
              }
            }
            
            if (!newBookingFound && bookingIdFromMessage) {
              loggers.booking.warn('⚠️ Booking success event received but booking not found in API response yet. It may appear in the next poll.');
            }
          } catch (error) {
            loggers.booking.error('Error checking bookings after iframe event:', error);
          }
        }, 3000); // Wait 3 seconds for booking to be processed by Cal.com API
      }
    };
    
    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [open, mentor, hasApiKey, saveBookingToFirebase]);

  // Verify booking was saved to Firestore
  const verifyBookingSaved = async () => {
    if (!currentUser || !mentor) return;

    setBookingStatus('checking');
    setShowBookingStatus(true);

    try {
      const mentorId = String(mentor.uid || mentor.id || '');
      
      // Query without createdAt filter to avoid index requirement
      // We'll filter by date in code instead
      const bookingsQuery = query(
        collection(firestore, 'bookings'),
        where('mentorId', '==', mentorId),
        where('isCalComBooking', '==', true)
      );

      const bookingsSnapshot = await getDocs(bookingsQuery);
      
      // Filter by date in code (last 10 minutes)
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      const recentBookings = bookingsSnapshot.docs.filter(doc => {
        const bookingData = doc.data();
        const createdAt = bookingData.createdAt;
        if (!createdAt) return false;
        
        // Handle both Timestamp and Date objects
        const createdAtDate = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
        return createdAtDate >= tenMinutesAgo;
      });
      
      if (recentBookings.length > 0) {
        setBookingStatus('saved');
        setBookingMessage('Your booking has been saved successfully!');
      } else {
        setBookingStatus('error');
        setBookingMessage('No recent bookings found. If you just completed a booking, it should appear shortly. The system automatically checks for new bookings every 10 seconds.');
      }
    } catch (error) {
      loggers.booking.error('Error verifying booking:', error);
      setBookingStatus('error');
      setBookingMessage('Unable to verify booking status. Please check your bookings page.');
    }
  };


  if (!open || !mentor) return null;

  return (
    <BannerWrapper sectionId="calcom-integration" bannerType="element">
      <div className="calcom-modal-overlay" onClick={onClose}>
        <div className="calcom-modal" onClick={e => e.stopPropagation()}>
        <div className="calcom-modal-header">
          <h3>
            <FaCalendarAlt /> Book with {getName(mentor)}
          </h3>
          <button onClick={onClose} className="calcom-modal-close" title="Close Cal.com modal">
            <FaTimes />
          </button>
        </div>
        <div className="calcom-modal-content">
          {mentor.calCom ? (
            <>
              <div className="calcom-modal-intro">
                <p>
                  Book a session directly with <b>{getName(mentor)}</b> using their Cal.com calendar.
                </p>
                <a
                  href={mentor.calCom}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="calcom-modal-link"
                  title="Open Cal.com booking page"
                >
                  <FaExternalLinkAlt />
                  Open Cal.com Booking
                </a>
              </div>
              <div className="calcom-iframe-container">
                <iframe
                  ref={iframeRef}
                  src={mentor.calCom}
                  title="Cal.com Booking"
                  className="calcom-iframe"
                  allow="camera; microphone; fullscreen;"
                  onLoad={() => {
                    loggers.booking.log('📱 Cal.com iframe loaded');
                  }}
                />
              </div>
              
              {/* Booking Status Check */}
              <div className="calcom-booking-status">
                <p className="calcom-booking-note">
                  {isPolling ? (
                    <>🔄 Automatically checking for new bookings every 10 seconds...</>
                  ) : hasApiKey === false ? (
                    <>📡 Automatic detection disabled. Your booking will be saved via webhook when you complete it in Cal.com.</>
                  ) : (
                    <>After completing your booking, it will be automatically saved to our system.</>
                  )}
                </p>
                {pollingError && (
                  <p className="calcom-booking-error" style={{ color: '#ff6b6b', fontSize: '0.9rem', marginTop: '8px' }}>
                    ⚠️ {pollingError}
                  </p>
                )}
                <button
                  type="button"
                  onClick={verifyBookingSaved}
                  className="calcom-verify-booking-btn"
                  disabled={bookingStatus === 'checking'}
                >
                  {bookingStatus === 'checking' ? (
                    <>
                      <FaSpinner className="spinning" /> Checking...
                    </>
                  ) : (
                    <>
                      <FaCheckCircle /> Check Recent Bookings
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            <div className="calcom-modal-error">
              This mentor does not have a Cal.com booking link set up.
            </div>
          )}
        </div>
        </div>
      </div>
      
      {/* Booking Status Modal */}
      <Modal
        isOpen={showBookingStatus}
        onClose={() => {
          setShowBookingStatus(false);
          setBookingStatus('idle');
          setBookingMessage('');
        }}
        title="Booking Status"
        type={bookingStatus === 'saved' ? 'success' : bookingStatus === 'error' ? 'error' : 'info'}
      >
        <div className="calcom-booking-status-content">
          {bookingStatus === 'checking' && (
            <div className="calcom-status-checking">
              <FaSpinner className="spinning" />
              <p>Checking if your booking was saved...</p>
            </div>
          )}
          {bookingStatus === 'saved' && (
            <div className="calcom-status-success">
              <FaCheckCircle />
              <p>{bookingMessage}</p>
              <p className="calcom-status-note">
                Your booking has been saved to our system and will appear in your bookings page.
              </p>
            </div>
          )}
          {bookingStatus === 'error' && (
            <div className="calcom-status-error">
              <p>{bookingMessage}</p>
              <p className="calcom-status-note">
                The Cal.com webhook should automatically save your booking. If it doesn't appear within a few minutes, please contact support with your booking confirmation email.
              </p>
            </div>
          )}
        </div>
      </Modal>
    </BannerWrapper>
  );
};

export default CalComModal; 