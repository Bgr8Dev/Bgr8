import React, { useState, useMemo } from 'react';
import { MentorBooking } from '../types/mentorTypes';
import './ViewBookingsModal.css';

interface ViewBookingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookings: MentorBooking[];
  onAcceptBooking?: (bookingId: string) => void;
  onRejectBooking?: (bookingId: string) => void;
  onCancelBooking?: (bookingId: string) => void;
}

export const ViewBookingsModal: React.FC<ViewBookingsModalProps> = ({
  isOpen,
  onClose,
  bookings,
  onAcceptBooking,
  onRejectBooking,
  onCancelBooking
}) => {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'mentee' | 'status'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [searchTerm, setSearchTerm] = useState('');

  // Filter and sort bookings
  const filteredAndSortedBookings = useMemo(() => {
    let filtered = bookings;

    // Apply status filter
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(booking => booking.status === selectedFilter);
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(booking => 
        booking.menteeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.sessionDate.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.sessionDate).getTime() - new Date(b.sessionDate).getTime();
          break;
        case 'mentee':
          comparison = a.menteeName.localeCompare(b.menteeName);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [bookings, selectedFilter, searchTerm, sortBy, sortOrder]);

  // Get booking statistics
  const stats = useMemo(() => {
    const total = bookings.length;
    const pending = bookings.filter(b => b.status === 'pending').length;
    const confirmed = bookings.filter(b => b.status === 'confirmed').length;
    const completed = bookings.filter(b => b.status === 'completed').length;
    const cancelled = bookings.filter(b => b.status === 'cancelled').length;

    return { total, pending, confirmed, completed, cancelled };
  }, [bookings]);

  const handleSort = (field: 'date' | 'mentee' | 'status') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortOrder('asc');
      setSortBy(field);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      pending: 'status-pending',
      confirmed: 'status-confirmed',
      completed: 'status-completed',
      cancelled: 'status-cancelled'
    };
    
    return (
      <span className={`status-badge ${statusClasses[status as keyof typeof statusClasses] || 'status-pending'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getActionButtons = (booking: MentorBooking) => {
    switch (booking.status) {
      case 'pending':
        return (
          <div className="booking-actions">
            <button 
              className="action-btn accept"
              onClick={() => onAcceptBooking?.(booking.id)}
            >
              Accept
            </button>
            <button 
              className="action-btn reject"
              onClick={() => onRejectBooking?.(booking.id)}
            >
              Reject
            </button>
          </div>
        );
      case 'confirmed':
        return (
          <div className="booking-actions">
            <button 
              className="action-btn complete"
              onClick={() => onAcceptBooking?.(booking.id)} // Reuse accept for now
            >
              Mark Complete
            </button>
            <button 
              className="action-btn cancel"
              onClick={() => onCancelBooking?.(booking.id)}
            >
              Cancel
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="view-bookings-modal-overlay" onClick={onClose}>
      <div className="view-bookings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>All Bookings</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {/* Statistics Overview */}
        <div className="bookings-stats">
          <div className="stat-item">
            <span className="stat-number">{stats.total}</span>
            <span className="stat-label">Total</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{stats.pending}</span>
            <span className="stat-label">Pending</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{stats.confirmed}</span>
            <span className="stat-label">Confirmed</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{stats.completed}</span>
            <span className="stat-label">Completed</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{stats.cancelled}</span>
            <span className="stat-label">Cancelled</span>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bookings-controls">
          <div className="filters">
            <button 
              className={`filter-btn ${selectedFilter === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedFilter('all')}
            >
              All
            </button>
            <button 
              className={`filter-btn ${selectedFilter === 'pending' ? 'active' : ''}`}
              onClick={() => setSelectedFilter('pending')}
            >
              Pending
            </button>
            <button 
              className={`filter-btn ${selectedFilter === 'confirmed' ? 'active' : ''}`}
              onClick={() => setSelectedFilter('confirmed')}
            >
              Confirmed
            </button>
            <button 
              className={`filter-btn ${selectedFilter === 'completed' ? 'active' : ''}`}
              onClick={() => setSelectedFilter('completed')}
            >
              Completed
            </button>
            <button 
              className={`filter-btn ${selectedFilter === 'cancelled' ? 'active' : ''}`}
              onClick={() => setSelectedFilter('cancelled')}
            >
              Cancelled
            </button>
          </div>

          <div className="search-sort">
            <input
              type="text"
              placeholder="Search mentees or dates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            
            <div className="sort-controls">
              <label>Sort by:</label>
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value as 'date' | 'mentee' | 'status')}
                className="sort-select"
              >
                <option value="date">Date</option>
                <option value="mentee">Mentee</option>
                <option value="status">Status</option>
              </select>
              <button 
                className="sort-order-btn"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>
        </div>

        {/* Bookings Table */}
        <div className="bookings-table-container">
          {filteredAndSortedBookings.length === 0 ? (
            <div className="no-bookings">
              <p>No bookings found matching your criteria.</p>
            </div>
          ) : (
            <div className="bookings-table">
              <div className="table-header">
                <div className="header-cell sortable" onClick={() => handleSort('mentee')}>
                  Mentee
                  {sortBy === 'mentee' && <span className="sort-indicator">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                </div>
                <div className="header-cell sortable" onClick={() => handleSort('date')}>
                  Session Date
                  {sortBy === 'date' && <span className="sort-indicator">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                </div>
                <div className="header-cell">Time</div>
                <div className="header-cell sortable" onClick={() => handleSort('status')}>
                  Status
                  {sortBy === 'status' && <span className="sort-indicator">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                </div>
                <div className="header-cell">Actions</div>
              </div>

              <div className="table-body">
                {filteredAndSortedBookings.map((booking) => (
                  <div key={booking.id} className="table-row">
                    <div className="table-cell">
                      <div className="mentee-info">
                        <span className="mentee-name">{booking.menteeName}</span>
                      </div>
                    </div>
                    <div className="table-cell">
                      {new Date(booking.sessionDate).toLocaleDateString()}
                    </div>
                    <div className="table-cell">
                      {booking.startTime || 'TBD'}
                    </div>
                    <div className="table-cell">
                      {getStatusBadge(booking.status)}
                    </div>
                    <div className="table-cell">
                      {getActionButtons(booking)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <div className="results-info">
            Showing {filteredAndSortedBookings.length} of {bookings.length} bookings
          </div>
          <button className="close-modal-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
