import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { db } from '../../../firebase/firebase';
import { collection, query, where, getDocs, Timestamp, doc, updateDoc, deleteDoc, setDoc } from 'firebase/firestore';
import { FaVideo, FaCheck, FaTimes, FaSearch, FaFileExport } from 'react-icons/fa';
import './MentorProgram.css';

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
  createdAt: Timestamp | Date;
  sessionDate?: Timestamp | Date;
  meetLink?: string;
  eventId?: string;
}

// Simple Modal component
function Modal({ open, onClose, message, type, actions }: { open: boolean, onClose: () => void, message: string, type?: 'success' | 'error' | 'info' | 'warning', actions?: React.ReactNode }) {
  if (!open) return null;
  let icon = '';
  if (type === 'success') icon = '✅';
  else if (type === 'error') icon = '❌';
  else if (type === 'warning') icon = '⚠️';
  else icon = 'ℹ️';
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.35)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#181818', color: '#fff', borderRadius: 12, padding: '2rem 2.5rem', minWidth: 320, boxShadow: '0 8px 32px rgba(0,0,0,0.25)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{ fontSize: 36, marginBottom: 8 }}>{icon}</div>
        <div style={{ fontSize: 18, textAlign: 'center', marginBottom: 16 }}>{message}</div>
        {actions ? actions : <button onClick={onClose} style={{ background: '#ffb3b3', color: '#181818', border: 'none', borderRadius: 8, padding: '0.6rem 1.5rem', fontWeight: 700, fontSize: 16, cursor: 'pointer', marginTop: 8 }}>OK</button>}
      </div>
    </div>
  );
}

