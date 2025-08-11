import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../hooks/useAuth';
import { useIsMobile } from '../../../../hooks/useIsMobile';
import { doc, getDoc, collection, addDoc, setDoc } from 'firebase/firestore';
import { firestore } from '../../../../firebase/firebase';
import { FaClock, FaTimes, FaCalendarAlt, FaExternalLinkAlt, FaListUl, FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import { MentorMenteeProfile } from '../algorithm/matchUsers';
import { CalComService, CalComEventType, CalComTokenManager } from '../CalCom/calComService';
import '../MentorProgram.css';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './BookingModalCalendar.css';

interface TimeSlot {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

interface MentorAvailability {
  mentorId: string;
  timeSlots: TimeSlot[];
  lastUpdated: Date;
}

interface Booking {
  id: string;
  mentorId: string;
  menteeId: string;
  mentorName: string;
  menteeName: string;
  mentorEmail: string;
  menteeEmail: string;
  day: string;
  startTime: string;
  endTime: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: Date;
  sessionDate?: Date;
}

interface BookingModalProps {
  open: boolean;
  onClose: () => void;
  mentor: MentorMenteeProfile;
}



export default function BookingModal({ open, onClose, mentor }: BookingModalProps) {
  const { currentUser } = useAuth();
  const { isMobile } = useIsMobile();
  const [availability, setAvailability] = useState<MentorAvailability | null>(null);
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [sessionDate, setSessionDate] = useState<string>('');
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | null>(null);
  const [bookingMethod, setBookingMethod] = useState<'internal' | 'calcom'>('internal');
  
  // Mobile-specific state
  const [currentStep, setCurrentStep] = useState<'event-types' | 'calendar' | 'summary'>('event-types');
  
  // Cal.com event types state
  const [calComEventTypes, setCalComEventTypes] = useState<CalComEventType[]>([]);
  const [selectedEventType, setSelectedEventType] = useState<CalComEventType | null>(null);
  const [hasCalComApiKey, setHasCalComApiKey] = useState(false);
  const [loadingEventTypes, setLoadingEventTypes] = useState(false);

  // Reset step when modal opens/closes
  useEffect(() => {
    if (open) {
      setCurrentStep('event-types');
    }
  }, [open]);

  useEffect(() => {
    if (open && mentor) {
      const fetchMentorData = async () => {
        setLoading(true);
        setError(null);
        
        try {
          // Fetch mentor availability
          const availabilityDoc = await getDoc(doc(firestore, 'mentorAvailability', mentor.uid));
          if (availabilityDoc.exists()) {
            setAvailability(availabilityDoc.data() as MentorAvailability);
          } else {
            setError('This mentor has not set their availability yet.');
          }
          
          // Check if mentor has Cal.com API key and fetch event types
          const hasApiKey = await CalComTokenManager.hasApiKey(mentor.uid);
          setHasCalComApiKey(hasApiKey);
          
          if (hasApiKey) {
            setLoadingEventTypes(true);
            try {
              const eventTypes = await CalComService.getEventTypes(mentor.uid);
              setCalComEventTypes(eventTypes);
            } catch (eventTypesError) {
              console.error('Error fetching Cal.com event types:', eventTypesError);
              // Don't show error to user, just disable Cal.com option
            } finally {
              setLoadingEventTypes(false);
            }
          }
        } catch (err) {
          setError('Failed to load mentor data');
          console.error('Error fetching mentor data:', err);
        } finally {
          setLoading(false);
        }
      };
      fetchMentorData();
    }
  }, [open, mentor]);

  const getAvailableSlotsForDate = (date: Date) => {
    if (!availability) return [];
    const dayName = getDayName(date);
    return availability.timeSlots.filter(slot => slot.day === dayName && slot.isAvailable);
  };

  const getDayName = (date: Date) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
  };

  // Mobile navigation functions
  const goToNextStep = () => {
    if (currentStep === 'event-types') {
      if (hasCalComApiKey && calComEventTypes.length > 0) {
        setCurrentStep('calendar');
      } else {
        setCurrentStep('calendar');
      }
    } else if (currentStep === 'calendar' && selectedSlot) {
      setCurrentStep('summary');
    }
  };

  const goToPreviousStep = () => {
    if (currentStep === 'summary') {
      setCurrentStep('calendar');
    } else if (currentStep === 'calendar') {
      setCurrentStep('event-types');
    }
  };

  const canProceedToNext = () => {
    if (currentStep === 'event-types') {
      return !hasCalComApiKey || calComEventTypes.length === 0 || selectedEventType;
    } else if (currentStep === 'calendar') {
      return selectedSlot !== null;
    }
    return true;
  };

  const handleBooking = async () => {
    if (!currentUser || !selectedSlot || !sessionDate) return;
    
    // Validate Cal.com booking requirements
    if (bookingMethod === 'calcom' && !selectedEventType) {
      setError('Please select a session type for Cal.com booking.');
      return;
    }

    // Debug log
    console.log('mentor.email:', mentor.email, 'currentUser.email:', currentUser.email);

    let mentorEmail = mentor.email;
    let menteeEmail = currentUser.email;

    // Fallback: fetch mentor email from Firestore if missing
    if (!mentorEmail && mentor.uid) {
      try {
        const mentorDoc = await getDoc(doc(firestore, 'mentorProgram', mentor.uid));
        if (mentorDoc.exists()) {
          const mentorData = mentorDoc.data();
          mentorEmail = mentorData.email || '';
        }
      } catch (err) {
        console.error('Error fetching mentor profile for email fallback:', err);
      }
    }

    // Fallback: fetch mentee email from Firestore if missing
    if (!menteeEmail && currentUser.uid) {
      try {
        const menteeDoc = await getDoc(doc(firestore, 'mentorProgram', currentUser.uid));
        if (menteeDoc.exists()) {
          const menteeData = menteeDoc.data();
          menteeEmail = menteeData.email || '';
        }
      } catch (err) {
        console.error('Error fetching mentee profile for email fallback:', err);
      }
    }

    // Final debug log
    console.log('Final mentorEmail:', mentorEmail, 'Final menteeEmail:', menteeEmail);

    if (!mentorEmail || !menteeEmail) {
      setError('Mentor or mentee email is missing. Cannot create booking.');
      setBooking(false);
      return;
    }

    setBooking(true);
    setError(null);
    setSuccess(null);

    try {
      if (bookingMethod === 'calcom' && mentor.calCom && hasCalComApiKey && selectedEventType) {
        // Use Cal.com booking
        try {
          await createCalComBooking();
        } catch (calComError) {
          console.error('Cal.com booking failed, falling back to internal booking:', calComError);
          // Fallback to internal booking if Cal.com fails
          await createInternalBooking();
        }
      } else {
        // Use internal booking system
        await createInternalBooking();
      }
      
      // Close modal after a short delay
      setTimeout(() => {
        onClose();
        setSuccess(null);
      }, 2000);
    } catch (err) {
      setError('Failed to create booking. Please try again.');
      console.error('Error creating booking:', err);
    } finally {
      setBooking(false);
    }
  };

  const createCalComBooking = async () => {
    if (!currentUser || !selectedSlot || !selectedEventType || !sessionDate) return;

    let mentorEmail = mentor.email;
    let menteeEmail = currentUser.email;

    // Fetch emails if missing
    if (!mentorEmail && mentor.uid) {
      const mentorDoc = await getDoc(doc(firestore, 'mentorProgram', mentor.uid));
      if (mentorDoc.exists()) {
        const mentorData = mentorDoc.data();
        mentorEmail = mentorData.email || '';
      }
    }

    if (!menteeEmail && currentUser.uid) {
      const menteeDoc = await getDoc(doc(firestore, 'mentorProgram', currentUser.uid));
      if (menteeDoc.exists()) {
        const menteeData = menteeDoc.data();
        menteeEmail = menteeData.email || '';
      }
    }

    if (!mentorEmail || !menteeEmail) {
      throw new Error('Mentor or mentee email is missing. Cannot create Cal.com booking.');
    }

    // Calculate start and end times based on selected slot and event type
    const [startHour, startMinute] = selectedSlot.startTime.split(':').map(Number);
    const sessionDateObj = new Date(sessionDate);
    sessionDateObj.setHours(startHour, startMinute, 0, 0);
    
    const endTime = new Date(sessionDateObj);
    endTime.setMinutes(endTime.getMinutes() + selectedEventType.length);

    // Create Cal.com booking request
    const bookingRequest = {
      eventTypeId: selectedEventType.id,
      startTime: sessionDateObj.toISOString(),
      endTime: endTime.toISOString(),
      attendeeName: currentUser.displayName || menteeEmail || 'Unknown',
      attendeeEmail: menteeEmail,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: 'en',
      metadata: {
        source: 'B8 Mentor Platform',
        mentorName: mentor.name,
        menteeName: currentUser.displayName || menteeEmail || 'Unknown'
      }
    };

    // Create the booking via Cal.com API
    const calComBooking = await CalComService.createBooking(mentor.uid, bookingRequest);
    
    // Store booking reference in our database
    const bookingData = {
      mentorId: mentor.uid,
      menteeId: currentUser.uid,
      mentorName: mentor.name,
      menteeName: currentUser.displayName || (menteeEmail || 'Unknown'),
      mentorEmail: mentorEmail || '',
      menteeEmail: menteeEmail || '',
      day: selectedSlot.day,
      startTime: selectedSlot.startTime,
      endTime: selectedSlot.endTime,
      status: 'confirmed', // Cal.com bookings are confirmed immediately
      createdAt: new Date(),
      sessionDate: sessionDate ? new Date(sessionDate) : new Date(),
      calComBookingId: calComBooking.id,
      calComBookingUid: calComBooking.uid,
      eventTypeId: selectedEventType.id,
      eventTypeTitle: selectedEventType.title,
      bookingMethod: 'calcom'
    };

    await addDoc(collection(firestore, 'bookings'), bookingData);
    setSuccess(`Booking created successfully! Check your email for confirmation. Booking ID: ${calComBooking.id}`);
  };

  const createInternalBooking = async () => {
    if (!currentUser || !selectedSlot) return;

    let mentorEmail = mentor.email;
    let menteeEmail = currentUser.email;

    // Fetch emails if missing
    if (!mentorEmail && mentor.uid) {
      const mentorDoc = await getDoc(doc(firestore, 'mentorProgram', mentor.uid));
      if (mentorDoc.exists()) {
        const mentorData = mentorDoc.data();
        mentorEmail = mentorData.email || '';
      }
    }

    if (!menteeEmail && currentUser.uid) {
      const menteeDoc = await getDoc(doc(firestore, 'mentorProgram', currentUser.uid));
      if (menteeDoc.exists()) {
        const menteeData = menteeDoc.data();
        menteeEmail = menteeData.email || '';
      }
    }



    const bookingData: Omit<Booking, 'id'> = {
      mentorId: mentor.uid,
      menteeId: currentUser.uid,
      mentorName: mentor.name,
      menteeName: currentUser.displayName || (menteeEmail || 'Unknown'),
      mentorEmail: mentorEmail || '',
      menteeEmail: menteeEmail || '',
      day: selectedSlot!.day,
      startTime: selectedSlot!.startTime,
      endTime: selectedSlot!.endTime,
      status: 'pending',
      createdAt: new Date(),
      sessionDate: sessionDate ? new Date(sessionDate) : new Date()
    };

    await addDoc(collection(firestore, 'bookings'), bookingData);

    // Update mentor's availability
    const availabilityRef = doc(firestore, 'mentorAvailability', mentor.uid);
    const availabilitySnap = await getDoc(availabilityRef);
    if (availabilitySnap.exists()) {
      const availabilityData = availabilitySnap.data();
      if (availabilityData && Array.isArray(availabilityData.timeSlots)) {
        const updatedSlots = availabilityData.timeSlots.map((slot: TimeSlot) => {
          if (
            slot.id === selectedSlot!.id &&
            slot.day === selectedSlot!.day &&
            slot.startTime === selectedSlot!.startTime &&
            slot.endTime === selectedSlot!.endTime
          ) {
            return { ...slot, isAvailable: false };
          }
          return slot;
        });
        await setDoc(availabilityRef, {
          ...availabilityData,
          timeSlots: updatedSlots,
          lastUpdated: new Date()
        });
      }
    }
    setSuccess('Booking request sent successfully! The mentor will confirm your session.');
  };

  if (!open) return null;

  return (
    <div className="booking-modal-overlay" onClick={onClose}>
      <div className={`booking-modal ${isMobile ? 'booking-modal-mobile' : ''}`} onClick={(e) => e.stopPropagation()}>
        {/* Mobile Header with Step Indicator */}
        <div className="booking-modal-header">
          {isMobile && (
            <div className="booking-modal-mobile-progress">
              <div className={`booking-modal-step ${currentStep === 'event-types' ? 'active' : ''}`}>
                <span className="booking-modal-step-number">1</span>
                <span className="booking-modal-step-label">Session Type</span>
              </div>
              <div className={`booking-modal-step ${currentStep === 'calendar' ? 'active' : ''}`}>
                <span className="booking-modal-step-number">2</span>
                <span className="booking-modal-step-label">Date & Time</span>
              </div>
              <div className={`booking-modal-step ${currentStep === 'summary' ? 'active' : ''}`}>
                <span className="booking-modal-step-number">3</span>
                <span className="booking-modal-step-label">Confirm</span>
              </div>
            </div>
          )}
          <div className="booking-modal-header-content">
            <h3>Book Session with {mentor.name}</h3>
            <button onClick={onClose} className="booking-modal-close" title="Close booking modal">
              <FaTimes />
            </button>
          </div>
        </div>

        {error && <div className="booking-modal-error">{error}</div>}
        {success && <div className="booking-modal-success">{success}</div>}

        <div className="booking-modal-content">
          {loading ? (
            <div className="booking-modal-loading">Loading availability...</div>
          ) : availability ? (
            <>
              {/* Step 1: Event Types Selection */}
              {(!isMobile || currentStep === 'event-types') && hasCalComApiKey && calComEventTypes.length > 0 && (
                <div className="booking-modal-event-types">
                  <h4 className="booking-modal-event-types h4">
                    <FaListUl className="booking-modal-event-types-icon" />
                    Select Session Type
                    {bookingMethod === 'calcom' && (
                      <span className="booking-modal-event-types-required"> *Required</span>
                    )}
                  </h4>
                  {loadingEventTypes ? (
                    <div className="booking-modal-event-types-loading">
                      Loading session types...
                    </div>
                  ) : (
                    <div className={`booking-modal-event-types-grid ${isMobile ? 'booking-modal-event-types-mobile' : ''}`}>
                      {calComEventTypes.map((eventType) => (
                        <button
                          key={eventType.id}
                          onClick={() => setSelectedEventType(eventType)}
                          className={`booking-modal-event-type ${selectedEventType?.id === eventType.id ? 'selected' : ''}`}
                        >
                          <div className="booking-modal-event-type-title">{eventType.title}</div>
                          <div className="booking-modal-event-type-details">
                            {eventType.length} minutes
                            {eventType.price > 0 && ` • £${eventType.price}`}
                          </div>
                          {eventType.description && (
                            <div className="booking-modal-event-type-description">
                              {eventType.description}
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Calendar Selection */}
              {(!isMobile || currentStep === 'calendar') && (
                <div className="booking-modal-calendar">
                  <h4>Select a Date and Time</h4>
                  <div className={`booking-modal-calendar-container ${isMobile ? 'booking-modal-calendar-mobile' : ''}`}>
                    <Calendar
                      value={selectedCalendarDate}
                      onChange={date => {
                        setSelectedCalendarDate(date as Date);
                        setSessionDate(String(date ? (date as Date).toISOString().split('T')[0] : ''));
                      }}
                      minDate={new Date()}
                      maxDate={(() => { const d = new Date(); d.setDate(d.getDate() + 30); return d; })()}
                      tileDisabled={({ date }) => getAvailableSlotsForDate(date).length === 0}
                      tileClassName={({ date, view }) => {
                        if (view === 'month' && getAvailableSlotsForDate(date).length > 0) {
                          return 'has-slots';
                        }
                        return null;
                      }}
                    />
                  </div>
                  {selectedCalendarDate && getAvailableSlotsForDate(selectedCalendarDate).length > 0 && (
                    <div className="booking-modal-slots-container">
                      <h5>Available Slots for {selectedCalendarDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</h5>
                      <div className={`booking-modal-slots ${isMobile ? 'booking-modal-slots-mobile' : ''}`}>
                        {getAvailableSlotsForDate(selectedCalendarDate).map(slot => (
                          <button
                            key={slot.id}
                            className={`booking-modal-slot ${selectedSlot?.id === slot.id ? 'selected' : ''}`}
                            onClick={() => {
                              setSelectedSlot(slot);
                              setSessionDate(String(selectedCalendarDate ? selectedCalendarDate.toISOString().split('T')[0] : ''));
                            }}
                          >
                            <FaClock className="booking-modal-slot-icon" />
                            {slot.startTime} - {slot.endTime}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Booking Summary */}
              {(!isMobile || currentStep === 'summary') && selectedSlot && (
                <div className="booking-modal-summary">
                  <h4>Booking Summary</h4>
                  <div className="booking-modal-summary-details">
                    <div className="booking-modal-summary-row">
                      <span>Mentor:</span>
                      <span>{mentor.name}</span>
                    </div>
                    <div className="booking-modal-summary-row">
                      <span>Date:</span>
                      <span>{sessionDate && new Date(sessionDate).toLocaleDateString('en-GB', { 
                        weekday: 'long', 
                        day: 'numeric', 
                        month: 'long',
                        year: 'numeric'
                      })}</span>
                    </div>
                    <div className="booking-modal-summary-row">
                      <span>Time:</span>
                      <span>{selectedSlot.startTime} - {selectedSlot.endTime}</span>
                    </div>
                    <div className="booking-modal-summary-row">
                      <span>Duration:</span>
                      <span>{selectedEventType ? `${selectedEventType.length} minutes` : '1 hour'}</span>
                    </div>
                    {selectedEventType && (
                      <div className="booking-modal-summary-row">
                        <span>Session Type:</span>
                        <span>{selectedEventType.title}</span>
                      </div>
                    )}
                    {selectedEventType && selectedEventType.price > 0 && (
                      <div className="booking-modal-summary-row">
                        <span>Price:</span>
                        <span>£{selectedEventType.price}</span>
                      </div>
                    )}
                  </div>

                  {/* Booking Method Selection */}
                  {mentor.calCom && hasCalComApiKey && (
                    <div className="booking-modal-method-selection">
                      <h5>Booking Method</h5>
                      <div className="booking-modal-method-options">
                        <label className="booking-modal-method-option">
                          <input
                            type="radio"
                            name="bookingMethod"
                            value="internal"
                            checked={bookingMethod === 'internal'}
                            onChange={(e) => setBookingMethod(e.target.value as 'internal' | 'calcom')}
                          />
                          <span className="booking-modal-method-label">
                            <FaClock className="booking-modal-slot-icon" />
                            Internal Booking
                          </span>
                        </label>
                        <label className="booking-modal-method-option">
                          <input
                            type="radio"
                            name="bookingMethod"
                            value="calcom"
                            checked={bookingMethod === 'calcom'}
                            onChange={(e) => setBookingMethod(e.target.value as 'internal' | 'calcom')}
                          />
                          <span className="booking-modal-method-label">
                            <FaCalendarAlt className="booking-modal-slot-icon" />
                            Cal.com Booking
                            {mentor.calCom && (
                              <a
                                href={mentor.calCom}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="booking-modal-calcom-link"
                                title="View Cal.com profile"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <FaExternalLinkAlt size={12} />
                              </a>
                            )}
                          </span>
                        </label>
                      </div>
                    </div>
                  )}
                  
                  <button
                    onClick={handleBooking}
                    disabled={booking}
                    className="booking-modal-confirm-btn"
                  >
                    {booking ? 'Creating Booking...' : 'Confirm Booking'}
                  </button>
                </div>
              )}

              {/* Mobile Navigation */}
              {isMobile && (
                <div className="booking-modal-mobile-nav">
                  {currentStep !== 'event-types' && (
                    <button
                      onClick={goToPreviousStep}
                      className="booking-modal-nav-btn booking-modal-nav-prev"
                    >
                      <FaArrowLeft className="booking-modal-nav-prev-icon" />
                      Back
                    </button>
                  )}
                  {currentStep !== 'summary' && canProceedToNext() && (
                    <button
                      onClick={goToNextStep}
                      className="booking-modal-nav-btn booking-modal-nav-next"
                    >
                      Next
                      <FaArrowRight className="booking-modal-nav-next-icon" />
                    </button>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="booking-modal-no-availability">
              <p>This mentor has not set their availability yet. Please check back later or contact them directly.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
 