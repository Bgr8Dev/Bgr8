import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { DeveloperFeedbackService, DeveloperMentor } from '../../services/developerFeedbackService';

export const DeveloperFeedbackTest: React.FC = () => {
  const { currentUser } = useAuth();
  const [mentors, setMentors] = useState<DeveloperMentor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [developerMode, setDeveloperMode] = useState(false);

  const testDeveloperService = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Testing developer feedback service...');
      const mentorsData = await DeveloperFeedbackService.getMentorsForDeveloperMode(10);
      setMentors(mentorsData);
      console.log('Developer Mentors found:', mentorsData.length);
      console.log('Developer Mentors:', mentorsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error testing developer service:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleDeveloperMode = () => {
    const newMode = !developerMode;
    DeveloperFeedbackService.setDeveloperMode(newMode);
    setDeveloperMode(newMode);
  };

  useEffect(() => {
    if (currentUser) {
      const currentMode = DeveloperFeedbackService.getDeveloperMode();
      setDeveloperMode(currentMode);
      testDeveloperService();
    }
  }, [currentUser]);

  if (!currentUser) {
    return <div>Please log in to test the developer feedback service.</div>;
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h2>Developer Feedback Service Test</h2>
      
      <div style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <button 
          onClick={testDeveloperService}
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
          {loading ? 'Loading...' : 'Test Developer Service'}
        </button>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>Developer Mode:</span>
          <button
            onClick={toggleDeveloperMode}
            style={{
              padding: '0.5rem 1rem',
              background: developerMode ? '#10b981' : '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            {developerMode ? 'Enabled' : 'Disabled'}
          </button>
        </div>
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

      <div style={{
        padding: '1.5rem',
        background: '#f0f9ff',
        border: '1px solid #bae6fd',
        borderRadius: '12px'
      }}>
        <h3>Available Mentors for Developer Testing</h3>
        
        {mentors.length === 0 ? (
          <p style={{ color: '#64748b', fontStyle: 'italic' }}>
            No mentors found. Make sure there are active mentors in the system.
          </p>
        ) : (
          <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
            {mentors.map((mentor) => (
              <div key={mentor.mentorId} style={{
                padding: '1rem',
                background: '#ffffff',
                border: '2px solid #e2e8f0',
                borderRadius: '8px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h4 style={{ margin: '0 0 0.5rem 0', color: '#1e293b' }}>{mentor.mentorName}</h4>
                    <div style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '0.5rem' }}>
                      {mentor.mentorEmail}
                    </div>
                    {mentor.industry && (
                      <div style={{ fontSize: '0.85rem', color: '#0369a1', marginBottom: '0.25rem' }}>
                        <strong>Industry:</strong> {mentor.industry}
                      </div>
                    )}
                    {mentor.yearsOfExperience && (
                      <div style={{ fontSize: '0.85rem', color: '#d97706', marginBottom: '0.25rem' }}>
                        <strong>Experience:</strong> {mentor.yearsOfExperience} years
                      </div>
                    )}
                    {mentor.skills && mentor.skills.length > 0 && (
                      <div style={{ fontSize: '0.85rem', color: '#059669' }}>
                        <strong>Skills:</strong> {mentor.skills.slice(0, 3).join(', ')}
                        {mentor.skills.length > 3 && ` +${mentor.skills.length - 3} more`}
                      </div>
                    )}
                  </div>
                  <div style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: '4px',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    background: mentor.isActive ? '#bbf7d0' : '#fecaca',
                    color: mentor.isActive ? '#059669' : '#dc2626'
                  }}>
                    {mentor.isActive ? 'Active' : 'Inactive'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginTop: '2rem', padding: '1rem', background: '#fef3c7', borderRadius: '8px', border: '1px solid #fbbf24' }}>
        <h4 style={{ margin: '0 0 0.5rem 0', color: '#92400e' }}>How to Use Developer Mode:</h4>
        <ol style={{ margin: '0', paddingLeft: '1.5rem', color: '#92400e', fontSize: '0.9rem' }}>
          <li>Enable Developer Mode using the toggle above</li>
          <li>Go to the Mentee Dashboard</li>
          <li>Look for the "Dev Mode" button in the Mentor Feedback card</li>
          <li>Click it to open the Developer Feedback Modal</li>
          <li>Select any mentor from the list to provide feedback</li>
          <li>The feedback will be marked as developer mode for easy identification</li>
        </ol>
      </div>
    </div>
  );
};
