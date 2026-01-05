import React, { useState, useEffect } from 'react';
import { FaVideo, FaMapMarkerAlt, FaGraduationCap, FaHeart, FaCheck, FaComments } from 'react-icons/fa';
import { ProfilePicture } from '../../../components/ui/ProfilePicture';
import { MentorMenteeProfile, MatchResult } from '../types/mentorTypes';
import BannerWrapper from '../../../components/ui/BannerWrapper';
import { useAuth } from '../../../hooks/useAuth';
import { MatchesService } from '../../../services/matchesService';
import '../styles/MatchesSection.css';

interface MatchesSectionProps {
  bestMatches: MatchResult[];
  currentUserProfile: MentorMenteeProfile | null;
  onProfileClick: (profile: MentorMenteeProfile) => void;
  onCalCom: (profile: MentorMenteeProfile) => void;
}

export const MatchesSection: React.FC<MatchesSectionProps> = ({
  bestMatches,
  currentUserProfile,
  onProfileClick,
  onCalCom
}) => {
  const { currentUser } = useAuth();
  const [matchedUserIds, setMatchedUserIds] = useState<Set<string>>(new Set());
  const [matchingUserIds, setMatchingUserIds] = useState<Set<string>>(new Set());

  // Check match status for all matches
  useEffect(() => {
    const checkMatches = async () => {
      if (!currentUser) return;
      
      const matched = new Set<string>();
      for (const match of bestMatches) {
        if (match.user.uid) {
          try {
            const isMatched = await MatchesService.areMatched(currentUser.uid, match.user.uid);
            if (isMatched) {
              matched.add(match.user.uid);
            }
          } catch (error) {
            console.error('Error checking match status:', error);
          }
        }
      }
      setMatchedUserIds(matched);
    };

    checkMatches();
  }, [currentUser, bestMatches]);

  const handleMatch = async (profile: MentorMenteeProfile) => {
    if (!currentUser || !profile.uid || matchingUserIds.has(profile.uid) || matchedUserIds.has(profile.uid)) return;

    setMatchingUserIds(prev => new Set(prev).add(profile.uid));
    try {
      await MatchesService.createMatch(currentUser.uid, profile.uid);
      setMatchedUserIds(prev => new Set(prev).add(profile.uid));
    } catch (error) {
      console.error('Error creating match:', error);
      alert('Failed to create match. Please try again.');
    } finally {
      setMatchingUserIds(prev => {
        const next = new Set(prev);
        next.delete(profile.uid);
        return next;
      });
    }
  };

  const handleMessage = (profile: MentorMenteeProfile) => {
    if (!profile.uid) return;
    
    // Open messaging widget with this user
    const event = new CustomEvent('openMessaging', {
      detail: { userId: profile.uid }
    });
    window.dispatchEvent(event);
  };

  if (!currentUserProfile || bestMatches.length === 0) {
    return null;
  }

  const getMatchScoreColor = (percentage: number) => {
    if (percentage >= 90) return 'var(--success)';
    if (percentage >= 80) return 'var(--warning)';
    if (percentage >= 70) return 'var(--info)';
    return 'var(--error)';
  };

  const getMatchScoreLabel = (percentage: number) => {
    if (percentage >= 90) return 'Excellent Match';
    if (percentage >= 80) return 'Great Match';
    if (percentage >= 70) return 'Good Match';
    return 'Fair Match';
  };

  return (
    <BannerWrapper sectionId="mentee-list" bannerType="element">
      <div className="ms-matches-section">
      <div className="ms-matches-header">
        <div className="ms-matches-header-content">
          <h2>Your Best Matches</h2>
          <p>
            {currentUserProfile?.type === 'mentee'
              ? 'Based on your profile, here are the mentors we think would be perfect for you'
              : 'Based on your profile, here are the mentees we think would be perfect for you'
            }
          </p>
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
              {Math.round(bestMatches.reduce((sum, match) => sum + match.percentage, 0) / bestMatches.length)}
            </span>
            <span className="ms-stat-label">Average Match %</span>
          </div>
          <div className="ms-stat-item">
            <span className="ms-stat-number">
              {bestMatches.filter(match => match.percentage >= 80).length}
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
                <ProfilePicture
                  src={typeof match.user.profilePicture === 'string' || Array.isArray(match.user.profilePicture) ? match.user.profilePicture : null}
                  alt={match.user.firstName || 'User'}
                  role={
                    match.user.isMentor === true
                      ? 'mentor'
                      : match.user.isMentee === true
                      ? 'mentee'
                      : typeof match.user.type === 'string' && match.user.type.toLowerCase() === 'mentor'
                      ? 'mentor'
                      : typeof match.user.type === 'string' && match.user.type.toLowerCase() === 'mentee'
                      ? 'mentee'
                      : null
                  }
                  size={80}
                />
              </div>
              <div className="ms-match-info">
                <h3>{match.user.firstName} {match.user.lastName}</h3>
                <p>{match.user.profession || match.user.educationLevel || 'Professional'}</p>
                {match.user.isGenerated && (
                  <span className="ms-generated-indicator" title="Generated Profile">
                    🎲 Generated
                  </span>
                )}
              </div>
              <div className="ms-match-score" style={{ color: getMatchScoreColor(match.percentage) }}>
                <div className="ms-match-percentage-display">
                  <div className="ms-percentage-circle" style={{ 
                    background: `conic-gradient(${getMatchScoreColor(match.percentage)} ${match.percentage * 3.6}deg, #e5e7eb ${match.percentage * 3.6}deg)` 
                  }}>
                    <span className="ms-percentage-text">{match.percentage}%</span>
                  </div>
                </div>
                <span className="ms-score-label">{getMatchScoreLabel(match.percentage)}</span>
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
                <span>{match.user.educationLevel || 'Not specified'}</span>
              </div>
              <div className="ms-detail-item">
                <FaMapMarkerAlt />
                <span>{match.user.county || 'Location not specified'}</span>
              </div>
              {match.user.calCom && (
                <div className="ms-detail-item">
                  <FaVideo />
                  <span>Video calls available</span>
                </div>
              )}
            </div>

            <div className="ms-match-actions">
              {!matchedUserIds.has(match.user.uid || '') && currentUserProfile?.type === 'mentee' && (
                <button 
                  className="ms-action-button match-button"
                  onClick={() => handleMatch(match.user)}
                  disabled={matchingUserIds.has(match.user.uid || '')}
                  title="Match with this mentor to start messaging"
                >
                  <FaHeart />
                  {matchingUserIds.has(match.user.uid || '') ? 'Matching...' : 'Match'}
                </button>
              )}
              
              {matchedUserIds.has(match.user.uid || '') && (
                <button 
                  className="ms-action-button matched-button"
                  disabled
                  title="You are matched with this user"
                >
                  <FaCheck />
                  Matched
                </button>
              )}

              <button 
                className="ms-action-button primary"
                onClick={() => onProfileClick(match.user)}
                title="View full profile details"
              >
                View Full Profile
              </button>
              {matchedUserIds.has(match.user.uid || '') && (
                <button 
                  className="ms-action-button secondary"
                  onClick={() => handleMessage(match.user)}
                  title={
                    currentUserProfile?.type === 'mentee' 
                      ? 'Message this mentor' 
                      : 'Message this mentee'
                  }
                >
                  <FaComments />
                  {currentUserProfile?.type === 'mentee' ? 'Message Mentor' : 'Message Mentee'}
                </button>
              )}
              {match.user.calCom && (
                <button 
                  className="ms-action-button tertiary"
                  onClick={() => onCalCom(match.user)}
                  title={
                    currentUserProfile?.type === 'mentee'
                      ? 'Schedule a video call'
                      : 'Schedule a video call with this mentee'
                  }
                >
                  {currentUserProfile?.type === 'mentee' ? 'Schedule Call' : 'Video Call'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      </div>
    </BannerWrapper>
  );
};
