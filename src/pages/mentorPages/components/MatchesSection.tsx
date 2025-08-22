import React from 'react';
import { FaStar, FaVideo, FaMapMarkerAlt, FaGraduationCap } from 'react-icons/fa';
import { MentorMenteeProfile, MatchResult } from '../types/mentorTypes';
import '../styles/MatchesSection.css';

interface MatchesSectionProps {
  bestMatches: MatchResult[];
  currentUserProfile: MentorMenteeProfile | null;
  onProfileClick: (profile: MentorMenteeProfile) => void;
  onBooking: (profile: MentorMenteeProfile) => void;
  onCalCom: (profile: MentorMenteeProfile) => void;
}

export const MatchesSection: React.FC<MatchesSectionProps> = ({
  bestMatches,
  currentUserProfile,
  onProfileClick,
  onBooking,
  onCalCom
}) => {
  if (!currentUserProfile || bestMatches.length === 0) {
    return null;
  }

  const getMatchScoreColor = (score: number) => {
    if (score >= 90) return 'var(--success)';
    if (score >= 80) return 'var(--warning)';
    if (score >= 70) return 'var(--info)';
    return 'var(--error)';
  };

  const getMatchScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent Match';
    if (score >= 80) return 'Great Match';
    if (score >= 70) return 'Good Match';
    return 'Fair Match';
  };

  return (
    <div className="matches-section">
      <div className="matches-header">
        <div className="matches-header-content">
          <h2>Your Best Matches</h2>
          <p>Based on your profile, here are the mentors/mentees we think would be perfect for you</p>
        </div>
      </div>

      <div className="matches-summary">
        <div className="summary-stats">
          <div className="stat-item">
            <span className="stat-number">{bestMatches.length}</span>
            <span className="stat-label">Total Matches</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">
              {Math.round(bestMatches.reduce((sum, match) => sum + match.score, 0) / bestMatches.length)}
            </span>
            <span className="stat-label">Average Score</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">
              {bestMatches.filter(match => match.score >= 80).length}
            </span>
            <span className="stat-label">High-Quality Matches</span>
          </div>
        </div>
      </div>

      <div className="matches-grid">
        {bestMatches.map((match, index) => (
          <div key={index} className="match-card">
            <div className="match-header">
              <div className="match-avatar">
                <img 
                  src={Array.isArray(match.profile.profilePicture as string[]) 
                    ? match.profile.profilePicture[0] as string || `https://ui-avatars.com/api/?name=${String(match.profile.name || 'User')}&background=random`
                    : match.profile.profilePicture as string || `https://ui-avatars.com/api/?name=${String(match.profile.name || 'User')}&background=random`
                  }
                  alt={String(match.profile.name as string || 'User')}
                />
              </div>
              <div className="match-info">
                <h3>{String(match.profile.name as string || 'User')}</h3>
                <p>{String(match.profile.profession as string || 'Professional')}</p>
              </div>
              <div className="match-score" style={{ color: getMatchScoreColor(match.score) }}>
                <FaStar />
                <span>{match.score}%</span>
                <span className="score-label">{getMatchScoreLabel(match.score)}</span>
              </div>
            </div>

            <div className="match-reasons">
              <h4>Why this is a great match:</h4>
              <ul>
                {match.reasons.slice(0, 3).map((reason, reasonIndex) => (
                  <li key={reasonIndex}>{reason}</li>
                ))}
                {match.reasons.length > 3 && (
                  <li className="more-reasons">+{match.reasons.length - 3} more reasons</li>
                )}
              </ul>
            </div>

            <div className="match-details">
              <div className="detail-item">
                <FaGraduationCap />
                <span>{String(match.profile.educationLevel as string[] || 'Not specified')}</span>
              </div>
              <div className="detail-item">
                <FaMapMarkerAlt />
                <span>{String(match.profile.county as string[] || 'Location not specified')}</span>
              </div>
              {match.profile.calCom as string[] && (
                <div className="detail-item">
                  <FaVideo />
                  <span>Video calls available</span>
                </div>
              )}
            </div>

            <div className="match-actions">
              <button 
                className="action-button primary"
                onClick={() => onProfileClick(match.profile as MentorMenteeProfile)}
              >
                View Full Profile
              </button>
              <button 
                className="action-button secondary"
                onClick={() => onBooking(match.profile as MentorMenteeProfile)}
              >
                Book Session
              </button>
              {match.profile.calCom as string[] && (
                <button 
                  className="action-button tertiary"
                  onClick={() => onCalCom(match.profile as MentorMenteeProfile)}
                >
                  Schedule Call
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
