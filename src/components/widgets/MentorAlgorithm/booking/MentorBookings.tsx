import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../../../../hooks/useAuth';
import { db } from '../../../../firebase/firebase';
import { collection, query, where, getDocs, Timestamp, doc, updateDoc, deleteDoc, setDoc } from 'firebase/firestore';
import { FaCheck, FaTimes, FaSearch, FaFileExport, FaCalendarAlt, FaExternalLinkAlt } from 'react-icons/fa';
import { CalComService, CalComBookingResponse } from '../CalCom/calComService';
import '../MentorProgram.css';

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
  // Cal.com specific fields
  isCalComBooking?: boolean;
  calComBookingId?: string;
  calComEventType?: {
    id: number;
    title: string;
  };
  calComAttendees?: Array<{
    name: string;
    email: string;
    timeZone: string;
  }>;
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
  const [filterType, setFilterType] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [selectedCancelled, setSelectedCancelled] = useState<string[]>([]);
  const [undoQueue, setUndoQueue] = useState<Booking[]>([]);
  const undoTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [showUndo, setShowUndo] = useState(false);

  // Sorting/filtering/search logic - moved to top
  const filtered = bookings.filter(b => {
    if (filterStatus !== 'all' && b.status !== filterStatus) return false;
    if (filterRole !== 'all' && getBookingRole(b) !== filterRole) return false;
    if (filterType !== 'all') {
      if (filterType === 'calcom' && !b.isCalComBooking) return false;
      if (filterType === 'internal' && b.isCalComBooking) return false;
    }
    if (search) {
      const s = search.toLowerCase();
      const eventTypeTitle = b.calComEventType?.title?.toLowerCase() || '';
      if (!b.mentorName.toLowerCase().includes(s) && 
          !b.menteeName.toLowerCase().includes(s) && 
          !b.startTime.includes(s) && 
          !b.endTime.includes(s) && 
          !getOtherPartyName(b).toLowerCase().includes(s) &&
          !eventTypeTitle.includes(s)) return false;
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
      if (!currentUser) {
        console.log('[CalCom DEBUG] No currentUser, skipping bookings fetch.');
        return;
      }
      try {
        console.log('[CalCom DEBUG] Current user:', currentUser);
        const results: Booking[] = [];
        
        // Fetch Firestore bookings where user is either mentor or mentee
        const mentorQuery = query(collection(db, 'bookings'), where('mentorId', '==', currentUser.uid));
        const menteeQuery = query(collection(db, 'bookings'), where('menteeId', '==', currentUser.uid));
        
        const [mentorSnapshot, menteeSnapshot] = await Promise.all([
          getDocs(mentorQuery),
          getDocs(menteeQuery)
        ]);
        
        // Add Firestore mentor bookings
        mentorSnapshot.forEach(docSnap => {
          const data = docSnap.data() as Booking;
          results.push({ ...data, id: docSnap.id });
        });
        
        // Add Firestore mentee bookings
        menteeSnapshot.forEach(docSnap => {
          const data = docSnap.data() as Booking;
          results.push({ ...data, id: docSnap.id });
        });

        // Fetch Cal.com bookings if user is a mentor
        try {
          console.log('[CalCom DEBUG] Attempting to fetch Cal.com bookings for UID:', currentUser.uid);
          const calComBookings = await CalComService.getBookings(currentUser.uid);
          console.log('[CalCom DEBUG] Raw Cal.com bookings response:', calComBookings);
          const calComBookingsFormatted = calComBookings.map((calBooking: CalComBookingResponse) => {
            const startDate = new Date(calBooking.startTime);
            const endDate = new Date(calBooking.endTime);
            
            // Find mentor and mentee from attendees
            const mentor = calBooking.attendees.find(attendee => 
              attendee.email === currentUser.email
            );
            const mentee = calBooking.attendees.find(attendee => 
              attendee.email !== currentUser.email
            );
            const formatted = {
              id: `calcom-${calBooking.id}`,
              mentorId: currentUser.uid,
              menteeId: mentee?.email || 'unknown',
              mentorName: mentor?.name || currentUser.displayName || 'Unknown Mentor',
              menteeName: mentee?.name || 'Unknown Mentee',
              mentorEmail: mentor?.email || currentUser.email || '',
              menteeEmail: mentee?.email || '',
              day: startDate.toLocaleDateString('en-GB'),
              startTime: startDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
              endTime: endDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
              status: calBooking.status === 'ACCEPTED' ? 'confirmed' : 
                      calBooking.status === 'PENDING' ? 'pending' : 'cancelled',
              createdAt: new Date(),
              sessionDate: startDate,
              isCalComBooking: true,
              calComBookingId: calBooking.id,
              calComEventType: calBooking.eventType,
              calComAttendees: calBooking.attendees
            } as Booking;
            console.log('[CalCom DEBUG] Formatted Cal.com booking:', formatted);
            return formatted;
          });
          
          results.push(...calComBookingsFormatted);
          console.log('[CalCom DEBUG] All bookings after merging Cal.com:', results);
        } catch (calComError) {
          console.error('[CalCom DEBUG] No Cal.com bookings found or error fetching:', calComError);
        }
        
        setBookings(results);
        console.log('[CalCom DEBUG] Final bookings set in state:', results);
      } catch (err) {
        console.error('[CalCom DEBUG] Error fetching bookings:', err);
      }
    };
    fetchBookings();
  }, [currentUser]);



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
    const eventDescription = `Mentoring session between ${booking.mentorName} (Mentor) and ${booking.menteeName} (Mentee).\n\nSession Details:\n- Date: ${sessionDate.toLocaleDateString('en-GB')}\n- Time: ${booking.startTime} - ${booking.endTime}\n- Duration: 1 hour\n\nThis meeting will include Google Meet integration.`;

    // Add guests parameter with mentor and mentee emails
    const guests = [booking.mentorEmail, booking.menteeEmail].filter(Boolean).join(',');

    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(eventTitle)}&dates=${formatDate(startTime)}/${formatDate(endTime)}&details=${encodeURIComponent(eventDescription)}&guests=${encodeURIComponent(guests)}&add=true`;

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
      if (booking.isCalComBooking && booking.calComBookingId) {
        // Cancel Cal.com booking
        await CalComService.cancelBooking(currentUser!.uid, booking.calComBookingId);
        setModalMessage('Cal.com booking cancelled successfully!');
      } else {
        // Cancel Firestore booking
        await updateDoc(doc(db, 'bookings', booking.id), {
          status: 'cancelled'
        });
        setModalMessage('Booking cancelled successfully!');
      }
      
      // Update local state
      setBookings(prev => prev.map(b => 
        b.id === booking.id ? { ...b, status: 'cancelled' } : b
      ));
      
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
      if (bookingToDelete.isCalComBooking && bookingToDelete.calComBookingId) {
        // Cal.com bookings are managed through Cal.com, so we just remove from local state
        setModalMessage('Cal.com booking removed from view. The booking is still active in Cal.com.');
      } else {
        // Delete Firestore booking
        await deleteDoc(doc(db, 'bookings', bookingToDelete.id));
        setModalMessage('Booking deleted successfully!');
      }
      
      setBookings(prev => prev.filter(b => b.id !== bookingToDelete.id));
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
      <Modal open={confirmDeleteOpen} onClose={() => setConfirmDeleteOpen(false)} message={
        bookingToDelete 
          ? bookingToDelete.isCalComBooking 
            ? "Are you sure you want to remove this Cal.com booking from view? (The booking will remain active in Cal.com)"
            : "Are you sure you want to permanently delete this cancelled booking?"
          : "Are you sure you want to permanently delete all selected cancelled bookings?"
      } type="warning" actions={
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
        <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ padding: '6px 12px', borderRadius: 8, background: '#222', color: '#fff', fontWeight: 600 }}>
          <option value="all">All Types</option>
          <option value="internal">Internal</option>
          <option value="calcom">Cal.com</option>
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
            return (
              <tr key={booking.id} className="mentor-animate-row" style={{ background: booking.status === 'cancelled' ? 'rgba(255,68,68,0.07)' : undefined, transition: 'background 0.2s', cursor: 'pointer' }}
                onMouseOver={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,179,0,0.08)'; (e.currentTarget as HTMLElement).style.transform = 'scale(1.012)'; }}
                onMouseOut={e => { (e.currentTarget as HTMLElement).style.background = booking.status === 'cancelled' ? 'rgba(255,68,68,0.07)' : ''; (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
              >
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ background: role === 'mentor' ? 'rgba(255, 42, 42, 0.2)' : 'rgba(0, 255, 255, 0.2)', color: role === 'mentor' ? '#ff2a2a' : '#00eaff', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600, textTransform: 'capitalize' }}>{role}</span>
                    {booking.isCalComBooking && (
                      <FaCalendarAlt style={{ color: '#ffb300', fontSize: '14px' }} title="Cal.com Booking" />
                    )}
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>{otherPartyName}</span>
                    {booking.isCalComBooking && booking.calComEventType && (
                      <span style={{ background: 'rgba(255, 179, 0, 0.2)', color: '#ffb300', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600 }}>
                        {booking.calComEventType.title}
                      </span>
                    )}
                  </div>
                </td>
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
                      {booking.status === 'confirmed' && !booking.isCalComBooking && (
                        <button
                          onClick={() => createCalendarEvent(booking)}
                          style={{ background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 12px', fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, transition: 'all 0.2s ease', boxShadow: '0 2px 8px rgba(255, 107, 53, 0.3)' }}
                          title="Set up Google Meet via calendar event"
                        >
                          📅 Set up Google Meet
                        </button>
                      )}
                      {booking.isCalComBooking && (
                        <button
                          onClick={() => window.open(`https://cal.com/bookings/${booking.calComBookingId}`, '_blank')}
                          style={{ background: 'linear-gradient(135deg, #ffb300 0%, #ff8c00 100%)', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 12px', fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, transition: 'all 0.2s ease', boxShadow: '0 2px 8px rgba(255, 179, 0, 0.3)' }}
                          title="View booking in Cal.com"
                        >
                          <FaExternalLinkAlt style={{ fontSize: '14px' }} />
                          View in Cal.com
                        </button>
                      )}
                      {booking.status === 'pending' && !booking.isCalComBooking && (
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