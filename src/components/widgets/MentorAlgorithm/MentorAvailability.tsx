import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../firebase/firebase';
import { FaClock, FaTrash } from 'react-icons/fa';
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

const DAYS_OF_WEEK = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
];

const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30'
];

export default function MentorAvailability() {
  const { currentUser } = useAuth();
  const [availability, setAvailability] = useState<MentorAvailability | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // const [success, setSuccess] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string>('Monday');
  const [selectedStartTime, setSelectedStartTime] = useState<string>('09:00');
  const [selectedEndTime, setSelectedEndTime] = useState<string>('10:00');

  useEffect(() => {
    const fetchAvailability = async () => {
      if (!currentUser) return;
      
      try {
        const availabilityDoc = await getDoc(doc(db, 'mentorAvailability', currentUser.uid));
        if (availabilityDoc.exists()) {
          setAvailability(availabilityDoc.data() as MentorAvailability);
        } else {
          // Initialize with empty availability
          const initialAvailability: MentorAvailability = {
            mentorId: currentUser.uid,
            timeSlots: [],
            lastUpdated: new Date()
          };
          setAvailability(initialAvailability);
        }
      } catch (err) {
        setError('Failed to load availability');
        console.error('Error fetching availability:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAvailability();
  }, [currentUser]);

  const addTimeSlot = () => {
    if (!availability) return;

    const newSlot: TimeSlot = {
      id: `${selectedDay}-${selectedStartTime}-${selectedEndTime}`,
      day: selectedDay,
      startTime: selectedStartTime,
      endTime: selectedEndTime,
      isAvailable: true
    };

    // Check if slot already exists
    const exists = availability.timeSlots.some(slot => 
      slot.day === selectedDay && 
      slot.startTime === selectedStartTime && 
      slot.endTime === selectedEndTime
    );

    if (exists) {
      setError('This time slot already exists');
      return;
    }

    setAvailability(prev => prev ? {
      ...prev,
      timeSlots: [...prev.timeSlots, newSlot]
    } : null);
    setError(null);
  };

  const removeTimeSlot = (slotId: string) => {
    if (!availability) return;

    setAvailability(prev => prev ? {
      ...prev,
      timeSlots: prev.timeSlots.filter(slot => slot.id !== slotId)
    } : null);
  };

  const getTimeSlotsForDay = (day: string) => {
    if (!availability) return [];
    return availability.timeSlots.filter(slot => slot.day === day);
  };

  if (loading) {
    return <div className="mentor-availability-loading">Loading availability...</div>;
  }

  return (
    <div className="mentor-availability">
      <div className="mentor-availability-header">
        <h3>Set Your Availability</h3>
        <p>Configure when you're available for mentoring sessions</p>
      </div>

      {error && <div className="mentor-availability-error">{error}</div>}
      {/* {success && <div className="mentor-availability-success">{success}</div>} */}

      <div className="mentor-availability-content">
        <div className="mentor-availability-add-section">
          <h4>Add Time Slot</h4>
          <div className="mentor-availability-form">
            <div className="mentor-availability-form-row">
              <div className="mentor-availability-form-field">
                <label>Day</label>
                <select 
                  value={selectedDay} 
                  onChange={(e) => setSelectedDay(e.target.value)}
                  style={{ padding: '0.8rem', borderRadius: 8, border: '1.5px solid #3a0a0a', background: '#181818', color: '#fff', fontSize: '1rem' }}
                >
                  {DAYS_OF_WEEK.map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>
              <div className="mentor-availability-form-field">
                <label>Start Time</label>
                <select 
                  value={selectedStartTime} 
                  onChange={(e) => setSelectedStartTime(e.target.value)}
                  style={{ padding: '0.8rem', borderRadius: 8, border: '1.5px solid #3a0a0a', background: '#181818', color: '#fff', fontSize: '1rem' }}
                >
                  {TIME_SLOTS.map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>
              <div className="mentor-availability-form-field">
                <label>End Time</label>
                <select 
                  value={selectedEndTime} 
                  onChange={(e) => setSelectedEndTime(e.target.value)}
                  style={{ padding: '0.8rem', borderRadius: 8, border: '1.5px solid #3a0a0a', background: '#181818', color: '#fff', fontSize: '1rem' }}
                >
                  {TIME_SLOTS.filter(time => time > selectedStartTime).map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>
              <div className="mentor-availability-form-field">
                <label>&nbsp;</label>
                <button 
                  onClick={addTimeSlot}
                  style={{
                    background: 'linear-gradient(135deg, #ff2a2a 0%, #a80000 100%)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '0.8rem 1.5rem',
                    fontSize: '1rem',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  <FaClock style={{ marginRight: 8 }} />
                  Add Slot
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="mentor-availability-slots-section">
          <h4>Your Time Slots</h4>
          {DAYS_OF_WEEK.map(day => (
            <div key={day} className="mentor-availability-day-group">
              <h5>{day}</h5>
              <div className="mentor-availability-slots-list">
                {getTimeSlotsForDay(day).length === 0 ? (
                  <span className="mentor-availability-no-slots">No slots</span>
                ) : (
                  getTimeSlotsForDay(day).map(slot => (
                    <div
                      key={slot.id}
                      className={`mentor-availability-slot${!slot.isAvailable ? ' mentor-availability-slot-booked' : ''}`}
                      style={{
                        background: !slot.isAvailable ? '#3a0a0a' : '#222',
                        color: !slot.isAvailable ? '#ff2a2a' : '#fff',
                        opacity: !slot.isAvailable ? 0.7 : 1,
                        border: '1.5px solid #3a0a0a',
                        borderRadius: 8,
                        padding: '0.6rem 1.2rem',
                        margin: '0.2rem 0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        position: 'relative',
                      }}
                    >
                      <FaClock style={{ marginRight: 8 }} />
                      {slot.startTime} - {slot.endTime}
                      {!slot.isAvailable && (
                        <span style={{
                          marginLeft: 12,
                          color: '#ff2a2a',
                          fontWeight: 700,
                          fontSize: '0.95rem',
                          background: 'rgba(255,42,42,0.13)',
                          borderRadius: 6,
                          padding: '0.1rem 0.6rem',
                        }}>
                          Booked
                        </span>
                      )}
                      <button
                        className="mentor-availability-remove-btn"
                        onClick={() => removeTimeSlot(slot.id)}
                        style={{
                          marginLeft: 'auto',
                          background: 'none',
                          border: 'none',
                          color: '#ff2a2a',
                          fontWeight: 700,
                          fontSize: 18,
                          cursor: 'pointer',
                          borderRadius: 4,
                          padding: '0.2rem 0.5rem',
                        }}
                        title="Remove slot"
                        disabled={!slot.isAvailable}
                      >
                        <FaTrash />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 