export default function MentorBookings() {
  const { currentUser } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState<'success' | 'error' | 'info' | 'warning'>('info');
  // New state for confirmation modal
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmBookingToCancel, setConfirmBookingToCancel] = useState<Booking | null>(null);
  // New state for delete confirmation modal
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState<Booking | null>(null);
  // Sorting, filtering, search
  const [sortField, setSortField] = useState<'date' | 'status' | 'role' | 'name' | 'time'>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [selectedCancelled, setSelectedCancelled] = useState<string[]>([]);
  const [undoQueue, setUndoQueue] = useState<Booking[]>([]);
  const undoTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [showUndo, setShowUndo] = useState(false);

  // Sorting/filtering/search logic - moved to top
  const filtered = bookings.filter(b => {
    if (filterStatus !== 'all' && b.status !== filterStatus) return false;
    if (filterRole !== 'all' && getBookingRole(b) !== filterRole) return false;
    if (search) {
      const s = search.toLowerCase();
      if (!b.mentorName.toLowerCase().includes(s) && !b.menteeName.toLowerCase().includes(s) && !b.startTime.includes(s) && !b.endTime.includes(s) && !getOtherPartyName(b).toLowerCase().includes(s)) return false;
    }
    return true;
  });
  filtered.sort((a, b) => {
    let vA: unknown, vB: unknown;
    if (sortField === 'date') {
      vA = a.sessionDate instanceof Timestamp ? a.sessionDate.toDate() : new Date(a.sessionDate!);
      vB = b.sessionDate instanceof Timestamp ? b.sessionDate.toDate() : new Date(b.sessionDate!);
    } else if (sortField === 'status') {
      vA = a.status; vB = b.status;
    } else if (sortField === 'role') {
      vA = getBookingRole(a); vB = getBookingRole(b);
    } else if (sortField === 'name') {
      vA = getOtherPartyName(a)?.toLowerCase?.() ?? ''; vB = getOtherPartyName(b)?.toLowerCase?.() ?? '';
    } else if (sortField === 'time') {
      vA = a.startTime; vB = b.startTime;
    }
    if (vA === undefined || vB === undefined) return 0;
    if (typeof vA === 'string' && typeof vB === 'string') {
      return sortDir === 'asc' ? vA.localeCompare(vB) : vB.localeCompare(vA);
    }
    if (vA instanceof Date && vB instanceof Date) {
      return sortDir === 'asc' ? vA.getTime() - vB.getTime() : vB.getTime() - vA.getTime();
    }
    if (typeof vA === 'number' && typeof vB === 'number') {
      return sortDir === 'asc' ? vA - vB : vB - vA;
    }
    return 0;
  });

  useEffect(() => {
    const fetchBookings = async () => {
      if (!currentUser) return;
      try {
        // Fetch bookings where user is either mentor or mentee
        const mentorQuery = query(collection(db, 'bookings'), where('mentorId', '==', currentUser.uid));
        const menteeQuery = query(collection(db, 'bookings'), where('menteeId', '==', currentUser.uid));
        
        const [mentorSnapshot, menteeSnapshot] = await Promise.all([
          getDocs(mentorQuery),
          getDocs(menteeQuery)
        ]);
        
        const results: Booking[] = [];
        
        // Add mentor bookings
        mentorSnapshot.forEach(docSnap => {
          const data = docSnap.data() as Booking;
          results.push({ ...data, id: docSnap.id });
        });
        
        // Add mentee bookings
        menteeSnapshot.forEach(docSnap => {
          const data = docSnap.data() as Booking;
          results.push({ ...data, id: docSnap.id });
        });
        
        setBookings(results);
      } catch (err) {
        console.error('Error fetching bookings:', err);
      }
    };
    fetchBookings();
  }, [currentUser]);

  const generateGoogleMeetLink = async (booking: Booking) => {
    try {
      const sessionDate = booking.sessionDate instanceof Timestamp 
        ? booking.sessionDate.toDate() 
        : booking.sessionDate ? new Date(booking.sessionDate) : new Date();

      const mentorEmail = booking.mentorEmail;
      const menteeEmail = booking.menteeEmail;

      if (!mentorEmail || !menteeEmail) {
        setModalMessage('Cannot create Google Meet: Mentor or mentee email is missing for this booking.');
        setModalType('error');
        setModalOpen(true);
        return;
      }

      const bookingData = {
        id: booking.id,
        mentorName: booking.mentorName,
        menteeName: booking.menteeName,
        mentorEmail,
        menteeEmail,
        sessionDate: sessionDate.toISOString(),
        startTime: booking.startTime,
        endTime: booking.endTime
      };

      const response = await fetch('http://localhost:3001/api/create-meeting', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ booking: bookingData }),
      });

      const result = await response.json();

      if (result.success) {
        if (result.method === 'google-meet-api') {
          // Real Google Meet link - open it directly
          window.open(result.meetLink, '_blank');
          
          // Update the booking in Firestore with the meet link
          await updateDoc(doc(db, 'bookings', booking.id), {
            meetLink: result.meetLink,
            eventId: result.eventId
          });
          
          setModalMessage(result.message || 'Google Meet meeting created successfully! Share the Meet link with participants.');
          setModalType('success');
          setModalOpen(true);
        } else {
          // Server returned calendar fallback
          setModalMessage(result.message || 'API not configured. Using calendar fallback.');
          setModalType('warning');
          setModalOpen(true);
          window.open(result.meetLink, '_blank');
        }
      } else {
        throw new Error(result.error || 'Failed to create meeting');
      }
    } catch (error) {
      console.error('Error creating meeting:', error);
      
      // Show error and suggest using calendar method instead
      setModalMessage('Failed to create automatic meeting. Please use "Create Calendar Event" instead or check if the server is running.');
      setModalType('error');
      setModalOpen(true);
    }
  };

  const createCalendarEvent = (booking: Booking) => {
    // Create a Google Calendar event with Meet integration (fallback method)
    const sessionDate = booking.sessionDate instanceof Timestamp 
      ? booking.sessionDate.toDate() 
      : booking.sessionDate ? new Date(booking.sessionDate) : new Date();
    
    const startTime = new Date(sessionDate);
    const [hours, minutes] = booking.startTime.split(':').map(Number);
    startTime.setHours(hours, minutes, 0, 0);
    
    const endTime = new Date(sessionDate);
    const [endHours, endMinutes] = booking.endTime.split(':').map(Number);
    endTime.setHours(endHours, endMinutes, 0, 0);
    
    // Format dates for Google Calendar
    const formatDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };
    
    const eventTitle = `Mentoring Session: ${booking.mentorName} & ${booking.menteeName}`;
    const eventDescription = `Mentoring session between ${booking.mentorName} (Mentor) and ${booking.menteeName} (Mentee).
    
Session Details:
- Date: ${sessionDate.toLocaleDateString('en-GB')}
- Time: ${booking.startTime} - ${booking.endTime}
- Duration: 1 hour

This meeting will include Google Meet integration.`;
    
    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(eventTitle)}&dates=${formatDate(startTime)}/${formatDate(endTime)}&details=${encodeURIComponent(eventDescription)}&add=true`;
    
    // Open Google Calendar with pre-filled event details
    window.open(googleCalendarUrl, '_blank');
  };

  const confirmBooking = async (booking: Booking) => {
    try {
      await updateDoc(doc(db, 'bookings', booking.id), {
        status: 'confirmed'
      });
      
      // Update local state
      setBookings(prev => prev.map(b => 
        b.id === booking.id ? { ...b, status: 'confirmed' } : b
      ));
      
      setModalMessage('Booking confirmed successfully!');
      setModalType('success');
      setModalOpen(true);
    } catch (err) {
      console.error('Error confirming booking:', err);
      setModalMessage('Failed to confirm booking. Please try again.');
      setModalType('error');
      setModalOpen(true);
    }
  };

  const cancelBooking = async (booking: Booking) => {
    try {
      await updateDoc(doc(db, 'bookings', booking.id), {
        status: 'cancelled'
      });
      
      // Update local state
      setBookings(prev => prev.map(b => 
        b.id === booking.id ? { ...b, status: 'cancelled' } : b
      ));
      
      setModalMessage('Booking cancelled successfully!');
      setModalType('success');
      setModalOpen(true);
    } catch (err) {
      console.error('Error cancelling booking:', err);
      setModalMessage('Failed to cancel booking. Please try again.');
      setModalType('error');
      setModalOpen(true);
    }
  };

  const handleDeleteBooking = (booking: Booking) => {
    setBookingToDelete(booking);
    setConfirmDeleteOpen(true);
  };
  const confirmDeleteBooking = async () => {
    if (!bookingToDelete) return;
    try {
      await deleteDoc(doc(db, 'bookings', bookingToDelete.id));
      setBookings(prev => prev.filter(b => b.id !== bookingToDelete.id));
      setModalMessage('Booking deleted successfully!');
      setModalType('success');
      setModalOpen(true);
    } catch {
      setModalMessage('Failed to delete booking.');
      setModalType('error');
      setModalOpen(true);
    }
    setBookingToDelete(null);
    setConfirmDeleteOpen(false);
  };

  // Bulk select logic
  const isAllCancelledSelected = filtered.filter(b => b.status === 'cancelled').length > 0 && filtered.filter(b => b.status === 'cancelled').every(b => selectedCancelled.includes(b.id));
  const handleSelectCancelled = (id: string, checked: boolean) => {
    setSelectedCancelled(prev => checked ? [...prev, id] : prev.filter(x => x !== id));
  };
  const handleSelectAllCancelled = (checked: boolean) => {
    const allCancelledIds = filtered.filter(b => b.status === 'cancelled').map(b => b.id);
    setSelectedCancelled(checked ? allCancelledIds : []);
  };
  const handleBulkDelete = () => {
    setBookingToDelete(null);
    setConfirmDeleteOpen(true);
  };
  const confirmBulkDelete = async () => {
    const toDelete = bookings.filter(b => selectedCancelled.includes(b.id));
    for (const booking of toDelete) {
      await deleteDoc(doc(db, 'bookings', booking.id));
    }
    setUndoQueue(toDelete);
    setBookings(prev => prev.filter(b => !selectedCancelled.includes(b.id)));
    setSelectedCancelled([]);
    setShowUndo(true);
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    undoTimeoutRef.current = setTimeout(() => {
      setShowUndo(false);
      setUndoQueue([]);
    }, 5000);
    setConfirmDeleteOpen(false);
  };
  const handleUndo = async () => {
    for (const booking of undoQueue) {
      // Convert Firestore Timestamp fields to JS Date if needed
      const bookingData = { ...booking };
      if (bookingData.createdAt instanceof Timestamp) bookingData.createdAt = bookingData.createdAt.toDate();
      if (bookingData.sessionDate instanceof Timestamp) bookingData.sessionDate = bookingData.sessionDate.toDate();
      await setDoc(doc(db, 'bookings', booking.id), bookingData);
    }
    setBookings(prev => [...prev, ...undoQueue]);
    setShowUndo(false);
    setUndoQueue([]);
  };

  // Determine if current user is a mentor or mentee for each booking
  const getBookingRole = (booking: Booking) => {
    return booking.mentorId === currentUser?.uid ? 'mentor' : 'mentee';
  };

  const getOtherPartyName = (booking: Booking) => {
    return booking.mentorId === currentUser?.uid ? booking.menteeName : booking.mentorName;
  };

  // Status badge helper
  const statusBadge = (status: string) => {
    let color = '#ffb300';
    if (status === 'confirmed') color = '#00e676';
    else if (status === 'cancelled') color = '#ff4444';
    else if (status === 'pending') color = '#ffb300';
    return <span className="status-badge" style={{ background: color, color: '#181818', borderRadius: 6, padding: '2px 10px', fontWeight: 700, fontSize: '0.9rem', marginLeft: 4 }}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>;
  };

  // Cancel with confirmation modal
  const handleCancel = (booking: Booking) => {
    setConfirmBookingToCancel(booking);
    setConfirmOpen(true);
  };
  const confirmCancel = async () => {
    if (confirmBookingToCancel) {
      await cancelBooking(confirmBookingToCancel);
      setConfirmBookingToCancel(null);
      setConfirmOpen(false);
    }
  };

  if (bookings.length === 0) {
    return <div className="mentor-bookings-empty">No bookings yet.</div>;
  }

  return (
    <div className="mentor-bookings mentor-animate-fadein mentor-animate-slideup">
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} message={modalMessage} type={modalType} />
      {/* Confirmation Modal */}
      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} message="Are you sure you want to cancel this booking?" type="warning" actions={
        <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
          <button onClick={confirmCancel} style={{ background: '#ff4444', color: '#fff', border: 'none', borderRadius: 8, padding: '0.6rem 1.5rem', fontWeight: 700, fontSize: 16, cursor: 'pointer' }}>Yes, Cancel</button>
          <button onClick={() => setConfirmOpen(false)} style={{ background: '#eee', color: '#181818', border: 'none', borderRadius: 8, padding: '0.6rem 1.5rem', fontWeight: 700, fontSize: 16, cursor: 'pointer' }}>No</button>
        </div>
      } />
      {/* Confirmation Modal for Delete */}
      <Modal open={confirmDeleteOpen} onClose={() => setConfirmDeleteOpen(false)} message={bookingToDelete ? "Are you sure you want to permanently delete this cancelled booking?" : "Are you sure you want to permanently delete all selected cancelled bookings?"} type="warning" actions={
        <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
          <button onClick={bookingToDelete ? confirmDeleteBooking : confirmBulkDelete} style={{ background: '#ff4444', color: '#fff', border: 'none', borderRadius: 8, padding: '0.6rem 1.5rem', fontWeight: 700, fontSize: 16, cursor: 'pointer' }}>Yes, Delete</button>
          <button onClick={() => setConfirmDeleteOpen(false)} style={{ background: '#eee', color: '#181818', border: 'none', borderRadius: 8, padding: '0.6rem 1.5rem', fontWeight: 700, fontSize: 16, cursor: 'pointer' }}>No</button>
        </div>
      } />
      {/* Bulk Delete and Undo Snackbar */}
      {filtered.filter(b => b.status === 'cancelled').length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <input type="checkbox" checked={isAllCancelledSelected} onChange={e => handleSelectAllCancelled(e.target.checked)} />
          <span>Select All Cancelled</span>
          <button onClick={handleBulkDelete} disabled={selectedCancelled.length === 0} style={{ background: '#ff4444', color: '#fff', border: 'none', borderRadius: 8, padding: '0.5rem 1.2rem', fontWeight: 700, fontSize: 15, cursor: selectedCancelled.length === 0 ? 'not-allowed' : 'pointer' }}>Delete Selected</button>
        </div>
      )}
      {showUndo && (
        <div style={{ position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)', background: '#222', color: '#fff', borderRadius: 8, padding: '1rem 2rem', boxShadow: '0 4px 16px rgba(0,0,0,0.18)', zIndex: 9999, display: 'flex', alignItems: 'center', gap: 18 }}>
          <span>Bookings deleted.</span>
          <button onClick={handleUndo} style={{ background: '#ffb300', color: '#181818', border: 'none', borderRadius: 8, padding: '0.5rem 1.2rem', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>Undo</button>
        </div>
      )}
      {/* Search, filter, export controls */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 18, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', background: '#222', borderRadius: 8, padding: '4px 12px' }}>
          <FaSearch style={{ color: '#ffb300', fontSize: 18, marginRight: 8 }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search bookings..." style={{ background: 'none', border: 'none', color: '#fff', fontSize: 16, outline: 'none', width: 180 }} />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: '6px 12px', borderRadius: 8, background: '#222', color: '#fff', fontWeight: 600 }}>
          <option value="all">All Statuses</option>
          <option value="confirmed">Confirmed</option>
          <option value="pending">Pending</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select value={filterRole} onChange={e => setFilterRole(e.target.value)} style={{ padding: '6px 12px', borderRadius: 8, background: '#222', color: '#fff', fontWeight: 600 }}>
          <option value="all">All Roles</option>
          <option value="mentor">Mentor</option>
          <option value="mentee">Mentee</option>
        </select>
        {/* Export button placeholder */}
        <button style={{ background: '#ffb300', color: '#181818', border: 'none', borderRadius: 8, padding: '6px 18px', fontWeight: 700, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }} title="Export to CSV">
          <FaFileExport /> Export CSV
        </button>
      </div>
        <table className="mentor-bookings-table mentor-animate-fadein mentor-animate-slideup">
          <thead>
            <tr>
            <th onClick={() => { setSortField('role'); setSortDir(sortField === 'role' && sortDir === 'asc' ? 'desc' : 'asc'); }} style={{ cursor: 'pointer' }}>Role {sortField === 'role' ? (sortDir === 'asc' ? '▲' : '▼') : ''}</th>
            <th onClick={() => { setSortField('name'); setSortDir(sortField === 'name' && sortDir === 'asc' ? 'desc' : 'asc'); }} style={{ cursor: 'pointer' }}>Other Party {sortField === 'name' ? (sortDir === 'asc' ? '▲' : '▼') : ''}</th>
            <th onClick={() => { setSortField('date'); setSortDir(sortField === 'date' && sortDir === 'asc' ? 'desc' : 'asc'); }} style={{ cursor: 'pointer' }}>Date {sortField === 'date' ? (sortDir === 'asc' ? '▲' : '▼') : ''}</th>
            <th onClick={() => { setSortField('time'); setSortDir(sortField === 'time' && sortDir === 'asc' ? 'desc' : 'asc'); }} style={{ cursor: 'pointer' }}>Time {sortField === 'time' ? (sortDir === 'asc' ? '▲' : '▼') : ''}</th>
            <th onClick={() => { setSortField('status'); setSortDir(sortField === 'status' && sortDir === 'asc' ? 'desc' : 'asc'); }} style={{ cursor: 'pointer' }}>Status {sortField === 'status' ? (sortDir === 'asc' ? '▲' : '▼') : ''}</th>
            <th>Actions</th>
            </tr>
          </thead>
          <tbody>
          {filtered.map(booking => {
            const role = getBookingRole(booking);
            const otherPartyName = getOtherPartyName(booking);
            const mentorEmail = booking.mentorEmail;
            const menteeEmail = booking.menteeEmail;
            const canAutoCreate = mentorEmail && menteeEmail;
            const autoCreateTooltip = (!mentorEmail || !menteeEmail)
              ? 'Mentor and mentee emails missing for this booking'
              : 'Create automatic Google Meet meeting via API';
            return (
              <tr key={booking.id} className="mentor-animate-row" style={{ background: booking.status === 'cancelled' ? 'rgba(255,68,68,0.07)' : undefined, transition: 'background 0.2s', cursor: 'pointer' }}
                onMouseOver={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,179,0,0.08)'; (e.currentTarget as HTMLElement).style.transform = 'scale(1.012)'; }}
                onMouseOut={e => { (e.currentTarget as HTMLElement).style.background = booking.status === 'cancelled' ? 'rgba(255,68,68,0.07)' : ''; (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
              >
                <td>
                  <span style={{ background: role === 'mentor' ? 'rgba(255, 42, 42, 0.2)' : 'rgba(0, 255, 255, 0.2)', color: role === 'mentor' ? '#ff2a2a' : '#00eaff', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600, textTransform: 'capitalize' }}>{role}</span>
                </td>
                <td>{otherPartyName}</td>
                <td>{booking.sessionDate ? (booking.sessionDate instanceof Timestamp ? booking.sessionDate.toDate().toLocaleDateString('en-GB') : new Date(booking.sessionDate).toLocaleDateString('en-GB')) : '-'}</td>
                <td>{booking.startTime} - {booking.endTime}</td>
                <td>{statusBadge(booking.status)}</td>
                <td>
                  {booking.status === 'cancelled' && (
                    <input type="checkbox" checked={selectedCancelled.includes(booking.id)} onChange={e => handleSelectCancelled(booking.id, e.target.checked)} />
                  )}
                  {/* Actions for confirmed and pending bookings */}
                  {booking.status !== 'cancelled' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {booking.status === 'confirmed' && (
                        <>
                          <button
                            onClick={() => generateGoogleMeetLink(booking)}
                            disabled={!canAutoCreate}
                            style={{ background: 'linear-gradient(135deg, #4285f4 0%, #34a853 100%)', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 12px', fontSize: '0.9rem', cursor: canAutoCreate ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, transition: 'all 0.2s ease', boxShadow: '0 2px 8px rgba(66, 133, 244, 0.3)', opacity: canAutoCreate ? 1 : 0.5 }}
                            title={autoCreateTooltip}
                          >
                            <FaVideo style={{ fontSize: '14px' }} />
                            Auto Create Meet
                          </button>
                          <button
                            onClick={() => createCalendarEvent(booking)}
                            style={{ background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 12px', fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, transition: 'all 0.2s ease', boxShadow: '0 2px 8px rgba(255, 107, 53, 0.3)' }}
                            title="Create calendar event with Google Meet integration"
                          >
                            📅 Create Calendar Event
                          </button>
                        </>
                      )}
                      {booking.status === 'pending' && (
                        <>
                          {role === 'mentor' && (
                            <button
                              onClick={() => confirmBooking(booking)}
                              style={{ background: 'linear-gradient(135deg, #00ff00 0%, #00cc00 100%)', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 12px', fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, transition: 'all 0.2s ease', boxShadow: '0 2px 8px rgba(0, 255, 0, 0.3)' }}
                              title="Confirm booking"
                            >
                              <FaCheck style={{ fontSize: '14px' }} />
                              Confirm
                            </button>
                          )}
                        </>
                      )}
                      {/* Cancel button for both mentor and mentee, any status except cancelled */}
                      <button
                        onClick={() => handleCancel(booking)}
                        style={{ background: 'linear-gradient(135deg, #ff4444 0%, #cc0000 100%)', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 12px', fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, transition: 'all 0.2s ease', boxShadow: '0 2px 8px rgba(255, 68, 68, 0.3)' }}
                        title="Cancel booking"
                      >
                        <FaTimes style={{ fontSize: '14px' }} />
                        Cancel
                      </button>
                    </div>
                  )}
                  {booking.status === 'cancelled' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <button
                        onClick={() => handleDeleteBooking(booking)}
                        style={{ background: 'linear-gradient(135deg, #ff4444 0%, #cc0000 100%)', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 12px', fontSize: '0.9rem', cursor: 'pointer', fontWeight: 600, marginTop: 4 }}
                        title="Delete this cancelled booking permanently"
                      >
                        Delete
                      </button>
                      <button
                            onClick={() => generateGoogleMeetLink(booking)}
                            disabled={!canAutoCreate}
                            style={{ background: 'linear-gradient(135deg, #4285f4 0%, #34a853 100%)', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 12px', fontSize: '0.9rem', cursor: canAutoCreate ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, transition: 'all 0.2s ease', boxShadow: '0 2px 8px rgba(66, 133, 244, 0.3)', opacity: canAutoCreate ? 1 : 0.5 }}
                            title={autoCreateTooltip}
                          >
                            <FaVideo style={{ fontSize: '14px' }} />
                            Auto Create Meet
                          </button>
                          <button
                            onClick={() => createCalendarEvent(booking)}
                            style={{ background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 12px', fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, transition: 'all 0.2s ease', boxShadow: '0 2px 8px rgba(255, 107, 53, 0.3)' }}
                            title="Create calendar event with Google Meet integration"
                          >
                            📅 Create Calendar Event
                          </button>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
          </tbody>
        </table>
    </div>
  );
} 