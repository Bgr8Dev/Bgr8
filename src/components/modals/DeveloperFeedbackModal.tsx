import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { DeveloperFeedbackService, DeveloperMentor } from '../../services/developerFeedbackService';
import { FaStar, FaTimes, FaUser, FaCode, FaSearch, FaToggleOn, FaToggleOff } from 'react-icons/fa';
import './DeveloperFeedbackModal.css';

interface DeveloperFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeveloperFeedbackModal: React.FC<DeveloperFeedbackModalProps> = ({
  isOpen,
  onClose
}) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [mentors, setMentors] = useState<DeveloperMentor[]>([]);
  const [selectedMentor, setSelectedMentor] = useState<DeveloperMentor | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Load mentors when modal opens
  useEffect(() => {
    if (isOpen) {
      loadMentors();
    } else {
      // Reset state when modal closes
      setMentors([]);
      setSelectedMentor(null);
      setSearchTerm('');
      setError(null);
    }
  }, [isOpen]);

  const loadMentors = async () => {
    try {
      setLoading(true);
      setError(null);
      const mentorsData = await DeveloperFeedbackService.getMentorsForDeveloperMode(50);
      setMentors(mentorsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load mentors');
      console.error('Error loading mentors for developer mode:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMentorSelect = (mentor: DeveloperMentor) => {
    setSelectedMentor(mentor);
  };

  const handleProvideFeedback = (mentor: DeveloperMentor) => {
    // Create a developer feedback data object
    const developerFeedbackData = DeveloperFeedbackService.createDeveloperFeedbackData(mentor);
    
    // Store the developer feedback data in sessionStorage for the feedback page to use
    sessionStorage.setItem('developerFeedbackData', JSON.stringify(developerFeedbackData));
    
    // Navigate to feedback page with a special developer mode identifier
    navigate(`/feedback/dev-${mentor.mentorId}`);
    onClose();
  };

  const handleBackToList = () => {
    setSelectedMentor(null);
  };

  const handleToggleDeveloperMode = () => {
    const currentMode = DeveloperFeedbackService.getDeveloperMode();
    DeveloperFeedbackService.setDeveloperMode(!currentMode);
    // Refresh the page to update the UI
    window.location.reload();
  };

  // Filter mentors based on search term
  const filteredMentors = mentors.filter(mentor =>
    mentor.mentorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (mentor.industry && mentor.industry.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (mentor.skills && mentor.skills.some(skill => 
      skill.toLowerCase().includes(searchTerm.toLowerCase())
    ))
  );

  if (!isOpen) return null;

  return (
    <div className="developer-feedback-modal-overlay">
      <div className="developer-feedback-modal">
        <div className="modal-header">
          <div className="header-content">
            <div className="header-title">
              <FaCode className="dev-icon" />
              <h2>Developer Mode - Mentor Feedback</h2>
            </div>
            <div className="developer-mode-toggle">
              <span>Developer Mode:</span>
              <button 
                className={`toggle-btn ${DeveloperFeedbackService.getDeveloperMode() ? 'active' : ''}`}
                onClick={handleToggleDeveloperMode}
                title={DeveloperFeedbackService.getDeveloperMode() ? 'Disable Developer Mode' : 'Enable Developer Mode'}
              >
                {DeveloperFeedbackService.getDeveloperMode() ? <FaToggleOn /> : <FaToggleOff />}
              </button>
            </div>
          </div>
          <button className="close-btn" onClick={onClose} title="Close modal">
            <FaTimes />
          </button>
        </div>

        <div className="modal-content">
          {!selectedMentor ? (
            // Mentor Selection View
            <div className="mentor-selection">
              <div className="selection-header">
                <h3>Select a Mentor for Feedback Testing</h3>
                <p>Choose any mentor to test the feedback system without requiring a completed session</p>
              </div>

              {/* Search Bar */}
              <div className="search-container">
                <div className="search-input-wrapper">
                  <FaSearch className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search mentors by name, industry, or skills..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                </div>
              </div>

              {loading ? (
                <div className="loading-state">
                  <div className="loading-spinner"></div>
                  <p>Loading mentors...</p>
                </div>
              ) : error ? (
                <div className="error-state">
                  <p>Error: {error}</p>
                  <button onClick={loadMentors} className="retry-btn">
                    Try Again
                  </button>
                </div>
              ) : filteredMentors.length === 0 ? (
                <div className="no-mentors">
                  <div className="no-mentors-icon">
                    <FaUser />
                  </div>
                  <h4>No Mentors Found</h4>
                  <p>
                    {searchTerm 
                      ? `No mentors match "${searchTerm}". Try a different search term.`
                      : 'No active mentors found in the system.'
                    }
                  </p>
                  {searchTerm && (
                    <button onClick={() => setSearchTerm('')} className="clear-search-btn">
                      Clear Search
                    </button>
                  )}
                </div>
              ) : (
                <div className="mentors-list">
                  <div className="mentors-header">
                    <span>Found {filteredMentors.length} mentor{filteredMentors.length !== 1 ? 's' : ''}</span>
                  </div>
                  {filteredMentors.map((mentor) => (
                    <div 
                      key={mentor.mentorId}
                      className="mentor-card"
                      onClick={() => handleMentorSelect(mentor)}
                    >
                      <div className="mentor-info">
                        <div className="mentor-avatar">
                          <FaUser />
                        </div>
                        <div className="mentor-details">
                          <h4>{mentor.mentorName}</h4>
                          <div className="mentor-meta">
                            {mentor.industry && (
                              <span className="industry-tag">{mentor.industry}</span>
                            )}
                            {mentor.yearsOfExperience && (
                              <span className="experience-tag">
                                {mentor.yearsOfExperience} years experience
                              </span>
                            )}
                          </div>
                          {mentor.skills && mentor.skills.length > 0 && (
                            <div className="skills-list">
                              {mentor.skills.slice(0, 3).map((skill, index) => (
                                <span key={index} className="skill-tag">{skill}</span>
                              ))}
                              {mentor.skills.length > 3 && (
                                <span className="more-skills">+{mentor.skills.length - 3} more</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="mentor-action">
                        <button className="provide-feedback-btn">
                          Provide Feedback
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            // Feedback Confirmation View
            <div className="feedback-confirmation">
              <button className="back-btn" onClick={handleBackToList}>
                ← Back to Mentors
              </button>

              <div className="confirmation-content">
                <div className="selected-mentor">
                  <div className="mentor-avatar large">
                    <FaUser />
                  </div>
                  <h3>{selectedMentor.mentorName}</h3>
                  <div className="mentor-details-extended">
                    {selectedMentor.industry && (
                      <div className="detail-item">
                        <strong>Industry:</strong> {selectedMentor.industry}
                      </div>
                    )}
                    {selectedMentor.yearsOfExperience && (
                      <div className="detail-item">
                        <strong>Experience:</strong> {selectedMentor.yearsOfExperience} years
                      </div>
                    )}
                    {selectedMentor.skills && selectedMentor.skills.length > 0 && (
                      <div className="detail-item">
                        <strong>Skills:</strong> {selectedMentor.skills.join(', ')}
                      </div>
                    )}
                  </div>
                </div>

                <div className="developer-warning">
                  <div className="warning-icon">
                    <FaCode />
                  </div>
                  <div className="warning-content">
                    <h4>Developer Mode Feedback</h4>
                    <p>
                      This is a developer mode feedback session. You're providing feedback for 
                      <strong> {selectedMentor.mentorName}</strong> without a completed mentoring session.
                    </p>
                    <p>
                      This is useful for testing the feedback system and UI components.
                    </p>
                  </div>
                </div>

                <div className="confirmation-actions">
                  <button className="cancel-btn" onClick={handleBackToList}>
                    Cancel
                  </button>
                  <button 
                    className="start-feedback-btn"
                    onClick={() => handleProvideFeedback(selectedMentor)}
                  >
                    <FaStar /> Start Developer Feedback
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
