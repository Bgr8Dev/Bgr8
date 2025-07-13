import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { doc, getDoc, collection, addDoc, setDoc } from 'firebase/firestore';
import { db } from '../../../firebase/firebase';
import { FaClock, FaTimes, FaCheck } from 'react-icons/fa';
import { MentorMenteeProfile } from './matchUsers';
import './MentorProgram.css';

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
  const [availability, setAvailability] = useState<MentorAvailability | null>(null);
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [sessionDate, setSessionDate] = useState<string>('');

  useEffect(() => {
    if (open && mentor) {
      const fetchMentorAvailability = async () => {
        setLoading(true);
        setError(null);
        try {
          const availabilityDoc = await getDoc(doc(db, 'mentorAvailability', mentor.uid));
          if (availabilityDoc.exists()) {
            setAvailability(availabilityDoc.data() as MentorAvailability);
          } else {
            setError('This mentor has not set their availability yet.');
          }
        } catch (err) {
          setError('Failed to load mentor availability');
          console.error('Error fetching availability:', err);
        } finally {
          setLoading(false);
        }
      };
      fetchMentorAvailability();
    }
  }, [open, mentor]);

  const getAvailableSlotsForDay = (day: string) => {
    if (!availability) return [];
    return availability.timeSlots.filter(slot => 
      slot.day === day && slot.isAvailable
    );
  };

  const getNextWeekDates = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    
    return dates;
  };

  const getDayName = (date: Date) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-GB', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    });
  };

  const handleSlotSelect = (slot: TimeSlot, date: Date) => {
    setSelectedSlot(slot);
    setSelectedDay(slot.day);
    setSessionDate(date.toISOString().split('T')[0]);
  };

  const handleBooking = async () => {
    if (!currentUser || !selectedSlot || !sessionDate) return;

    if (!mentor.email || !currentUser.email) {
      setError('Mentor or mentee email is missing. Cannot create booking.');
      setBooking(false);
      return;
    }

    setBooking(true);
    setError(null);
    setSuccess(null);

    try {
      const bookingData: Omit<Booking, 'id'> = {
        mentorId: mentor.uid,
        menteeId: currentUser.uid,
        mentorName: mentor.name,
        menteeName: currentUser.displayName || currentUser.email || 'Unknown',
        mentorEmail: mentor.email,
        menteeEmail: currentUser.email || '',
        day: selectedSlot.day,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        status: 'pending',
        createdAt: new Date(),
        sessionDate: new Date(sessionDate)
      };

      await addDoc(collection(db, 'bookings'), bookingData);

      // Update mentor's availability: set isAvailable: false for the booked slot
      const availabilityRef = doc(db, 'mentorAvailability', mentor.uid);
      const availabilitySnap = await getDoc(availabilityRef);
      if (availabilitySnap.exists()) {
        const availabilityData = availabilitySnap.data();
        if (availabilityData && Array.isArray(availabilityData.timeSlots)) {
          const updatedSlots = availabilityData.timeSlots.map((slot: TimeSlot) => {
            if (
              slot.id === selectedSlot.id &&
              slot.day === selectedSlot.day &&
              slot.startTime === selectedSlot.startTime &&
              slot.endTime === selectedSlot.endTime
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

  if (!open) return null;

  return (
    <div className="booking-modal-overlay" onClick={onClose}>
      <div className="booking-modal" onClick={(e) => e.stopPropagation()}>
        <div className="booking-modal-header">
          <h3>Book Session with {mentor.name}</h3>
          <button onClick={onClose} className="booking-modal-close" title="Close booking modal">
            <FaTimes />
          </button>
        </div>

        {error && <div className="booking-modal-error">{error}</div>}
        {success && <div className="booking-modal-success">{success}</div>}

        <div className="booking-modal-content">
          {loading ? (
            <div className="booking-modal-loading">Loading availability...</div>
          ) : availability ? (
            <>
              <div className="booking-modal-calendar">
                <h4>Select a Date and Time</h4>
                <div className="booking-modal-dates">
                  {getNextWeekDates().map((date, index) => {
                    const dayName = getDayName(date);
                    const availableSlots = getAvailableSlotsForDay(dayName);
                    
                    return (
                      <div key={index} className="booking-modal-date">
                        <div className="booking-modal-date-header">
                          <h5>{formatDate(date)}</h5>
                          <span className="booking-modal-slots-count">
                            {availableSlots.length} slot{availableSlots.length !== 1 ? 's' : ''} available
                          </span>
                        </div>
                        
                        {availableSlots.length > 0 ? (
                          <div className="booking-modal-slots">
                            {availableSlots.map(slot => (
                              <button
                                key={slot.id}
                                className={`booking-modal-slot ${
                                  selectedSlot?.id === slot.id && selectedDay === dayName ? 'selected' : ''
                                }`}
                                onClick={() => handleSlotSelect(slot, date)}
                              >
                                <FaClock style={{ marginRight: 8 }} />
                                {slot.startTime} - {slot.endTime}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <p className="booking-modal-no-slots">No available slots</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {selectedSlot && (
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
                      <span>1 hour</span>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleBooking}
                    disabled={booking}
                    className="booking-modal-confirm-btn"
                  >
                    <FaCheck style={{ marginRight: 8 }} />
                    {booking ? 'Booking...' : 'Confirm Booking'}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="booking-modal-no-availability">
              <p>This mentor has not set their availability yet.</p>
              <p>Please check back later or contact them directly.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 