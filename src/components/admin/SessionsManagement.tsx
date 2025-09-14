import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { firestore } from '../../firebase/firebase';
import { Session } from '../../types/sessions';
import { SessionsService } from '../../services/sessionsService';
import { Timestamp } from 'firebase/firestore';
import { FaSearch, FaFilter } from 'react-icons/fa';
import './SessionsManagement.css';

export const SessionsManagement: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'scheduled' | 'completed' | 'cancelled' | 'no-show'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const sessionsQuery = query(
        collection(firestore, 'sessions'),
        orderBy('sessionDate', 'desc')
      );
      
      const sessionsSnapshot = await getDocs(sessionsQuery);
      const sessionsData: Session[] = [];
      
      sessionsSnapshot.forEach(doc => {
        sessionsData.push({ id: doc.id, ...doc.data() } as Session);
      });
      
      setSessions(sessionsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const updateSessionStatus = async (sessionId: string, newStatus: Session['status']) => {
    try {
      await SessionsService.updateSessionStatus(sessionId, newStatus);
      // Update local state
      setSessions(prev => 
        prev.map(session => 
          session.id === sessionId 
            ? { ...session, status: newStatus, updatedAt: Timestamp.now() }
            : session
        )
      );
    } catch (err) {
      console.error('Failed to update session status:', err);
    }
  };

  const filteredSessions = sessions.filter(session => {
    const matchesFilter = filter === 'all' || session.status === filter;
    const matchesSearch = searchTerm === '' || 
      session.mentorId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.menteeId.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  const formatDate = (timestamp: Timestamp | Date | string | null) => {
    if (!timestamp) return 'N/A';
    
    let date: Date;
    if (timestamp && typeof timestamp === 'object' && 'toDate' in timestamp) {
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

  const formatTime = (timestamp: Timestamp | Date | string | null) => {
    if (!timestamp) return 'N/A';
    
    let date: Date;
    if (timestamp && typeof timestamp === 'object' && 'toDate' in timestamp) {
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
    return (
      <div className="sessions-management-admin">
        <div className="sessions-loading">
          <div className="loading-spinner"></div>
          <p>Loading sessions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="sessions-management-admin">
        <div className="sessions-error">
          <div className="error-message">{error}</div>
          <button
            onClick={loadSessions}
            className="retry-button"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="sessions-management-admin">
      <div className="sessions-admin-section">
        <div className="sessions-admin-header">
          <div className="header-content">
            <h2>Sessions Management</h2>
            <p className="sessions-admin-subtitle">Manage all platform sessions and their status with style ✨</p>
          </div>
          <div className="sessions-stats">
            <div className="stat-card">
              <span className="stat-number">{sessions.length}</span>
              <span className="stat-label">Total Sessions</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">{sessions.filter(s => s.status === 'scheduled').length}</span>
              <span className="stat-label">Scheduled</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">{sessions.filter(s => s.status === 'completed').length}</span>
              <span className="stat-label">Completed</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">
                {sessions.length > 0 
                  ? Math.round((sessions.filter(s => s.feedbackSubmitted_mentor || s.feedbackSubmitted_mentee).length / sessions.length) * 100)
                  : 0}%
              </span>
              <span className="stat-label">Feedback Rate</span>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="sessions-filters">
          <div className="search-bar">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search by mentor or mentee ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="filter-group">
            <FaFilter className="filter-icon" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as 'all' | 'scheduled' | 'completed' | 'cancelled' | 'no-show')}
            >
              <option value="all">All Statuses</option>
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="no-show">No Show</option>
            </select>
          </div>
        </div>

        {/* Sessions Table */}
        <div className="sessions-table-container">
          <table className="sessions-table">
            <thead>
              <tr>
                <th>Session Details</th>
                <th>Date & Time</th>
                <th>Participants</th>
                <th>Status</th>
                <th>Feedback</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSessions.map((session) => (
                <tr key={session.id}>
                  <td>
                    <div className="session-details">
                      <div className="session-id">
                        Session #{session.id.slice(-8)}
                      </div>
                      <div className="session-location">
                        {session.sessionLocation}
                      </div>
                      {session.sessionLink && (
                        <a
                          href={session.sessionLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="session-link"
                        >
                          Join Link
                        </a>
                      )}
                    </div>
                  </td>
                  
                  <td>
                    <div className="date-time">
                      <div className="date-display">
                        {formatDate(session.sessionDate)}
                      </div>
                      <div className="time-display">
                        {formatTime(session.startTime)} - {formatTime(session.endTime)}
                      </div>
                    </div>
                  </td>
                  
                  <td>
                    <div className="participants">
                      <div className="participant-id">
                        Mentor: {session.mentorId.slice(-8)}
                      </div>
                      <div className="participant-id">
                        Mentee: {session.menteeId.slice(-8)}
                      </div>
                    </div>
                  </td>
                  
                  <td>
                    <span className={`status-badge ${session.status}`}>
                      {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                    </span>
                  </td>
                  
                  <td>
                    <div className="feedback-indicators">
                      <div className={`feedback-indicator ${session.feedbackSubmitted_mentor ? 'submitted' : 'pending'}`}>
                        Mentor: {session.feedbackSubmitted_mentor ? '✓' : '✗'}
                      </div>
                      <div className={`feedback-indicator ${session.feedbackSubmitted_mentee ? 'submitted' : 'pending'}`}>
                        Mentee: {session.feedbackSubmitted_mentee ? '✓' : '✗'}
                      </div>
                    </div>
                  </td>
                  
                  <td>
                    <select
                      value={session.status}
                      onChange={(e) => updateSessionStatus(session.id, e.target.value as Session['status'])}
                      className="action-dropdown"
                    >
                      <option value="scheduled">Scheduled</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="no-show">No Show</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
