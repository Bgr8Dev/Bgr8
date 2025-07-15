import React from 'react';

interface Booking {
  id: string;
  mentorName: string;
  mentorEmail: string;
  menteeName: string;
  menteeEmail: string;
  sessionDate?: Date | string;
  startTime: string;
  endTime: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  meetLink?: string;
  eventId?: string;
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

interface BookingDetailsModalProps {
  booking: Booking | null;
  open: boolean;
  onClose: () => void;
  onDelete?: (booking: Booking) => void;
  onUpdateStatus?: (booking: Booking, status: 'confirmed' | 'cancelled') => void;
}

export default function BookingDetailsModal({ booking, open, onClose, onDelete, onUpdateStatus }: BookingDetailsModalProps) {
  if (!open || !booking) return null;
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.35)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#181818', color: '#fff', borderRadius: 12, padding: '2rem 2.5rem', minWidth: 340, boxShadow: '0 8px 32px rgba(0,0,0,0.25)', display: 'flex', flexDirection: 'column', gap: 16, position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 12, right: 12, background: '#ff4444', color: '#fff', border: 'none', borderRadius: 8, padding: '0.3rem 1rem', fontWeight: 700, fontSize: 16, cursor: 'pointer' }}>Close</button>
        <h2 style={{ marginBottom: 8 }}>Booking Details</h2>
        <div><b>Mentor:</b> {booking.mentorName} ({booking.mentorEmail})</div>
        <div><b>Mentee:</b> {booking.menteeName} ({booking.menteeEmail})</div>
        <div><b>Date:</b> {booking.sessionDate ? (typeof booking.sessionDate === 'object' && 'toDate' in booking.sessionDate ? (booking.sessionDate as { toDate: () => Date }).toDate().toLocaleDateString('en-GB') : new Date(booking.sessionDate).toLocaleDateString('en-GB')) : '-'}</div>
        <div><b>Time:</b> {booking.startTime} - {booking.endTime}</div>
        <div><b>Status:</b> <span style={{ background: booking.status === 'confirmed' ? '#00e676' : booking.status === 'pending' ? '#ffb300' : '#ff4444', color: '#181818', borderRadius: 6, padding: '2px 10px', fontWeight: 700, fontSize: '0.9rem' }}>{booking.status.toUpperCase()}</span></div>
        {booking.meetLink && <div><b>Meet Link:</b> <a href={booking.meetLink} target="_blank" rel="noopener noreferrer" style={{ color: '#00eaff' }}>{booking.meetLink}</a></div>}
        {booking.eventId && <div><b>Event ID:</b> {booking.eventId}</div>}
        {booking.isCalComBooking && (
          <>
            <div style={{ marginTop: 8, padding: 8, background: 'rgba(0,234,255,0.1)', borderRadius: 8, border: '1px solid #00eaff' }}>
              <div style={{ color: '#00eaff', fontWeight: 600, marginBottom: 4 }}>Cal.com Booking</div>
              {booking.calComBookingId && <div><b>Cal.com ID:</b> {booking.calComBookingId}</div>}
              {booking.calComEventType && <div><b>Event Type:</b> {booking.calComEventType.title}</div>}
            </div>
          </>
        )}
        <div><b>Booking ID:</b> {booking.id}</div>
        {/* Admin Actions */}
        <div style={{ display: 'flex', gap: 16, marginTop: 18 }}>
          {onUpdateStatus && booking.status !== 'confirmed' && (
            <button onClick={() => onUpdateStatus(booking, 'confirmed')} style={{ background: '#00e676', color: '#181818', border: 'none', borderRadius: 8, padding: '0.5rem 1.2rem', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>Mark Confirmed</button>
          )}
          {onUpdateStatus && booking.status !== 'cancelled' && (
            <button onClick={() => onUpdateStatus(booking, 'cancelled')} style={{ background: '#ff4444', color: '#fff', border: 'none', borderRadius: 8, padding: '0.5rem 1.2rem', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>Mark Cancelled</button>
          )}
          {onDelete && (
            <button onClick={() => { if(window.confirm('Are you sure you want to delete this booking?')) onDelete(booking); }} style={{ background: '#2d0000', color: '#ff2a2a', border: '1.5px solid #ff2a2a', borderRadius: 8, padding: '0.5rem 1.2rem', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>Delete</button>
          )}
        </div>
      </div>
    </div>
  );
} 