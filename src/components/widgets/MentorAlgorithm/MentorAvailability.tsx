import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../../firebase/firebase';
import { FaClock, FaTrash, FaSearch, FaFileExport, FaCopy, FaCalendarAlt, FaSyncAlt } from 'react-icons/fa';
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
  const [loading, setLoading] = useState(true);
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
  const [bulkMode, setBulkMode] = useState<boolean>(false);
  // UI/UX enhancements
  const [sortField, setSortField] = useState<'day' | 'date' | 'time' | 'status' | 'type'>('day');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [filterType, setFilterType] = useState<'all' | 'recurring' | 'specific'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'available' | 'booked'>('all');
  const [search, setSearch] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [slotToRemove, setSlotToRemove] = useState<TimeSlot | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState<'success' | 'error' | 'info' | 'warning'>('info');

  useEffect(() => {
    const fetchAvailability = async () => {
      if (!currentUser) return;
      try {
        const availabilityDoc = await getDoc(doc(db, 'mentorAvailability', currentUser.uid));
        if (availabilityDoc.exists()) {
          setAvailability(availabilityDoc.data() as MentorAvailability);
        } else {
          setAvailability({ mentorId: currentUser.uid, timeSlots: [], lastUpdated: new Date() });
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

  // Add slot (recurring or specific)
  const addTimeSlot = async () => {
    if (!availability || !currentUser) return;
    
    if (bulkMode) {
      await addBulkTimeSlots();
      return;
    }
    
    let newSlot: TimeSlot;
    if (activeTab === 'recurring') {
      newSlot = {
        id: `recurring-${selectedDay}-${selectedStartTime}-${selectedEndTime}`,
        day: selectedDay,
        startTime: selectedStartTime,
        endTime: selectedEndTime,
        isAvailable: true,
        type: 'recurring',
      };
    } else {
      if (!selectedDate) {
        setError('Please select a date');
        return;
      }
      newSlot = {
        id: `specific-${selectedDate}-${selectedStartTime}-${selectedEndTime}`,
        date: selectedDate,
        startTime: selectedStartTime,
        endTime: selectedEndTime,
        isAvailable: true,
        type: 'specific',
      };
    }
    // Check for duplicates
    const exists = availability.timeSlots.some(slot => 
      slot.type === newSlot.type &&
      (slot.type === 'recurring'
        ? slot.day === newSlot.day && slot.startTime === newSlot.startTime && slot.endTime === newSlot.endTime
        : slot.date === newSlot.date && slot.startTime === newSlot.startTime && slot.endTime === newSlot.endTime)
    );
    if (exists) {
      setError('This time slot already exists');
      return;
    }

    try {
      const updatedAvailability = { 
        ...availability, 
        timeSlots: [...availability.timeSlots, newSlot],
        lastUpdated: new Date()
      };
      
      // Save to Firebase
      await setDoc(doc(db, 'mentorAvailability', currentUser.uid), updatedAvailability);
      
      // Update local state
      setAvailability(updatedAvailability);
      setError(null);
      setModalMessage('Time slot added successfully!');
      setModalType('success');
      setModalOpen(true);
    } catch (err) {
      console.error('Error saving time slot:', err);
      setError('Failed to save time slot. Please try again.');
    }
  };

  // Add bulk time slots
  const addBulkTimeSlots = async () => {
    if (!availability || !currentUser) return;
    
    const duration = parseInt(meetingDuration);
    const startTime = new Date(`2000-01-01T${bulkStartTime}:00`);
    const endTime = new Date(`2000-01-01T${bulkEndTime}:00`);
    
    if (startTime >= endTime) {
      setError('Start time must be before end time');
      return;
    }
    
    const newSlots: TimeSlot[] = [];
    let currentTime = new Date(startTime);
    
    while (currentTime < endTime) {
      const slotStart = currentTime.toTimeString().slice(0, 5);
      const slotEndTime = new Date(currentTime.getTime() + duration * 60000);
      const slotEnd = slotEndTime.toTimeString().slice(0, 5);
      
      if (slotEndTime > endTime) break;
      
      let newSlot: TimeSlot;
      if (activeTab === 'recurring') {
        newSlot = {
          id: `recurring-${selectedDay}-${slotStart}-${slotEnd}`,
          day: selectedDay,
          startTime: slotStart,
          endTime: slotEnd,
          isAvailable: true,
          type: 'recurring',
        };
      } else {
        if (!selectedDate) {
          setError('Please select a date');
          return;
        }
        newSlot = {
          id: `specific-${selectedDate}-${slotStart}-${slotEnd}`,
          date: selectedDate,
          startTime: slotStart,
          endTime: slotEnd,
          isAvailable: true,
          type: 'specific',
        };
      }
      
      // Check for duplicates
      const exists = availability.timeSlots.some(slot => 
        slot.type === newSlot.type &&
        (slot.type === 'recurring'
          ? slot.day === newSlot.day && slot.startTime === newSlot.startTime && slot.endTime === newSlot.endTime
          : slot.date === newSlot.date && slot.startTime === newSlot.startTime && slot.endTime === newSlot.endTime)
      );
      
      if (!exists) {
        newSlots.push(newSlot);
      }
      
      // Move to next time slot
      currentTime = new Date(currentTime.getTime() + duration * 60000);
    }
    
    if (newSlots.length === 0) {
      setError('No new time slots could be created (all may already exist)');
      return;
    }

    try {
      const updatedAvailability = { 
        ...availability, 
        timeSlots: [...availability.timeSlots, ...newSlots],
        lastUpdated: new Date()
      };
      
      // Save to Firebase
      await setDoc(doc(db, 'mentorAvailability', currentUser.uid), updatedAvailability);
      
      // Update local state
      setAvailability(updatedAvailability);
      setError(null);
      setModalMessage(`Successfully created ${newSlots.length} time slots!`);
      setModalType('success');
      setModalOpen(true);
    } catch (err) {
      console.error('Error saving bulk time slots:', err);
      setError('Failed to save time slots. Please try again.');
    }
  };

  // Remove slot with confirmation
  const handleRemoveSlot = (slot: TimeSlot) => {
    setSlotToRemove(slot);
    setConfirmOpen(true);
  };
  
  const confirmRemoveSlot = async () => {
    if (!availability || !slotToRemove || !currentUser) return;
    
    try {
      const updatedAvailability = { 
        ...availability, 
        timeSlots: availability.timeSlots.filter(s => s.id !== slotToRemove.id),
        lastUpdated: new Date()
      };
      
      // Save to Firebase
      await setDoc(doc(db, 'mentorAvailability', currentUser.uid), updatedAvailability);
      
      // Update local state
      setAvailability(updatedAvailability);
      setSlotToRemove(null);
      setConfirmOpen(false);
      setModalMessage('Time slot removed successfully!');
      setModalType('success');
      setModalOpen(true);
    } catch (err) {
      console.error('Error removing time slot:', err);
      setError('Failed to remove time slot. Please try again.');
    }
  };

  // Filtering, sorting, search
  const filtered = (availability?.timeSlots || []).filter(slot => {
    if (filterType !== 'all' && slot.type !== filterType) return false;
    if (filterStatus !== 'all') {
      if (filterStatus === 'available' && !slot.isAvailable) return false;
      if (filterStatus === 'booked' && slot.isAvailable) return false;
    }
    if (search) {
      const s = search.toLowerCase();
      if (!(slot.day?.toLowerCase().includes(s) || slot.date?.includes(s) || slot.startTime.includes(s) || slot.endTime.includes(s))) return false;
    }
    return true;
  });
  filtered.sort((a, b) => {
    let vA: unknown, vB: unknown;
    if (sortField === 'day') {
      vA = a.day || '';
      vB = b.day || '';
    } else if (sortField === 'date') {
      vA = a.date || '';
      vB = b.date || '';
    } else if (sortField === 'time') {
      vA = a.startTime;
      vB = b.startTime;
    } else if (sortField === 'status') {
      vA = a.isAvailable ? 'available' : 'booked';
      vB = b.isAvailable ? 'available' : 'booked';
    } else if (sortField === 'type') {
      vA = a.type;
      vB = b.type;
    }
    if (typeof vA === 'string' && typeof vB === 'string') {
      return sortDir === 'asc' ? vA.localeCompare(vB) : vB.localeCompare(vA);
    }
    return 0;
  });

  // Badge helpers
  const statusBadge = (slot: TimeSlot) => {
    return <span className="status-badge mentor-animate-fadein">{slot.isAvailable ? 'Available' : 'Booked'}</span>;
  };
  const typeBadge = (slot: TimeSlot) => {
    return <span className="type-badge mentor-animate-fadein">{slot.type === 'recurring' ? 'Recurring' : 'One-off'}</span>;
  };

  // Copy to clipboard
  const copySlot = (slot: TimeSlot) => {
    const text = slot.type === 'recurring'
      ? `${slot.day} ${slot.startTime}-${slot.endTime} (Recurring)`
      : `${slot.date} ${slot.startTime}-${slot.endTime} (One-off)`;
    navigator.clipboard.writeText(text);
    setModalMessage('Slot details copied!');
    setModalType('success');
    setModalOpen(true);
  };

  if (loading) {
    return <div className="mentor-availability-loading">Loading availability...</div>;
  }

  return (
    <div className="mentor-availability mentor-animate-fadein mentor-animate-slideup">
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} message={modalMessage} type={modalType} />
      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} message="Are you sure you want to remove this internal time slot?" type="warning" actions={
        <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
          <button onClick={confirmRemoveSlot} style={{ background: 'linear-gradient(135deg, #ff4444 0%, #cc0000 100%)', color: '#fff', border: 'none', borderRadius: 8, padding: '0.8rem 1.8rem', fontWeight: 700, fontSize: 16, cursor: 'pointer', boxShadow: '0 4px 12px rgba(255,68,68,0.3)', transition: 'all 0.2s' }}>Yes, Remove</button>
          <button onClick={() => setConfirmOpen(false)} style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 8, padding: '0.8rem 1.8rem', fontWeight: 700, fontSize: 16, cursor: 'pointer', transition: 'all 0.2s' }}>Cancel</button>
        </div>
      } />
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
      <div className="mentor-availability-content">
        {/* Tabs for recurring/specific */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 18 }}>
          <button onClick={() => setActiveTab('recurring')} style={{ fontWeight: 700, fontSize: '1.08rem', padding: '0.7rem 1.5rem', borderRadius: 8, border: 'none', cursor: 'pointer', background: activeTab === 'recurring' ? '#ff2a2a' : '#181818', color: activeTab === 'recurring' ? '#fff' : '#ff2a2a', transition: 'all 0.18s' }}><FaSyncAlt style={{ marginRight: 8 }} />Recurring</button>
          <button onClick={() => setActiveTab('specific')} style={{ fontWeight: 700, fontSize: '1.08rem', padding: '0.7rem 1.5rem', borderRadius: 8, border: 'none', cursor: 'pointer', background: activeTab === 'specific' ? '#ff2a2a' : '#181818', color: activeTab === 'specific' ? '#fff' : '#ff2a2a', transition: 'all 0.18s' }}><FaCalendarAlt style={{ marginRight: 8 }} />Specific Date</button>
        </div>
        
        {/* Mode toggle */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 18, alignItems: 'center' }}>
          <button 
            onClick={() => setBulkMode(false)} 
            style={{ 
              fontWeight: 700, 
              fontSize: '1rem', 
              padding: '0.5rem 1.2rem', 
              borderRadius: 8, 
              border: 'none', 
              cursor: 'pointer', 
              background: !bulkMode ? '#ffb300' : '#181818', 
              color: !bulkMode ? '#181818' : '#ffb300', 
              transition: 'all 0.18s' 
            }}
          >
            Single Slot
          </button>
          <button 
            onClick={() => setBulkMode(true)} 
            style={{ 
              fontWeight: 700, 
              fontSize: '1rem', 
              padding: '0.5rem 1.2rem', 
              borderRadius: 8, 
              border: 'none', 
              cursor: 'pointer', 
              background: bulkMode ? '#ffb300' : '#181818', 
              color: bulkMode ? '#181818' : '#ffb300', 
              transition: 'all 0.18s' 
            }}
          >
            Bulk Create
          </button>
        </div>
        
        {/* Add slot form */}
        <div className="mentor-availability-add-section">
          <h4>{bulkMode ? 'Create Multiple Internal Time Slots' : 'Add Internal Time Slot'}</h4>
          <div className="mentor-availability-form">
            <div className="mentor-availability-form-row">
              {activeTab === 'recurring' ? (
              <div className="mentor-availability-form-field">
                <label>Day</label>
                  <select value={selectedDay} onChange={e => setSelectedDay(e.target.value)} style={{ padding: '0.8rem', borderRadius: 8, border: '1.5px solid #3a0a0a', background: '#181818', color: '#fff', fontSize: '1rem' }}>
                  {DAYS_OF_WEEK.map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>
              ) : (
                <div className="mentor-availability-form-field">
                  <label>Date</label>
                  <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} style={{ padding: '0.8rem', borderRadius: 8, border: '1.5px solid #3a0a0a', background: '#181818', color: '#fff', fontSize: '1rem' }} />
                </div>
              )}
              
              {!bulkMode ? (
                <>
                  <div className="mentor-availability-form-field">
                    <label>Start Time</label>
                    <select value={selectedStartTime} onChange={e => setSelectedStartTime(e.target.value)} style={{ padding: '0.8rem', borderRadius: 8, border: '1.5px solid #3a0a0a', background: '#181818', color: '#fff', fontSize: '1rem' }}>
                      {TIME_SLOTS.map(time => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>
                  <div className="mentor-availability-form-field">
                    <label>End Time</label>
                    <select value={selectedEndTime} onChange={e => setSelectedEndTime(e.target.value)} style={{ padding: '0.8rem', borderRadius: 8, border: '1.5px solid #3a0a0a', background: '#181818', color: '#fff', fontSize: '1rem' }}>
                      {TIME_SLOTS.filter(time => time > selectedStartTime).map(time => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>
                </>
              ) : (
                <>
                  <div className="mentor-availability-form-field">
                    <label>Time Range Start</label>
                    <select value={bulkStartTime} onChange={e => setBulkStartTime(e.target.value)} style={{ padding: '0.8rem', borderRadius: 8, border: '1.5px solid #3a0a0a', background: '#181818', color: '#fff', fontSize: '1rem' }}>
                      {TIME_SLOTS.map(time => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>
                  <div className="mentor-availability-form-field">
                    <label>Time Range End</label>
                    <select value={bulkEndTime} onChange={e => setBulkEndTime(e.target.value)} style={{ padding: '0.8rem', borderRadius: 8, border: '1.5px solid #3a0a0a', background: '#181818', color: '#fff', fontSize: '1rem' }}>
                      {TIME_SLOTS.filter(time => time > bulkStartTime).map(time => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>
                  <div className="mentor-availability-form-field">
                    <label>Meeting Duration</label>
                    <select value={meetingDuration} onChange={e => setMeetingDuration(e.target.value)} style={{ padding: '0.8rem', borderRadius: 8, border: '1.5px solid #3a0a0a', background: '#181818', color: '#fff', fontSize: '1rem' }}>
                      <option value="15">15 minutes</option>
                      <option value="30">30 minutes</option>
                      <option value="45">45 minutes</option>
                      <option value="60">1 hour</option>
                      <option value="90">1.5 hours</option>
                      <option value="120">2 hours</option>
                    </select>
                  </div>
                </>
              )}
              
              <div className="mentor-availability-form-field">
                <label>&nbsp;</label>
                <button onClick={addTimeSlot} style={{ background: 'linear-gradient(135deg, #ff2a2a 0%, #a80000 100%)', color: '#fff', border: 'none', borderRadius: 8, padding: '0.8rem 1.5rem', fontSize: '1rem', cursor: 'pointer', fontWeight: 600 }}>
                  <FaClock style={{ marginRight: 8 }} />
                  {bulkMode ? 'Create Internal Slots' : 'Add Internal Slot'}
                </button>
              </div>
            </div>
          </div>
        </div>
        {/* Controls: search, filter, sort, export */}
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 18, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', background: '#222', borderRadius: 8, padding: '4px 12px' }}>
            <FaSearch style={{ color: '#ffb300', fontSize: 18, marginRight: 8 }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search slots..." style={{ background: 'none', border: 'none', color: '#fff', fontSize: 16, outline: 'none', width: 180 }} />
          </div>
          <select value={filterType} onChange={e => setFilterType(e.target.value as 'all' | 'recurring' | 'specific')} style={{ padding: '6px 12px', borderRadius: 8, background: '#222', color: '#fff', fontWeight: 600 }}>
            <option value="all">All Types</option>
            <option value="recurring">Recurring</option>
            <option value="specific">One-off</option>
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as 'all' | 'available' | 'booked')} style={{ padding: '6px 12px', borderRadius: 8, background: '#222', color: '#fff', fontWeight: 600 }}>
            <option value="all">All Statuses</option>
            <option value="available">Available</option>
            <option value="booked">Booked</option>
          </select>
          <button style={{ background: '#ffb300', color: '#181818', border: 'none', borderRadius: 8, padding: '6px 18px', fontWeight: 700, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }} title="Export to CSV">
            <FaFileExport /> Export CSV
          </button>
        </div>
        {/* Internal slot list/table */}
        <div style={{ marginBottom: 12 }}>
          <h4 style={{ color: '#ffb300', marginBottom: 8 }}>Your Internal Time Slots</h4>
          <p style={{ color: '#888', fontSize: '0.9rem', marginBottom: 16 }}>Manage your internal platform availability slots</p>
        </div>
        <table className="mentor-availability-table mentor-animate-fadein mentor-animate-slideup">
          <thead>
            <tr>
              <th onClick={() => { setSortField('type'); setSortDir(sortField === 'type' && sortDir === 'asc' ? 'desc' : 'asc'); }} style={{ cursor: 'pointer' }}>Type {sortField === 'type' ? (sortDir === 'asc' ? '▲' : '▼') : ''}</th>
              <th onClick={() => { setSortField('day'); setSortDir(sortField === 'day' && sortDir === 'asc' ? 'desc' : 'asc'); }} style={{ cursor: 'pointer' }}>Day {sortField === 'day' ? (sortDir === 'asc' ? '▲' : '▼') : ''}</th>
              <th onClick={() => { setSortField('date'); setSortDir(sortField === 'date' && sortDir === 'asc' ? 'desc' : 'asc'); }} style={{ cursor: 'pointer' }}>Date {sortField === 'date' ? (sortDir === 'asc' ? '▲' : '▼') : ''}</th>
              <th onClick={() => { setSortField('time'); setSortDir(sortField === 'time' && sortDir === 'asc' ? 'desc' : 'asc'); }} style={{ cursor: 'pointer' }}>Time {sortField === 'time' ? (sortDir === 'asc' ? '▲' : '▼') : ''}</th>
              <th onClick={() => { setSortField('status'); setSortDir(sortField === 'status' && sortDir === 'asc' ? 'desc' : 'asc'); }} style={{ cursor: 'pointer' }}>Status {sortField === 'status' ? (sortDir === 'asc' ? '▲' : '▼') : ''}</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', color: '#888', padding: 24 }}>No internal time slots found. Add some slots above to get started.</td></tr>
            ) : filtered.map(slot => (
              <tr key={slot.id} className="mentor-animate-row" style={{ background: !slot.isAvailable ? 'rgba(255,68,68,0.07)' : undefined, transition: 'background 0.2s', cursor: 'pointer' }}
                onMouseOver={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,179,0,0.08)'; (e.currentTarget as HTMLElement).style.transform = 'scale(1.012)'; }}
                onMouseOut={e => { (e.currentTarget as HTMLElement).style.background = !slot.isAvailable ? 'rgba(255,68,68,0.07)' : ''; (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
              >
                <td>{typeBadge(slot)}</td>
                <td>{slot.day || '-'}</td>
                <td>{slot.date || '-'}</td>
                <td>{slot.startTime} - {slot.endTime}</td>
                <td>{statusBadge(slot)}</td>
                <td>
                  <button onClick={() => copySlot(slot)} style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 6, padding: '6px 10px', fontSize: '0.9rem', cursor: 'pointer', fontWeight: 600, marginRight: 8 }} title="Copy slot details"><FaCopy /></button>
                  <button onClick={() => handleRemoveSlot(slot)} style={{ background: 'linear-gradient(135deg, #ff4444 0%, #cc0000 100%)', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 10px', fontSize: '0.9rem', cursor: slot.isAvailable ? 'pointer' : 'not-allowed', fontWeight: 600 }} title="Remove slot" disabled={!slot.isAvailable}><FaTrash /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Enhanced Modal component with better visibility
function Modal({ open, onClose, message, type, actions }: { open: boolean, onClose: () => void, message: string, type?: 'success' | 'error' | 'info' | 'warning', actions?: React.ReactNode }) {
  if (!open) return null;
  
  let icon = '';
  let iconColor = '#ffb300';
  let borderColor = '#ffb300';
  
  if (type === 'success') {
    icon = '✅';
    iconColor = '#00e676';
    borderColor = '#00e676';
  } else if (type === 'error') {
    icon = '❌';
    iconColor = '#ff4444';
    borderColor = '#ff4444';
  } else if (type === 'warning') {
    icon = '⚠️';
    iconColor = '#ffb300';
    borderColor = '#ffb300';
  } else {
    icon = 'ℹ️';
    iconColor = '#00eaff';
    borderColor = '#00eaff';
  }
  
  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      width: '100vw', 
      height: '100vh', 
      background: 'rgba(0,0,0,0.6)', 
      zIndex: 9999, 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      backdropFilter: 'blur(4px)'
    }}>
      <div style={{ 
        background: '#181818', 
        color: '#fff', 
        borderRadius: 16, 
        padding: '2.5rem 3rem', 
        minWidth: 400, 
        maxWidth: 500,
        boxShadow: '0 12px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.1)', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        gap: 20,
        border: `2px solid ${borderColor}`,
        transform: 'scale(1)',
        opacity: 1,
        transition: 'all 0.3s ease-out'
      }}>
        <div style={{ 
          fontSize: 48, 
          marginBottom: 8,
          filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))'
        }}>
          {icon}
        </div>
        <div style={{ 
          fontSize: 20, 
          textAlign: 'center', 
          marginBottom: 8,
          fontWeight: 600,
          lineHeight: 1.4,
          color: iconColor
        }}>
          {message}
        </div>
        {type === 'warning' && (
          <div style={{ 
            fontSize: 14, 
            textAlign: 'center', 
            color: '#888',
            marginBottom: 8,
            lineHeight: 1.4
          }}>
            This action cannot be undone.
          </div>
        )}
        {actions ? actions : (
          <button 
            onClick={onClose} 
            style={{ 
              background: `linear-gradient(135deg, ${iconColor} 0%, ${iconColor}dd 100%)`, 
              color: '#181818', 
              border: 'none', 
              borderRadius: 10, 
              padding: '0.8rem 2rem', 
              fontWeight: 700, 
              fontSize: 16, 
              cursor: 'pointer', 
              marginTop: 8,
              boxShadow: `0 4px 12px ${iconColor}40`,
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = `0 6px 16px ${iconColor}60`;
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = `0 4px 12px ${iconColor}40`;
            }}
          >
            OK
          </button>
        )}
      </div>
    </div>
  );
} 