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
    <div className="ms-matches-section">
      <div className="ms-matches-header">
        <div className="ms-matches-header-content">
          <h2>Your Best Matches</h2>
          <p>Based on your profile, here are the mentors/mentees we think would be perfect for you</p>
        </div>
      </div>

      <div className="ms-matches-summary">
        <div className="ms-summary-stats">
          <div className="ms-stat-item">
            <span className="ms-stat-number">{bestMatches.length}</span>
            <span className="ms-stat-label">Total Matches</span>
          </div>
          <div className="ms-stat-item">
            <span className="ms-stat-number">
              {Math.round(bestMatches.reduce((sum, match) => sum + match.score, 0) / bestMatches.length)}
            </span>
            <span className="ms-stat-label">Average Score</span>
          </div>
          <div className="ms-stat-item">
            <span className="ms-stat-number">
              {bestMatches.filter(match => match.score >= 80).length}
            </span>
            <span className="ms-stat-label">High-Quality Matches</span>
          </div>
        </div>
      </div>

      <div className="ms-matches-grid">
        {bestMatches.map((match, index) => (
          <div key={index} className="ms-match-card">
            <div className="ms-match-header">
              <div className="ms-match-avatar">
                <img 
                  src={Array.isArray(match.profile.profilePicture as string[]) 
                    ? match.profile.profilePicture[0] as string || `https://ui-avatars.com/api/?name=${String(match.profile.name || 'User')}&background=random`
                    : match.profile.profilePicture as string || `https://ui-avatars.com/api/?name=${String(match.profile.name || 'User')}&background=random`
                  }
                  alt={String(match.profile.name as string || 'User')}
                />
              </div>
              <div className="ms-match-info">
                <h3>{String(match.profile.name as string || 'User')}</h3>
                <p>{String(match.profile.profession as string || 'Professional')}</p>
              </div>
              <div className="ms-match-score" style={{ color: getMatchScoreColor(match.score) }}>
                <FaStar />
                <span>{match.score}%</span>
                <span className="ms-score-label">{getMatchScoreLabel(match.score)}</span>
              </div>
            </div>

            <div className="ms-match-reasons">
              <h4>Why this is a great match:</h4>
              <ul>
                {match.reasons.slice(0, 3).map((reason, reasonIndex) => (
                  <li key={reasonIndex}>{reason}</li>
                ))}
                {match.reasons.length > 3 && (
                  <li className="ms-more-reasons">+{match.reasons.length - 3} more reasons</li>
                )}
              </ul>
            </div>

            <div className="ms-match-details">
              <div className="ms-detail-item">
                <FaGraduationCap />
                <span>{String(match.profile.educationLevel as string[] || 'Not specified')}</span>
              </div>
              <div className="ms-detail-item">
                <FaMapMarkerAlt />
                <span>{String(match.profile.county as string[] || 'Location not specified')}</span>
              </div>
              {match.profile.calCom as string[] && (
                <div className="ms-detail-item">
                  <FaVideo />
                  <span>Video calls available</span>
                </div>
              )}
            </div>

            <div className="ms-match-actions">
              <button 
                className="ms-action-button primary"
                onClick={() => onProfileClick(match.profile as MentorMenteeProfile)}
              >
                View Full Profile
              </button>
              <button 
                className="ms-action-button secondary"
                onClick={() => onBooking(match.profile as MentorMenteeProfile)}
              >
                Book Session
              </button>
              {match.profile.calCom as string[] && (
                <button 
                  className="ms-action-button tertiary"
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
