import React, { useState, useEffect } from 'react';
import { FaStar, FaVideo, FaCheckCircle, FaGraduationCap, FaIndustry, FaClock, FaHeart, FaCheck, FaComments } from 'react-icons/fa';
import { MentorMenteeProfile, MentorAvailability } from '../types/mentorTypes';
import MatchStrengthDisplay from '../../../components/widgets/MentorAlgorithm/MatchStrengthDisplay';
import BannerWrapper from '../../../components/ui/BannerWrapper';
import { ProfilePicture } from '../../../components/ui/ProfilePicture';
import { useAuth } from '../../../hooks/useAuth';
import { MatchesService } from '../../../services/matchesService';
import '../styles/MentorCard.css';

interface MentorCardProps {
  mentor: MentorMenteeProfile;
  mentorAvailability: MentorAvailability;
  currentUserRole?: 'mentor' | 'mentee';
  onProfileClick: (mentor: MentorMenteeProfile) => void;
  onCalCom: (mentor: MentorMenteeProfile) => void;
  matchScore?: number;
}

export const MentorCard: React.FC<MentorCardProps> = ({
  mentor,
  mentorAvailability,
  currentUserRole,
  onProfileClick,
  onCalCom,
  matchScore
}) => {
  const { currentUser } = useAuth();
  const [isMatched, setIsMatched] = useState(false);
  const [isMatching, setIsMatching] = useState(false);

  // Check if already matched
  useEffect(() => {
    const checkMatch = async () => {
      if (!currentUser || !mentor.uid) return;
      try {
        const matched = await MatchesService.areMatched(currentUser.uid, mentor.uid);
        setIsMatched(matched);
      } catch (error) {
        console.error('Error checking match status:', error);
      }
    };
    checkMatch();
  }, [currentUser, mentor.uid]);

  // Handle match button click
  const handleMatchClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser || !mentor.uid || isMatching || isMatched) return;

    setIsMatching(true);
    try {
      await MatchesService.createMatch(currentUser.uid, mentor.uid);
      setIsMatched(true);
    } catch (error) {
      console.error('Error creating match:', error);
      alert('Failed to create match. Please try again.');
    } finally {
      setIsMatching(false);
    }
  };
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
    return currentUserRole === 'mentee' ? 'Mentor' : 'Mentee';
  };

  // Handle card click to show profile modal
  const handleCardClick = () => {
    onProfileClick(mentor);
  };

  // Handle Cal.com button click
  const handleCalComClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCalCom(mentor);
  };

  // Handle message button click
  const handleMessageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isMatched || !mentor.uid) return;
    
    // Open messaging widget with this user
    const event = new CustomEvent('openMessaging', {
      detail: { userId: mentor.uid }
    });
    window.dispatchEvent(event);
  };


  // Determine role from mentor profile
  const getRole = (): 'mentor' | 'mentee' | null => {
    if (mentor.isMentor === true) {
      return 'mentor';
    }
    if (mentor.isMentee === true) {
      return 'mentee';
    }
    if (typeof mentor.type === 'string' && mentor.type.toLowerCase() === 'mentor') {
      return 'mentor';
    }
    if (typeof mentor.type === 'string' && mentor.type.toLowerCase() === 'mentee') {
      return 'mentee';
    }
    return null;
  };

  return (
    <BannerWrapper sectionId="feedback-forms" bannerType="element">
      <div 
        className="mc-mentor-card"
        onClick={handleCardClick}
      >
      <div className="mc-mentor-card-header">
        <div className="mc-mentor-avatar">
          <ProfilePicture
            src={typeof mentor.profilePicture === 'string' || Array.isArray(mentor.profilePicture) ? mentor.profilePicture : null}
            alt={getDisplayName()}
            role={getRole()}
            size={80}
            className="mc-mentor-avatar-img"
          />
        </div>
        
        <div className="mc-mentor-info">
          <h3 className="mc-mentor-name">{getDisplayName()}</h3>
          <p className="mc-mentor-title">
            {mentor.profession || mentor.educationLevel || (currentUserRole === 'mentee' ? 'Professional' : 'Student')}
          </p>
          <div className="mc-mentor-rating">
            <FaStar className="mc-star-icon" />
            <span>4.8</span>
            <span className="mc-review-count">(24 reviews)</span>
          </div>
        </div>

        <div className="mc-mentor-badges">
          {/* Match Strength Display */}
          {matchScore !== undefined && (
            <div className="mc-match-strength-badge">
              <MatchStrengthDisplay 
                score={matchScore} 
                size={45} 
                showLabel={false}
                className="mc-match-strength"
              />
            </div>
          )}
          
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
          {mentor.isGenerated && (
            <div className="mc-badge mc-generated-badge" title="Generated Profile">
              🎲 Generated
            </div>
          )}
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
        <h4>{currentUserRole === 'mentee' ? 'Expertise' : 'Interests & Goals'}</h4>
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
            <span className="mc-skill-tag">
              {currentUserRole === 'mentee' ? 'General expertise' : 'Various interests'}
            </span>
          )}
        </div>
      </div>

      <div className="mc-mentor-availability">
        <div className="mc-availability-status">
          <FaClock className="mc-clock-icon" />
          <span className={mentorAvailability[mentor.uid]?.available ? 'available' : 'unavailable'}>
            {mentorAvailability[mentor.uid]?.available 
              ? (currentUserRole === 'mentee' ? 'Available now' : 'Available for connection')
              : (currentUserRole === 'mentee' ? 'No availability' : 'Not available')
            }
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
        {!isMatched && currentUserRole === 'mentee' && (
          <button 
            className="mc-action-button match-button"
            onClick={handleMatchClick}
            disabled={isMatching}
            title="Match with this mentor to start messaging"
            data-tooltip="Match with this mentor to start messaging"
          >
            <FaHeart />
            {isMatching ? 'Matching...' : 'Match'}
          </button>
        )}
        
        {isMatched && (
          <button 
            className="mc-action-button matched-button"
            disabled
            title="You are matched with this user"
            data-tooltip="You are matched with this user"
          >
            <FaCheck />
            Matched
          </button>
        )}

        {isMatched && (
          <button 
            className="mc-action-button primary"
            onClick={handleMessageClick}
            title={
              currentUserRole === 'mentee' 
                ? "Message this mentor"
                : "Message this mentee"
            }
            data-tooltip={
              currentUserRole === 'mentee' 
                ? "Message this mentor"
                : "Message this mentee"
            }
          >
            <FaComments />
            {currentUserRole === 'mentee' ? 'Message Mentor' : 'Message Mentee'}
          </button>
        )}
        
        {mentor.calCom && (
          <button 
            className="mc-action-button secondary"
            onClick={handleCalComClick}
            title={
              currentUserRole === 'mentee'
                ? "Schedule a video call using Cal.com integration"
                : "Schedule a video call with this mentee"
            }
            data-tooltip={
              currentUserRole === 'mentee'
                ? "Schedule a video call using Cal.com integration"
                : "Schedule a video call with this mentee"
            }
          >
            <FaVideo />
            {currentUserRole === 'mentee' ? 'Schedule Call' : 'Video Call'}
          </button>
        )}
      </div>
      </div>
    </BannerWrapper>
  );
};
