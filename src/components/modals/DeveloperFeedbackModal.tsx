import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { DeveloperFeedbackService, DeveloperMentor } from '../../services/developerFeedbackService';
import { FaStar, FaTimes, FaUser, FaCode, FaSearch, FaToggleOn, FaToggleOff, FaCheck, FaArrowLeft } from 'react-icons/fa';
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
  const [mentors, setMentors] = useState<DeveloperMentor[]>([]);
  const [selectedMentor, setSelectedMentor] = useState<DeveloperMentor | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // Feedback form state
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Feedback form data
  const [helpfulness, setHelpfulness] = useState(0);
  const [comfort, setComfort] = useState(0);
  const [support, setSupport] = useState(0);
  const [strengths, setStrengths] = useState('');
  const [improvements, setImprovements] = useState('');
  const [learnings, setLearnings] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);

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
      setShowFeedbackForm(false);
      setSubmitting(false);
      setSuccess(null);
      setHelpfulness(0);
      setComfort(0);
      setSupport(0);
      setStrengths('');
      setImprovements('');
      setLearnings('');
      setIsAnonymous(false);
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
    console.log('Providing feedback for mentor:', mentor);
    setSelectedMentor(mentor);
    setShowFeedbackForm(true);
  };

  const handleBackToList = () => {
    setSelectedMentor(null);
    setShowFeedbackForm(false);
  };

  const handleRatingChange = (question: 'helpfulness' | 'comfort' | 'support', value: number) => {
    switch (question) {
      case 'helpfulness':
        setHelpfulness(value);
        break;
      case 'comfort':
        setComfort(value);
        break;
      case 'support':
        setSupport(value);
        break;
    }
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedMentor || !currentUser) return;

    // Validate required fields
    if (helpfulness === 0 || comfort === 0 || support === 0) {
      setError('Please provide ratings for all questions');
      return;
    }

    if (!strengths.trim() || !improvements.trim() || !learnings.trim()) {
      setError('Please fill in all text fields');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const overallRating = Math.round((helpfulness + comfort + support) / 3);

      const feedbackData = {
        bookingId: `dev-${selectedMentor.mentorId}`,
        mentorId: selectedMentor.mentorId,
        menteeId: currentUser.uid,
        mentorName: selectedMentor.mentorName,
        menteeName: currentUser.displayName || 'Unknown Mentee',
        sessionDate: new Date(),
        feedbackType: 'mentor',
        submittedBy: currentUser.uid,
        submittedAt: new Date(),
        helpfulness,
        comfort,
        support,
        strengths: strengths.trim(),
        improvements: improvements.trim(),
        learnings: learnings.trim(),
        overallRating,
        isAnonymous,
        status: 'submitted',
        isDeveloperMode: true,
        developerModeMentorId: selectedMentor.mentorId
      };

      // Import Firebase functions
      const { addDoc, collection } = await import('firebase/firestore');
      const { firestore } = await import('../../firebase/firebase');
      
      await addDoc(collection(firestore, 'feedback'), feedbackData);

      setSuccess('Thank you for your feedback! Your response has been submitted successfully.');
      
      // Reset form after success
      setTimeout(() => {
        setSuccess(null);
        setShowFeedbackForm(false);
        setSelectedMentor(null);
        setHelpfulness(0);
        setComfort(0);
        setSupport(0);
        setStrengths('');
        setImprovements('');
        setLearnings('');
        setIsAnonymous(false);
      }, 2000);

    } catch (err) {
      console.error('Error submitting feedback:', err);
      setError('Failed to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStarRating = (
    question: 'helpfulness' | 'comfort' | 'support',
    value: number,
    onChange: (value: number) => void
  ) => {
    return (
      <div className="dev-fb-star-rating">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className={`dev-fb-star ${star <= value ? 'filled' : ''}`}
            onClick={() => onChange(star)}
            title={`Rate ${star} star${star > 1 ? 's' : ''}`}
            onMouseEnter={(e) => {
              const stars = e.currentTarget.parentElement?.children;
              if (stars) {
                for (let i = 0; i < stars.length; i++) {
                  if (i < star) {
                    stars[i].classList.add('hover');
                  } else {
                    stars[i].classList.remove('hover');
                  }
                }
              }
            }}
            onMouseLeave={(e) => {
              const stars = e.currentTarget.parentElement?.children;
              if (stars) {
                for (let i = 0; i < stars.length; i++) {
                  stars[i].classList.remove('hover');
                }
              }
            }}
          >
            <FaStar />
          </button>
        ))}
        <span className="dev-fb-rating-label">
          {value === 0 && 'Select rating'}
          {value === 1 && 'Poor'}
          {value === 2 && 'Fair'}
          {value === 3 && 'Good'}
          {value === 4 && 'Very Good'}
          {value === 5 && 'Excellent'}
        </span>
      </div>
    );
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
    <div className="dev-fb-modal-overlay">
      <div className="dev-fb-modal">
        <div className="dev-fb-modal-header">
          <div className="dev-fb-header-content">
            <div className="dev-fb-header-title">
              <FaCode className="dev-fb-dev-icon" />
              <h2>Developer Mode - Mentor Feedback</h2>
            </div>
            <div className="dev-fb-developer-mode-toggle">
              <span>Developer Mode:</span>
              <button 
                className={`dev-fb-toggle-btn ${DeveloperFeedbackService.getDeveloperMode() ? 'active' : ''}`}
                onClick={handleToggleDeveloperMode}
                title={DeveloperFeedbackService.getDeveloperMode() ? 'Disable Developer Mode' : 'Enable Developer Mode'}
              >
                {DeveloperFeedbackService.getDeveloperMode() ? <FaToggleOn /> : <FaToggleOff />}
              </button>
            </div>
          </div>
          <button className="dev-fb-close-btn" onClick={onClose} title="Close modal">
            <FaTimes />
          </button>
        </div>

        <div className="dev-fb-modal-content">
          {showFeedbackForm ? (
            // Feedback Form View
            <div className="dev-fb-feedback-form-view">
              <div className="dev-fb-feedback-header">
                <button className="dev-fb-back-btn" onClick={handleBackToList}>
                  <FaArrowLeft /> Back to Mentors
                </button>
                <h3>Session Feedback</h3>
                <div className="dev-fb-session-info">
                  <h4>Session with {selectedMentor?.mentorName}</h4>
                  <p>{new Date().toLocaleDateString('en-GB', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })} • Developer Mode</p>
                  <div className="dev-fb-developer-mode-indicator">
                    <span className="dev-fb-dev-badge">🔧 Developer Mode</span>
                    <span className="dev-fb-dev-text">Testing feedback system - no actual session required</span>
                  </div>
                </div>
              </div>

              {success && (
                <div className="dev-fb-success-message">
                  <FaCheck /> {success}
                </div>
              )}

              {error && (
                <div className="dev-fb-error-message">
                  <FaTimes /> {error}
                </div>
              )}

              <form onSubmit={handleSubmitFeedback} className="dev-fb-feedback-form">
                <div className="dev-fb-form-section">
                  <h4>Rate Your Experience</h4>
                  <p className="dev-fb-section-description">
                    Please rate your experience on a scale of 1 to 5, where 1 is Poor and 5 is Excellent.
                  </p>

                  <div className="dev-fb-rating-question">
                    <label>
                      How helpful and engaged has your mentor been during your sessions?
                      <span className="dev-fb-question-hint">(e.g., listens well, gives advice, makes time for you)</span>
                    </label>
                    {renderStarRating('helpfulness', helpfulness, (value) => handleRatingChange('helpfulness', value))}
                  </div>

                  <div className="dev-fb-rating-question">
                    <label>
                      Do you feel comfortable talking to your mentor and asking questions?
                    </label>
                    {renderStarRating('comfort', comfort, (value) => handleRatingChange('comfort', value))}
                  </div>

                  <div className="dev-fb-rating-question">
                    <label>
                      Have you felt supported and understood in your mentorship?
                      <span className="dev-fb-question-hint">(Do you feel they "get" you and your goals?)</span>
                    </label>
                    {renderStarRating('support', support, (value) => handleRatingChange('support', value))}
                  </div>
                </div>

                <div className="dev-fb-form-section">
                  <h4>Share Your Thoughts</h4>
                  <p className="dev-fb-section-description">
                    Please provide specific examples and constructive feedback to help improve the mentorship experience.
                  </p>

                  <div className="dev-fb-text-question">
                    <label htmlFor="strengths">
                      What's one thing your mentor does well?
                    </label>
                    <textarea
                      id="strengths"
                      value={strengths}
                      onChange={(e) => setStrengths(e.target.value)}
                      placeholder="Share what your mentor excels at..."
                      rows={3}
                      required
                    />
                  </div>

                  <div className="dev-fb-text-question">
                    <label htmlFor="improvements">
                      What's one thing your mentor could do to better support you?
                    </label>
                    <textarea
                      id="improvements"
                      value={improvements}
                      onChange={(e) => setImprovements(e.target.value)}
                      placeholder="Share constructive suggestions for improvement..."
                      rows={3}
                      required
                    />
                  </div>

                  <div className="dev-fb-text-question">
                    <label htmlFor="learnings">
                      What's one thing you've gained or learned from this mentorship so far?
                    </label>
                    <textarea
                      id="learnings"
                      value={learnings}
                      onChange={(e) => setLearnings(e.target.value)}
                      placeholder="Share your key takeaways and learnings..."
                      rows={3}
                      required
                    />
                  </div>
                </div>

                <div className="dev-fb-form-section">
                  <div className="dev-fb-anonymous-option">
                    <label className="dev-fb-checkbox-label">
                      <input
                        type="checkbox"
                        checked={isAnonymous}
                        onChange={(e) => setIsAnonymous(e.target.checked)}
                      />
                      <span className="dev-fb-checkmark"></span>
                      Submit feedback anonymously
                    </label>
                    <p className="dev-fb-checkbox-hint">
                      Your name will not be shared with the mentor, but your feedback will still be valuable for improvement.
                    </p>
                  </div>
                </div>

                <div className="dev-fb-form-actions">
                  <button
                    type="button"
                    onClick={handleBackToList}
                    className="dev-fb-btn-secondary"
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="dev-fb-btn-primary"
                    disabled={submitting}
                  >
                    {submitting ? 'Submitting...' : 'Submit Feedback'}
                  </button>
                </div>
              </form>
            </div>
          ) : !selectedMentor ? (
            // Mentor Selection View
            <div className="dev-fb-mentor-selection">
              <div className="dev-fb-selection-header">
                <h3>Select a Mentor for Feedback Testing</h3>
                <p>Choose any mentor to test the feedback system without requiring a completed session</p>
              </div>

              {/* Search Bar */}
              <div className="dev-fb-search-container">
                <div className="dev-fb-search-input-wrapper">
                  <FaSearch className="dev-fb-search-icon" />
                  <input
                    type="text"
                    placeholder="Search mentors by name, industry, or skills..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="dev-fb-search-input"
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
                      <div className="dev-fb-mentor-info">
                        <div className="dev-fb-mentor-avatar">
                          <FaUser />
                        </div>
                        <div className="dev-fb-mentor-details">
                          <h4>{mentor.mentorName}</h4>
                          <div className="dev-fb-mentor-meta">
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
                      <div className="dev-fb-mentor-actions">
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
