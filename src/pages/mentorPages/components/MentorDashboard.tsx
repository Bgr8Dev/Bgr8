import React, { useState } from 'react';
import { MentorMenteeProfile, MentorAvailability } from '../types';
import { ViewBookingsModal } from './ViewBookingsModal';

interface MentorBooking {
  id: string;
  menteeName: string;
  sessionDate: string;
  startTime: string;
  status: string;
}

interface MentorBookings {
  [key: string]: MentorBooking[];
}

interface MentorDashboardProps {
  currentUserProfile: MentorMenteeProfile;
  mentorAvailability: MentorAvailability;
  mentorBookings: MentorBookings;
  onProfileEdit: (event?: React.MouseEvent<HTMLElement>) => void;
  onAvailabilityManage: () => void;
  onViewAllBookings: () => void;
  onAcceptBooking: (bookingId: string) => void;
  onRejectBooking: (bookingId: string) => void;
  onCancelBooking: (bookingId: string) => void;
}

export const MentorDashboard: React.FC<MentorDashboardProps> = ({
  currentUserProfile,
  mentorAvailability,
  mentorBookings,
  onProfileEdit,
  onAvailabilityManage,
  onViewAllBookings,
  onAcceptBooking,
  onRejectBooking,
  onCancelBooking
}) => {
  const [isProfileCardExpanded, setIsProfileCardExpanded] = useState(false);
  const [isAvailabilityCardExpanded, setIsAvailabilityCardExpanded] = useState(false);
  const [isBookingWidgetMinimized, setIsBookingWidgetMinimized] = useState(false);
  const [showViewBookingsModal, setShowViewBookingsModal] = useState(false);

  const toggleBookingWidget = () => {
    setIsBookingWidgetMinimized(!isBookingWidgetMinimized);
  };

  const handleViewAllBookings = () => {
    onViewAllBookings();
  };

  // Helper function to get all bookings from the object
  const getAllBookings = (): MentorBooking[] => {
    return Object.values(mentorBookings).flat();
  };

  // Helper function to get upcoming bookings
  const getUpcomingBookings = (): MentorBooking[] => {
    return getAllBookings().filter(booking => 
      new Date(booking.sessionDate) > new Date()
    );
  };

  // Helper function to get completed bookings
  const getCompletedBookings = (): MentorBooking[] => {
    return getAllBookings().filter(booking => 
      new Date(booking.sessionDate) <= new Date()
    );
  };

  return (
    <>
      {/* Dashboard Header */}
      <div className="dashboard-header">
        <div className="dashboard-title">
          <h1>Mentor Dashboard</h1>
          <p>Find mentees who can benefit from your knowledge and experience</p>
        </div>
        
        {/* Mentor-specific info */}
        <div className="generated-profiles-info">
          <p className="info-text">
            💡 <strong>Welcome to your Mentor Dashboard!</strong> Here you can manage your profile, 
            set your availability, and view your upcoming sessions with mentees.
          </p>
          <p className="info-text" style={{ marginTop: '8px', fontSize: '0.9rem', opacity: '0.9' }}>
            📅 <strong>Availability:</strong> Keep your schedule updated to receive more booking requests from mentees.
          </p>
        </div>
      </div>

      {/* User Profile Summary Cards */}
      <div className="profile-summary-cards">
        <div className="profile-card">
          <div className="profile-card-header">
            <div className="profile-info">
              <div className="profile-role mentor">Mentor</div>
              <div className="profile-name">
                {currentUserProfile.firstName} {currentUserProfile.lastName}
              </div>
            </div>
            <div className="profile-card-actions">
              <button 
                className="profile-edit-btn"
                onClick={(e) => onProfileEdit(e)}
                data-tooltip="Edit your profile information"
              >
                Edit Profile
              </button>
              <button 
                className="expand-toggle-btn"
                onClick={() => setIsProfileCardExpanded(!isProfileCardExpanded)}
                title={isProfileCardExpanded ? "Collapse profile details" : "Expand profile details"}
              >
                {isProfileCardExpanded ? '▼' : '▶'}
              </button>
            </div>
          </div>
          
          {/* Expandable Profile Content */}
          {isProfileCardExpanded && (
            <div className="profile-card-content">
              <div className="profile-details">
                <div className="detail-item">
                  <span className="detail-label">Email:</span>
                  <span className="detail-value">{currentUserProfile.email || 'Not provided'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Industry:</span>
                  <span className="detail-value">{currentUserProfile.industry || 'Not specified'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Experience:</span>
                  <span className="detail-value">{currentUserProfile.yearsOfExperience || 'Not specified'} years</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Skills:</span>
                  <span className="detail-value">
                    {currentUserProfile.skills && currentUserProfile.skills.length > 0 
                      ? currentUserProfile.skills.slice(0, 3).join(', ') + (currentUserProfile.skills.length > 3 ? '...' : '')
                      : 'No skills listed'
                    }
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="profile-card">
          <div className="profile-card-header">
            <div className="profile-info">
              <div className="profile-role mentor">Mentor</div>
              <div className="profile-name">Availability Management</div>
            </div>
            <div className="profile-card-actions">
              <button 
                className="availability-manage-btn"
                onClick={onAvailabilityManage}
                data-tooltip="Manage your availability schedule"
              >
                Manage Availability
              </button>
              <button 
                className="expand-toggle-btn"
                onClick={() => setIsAvailabilityCardExpanded(!isAvailabilityCardExpanded)}
                title={isAvailabilityCardExpanded ? "Collapse availability details" : "Expand availability details"}
              >
                {isAvailabilityCardExpanded ? '▼' : '▶'}
              </button>
            </div>
          </div>
          
          {/* Expandable Availability Content */}
          {isAvailabilityCardExpanded && (
            <div className="profile-card-content">
              <div className="availability-summary">
                <div className="availability-stat">
                  <span className="stat-number">
                    {Object.keys(mentorAvailability).length}
                  </span>
                  <span className="stat-label">Available Days</span>
                </div>
                <div className="availability-stat">
                  <span className="stat-number">
                    {Object.values(mentorAvailability).flat().length}
                  </span>
                  <span className="stat-label">Time Slots</span>
                </div>
                <div className="availability-stat">
                  <span className="stat-number">
                    {getUpcomingBookings().length}
                  </span>
                  <span className="stat-label">Upcoming Sessions</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bookings Widget */}
      <div className={`bookings-widget-section ${isBookingWidgetMinimized ? 'minimized' : ''}`}>
        <div 
          className="bookings-widget-header"
          onClick={toggleBookingWidget}
          style={{ cursor: 'pointer' }}
        >
          <div className="bookings-widget-title">
            <h2>Your Bookings</h2>
            <button 
              className="minimize-toggle-btn"
              onClick={(e) => {
                e.stopPropagation();
                toggleBookingWidget();
              }}
              title={isBookingWidgetMinimized ? "Expand widget" : "Minimize widget"}
            >
              {isBookingWidgetMinimized ? '▼' : '▲'}
            </button>
          </div>
          {!isBookingWidgetMinimized && (
            <p>Manage and view all your scheduled sessions</p>
          )}
        </div>
        
        {!isBookingWidgetMinimized && (
          <div className="bookings-widget-content">
            <div className="bookings-summary">
                              <div className="booking-stat">
                  <span className="stat-number">
                    {getAllBookings().length}
                  </span>
                  <span className="stat-label">Total Bookings</span>
                </div>
                <div className="booking-stat">
                  <span className="stat-number">
                    {getUpcomingBookings().length}
                  </span>
                  <span className="stat-label">Upcoming</span>
                </div>
                <div className="booking-stat">
                  <span className="stat-number">
                    {getCompletedBookings().length}
                  </span>
                  <span className="stat-label">Completed</span>
                </div>
            </div>
            
            <div className="bookings-list">
              {getAllBookings().length > 0 ? (
                getAllBookings()
                  .sort((a: MentorBooking, b: MentorBooking) => new Date(a.sessionDate).getTime() - new Date(b.sessionDate).getTime())
                  .slice(0, 5)
                  .map((booking: MentorBooking, index) => (
                    <div key={index} className="booking-item">
                      <div className="booking-info">
                        <div className="booking-header">
                          <h4>{booking.menteeName || 'Mentee'}</h4>
                          <span className={`booking-status ${booking.status || 'pending'}`}>
                            {booking.status || 'Pending'}
                          </span>
                        </div>
                        <div className="booking-details">
                          <span className="booking-date">
                            {new Date(booking.sessionDate).toLocaleDateString()}
                          </span>
                          <span className="booking-time">
                            {booking.startTime || 'Time TBD'}
                          </span>
                        </div>
                      </div>
                      <div className="booking-actions">
                        <button className="booking-action-btn view">View Details</button>
                        {booking.status === 'pending' && (
                          <button className="booking-action-btn accept">Accept</button>
                        )}
                      </div>
                    </div>
                  ))
              ) : (
                <div className="no-bookings">
                  <p>No bookings yet. Your scheduled sessions will appear here.</p>
                </div>
              )}
            </div>
            
            <div className="bookings-widget-footer">
              <button className="view-all-bookings-btn" onClick={handleViewAllBookings}>
                View All Bookings
              </button>
            </div>
          </div>
        )}
      </div>

      {/* View Bookings Modal */}
      {showViewBookingsModal && (
        <ViewBookingsModal
          isOpen={showViewBookingsModal}
          onClose={() => setShowViewBookingsModal(false)}
          bookings={getAllBookings()}
          onAcceptBooking={onAcceptBooking}
          onRejectBooking={onRejectBooking}
          onCancelBooking={onCancelBooking}
        />
      )}
    </>
  );
};
