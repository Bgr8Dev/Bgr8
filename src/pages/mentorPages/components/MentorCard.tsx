import React from 'react';
import { FaStar, FaVideo, FaCheckCircle, FaGraduationCap, FaIndustry, FaClock, FaCalendarAlt } from 'react-icons/fa';
import { MentorMenteeProfile, MentorAvailability } from '../types/mentorTypes';
import '../styles/MentorCard.css';

interface MentorCardProps {
  mentor: MentorMenteeProfile;
  mentorAvailability: MentorAvailability;
  onProfileClick: (mentor: MentorMenteeProfile) => void;
  onBooking: (mentor: MentorMenteeProfile) => void;
  onCalCom: (mentor: MentorMenteeProfile) => void;
}

export const MentorCard: React.FC<MentorCardProps> = ({
  mentor,
  mentorAvailability,
  onProfileClick,
  onBooking,
  onCalCom
}) => {
  // Helper function to get the best available name
  const getDisplayName = () => {
    // First try to construct from firstName + lastName
    if (mentor.firstName && mentor.lastName) {
      return `${mentor.firstName} ${mentor.lastName}`;
    }
    // Fall back to just firstName
    if (mentor.firstName) {
      return mentor.firstName;
    }
    // Fall back to just lastName
    if (mentor.lastName) {
      return mentor.lastName;
    }
    // Fall back to email (without domain)
    if (mentor.email) {
      return mentor.email.split('@')[0];
    }
    // Final fallback
    return 'Mentor';
  };



  const getProfileImageSrc = () => {
    if (Array.isArray(mentor.profilePicture)) {
      return mentor.profilePicture[0] || `https://ui-avatars.com/api/?name=${getDisplayName()}&background=random`;
    }
    if (typeof mentor.profilePicture === 'string') {
      return mentor.profilePicture;
    }
    return `https://ui-avatars.com/api/?name=${getDisplayName()}&background=random`;
  };

  return (
    <div 
      className="mc-mentor-card"
      onClick={() => onProfileClick(mentor)}
    >
      <div className="mc-mentor-card-header">
        <div className="mc-mentor-avatar">
          <img 
            src={getProfileImageSrc()}
            alt={getDisplayName()}
          />
        </div>
        
        <div className="mc-mentor-info">
          <h3 className="mc-mentor-name">{getDisplayName()}</h3>
          <p className="mc-mentor-title">{mentor.profession || mentor.educationLevel || 'Professional'}</p>
          <div className="mc-mentor-rating">
            <FaStar className="mc-star-icon" />
            <span>4.8</span>
            <span className="mc-review-count">(24 reviews)</span>
          </div>
        </div>

        <div className="mc-mentor-badges">
          {mentor.calCom && (
            <div className="mc-badge mc-video-badge">
              <FaVideo />
              Video calls
            </div>
          )}
          <div className="mc-badge mc-verified-badge">
            <FaCheckCircle />
            Verified
          </div>
        </div>
      </div>

      <div className="mc-mentor-details">
        <div className="mc-detail-item">
          <FaGraduationCap />
          <span>{mentor.educationLevel || 'Not specified'}</span>
        </div>
        <div className="mc-detail-item">
          <FaIndustry />
          <span>
            {Array.isArray(mentor.industries) && mentor.industries.length > 0 
              ? mentor.industries.join(', ') 
              : mentor.profession || 'Various industries'
            }
          </span>
        </div>
        <div className="mc-detail-item">
          <span>{mentor.county || 'Location not specified'}</span>
        </div>
      </div>

      <div className="mc-mentor-skills">
        <h4>Expertise</h4>
        <div className="mc-skills-tags">
          {Array.isArray(mentor.skills) && mentor.skills.length > 0 ? (
            <>
              {mentor.skills.slice(0, 3).map((skill, index) => (
                <span key={index} className="mc-skill-tag">{skill}</span>
              ))}
              {mentor.skills.length > 3 && (
                <span className="mc-skill-tag more">+{mentor.skills.length - 3} more</span>
              )}
            </>
          ) : (
            <span className="mc-skill-tag">General expertise</span>
          )}
        </div>
      </div>

      <div className="mc-mentor-availability">
        <div className="mc-availability-status">
          <FaClock className="mc-clock-icon" />
          <span className={mentorAvailability[mentor.uid]?.available ? 'available' : 'unavailable'}>
            {mentorAvailability[mentor.uid]?.available ? 'Available now' : 'No availability'}
          </span>
        </div>
        
        {mentorAvailability[mentor.uid]?.available && mentorAvailability[mentor.uid]?.nextSlot && (
          <div className="mc-next-slot">
            Next: {mentorAvailability[mentor.uid]?.nextSlot}
          </div>
        )}

        {/* Cal.com Integration Indicator */}
        {mentor.calCom && (
          <div className="mc-calcom-indicator">
            <FaVideo className="mc-video-icon" />
            <span>Cal.com Connected</span>
          </div>
        )}
      </div>

      <div className="mc-mentor-actions" onClick={(e) => e.stopPropagation()}>
        <button 
          className="mc-action-button primary"
          onClick={() => onBooking(mentor)}
          title="Book a mentoring session with this mentor"
          data-tooltip="Book a mentoring session with this mentor"
        >
          <FaCalendarAlt />
          Book Session
        </button>
        
        {mentor.calCom && (
          <button 
            className="mc-action-button secondary"
            onClick={() => onCalCom(mentor)}
            title="Schedule a video call using Cal.com integration"
            data-tooltip="Schedule a video call using Cal.com integration"
          >
            <FaVideo />
            Schedule Call
          </button>
        )}
      </div>
    </div>
  );
};
