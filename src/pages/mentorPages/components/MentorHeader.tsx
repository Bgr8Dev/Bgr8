import React from 'react';
import { FaSearch, FaEdit, FaUserFriends, FaCog } from 'react-icons/fa';
import { MentorMenteeProfile, MENTOR } from '../types/mentorTypes';
import '../styles/MentorHeader.css';

interface MentorHeaderProps {
  currentUserProfile: MentorMenteeProfile | null;
  searchTerm: string;
  showSearchDropdown: boolean;
  searchSuggestions: string[];
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSuggestionClick: (suggestion: string) => void;
  onProfileEdit: () => void;
  onFindMatches: () => void;
  onAvailabilityManage: () => void;
}

export const MentorHeader: React.FC<MentorHeaderProps> = ({
  currentUserProfile,
  searchTerm,
  showSearchDropdown,
  searchSuggestions,
  onSearchChange,
  onSuggestionClick,
  onProfileEdit,
  onFindMatches,
  onAvailabilityManage
}) => {
  return (
    <div className="mheader-mentor-header">
      <div className="mheader-mentor-header-content">
        <h1>Find mentors who can guide your journey</h1>
        <p>Connect with experienced professionals who share your interests and goals</p>
        
        {/* User Profile Summary */}
        {currentUserProfile && (
          <div className="mheader-user-profile-summary">
            <div className="mheader-profile-info">
              <span className={`mheader-profile-role ${currentUserProfile.type === MENTOR ? 'mheader-mentor' : 'mheader-mentee'}`}>
                {currentUserProfile.type === MENTOR ? 'Mentor' : 'Mentee'}
              </span>
              <span className="mheader-profile-name">{currentUserProfile.name}</span>
            </div>
            <div className="mheader-profile-actions">
              <button onClick={onProfileEdit} className="mheader-profile-edit-btn" title="Edit your profile information" data-tooltip="Edit your profile information">
                <FaEdit /> Edit Profile
              </button>
              <button onClick={onFindMatches} className="mheader-find-matches-btn" title="Find mentors/mentees that match your profile" data-tooltip="Find mentors/mentees that match your profile">
                <FaUserFriends /> Find Matches
              </button>
              {currentUserProfile.type === MENTOR && (
                <button onClick={onAvailabilityManage} className="mheader-availability-manage-btn" title="Manage your availability schedule for mentee bookings" data-tooltip="Manage your availability schedule for mentee bookings">
                  <FaCog /> Manage Availability
                </button>
              )}
            </div>
          </div>
        )}
        
        {/* Search Bar */}
        <div className="mheader-search-container">
          <div className="mheader-search-bar">
            <FaSearch className="mheader-search-icon" />
            <input
              type="text"
              placeholder="What are you looking to learn?"
              value={searchTerm}
              onChange={onSearchChange}
              onFocus={() => onSearchChange({ target: { value: searchTerm } } as React.ChangeEvent<HTMLInputElement>)}
            />
            {showSearchDropdown && (
              <div className="mheader-search-suggestions-dropdown">
                {searchSuggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="mheader-suggestion-item"
                    onClick={() => onSuggestionClick(suggestion)}
                  >
                    {suggestion}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
