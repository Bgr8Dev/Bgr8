import React, { useState, useEffect } from 'react';
import { FaComments, FaUser, FaCalendarAlt, FaVideo, FaHeart } from 'react-icons/fa';
import { useAuth } from '../../../hooks/useAuth';
import { MatchesService, Match } from '../../../services/matchesService';
import { ProfilePicture } from '../../../components/ui/ProfilePicture';
import BannerWrapper from '../../../components/ui/BannerWrapper';
import './MatchesView.css';

interface MatchesViewProps {
  onProfileClick?: (userId: string) => void;
  onBooking?: (userId: string) => void;
  onCalCom?: (userId: string) => void;
}

export const MatchesView: React.FC<MatchesViewProps> = ({
  onProfileClick,
  onBooking,
  onCalCom
}) => {
  const { currentUser } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadMatches = async () => {
      if (!currentUser) return;

      try {
        setLoading(true);
        const userMatches = await MatchesService.getMatches(currentUser.uid);
        setMatches(userMatches);
      } catch (err) {
        console.error('Error loading matches:', err);
        setError('Failed to load matches. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadMatches();
  }, [currentUser]);

  const handleMessage = async (matchedUserId: string) => {
    // Open messaging widget with this user
    // The messaging widget should handle opening the conversation
    const event = new CustomEvent('openMessaging', {
      detail: { userId: matchedUserId }
    });
    window.dispatchEvent(event);
  };

  if (!currentUser) {
    return (
      <BannerWrapper sectionId="matches-view" bannerType="element">
        <div className="matches-view-container">
          <p>Please log in to view your matches.</p>
        </div>
      </BannerWrapper>
    );
  }

  if (loading) {
    return (
      <BannerWrapper sectionId="matches-view" bannerType="element">
        <div className="matches-view-container">
          <div className="matches-loading">Loading matches...</div>
        </div>
      </BannerWrapper>
    );
  }

  if (error) {
    return (
      <BannerWrapper sectionId="matches-view" bannerType="element">
        <div className="matches-view-container">
          <div className="matches-error">{error}</div>
        </div>
      </BannerWrapper>
    );
  }

  if (matches.length === 0) {
    return (
      <BannerWrapper sectionId="matches-view" bannerType="element">
        <div className="matches-view-container">
          <div className="matches-empty">
            <FaHeart className="empty-icon" />
            <h2>No matches yet</h2>
            <p>Start matching with mentors or mentees to see them here!</p>
          </div>
        </div>
      </BannerWrapper>
    );
  }

  return (
    <BannerWrapper sectionId="matches-view" bannerType="element">
      <div className="matches-view-container">
        <div className="matches-header">
          <h2>Your Matches</h2>
          <p>Connect and message with your matched mentors and mentees</p>
        </div>

        <div className="matches-grid">
          {matches.map((match) => (
            <div key={match.id} className="match-card">
              <div className="match-card-header">
                <div className="match-avatar">
                  <ProfilePicture
                    src={
                      match.matchedUserProfile?.profilePicture
                        ? (typeof match.matchedUserProfile.profilePicture === 'string'
                            ? match.matchedUserProfile.profilePicture
                            : Array.isArray(match.matchedUserProfile.profilePicture)
                            ? match.matchedUserProfile.profilePicture[0]
                            : null)
                        : null
                    }
                    alt={match.matchedUserName}
                    role={
                      match.matchedUserProfile?.isMentor === true
                        ? 'mentor'
                        : match.matchedUserProfile?.isMentee === true
                        ? 'mentee'
                        : null
                    }
                    size={80}
                  />
                </div>
                <div className="match-info">
                  <h3>{match.matchedUserName}</h3>
                  <p>
                    {match.matchedUserProfile?.profession ||
                      match.matchedUserProfile?.educationLevel ||
                      'Professional'}
                  </p>
                  {match.matchedUserProfile?.county && (
                    <p className="match-location">{match.matchedUserProfile.county}</p>
                  )}
                </div>
                {match.unreadCount && match.unreadCount > 0 && (
                  <div className="match-unread-badge">{match.unreadCount}</div>
                )}
              </div>

              <div className="match-actions">
                <button
                  className="match-action-button message-button"
                  onClick={() => handleMessage(match.matchedUserId)}
                  title="Send a message"
                >
                  <FaComments />
                  Message
                </button>
                {onProfileClick && (
                  <button
                    className="match-action-button profile-button"
                    onClick={() => onProfileClick(match.matchedUserId)}
                    title="View profile"
                  >
                    <FaUser />
                    Profile
                  </button>
                )}
                {onBooking && (
                  <button
                    className="match-action-button booking-button"
                    onClick={() => onBooking(match.matchedUserId)}
                    title="Book a session"
                  >
                    <FaCalendarAlt />
                    Book
                  </button>
                )}
                {onCalCom && match.matchedUserProfile?.calCom && (
                  <button
                    className="match-action-button calcom-button"
                    onClick={() => onCalCom(match.matchedUserId)}
                    title="Schedule video call"
                  >
                    <FaVideo />
                    Call
                  </button>
                )}
              </div>

              {match.lastMessageAt && (
                <div className="match-last-message">
                  Last message: {new Date(match.lastMessageAt as Date).toLocaleDateString()}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </BannerWrapper>
  );
};

