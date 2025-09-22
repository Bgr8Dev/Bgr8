import React from 'react';
import { Booking } from '../../../types/bookings';
import '../../../styles/adminStyles/AdminModal.css';

// Extend the Booking interface to include generated properties
interface ExtendedBooking extends Booking {
  isGeneratedMentor?: boolean;
  isGeneratedMentee?: boolean;
}

interface BookingDetailsModalProps {
  booking: ExtendedBooking | null;
  open: boolean;
  onClose: () => void;
  onDelete?: (booking: ExtendedBooking) => void;
  onUpdateStatus?: (booking: ExtendedBooking, status: 'confirmed' | 'cancelled') => void;
}

export default function BookingDetailsModal({ booking, open, onClose, onDelete, onUpdateStatus }: BookingDetailsModalProps) {
  if (!open || !booking) return null;
  return (
    <div className="booking-details-modal-overlay">
      <div className="booking-details-modal">
        <button onClick={onClose} className="booking-details-modal-close">Close</button>
        <h2 className="booking-details-modal-title">Booking Details</h2>
        <div className="booking-details-modal-row">
          <b>Mentor:</b> {booking.mentorName} ({booking.mentorEmail})
          {booking.isGeneratedMentor && (
            <span style={{ background: '#667eea', color: '#fff', borderRadius: 4, padding: '2px 6px', fontSize: 10, fontWeight: 600, marginLeft: 8 }} title="Generated Mentor">🎲 Generated</span>
          )}
        </div>
        <div className="booking-details-modal-row">
          <b>Mentee:</b> {booking.menteeName} ({booking.menteeEmail})
          {booking.isGeneratedMentee && (
            <span style={{ background: '#667eea', color: '#fff', borderRadius: 4, padding: '2px 6px', fontSize: 10, fontWeight: 600, marginLeft: 8 }} title="Generated Mentee">🎲 Generated</span>
          )}
        </div>
        <div className="booking-details-modal-row"><b>Date:</b> {booking.sessionDate ? (typeof booking.sessionDate === 'object' && 'toDate' in booking.sessionDate ? (booking.sessionDate as { toDate: () => Date }).toDate().toLocaleDateString('en-GB') : new Date(booking.sessionDate).toLocaleDateString('en-GB')) : '-'}</div>
        <div className="booking-details-modal-row"><b>Time:</b> {booking.startTime} - {booking.endTime}</div>
        <div className="booking-details-modal-row"><b>Status:</b> <span className={`booking-details-status booking-details-status-${booking.status}`}>{booking.status.toUpperCase()}</span></div>
        {booking.meetLink && <div className="booking-details-modal-row"><b>Meet Link:</b> <a href={booking.meetLink} target="_blank" rel="noopener noreferrer" className="booking-details-link">{booking.meetLink}</a></div>}
        {booking.eventId && <div className="booking-details-modal-row"><b>Event ID:</b> {booking.eventId}</div>}
        {booking.isCalComBooking && (
          <>
            <div className="booking-details-calcom-section">
              <div className="booking-details-calcom-title">Cal.com Booking</div>
              {booking.calComBookingId && <div className="booking-details-modal-row"><b>Cal.com ID:</b> {booking.calComBookingId}</div>}
              {booking.calComEventType && <div className="booking-details-modal-row"><b>Event Type:</b> {booking.calComEventType.title}</div>}
            </div>
          </>
        )}
        <div className="booking-details-modal-row"><b>Booking ID:</b> {booking.id}</div>
        {/* Admin Actions */}
        <div className="booking-details-modal-actions">
          {onUpdateStatus && booking.status !== 'confirmed' && (
            <button onClick={() => onUpdateStatus(booking, 'confirmed')} className="booking-details-btn booking-details-btn-confirm">Mark Confirmed</button>
          )}
          {onUpdateStatus && booking.status !== 'cancelled' && (
            <button onClick={() => onUpdateStatus(booking, 'cancelled')} className="booking-details-btn booking-details-btn-cancel">Mark Cancelled</button>
          )}
          {onDelete && (
            <button onClick={() => { if(window.confirm('Are you sure you want to delete this booking?')) onDelete(booking); }} className="booking-details-btn booking-details-btn-delete">Delete</button>
          )}
        </div>
      </div>
    </div>
  );
} 