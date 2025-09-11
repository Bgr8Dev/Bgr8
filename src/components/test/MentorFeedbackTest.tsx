import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { MentorFeedbackService, MenteeFeedbackSummary } from '../../services/mentorFeedbackService';

export const MentorFeedbackTest: React.FC = () => {
  const { currentUser } = useAuth();
  const [feedbackSummary, setFeedbackSummary] = useState<MenteeFeedbackSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testFeedbackService = useCallback(async () => {
    if (!currentUser) {
      setError('No current user');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const summary = await MentorFeedbackService.getMenteeFeedbackSummary(currentUser.uid);
      setFeedbackSummary(summary);
      console.log('Feedback Summary:', summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error testing feedback service:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      testFeedbackService();
    }
  }, [currentUser, testFeedbackService]);

  if (!currentUser) {
    return <div>Please log in to test the mentor feedback service.</div>;
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h2>Mentor Feedback Service Test</h2>
      
      <div style={{ marginBottom: '2rem' }}>
        <button 
          onClick={testFeedbackService}
          disabled={loading}
          style={{
            padding: '0.75rem 1.5rem',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Loading...' : 'Test Feedback Service'}
        </button>
      </div>

      {error && (
        <div style={{
          padding: '1rem',
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          color: '#dc2626',
          marginBottom: '1rem'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {feedbackSummary && (
        <div style={{
          padding: '1.5rem',
          background: '#f0f9ff',
          border: '1px solid #bae6fd',
          borderRadius: '12px'
        }}>
          <h3>Feedback Summary for {currentUser.email}</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1e40af' }}>
                {feedbackSummary.totalCompletedSessions}
              </div>
              <div style={{ color: '#64748b' }}>Completed Sessions</div>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#059669' }}>
                {feedbackSummary.feedbackSubmitted}
              </div>
              <div style={{ color: '#64748b' }}>Feedback Provided</div>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#d97706' }}>
                {feedbackSummary.pendingFeedback}
              </div>
              <div style={{ color: '#64748b' }}>Pending Feedback</div>
            </div>
          </div>

          <h4>Eligible Mentors for Feedback:</h4>
          {feedbackSummary.eligibleForFeedback.length === 0 ? (
            <p style={{ color: '#64748b', fontStyle: 'italic' }}>
              No completed sessions found. Complete a mentoring session to provide feedback.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {feedbackSummary.eligibleForFeedback.map((mentor) => (
                <div key={`${mentor.mentorId}-${mentor.sessionId}`} style={{
                  padding: '1rem',
                  background: mentor.feedbackAlreadySubmitted ? '#f0fdf4' : '#ffffff',
                  border: `2px solid ${mentor.feedbackAlreadySubmitted ? '#bbf7d0' : '#e2e8f0'}`,
                  borderRadius: '8px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong>{mentor.mentorName}</strong>
                      <div style={{ fontSize: '0.9rem', color: '#64748b' }}>
                        Session: {mentor.sessionDate.toLocaleDateString()}
                      </div>
                    </div>
                    <div style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '4px',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      background: mentor.feedbackAlreadySubmitted ? '#bbf7d0' : '#fef3c7',
                      color: mentor.feedbackAlreadySubmitted ? '#059669' : '#d97706'
                    }}>
                      {mentor.feedbackAlreadySubmitted ? 'Feedback Submitted' : 'Pending Feedback'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
