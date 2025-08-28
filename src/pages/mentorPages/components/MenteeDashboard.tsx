import React, { useState } from 'react';
import { MentorMenteeProfile } from '../types';

interface MenteeDashboardProps {
  currentUserProfile: MentorMenteeProfile;
  onProfileEdit: () => void;
}

export const MenteeDashboard: React.FC<MenteeDashboardProps> = ({
  currentUserProfile,
  onProfileEdit
}) => {
  const [isProfileCardExpanded, setIsProfileCardExpanded] = useState(false);

  return (
    <>
      {/* Dashboard Header */}
      <div className="dashboard-header">
        <div className="dashboard-title">
          <h1>Mentee Dashboard</h1>
          <p>Connect with experienced professionals who can guide you on your journey to success</p>
        </div>
        
        {/* Generated Profiles Info */}
        <div className="generated-profiles-info">
          <p className="info-text">
            💡 <strong>Tip:</strong> This platform includes both real user profiles and generated test profiles 
            (marked with 🎲) to help you explore the matching system and test features.
          </p>
          <p className="info-text" style={{ marginTop: '8px', fontSize: '0.9rem', opacity: '0.9' }}>
            🎯 <strong>Smart Matching:</strong> Your matches are automatically calculated and ranked by compatibility percentage.
          </p>
        </div>
      </div>

      {/* User Profile Summary Cards */}
      <div className="profile-summary-cards">
        <div className="profile-card">
          <div className="profile-card-header">
            <div className="profile-info">
              <div className="profile-role mentee">Mentee</div>
              <div className="profile-name">
                {currentUserProfile.firstName} {currentUserProfile.lastName}
              </div>
            </div>
            <div className="profile-card-actions">
              <button 
                className="profile-edit-btn"
                onClick={onProfileEdit}
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
                <div className="detail-item">
                  <span className="detail-label">Goals:</span>
                  <span className="detail-value">
                    {currentUserProfile.goals && currentUserProfile.goals.length > 0 
                      ? currentUserProfile.goals.slice(0, 2).join(', ') + (currentUserProfile.goals.length > 2 ? '...' : '')
                      : 'No goals specified'
                    }
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Learning Areas:</span>
                  <span className="detail-value">
                    {currentUserProfile.learningAreas && currentUserProfile.learningAreas.length > 0 
                      ? currentUserProfile.learningAreas.slice(0, 2).join(', ') + (currentUserProfile.learningAreas.length > 2 ? '...' : '')
                      : 'No learning areas specified'
                    }
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Mentee-specific card for learning progress or goals */}
        <div className="profile-card">
          <div className="profile-card-header">
            <div className="profile-info">
              <div className="profile-role mentee">Mentee</div>
              <div className="profile-name">Learning Journey</div>
            </div>
            <div className="profile-card-actions">
              <button 
                className="profile-edit-btn"
                onClick={() => {/* TODO: Implement learning journey management */}}
                data-tooltip="Manage your learning goals and progress"
              >
                Manage Goals
              </button>
              <button 
                className="expand-toggle-btn"
                onClick={() => {/* TODO: Implement expand functionality */}}
                title="Expand learning journey details"
              >
                ▶
              </button>
            </div>
          </div>
          
          {/* Expandable Learning Journey Content */}
          <div className="profile-card-content">
            <div className="learning-summary">
              <div className="learning-stat">
                <span className="stat-number">
                  {currentUserProfile.goals?.length || 0}
                </span>
                <span className="stat-label">Learning Goals</span>
              </div>
              <div className="learning-stat">
                <span className="stat-number">
                  {currentUserProfile.learningAreas?.length || 0}
                </span>
                <span className="stat-label">Areas of Interest</span>
              </div>
              <div className="learning-stat">
                <span className="stat-number">
                  0
                </span>
                <span className="stat-label">Completed Sessions</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
