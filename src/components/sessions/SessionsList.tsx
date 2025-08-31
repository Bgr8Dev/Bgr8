import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Session } from '../../types/sessions';
import SessionsService from '../../services/SessionsService';
import FeedbackForm from '../feedback/FeedbackForm';
import './SessionsList.css';

type TimestampType = Date | { toDate: () => Date } | string | number;

export default function SessionsList() {
  const { currentUser } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [feedbackType, setFeedbackType] = useState<'mentor' | 'mentee' | 'self'>('mentor');
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);

  const loadSessions = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      const userSessions = await SessionsService.getUserSessions(currentUser.uid);
      setSessions(userSessions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      loadSessions();
    }
  }, [currentUser, loadSessions]);

  const handleFeedbackClick = (session: Session, type: 'mentor' | 'mentee' | 'self') => {
    setSelectedSession(session);
    setFeedbackType(type);
    setShowFeedbackForm(true);
  };

  const handleFeedbackSuccess = () => {
    setShowFeedbackForm(false);
    setSelectedSession(null);
    loadSessions(); // Refresh to update feedback status
  };

  const formatDate = (timestamp: TimestampType) => {
    if (!timestamp) return 'N/A';
    
    let date: Date;
    if (typeof timestamp === 'object' && 'toDate' in timestamp) {
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else {
      date = new Date(timestamp);
    }
    
    return date.toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timestamp: TimestampType) => {
    if (!timestamp) return 'N/A';
    
    let date: Date;
    if (typeof timestamp === 'object' && 'toDate' in timestamp) {
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else {
      date = new Date(timestamp);
    }
    
    return date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <div className="text-center py-8">Loading sessions...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">{error}</div>
        <button
          onClick={loadSessions}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No sessions found. Sessions will appear here after they are created from bookings.
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">My Sessions</h2>
      
      <div className="grid gap-6">
        {sessions.map((session) => (
          <div key={session.id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold">
                  Session on {formatDate(session.sessionDate)}
                </h3>
                <p className="text-gray-600">
                  {formatTime(session.startTime)} - {formatTime(session.endTime)}
                </p>
                <p className="text-sm text-gray-500">
                  Location: {session.sessionLocation}
                </p>
                <p className="text-sm text-gray-500">
                  Status: <span className={`font-medium ${
                    session.status === 'completed' ? 'text-green-600' :
                    session.status === 'cancelled' ? 'text-red-600' :
                    session.status === 'no-show' ? 'text-orange-600' :
                    'text-blue-600'
                  }`}>
                    {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                  </span>
                </p>
              </div>
              
              <div className="flex space-x-2">
                {session.sessionLink && (
                  <a
                    href={session.sessionLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                  >
                    Join Session
                  </a>
                )}
              </div>
            </div>

            {/* Feedback Section */}
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Feedback</h4>
              <div className="flex space-x-3">
                {currentUser?.uid === session.mentorId && !session.feedbackSubmitted_mentor && (
                  <button
                    onClick={() => handleFeedbackClick(session, 'mentor')}
                    className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
                  >
                    Submit Mentor Feedback
                  </button>
                )}
                
                {currentUser?.uid === session.menteeId && !session.feedbackSubmitted_mentee && (
                  <button
                    onClick={() => handleFeedbackClick(session, 'mentee')}
                    className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
                  >
                    Submit Mentee Feedback
                  </button>
                )}
                
                {session.feedbackSubmitted_mentor && currentUser?.uid === session.mentorId && (
                  <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-md">
                    Mentor Feedback Submitted
                  </span>
                )}
                
                {session.feedbackSubmitted_mentee && currentUser?.uid === session.menteeId && (
                  <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-md">
                    Mentee Feedback Submitted
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Feedback Modal */}
      {showFeedbackForm && selectedSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Session Feedback</h3>
                <button
                  onClick={() => setShowFeedbackForm(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              
              <FeedbackForm
                sessionId={selectedSession.id}
                feedbackType={feedbackType}
                receiverUserId={
                  feedbackType === 'mentor' ? selectedSession.menteeId :
                  feedbackType === 'mentee' ? selectedSession.mentorId :
                  null
                }
                onSuccess={handleFeedbackSuccess}
                onCancel={() => setShowFeedbackForm(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
