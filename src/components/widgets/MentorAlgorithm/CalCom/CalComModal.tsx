import React, { useEffect, useRef, useState } from 'react';
import { FaTimes, FaExternalLinkAlt, FaCalendarAlt, FaCheckCircle, FaSpinner } from 'react-icons/fa';
import { getName, MentorMenteeProfile } from '../algorithm/matchUsers';
import { useAuth } from '../../../../hooks/useAuth';
import { collection, query, where, getDocs, Timestamp, addDoc } from 'firebase/firestore';
import { firestore } from '../../../../firebase/firebase';
import { CalComService, CalComBookingResponse } from './calComService';
import { SessionsService } from '../../../../services/sessionsService';
import BannerWrapper from '../../../../components/ui/BannerWrapper';
import Modal from '../../../ui/Modal';
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

  // Poll for new bookings when modal is open
  useEffect(() => {
    if (!open || !mentor || !currentUser) return;

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
      } catch (error) {
        console.error('Error initializing existing bookings:', error);
      }
    };

    initializeExistingBookings();

    // Start polling for new bookings
    const checkForNewBookings = async () => {
      const mentorId = String(mentor.uid || mentor.id || '');
      if (!mentorId) return;
      
      try {
        // Fetch bookings from Cal.com API
        const calComBookings = await CalComService.getBookings(
          mentorId,
          new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Last 24 hours
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // Next 30 days
        );

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
          await saveBookingToFirebase(calBooking, mentor);
          lastCheckedBookingsRef.current.add(bookingId);
        }
      } catch (error) {
        console.error('Error checking for new bookings:', error);
        // Don't show error to user - just log it
      }
    };

    // Poll every 10 seconds while modal is open
    setIsPolling(true);
    pollingIntervalRef.current = setInterval(checkForNewBookings, 10000);
    
    // Also check immediately
    checkForNewBookings();

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      setIsPolling(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mentor?.uid, mentor?.id, currentUser?.uid]);

  // Save a Cal.com booking to Firebase
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
          console.error('Error finding mentee by email:', error);
        }
      }

      const mentorId = String(mentor.uid || mentor.id || '');
      
      // Extract meeting URL from references (daily_video, zoom, etc.) or metadata
      let meetingUrl = '';
      if (calBooking.references && Array.isArray(calBooking.references)) {
        // Find daily_video or other video meeting reference
        const videoRef = calBooking.references.find(ref => 
          ref.type === 'daily_video' || 
          ref.type === 'zoom_video' || 
          ref.type === 'google_meet' ||
          ref.meetingUrl
        );
        if (videoRef?.meetingUrl) {
          meetingUrl = videoRef.meetingUrl;
        }
      }
      // Fallback to metadata videoCallUrl
      if (!meetingUrl && calBooking.metadata?.videoCallUrl) {
        meetingUrl = calBooking.metadata.videoCallUrl;
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

      // Save booking
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
        console.error('Failed to create session:', sessionError);
      }

      console.log('✅ Booking saved to Firebase:', calBooking.id);
    } catch (error) {
      console.error('Error saving booking to Firebase:', error);
      throw error;
    }
  };

  // Verify booking was saved to Firestore
  const verifyBookingSaved = async () => {
    if (!currentUser || !mentor) return;

    setBookingStatus('checking');
    setShowBookingStatus(true);

    try {
      // Check for recent bookings in the last 10 minutes
      const tenMinutesAgo = Timestamp.fromDate(new Date(Date.now() - 10 * 60 * 1000));
      
      const mentorId = String(mentor.uid || mentor.id || '');
      const bookingsQuery = query(
        collection(firestore, 'bookings'),
        where('mentorId', '==', mentorId),
        where('isCalComBooking', '==', true),
        where('createdAt', '>=', tenMinutesAgo)
      );

      const bookingsSnapshot = await getDocs(bookingsQuery);
      
      if (!bookingsSnapshot.empty) {
        setBookingStatus('saved');
        setBookingMessage('Your booking has been saved successfully!');
      } else {
        setBookingStatus('error');
        setBookingMessage('No recent bookings found. If you just completed a booking, it should appear shortly. The system automatically checks for new bookings every 10 seconds.');
      }
    } catch (error) {
      console.error('Error verifying booking:', error);
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
                />
              </div>
              
              {/* Booking Status Check */}
              <div className="calcom-booking-status">
                <p className="calcom-booking-note">
                  {isPolling ? (
                    <>🔄 Automatically checking for new bookings every 10 seconds...</>
                  ) : (
                    <>After completing your booking, it will be automatically saved to our system.</>
                  )}
                </p>
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