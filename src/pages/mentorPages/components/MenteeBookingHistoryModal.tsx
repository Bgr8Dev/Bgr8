import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { firestore } from '../../../firebase/firebase';
import { Booking } from '../../../types/bookings';
import { MentorMenteeProfile } from '../types';

interface MenteeBookingHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserProfile: MentorMenteeProfile;
}

export const MenteeBookingHistoryModal: React.FC<MenteeBookingHistoryModalProps> = ({
  isOpen,
  onClose,
  currentUserProfile
}) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'confirmed' | 'cancelled' | 'completed'>('all');

  // Fetch mentee's booking history from Firebase
  useEffect(() => {
    if (!isOpen || !currentUserProfile?.uid) return;

    const fetchBookings = async () => {
      try {
        setLoading(true);
        setError(null);

        const bookingsRef = collection(firestore, 'bookings');
        const q = query(
          bookingsRef,
          where('menteeId', '==', currentUserProfile.uid),
          orderBy('sessionDate', 'desc')
        );

        const querySnapshot = await getDocs(q);
        const fetchedBookings: Booking[] = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          fetchedBookings.push({
            id: doc.id,
            ...data,
            sessionDate: data.sessionDate || data.day ? Timestamp.fromDate(new Date(data.sessionDate || data.day)) : undefined,
            createdAt: data.createdAt || Timestamp.now()
          } as Booking);
        });

        setBookings(fetchedBookings);
      } catch (err) {
        console.error('Error fetching bookings:', err);
        setError('Failed to load booking history. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [isOpen, currentUserProfile?.uid]);

  // Filter bookings based on status
  const filteredBookings = bookings.filter(booking => {
    if (statusFilter === 'all') return true;
    return booking.status === statusFilter;
  });

  // Helper function to format date
  const formatDate = (timestamp: Timestamp | undefined) => {
    if (!timestamp) return 'Date not set';
    try {
      const date = timestamp instanceof Timestamp ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('en-GB', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Invalid date';
    }
  };

  // Helper function to format time
  const formatTime = (startTime: string, endTime: string) => {
    return `${startTime} - ${endTime}`;
  };

  // Get status color and text
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'confirmed':
        return { color: '#00e676', bgColor: 'rgba(0, 230, 118, 0.1)', text: 'Confirmed' };
      case 'pending':
        return { color: '#ffb300', bgColor: 'rgba(255, 179, 0, 0.1)', text: 'Pending' };
      case 'cancelled':
        return { color: '#ff4444', bgColor: 'rgba(255, 68, 68, 0.1)', text: 'Cancelled' };
      case 'completed':
        return { color: '#00c853', bgColor: 'rgba(0, 200, 83, 0.1)', text: 'Completed' };
      default:
        return { color: '#888', bgColor: 'rgba(136, 136, 136, 0.1)', text: status };
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ display: 'flex' }}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ zIndex: 10001 }}>
        <div className="modal-header">
          <h2>📚 My Booking History</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {/* Status Filter */}
          <div className="status-filter">
            <label htmlFor="status-filter">Filter by status:</label>
            <select
              id="status-filter"
              value={statusFilter}
                             onChange={(e) => setStatusFilter(e.target.value as 'all' | 'pending' | 'confirmed' | 'cancelled' | 'completed')}
              className="status-select"
            >
              <option value="all">All Bookings ({bookings.length})</option>
              <option value="pending">Pending ({bookings.filter(b => b.status === 'pending').length})</option>
              <option value="confirmed">Confirmed ({bookings.filter(b => b.status === 'confirmed').length})</option>
              <option value="completed">Completed ({bookings.filter(b => b.status === 'completed').length})</option>
              <option value="cancelled">Cancelled ({bookings.filter(b => b.status === 'cancelled').length})</option>
            </select>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading your booking history...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="error-state">
              <p>❌ {error}</p>
              <button onClick={() => window.location.reload()} className="retry-btn">
                Try Again
              </button>
            </div>
          )}

          {/* Bookings List */}
          {!loading && !error && (
            <div className="bookings-list">
              {filteredBookings.length === 0 ? (
                <div className="no-bookings">
                  <div className="no-bookings-icon">📅</div>
                  <h3>No bookings found</h3>
                  <p>
                    {statusFilter === 'all' 
                      ? "You haven't made any bookings yet. Start your learning journey by booking a session with a mentor!"
                      : `No ${statusFilter} bookings found.`
                    }
                  </p>
                </div>
              ) : (
                filteredBookings.map((booking) => {
                  const statusInfo = getStatusInfo(booking.status);
                  return (
                    <div key={booking.id} className="booking-item">
                      <div className="booking-header">
                        <div className="booking-mentor">
                          <div className="mentor-avatar">
                            {booking.mentorName.charAt(0).toUpperCase()}
                          </div>
                          <div className="mentor-info">
                            <h4>{booking.mentorName}</h4>
                            <p>{booking.mentorEmail}</p>
                          </div>
                        </div>
                        <div className="booking-status">
                          <span 
                            className="status-badge"
                            style={{ 
                              color: statusInfo.color, 
                              backgroundColor: statusInfo.bgColor,
                              border: `1px solid ${statusInfo.color}`
                            }}
                          >
                            {statusInfo.text}
                          </span>
                        </div>
                      </div>

                      <div className="booking-details">
                        <div className="detail-row">
                          <div className="detail-item">
                            <span className="detail-label">📅 Session Date:</span>
                            <span className="detail-value">{formatDate(booking.sessionDate)}</span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">🕐 Time:</span>
                            <span className="detail-value">{formatTime(booking.startTime, booking.endTime)}</span>
                          </div>
                        </div>

                        {booking.sessionLink && (
                          <div className="detail-item">
                            <span className="detail-label">🔗 Session Link:</span>
                            <a 
                              href={booking.sessionLink} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="session-link"
                            >
                              Join Session
                            </a>
                          </div>
                        )}

                        {booking.isCalComBooking && (
                          <div className="detail-item">
                            <span className="detail-label">📱 Platform:</span>
                            <span className="detail-value">
                              <span className="calcom-badge">Cal.com</span>
                            </span>
                          </div>
                        )}

                        <div className="detail-item">
                          <span className="detail-label">📝 Created:</span>
                          <span className="detail-value">
                            {formatDate(booking.createdAt)}
                          </span>
                        </div>
                      </div>

                      {/* Action buttons for pending/confirmed bookings */}
                      {booking.status === 'pending' && (
                        <div className="booking-actions">
                          <button className="action-btn primary">
                            📞 Contact Mentor
                          </button>
                          <button className="action-btn secondary">
                            ❌ Cancel Booking
                          </button>
                        </div>
                      )}

                      {booking.status === 'confirmed' && (
                        <div className="booking-actions">
                          <button className="action-btn primary">
                            🎥 Join Session
                          </button>
                          <button className="action-btn secondary">
                            📝 Add to Calendar
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="modal-btn secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
