import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, Timestamp } from 'firebase/firestore';
import { firestore } from '../../../firebase/firebase';
import { Booking } from '../../../types/bookings';
import { MentorMenteeProfile } from '../types';
import { loggers } from '../../../utils/logger';
import { useAuth } from '../../../hooks/useAuth';

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
  const { currentUser } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'confirmed' | 'cancelled' | 'completed'>('all');

  // Fetch mentee's booking history from Firestore using robust matching
  useEffect(() => {
    if (!isOpen || !currentUserProfile?.uid || !currentUser?.uid) return;

    const fetchBookings = async () => {
      try {
        setLoading(true);
        setError(null);

        const userEmail = currentUser.email || '';
        const userDisplayName = currentUser.displayName || '';
        const userNameParts = userDisplayName.toLowerCase().split(' ').filter(p => p.length > 0);
        
        loggers.booking.log(`🔍 Modal: Fetching bookings for mentee: ${currentUser.uid}, email: ${userEmail}, name: ${userDisplayName}`);

        // Get all bookings and filter in memory (same robust method as dashboard)
        const allBookingsQuery = query(collection(firestore, 'bookings'));
        const allBookingsSnapshot = await getDocs(allBookingsQuery);
        
        loggers.booking.log(`📊 Modal: Total bookings in database: ${allBookingsSnapshot.docs.length}`);
        
        const matchedBookings: Booking[] = [];
        const matchReasons: string[] = [];
        
        allBookingsSnapshot.docs.forEach(doc => {
          const data = doc.data();
          let isMatch = false;
          let matchReason = '';
          
          // Check 1: menteeId matches
          if (data.menteeId === currentUser.uid) {
            isMatch = true;
            matchReason = 'menteeId';
          }
          // Check 2: menteeEmail matches
          else if (userEmail && data.menteeEmail === userEmail) {
            isMatch = true;
            matchReason = 'menteeEmail';
          }
          // Check 3: Check calComAttendees array
          else if (Array.isArray(data.calComAttendees) && data.calComAttendees.length > 0) {
            const attendeeMatch = data.calComAttendees.some((attendee: { 
              email?: string; 
              name?: string; 
              id?: number | string;
              user?: { 
                email?: string; 
                name?: string; 
              };
            }) => {
              // Match by email
              if (userEmail && attendee.email && attendee.email.toLowerCase() === userEmail.toLowerCase()) {
                matchReason = 'calComAttendees.email';
                return true;
              }
              // Match by attendee.user.email (nested email)
              if (userEmail && attendee.user?.email && attendee.user.email.toLowerCase() === userEmail.toLowerCase()) {
                matchReason = 'calComAttendees.user.email';
                return true;
              }
              // Match by name (if display name matches)
              if (userDisplayName && attendee.name) {
                const attendeeNameLower = attendee.name.toLowerCase();
                const userDisplayNameLower = userDisplayName.toLowerCase();
                // Exact match
                if (attendeeNameLower === userDisplayNameLower) {
                  matchReason = 'calComAttendees.name';
                  return true;
                }
                // Partial match (check if all name parts are present)
                if (userNameParts.length > 0) {
                  const attendeeNameParts = attendeeNameLower.split(' ').filter((p: string) => p.length > 0);
                  const allPartsMatch = userNameParts.every(part => 
                    attendeeNameParts.some((ap: string) => ap.includes(part) || part.includes(ap))
                  );
                  if (allPartsMatch && attendeeNameParts.length === userNameParts.length) {
                    matchReason = 'calComAttendees.name.partial';
                    return true;
                  }
                }
              }
              // Match by attendee.user.name (nested name)
              if (userDisplayName && attendee.user?.name) {
                const attendeeUserNameLower = attendee.user.name.toLowerCase();
                const userDisplayNameLower = userDisplayName.toLowerCase();
                if (attendeeUserNameLower === userDisplayNameLower) {
                  matchReason = 'calComAttendees.user.name';
                  return true;
                }
              }
              return false;
            });
            
            if (attendeeMatch) {
              isMatch = true;
            }
          }
          
          if (isMatch) {
            const bookingData: Booking = {
              id: doc.id,
              ...data,
              sessionDate: data.sessionDate || (data.day ? Timestamp.fromDate(new Date(data.day)) : undefined),
              createdAt: data.createdAt || Timestamp.now()
            } as Booking;
            matchedBookings.push(bookingData);
            matchReasons.push(`${doc.id}: ${matchReason}`);
          }
        });
        
        loggers.booking.log(`📊 Modal: Found ${matchedBookings.length} matching bookings`);
        if (matchedBookings.length > 0) {
          loggers.booking.debug('Modal: Match reasons:', matchReasons.slice(0, 5)); // Log first 5
        }

        // Sort by session date (most recent first)
        matchedBookings.sort((a, b) => {
          const dateA = a.sessionDate?.toMillis() || 0;
          const dateB = b.sessionDate?.toMillis() || 0;
          return dateB - dateA;
        });

        setBookings(matchedBookings);
      } catch (err: unknown) {
        loggers.booking.error('Error fetching bookings in modal:', err);
        setError('Failed to load booking history. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [isOpen, currentUserProfile?.uid, currentUser?.uid, currentUser?.email, currentUser?.displayName]);

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
        <div className="modal-header modal-loading">
          <h2>📚 My Booking History</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body modal-loading">
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

        <div className="modal-footer modal-loading">
          <button className="modal-btn secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
