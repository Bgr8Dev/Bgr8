import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { MentorFeedbackEligibility } from '../../services/mentorFeedbackService';
import { FaStar, FaTimes, FaCheck, FaUser, FaCalendar } from 'react-icons/fa';
import './MentorFeedbackModal.css';

interface MentorFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  eligibleMentors: MentorFeedbackEligibility[];
}

export const MentorFeedbackModal: React.FC<MentorFeedbackModalProps> = ({
  isOpen,
  onClose,
  eligibleMentors
}) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [selectedMentor, setSelectedMentor] = useState<MentorFeedbackEligibility | null>(null);

  // Reset selected mentor when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedMentor(null);
    }
  }, [isOpen]);

  const handleMentorSelect = (mentor: MentorFeedbackEligibility) => {
    setSelectedMentor(mentor);
  };

  const handleProvideFeedback = (mentor: MentorFeedbackEligibility) => {
    // Navigate to the existing feedback page with the booking ID
    navigate(`/feedback/${mentor.bookingId}`);
    onClose();
  };

  const handleBackToList = () => {
    setSelectedMentor(null);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="mentor-feedback-modal-overlay">
      <div className="mentor-feedback-modal">
        <div className="modal-header">
          <h2>Mentor Feedback</h2>
          <button className="close-btn" onClick={onClose} title="Close modal">
            <FaTimes />
          </button>
        </div>

        <div className="modal-content">
          {!selectedMentor ? (
            // Mentor Selection View
            <div className="mentor-selection">
              <div className="selection-header">
                <h3>Select a Mentor to Provide Feedback</h3>
                <p>Choose a mentor you've completed sessions with to share your experience</p>
              </div>

              {eligibleMentors.length === 0 ? (
                <div className="no-eligible-mentors">
                  <div className="no-mentors-icon">
                    <FaUser />
                  </div>
                  <h4>No Completed Sessions</h4>
                  <p>You haven't completed any sessions with mentors yet.</p>
                  <p>Complete a mentoring session to provide feedback.</p>
                </div>
              ) : (
                <div className="mentors-list">
                  {eligibleMentors.map((mentor) => (
                    <div 
                      key={`${mentor.mentorId}-${mentor.sessionId}`}
                      className={`mentor-card ${mentor.feedbackAlreadySubmitted ? 'submitted' : 'available'}`}
                    >
                      <div className="mentor-info">
                        <div className="mentor-avatar">
                          <FaUser />
                        </div>
                        <div className="mentor-details">
                          <h4>{mentor.mentorName}</h4>
                          <div className="session-date">
                            <FaCalendar />
                            <span>Session: {formatDate(mentor.sessionDate)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="mentor-actions">
                        {mentor.feedbackAlreadySubmitted ? (
                          <div className="feedback-status submitted">
                            <FaCheck />
                            <span>Feedback Submitted</span>
                          </div>
                        ) : (
                          <button
                            className="provide-feedback-btn"
                            onClick={() => handleMentorSelect(mentor)}
                          >
                            Provide Feedback
                          </button>
                        )}
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
                  <div className="session-details">
                    <FaCalendar />
                    <span>Session completed on {formatDate(selectedMentor.sessionDate)}</span>
                  </div>
                </div>

                <div className="feedback-info">
                  <h4>Ready to Provide Feedback?</h4>
                  <p>
                    You'll be taken to a feedback form where you can rate your experience 
                    and share what went well and what could be improved.
                  </p>
                  
                  <div className="feedback-preview">
                    <div className="preview-item">
                      <FaStar />
                      <span>Rate helpfulness, comfort, and support</span>
                    </div>
                    <div className="preview-item">
                      <FaUser />
                      <span>Share strengths and improvements</span>
                    </div>
                    <div className="preview-item">
                      <FaCheck />
                      <span>Describe your key learnings</span>
                    </div>
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
                    Start Feedback
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
