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
  const getProfileImageSrc = () => {
    if (Array.isArray(mentor.profilePicture)) {
      return mentor.profilePicture[0] || `https://ui-avatars.com/api/?name=${String(mentor.name || 'Mentor')}&background=random`;
    }
    return mentor.profilePicture || `https://ui-avatars.com/api/?name=${String(mentor.name || 'Mentor')}&background=random`;
  };

  return (
    <div 
      className="mentor-card"
      onClick={() => onProfileClick(mentor)}
    >
      <div className="mentor-card-header">
        <div className="mentor-avatar">
          <img 
            src={getProfileImageSrc()}
            alt={String(mentor.name || 'Mentor')}
          />
        </div>
        
        <div className="mentor-info">
          <h3 className="mentor-name">{String(mentor.name || 'Mentor')}</h3>
          <p className="mentor-title">{String(mentor.profession || 'Professional')}</p>
          <div className="mentor-rating">
            <FaStar className="star-icon" />
            <span>4.8</span>
            <span className="review-count">(24 reviews)</span>
          </div>
        </div>

        <div className="mentor-badges">
          {mentor.calCom && (
            <div className="badge video-badge">
              <FaVideo />
              Video calls
            </div>
          )}
          <div className="badge verified-badge">
            <FaCheckCircle />
            Verified
          </div>
        </div>
      </div>

      <div className="mentor-details">
        <div className="detail-item">
          <FaGraduationCap />
          <span>{String(mentor.educationLevel || 'Not specified')}</span>
        </div>
        <div className="detail-item">
          <FaIndustry />
          <span>{Array.isArray(mentor.industries) ? mentor.industries.join(', ') : 'Various industries'}</span>
        </div>
        <div className="detail-item">
          <span>{String(mentor.county || 'Location not specified')}</span>
        </div>
      </div>

      <div className="mentor-skills">
        <h4>Expertise</h4>
        <div className="skills-tags">
          {Array.isArray(mentor.skills) && mentor.skills.slice(0, 3).map((skill, index) => (
            <span key={index} className="skill-tag">{skill}</span>
          ))}
          {Array.isArray(mentor.skills) && mentor.skills.length > 3 && (
            <span className="skill-tag more">+{mentor.skills.length - 3} more</span>
          )}
        </div>
      </div>

      <div className="mentor-availability">
        <div className="availability-status">
          <FaClock className="clock-icon" />
          <span className={mentorAvailability[mentor.uid]?.available ? 'available' : 'unavailable'}>
            {mentorAvailability[mentor.uid]?.available ? 'Available now' : 'No availability'}
          </span>
        </div>
        
        {mentorAvailability[mentor.uid]?.available && mentorAvailability[mentor.uid]?.nextSlot && (
          <div className="next-slot">
            Next: {mentorAvailability[mentor.uid]?.nextSlot}
          </div>
        )}

        {/* Cal.com Integration Indicator */}
        {mentor.calCom && (
          <div className="calcom-indicator">
            <FaVideo className="video-icon" />
            <span>Cal.com Connected</span>
          </div>
        )}
      </div>

      <div className="mentor-actions" onClick={(e) => e.stopPropagation()}>
        <button 
          className="action-button primary"
          onClick={() => onBooking(mentor)}
          title="Book a mentoring session with this mentor"
          data-tooltip="Book a mentoring session with this mentor"
        >
          <FaCalendarAlt />
          Book Session
        </button>
        
        {mentor.calCom && (
          <button 
            className="action-button secondary"
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
