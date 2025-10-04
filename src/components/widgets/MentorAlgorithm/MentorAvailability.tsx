import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { firestore } from '../../../firebase/firebase';
import { FaClock, FaTrash, FaFileExport, FaCopy, FaCalendarAlt } from 'react-icons/fa';
import BannerWrapper from '../../../components/ui/BannerWrapper';
import './MentorProgram.css';

interface TimeSlot {
  id: string;
  day?: string; // For recurring
  date?: string; // For specific date (YYYY-MM-DD)
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  type: 'recurring' | 'specific';
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
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'recurring' | 'specific'>('recurring');
  // Recurring slot state
  const [selectedDay, setSelectedDay] = useState<string>('Monday');
  // Specific-date slot state
  const [selectedDate, setSelectedDate] = useState<string>('');
  // Common slot state
  const [selectedStartTime, setSelectedStartTime] = useState<string>('09:00');
  const [selectedEndTime, setSelectedEndTime] = useState<string>('10:00');
  // Add new state for bulk slot creation
  const [bulkStartTime, setBulkStartTime] = useState<string>('09:00');
  const [bulkEndTime, setBulkEndTime] = useState<string>('13:00');
  const [meetingDuration, setMeetingDuration] = useState<string>('30');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);

  // Load availability data
  useEffect(() => {
    const loadAvailability = async () => {
      if (!currentUser) return;
      
      try {
        const availabilityDoc = await getDoc(doc(firestore, 'users', currentUser.uid, 'availabilities', 'default'));
        if (availabilityDoc.exists()) {
          const data = availabilityDoc.data();
          setAvailability({
            mentorId: currentUser.uid,
            timeSlots: data.timeSlots || [],
            lastUpdated: data.lastUpdated?.toDate() || new Date()
          });
        } else {
          // Create default availability
          const defaultAvailability: MentorAvailability = {
            mentorId: currentUser.uid,
            timeSlots: [],
            lastUpdated: new Date()
          };
          await setDoc(doc(firestore, 'users', currentUser.uid, 'availabilities', 'default'), defaultAvailability);
          setAvailability(defaultAvailability);
        }
      } catch (err) {
        console.error('Error loading availability:', err);
        setError('Failed to load availability data');
      }
    };

    loadAvailability();
  }, [currentUser]);

  // Helper functions
  const generateTimeSlots = (startTime: string, endTime: string, duration: number): string[] => {
    const slots: string[] = [];
    const start = new Date(`2000-01-01T${startTime}:00`);
    const end = new Date(`2000-01-01T${endTime}:00`);
    
    while (start < end) {
      slots.push(start.toTimeString().slice(0, 5));
      start.setMinutes(start.getMinutes() + duration);
    }
    
    return slots;
  };

  const addTimeSlot = async (slot: Omit<TimeSlot, 'id'>) => {
    if (!availability || !currentUser) return;
    
    const newSlot: TimeSlot = {
      ...slot,
      id: `${slot.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
    
    const updatedSlots = [...availability.timeSlots, newSlot];
    const updatedAvailability = {
      ...availability,
      timeSlots: updatedSlots,
      lastUpdated: new Date()
    };
    
    try {
      await setDoc(doc(firestore, 'users', currentUser.uid, 'availabilities', 'default'), updatedAvailability);
      setAvailability(updatedAvailability);
      console.log('Time slot added successfully!');
    } catch (err) {
      console.error('Error adding time slot:', err);
    }
  };

  const removeTimeSlot = async (slotId: string) => {
    if (!availability || !currentUser) return;
    
    const updatedSlots = availability.timeSlots.filter(slot => slot.id !== slotId);
    const updatedAvailability = {
      ...availability,
      timeSlots: updatedSlots,
      lastUpdated: new Date()
    };
    
    try {
      await setDoc(doc(firestore, 'users', currentUser.uid, 'availabilities', 'default'), updatedAvailability);
      setAvailability(updatedAvailability);
      console.log('Time slot removed successfully!');
    } catch (err) {
      console.error('Error removing time slot:', err);
    }
  };

  const handleAddRecurringSlot = () => {
    if (!selectedStartTime || !selectedEndTime) return;
    
    addTimeSlot({
      day: selectedDay,
      startTime: selectedStartTime,
      endTime: selectedEndTime,
      isAvailable: true,
      type: 'recurring'
    });
  };

  const handleAddSpecificSlot = () => {
    if (!selectedDate || !selectedStartTime || !selectedEndTime) return;
    
    addTimeSlot({
      date: selectedDate,
      startTime: selectedStartTime,
      endTime: selectedEndTime,
      isAvailable: true,
      type: 'specific'
    });
  };

  const handleBulkAddSlots = () => {
    if (!bulkStartTime || !bulkEndTime || selectedDays.length === 0) return;
    
    const duration = parseInt(meetingDuration);
    const timeSlots = generateTimeSlots(bulkStartTime, bulkEndTime, duration);
    
    selectedDays.forEach(day => {
      timeSlots.forEach((time, index) => {
        if (index < timeSlots.length - 1) {
          addTimeSlot({
            day,
            startTime: time,
            endTime: timeSlots[index + 1],
            isAvailable: true,
            type: 'recurring'
          });
        }
      });
    });
    
    setSelectedDays([]);
  };


  const handleRemoveSlot = (slot: TimeSlot) => {
    if (window.confirm('Are you sure you want to remove this time slot?')) {
      removeTimeSlot(slot.id);
    }
  };

  const exportAvailability = () => {
    if (!availability) return;
    
    const dataStr = JSON.stringify(availability, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mentor-availability-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const copyAvailability = () => {
    if (!availability) return;
    
    const text = availability.timeSlots.map(slot => 
      `${slot.type === 'recurring' ? slot.day : slot.date}: ${slot.startTime} - ${slot.endTime}`
    ).join('\n');
    
    navigator.clipboard.writeText(text).then(() => {
      console.log('Availability copied to clipboard!');
    });
  };

  if (!availability) {
    return <div className="mentor-availability-loading">Loading availability...</div>;
  }

  return (
    <BannerWrapper sectionId="video-calls" bannerType="element">
      <div className="mentor-availability mentor-animate-fadein mentor-animate-slideup">
        <div className="mentor-availability-header">
          <h3>Set Your Internal Availability</h3>
          <p>Configure your internal time slots for mentoring sessions (separate from Cal.com)</p>
          <div style={{ 
            background: 'rgba(255,179,0,0.1)', 
            border: '1px solid #ffb300', 
            borderRadius: 8, 
            padding: '12px 16px', 
            marginTop: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <FaClock style={{ color: '#ffb300', fontSize: 16 }} />
            <span style={{ color: '#ffb300', fontSize: '0.95rem', fontWeight: 600 }}>
              These are internal platform time slots. For Cal.com integration, use the Cal.com tab in your profile.
            </span>
          </div>
        </div>
        {error && <div className="mentor-availability-error">{error}</div>}
        
        {/* Tab Navigation */}
        <div className="mentor-availability-tabs">
          <button 
            className={`tab ${activeTab === 'recurring' ? 'active' : ''}`}
            onClick={() => setActiveTab('recurring')}
          >
            <FaCalendarAlt /> Recurring Slots
          </button>
          <button 
            className={`tab ${activeTab === 'specific' ? 'active' : ''}`}
            onClick={() => setActiveTab('specific')}
          >
            <FaClock /> Specific Dates
          </button>
        </div>

        {/* Recurring Slots Tab */}
        {activeTab === 'recurring' && (
          <div className="mentor-availability-tab-content">
            <div className="mentor-availability-form">
              <h4>Add Recurring Time Slot</h4>
              <div className="form-row">
                <div className="form-group">
                  <label>Day of Week</label>
                  <select 
                    value={selectedDay} 
                    onChange={(e) => setSelectedDay(e.target.value)}
                  >
                    {DAYS_OF_WEEK.map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Start Time</label>
                  <select 
                    value={selectedStartTime} 
                    onChange={(e) => setSelectedStartTime(e.target.value)}
                  >
                    {TIME_SLOTS.map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>End Time</label>
                  <select 
                    value={selectedEndTime} 
                    onChange={(e) => setSelectedEndTime(e.target.value)}
                  >
                    {TIME_SLOTS.map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
                <button 
                  className="add-slot-btn"
                  onClick={handleAddRecurringSlot}
                >
                  Add Slot
                </button>
              </div>
            </div>

            {/* Bulk Add Section */}
            <div className="mentor-availability-bulk">
              <h4>Bulk Add Multiple Days</h4>
              <div className="form-row">
                <div className="form-group">
                  <label>Select Days</label>
                  <div className="day-checkboxes">
                    {DAYS_OF_WEEK.map(day => (
                      <label key={day} className="day-checkbox">
                        <input
                          type="checkbox"
                          checked={selectedDays.includes(day)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedDays([...selectedDays, day]);
                            } else {
                              setSelectedDays(selectedDays.filter(d => d !== day));
                            }
                          }}
                        />
                        {day}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label>Start Time</label>
                  <select 
                    value={bulkStartTime} 
                    onChange={(e) => setBulkStartTime(e.target.value)}
                  >
                    {TIME_SLOTS.map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>End Time</label>
                  <select 
                    value={bulkEndTime} 
                    onChange={(e) => setBulkEndTime(e.target.value)}
                  >
                    {TIME_SLOTS.map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Meeting Duration (min)</label>
                  <select 
                    value={meetingDuration} 
                    onChange={(e) => setMeetingDuration(e.target.value)}
                  >
                    <option value="15">15 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="45">45 minutes</option>
                    <option value="60">60 minutes</option>
                  </select>
                </div>
                <button 
                  className="bulk-add-btn"
                  onClick={handleBulkAddSlots}
                  disabled={selectedDays.length === 0}
                >
                  Bulk Add
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Specific Dates Tab */}
        {activeTab === 'specific' && (
          <div className="mentor-availability-tab-content">
            <div className="mentor-availability-form">
              <h4>Add Specific Date Slot</h4>
              <div className="form-row">
                <div className="form-group">
                  <label>Date</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="form-group">
                  <label>Start Time</label>
                  <select 
                    value={selectedStartTime} 
                    onChange={(e) => setSelectedStartTime(e.target.value)}
                  >
                    {TIME_SLOTS.map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>End Time</label>
                  <select 
                    value={selectedEndTime} 
                    onChange={(e) => setSelectedEndTime(e.target.value)}
                  >
                    {TIME_SLOTS.map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
                <button 
                  className="add-slot-btn"
                  onClick={handleAddSpecificSlot}
                >
                  Add Slot
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Time Slots List */}
        <div className="mentor-availability-list">
          <div className="list-header">
            <h4>Your Time Slots</h4>
            <div className="list-actions">
              <button onClick={exportAvailability} className="action-btn">
                <FaFileExport /> Export
              </button>
              <button onClick={copyAvailability} className="action-btn">
                <FaCopy /> Copy
              </button>
            </div>
          </div>
          
          {availability.timeSlots.length === 0 ? (
            <div className="no-slots">
              <FaClock />
              <p>No time slots added yet. Add some above to get started!</p>
            </div>
          ) : (
            <div className="slots-table">
              <table>
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Day/Date</th>
                    <th>Time</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {availability.timeSlots.map(slot => (
                    <tr key={slot.id}>
                      <td>
                        <span className={`slot-type ${slot.type}`}>
                          {slot.type === 'recurring' ? 'Recurring' : 'Specific'}
                        </span>
                      </td>
                      <td>{slot.day || slot.date}</td>
                      <td>{slot.startTime} - {slot.endTime}</td>
                      <td>
                        <span className={`slot-status ${slot.isAvailable ? 'available' : 'unavailable'}`}>
                          {slot.isAvailable ? 'Available' : 'Unavailable'}
                        </span>
                      </td>
                      <td>
                        <button 
                          className="remove-btn"
                          onClick={() => handleRemoveSlot(slot)}
                          title="Remove time slot"
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </BannerWrapper>
  );
}