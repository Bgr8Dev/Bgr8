import React, { useState, useEffect } from 'react';
import { firestore } from '../../firebase/firebase';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { SessionFeedback } from '../../types/b8fc';
import type { FeedbackAnalytics } from '../../types/b8fc';
import { FaStar, FaComments, FaUsers, FaThumbsUp } from 'react-icons/fa';
import '../../styles/adminStyles/FeedbackAnalytics.css';

export default function FeedbackAnalytics() {
  const [, setFeedbackData] = useState<SessionFeedback[]>([]);
  const [analytics, setAnalytics] = useState<FeedbackAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeedbackData = async () => {
      try {
        setLoading(true);
        const feedbackQuery = query(
          collection(firestore, 'feedback'),
          orderBy('submittedAt', 'desc'),
          limit(100)
        );
        
        const snapshot = await getDocs(feedbackQuery);
        const feedback: SessionFeedback[] = [];
        
        snapshot.forEach(doc => {
          const data = doc.data();
          feedback.push({
            id: doc.id,
            ...data,
            sessionDate: data.sessionDate?.toDate?.() || new Date(data.sessionDate),
            submittedAt: data.submittedAt?.toDate?.() || new Date(data.submittedAt),
            isCalComBooking: data.isCalComBooking || false,
            calComBookingId: data.calComBookingId || null
          } as unknown as SessionFeedback);
        });
        
        setFeedbackData(feedback);
        
        // Calculate analytics
        const analyticsData = calculateAnalytics(feedback);
        setAnalytics(analyticsData);
        
      } catch (err) {
        console.error('Error fetching feedback data:', err);
        setError('Failed to load feedback data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchFeedbackData();
  }, []);

  const calculateAnalytics = (feedback: SessionFeedback[]): FeedbackAnalytics => {
    const totalFeedback = feedback.length;
    const totalRating = feedback.reduce((sum, f) => sum + f.overallRating, 0);
    const averageRating = totalFeedback > 0 ? totalRating / totalFeedback : 0;
    
    const feedbackByMentor: Record<string, {
      totalSessions: number;
      totalFeedback: number;
      averageRating: number;
      strengths: string[];
      improvements: string[];
    }> = {};
    const feedbackByMentee: Record<string, {
      totalSessions: number;
      totalFeedback: number;
      averageRating: number;
      learnings: string[];
    }> = {};
    
    feedback.forEach(f => {
      // Group by mentor
      if (!feedbackByMentor[f.mentorId]) {
        feedbackByMentor[f.mentorId] = {
          totalSessions: 0,
          totalFeedback: 0,
          averageRating: 0,
          strengths: [],
          improvements: []
        };
      }
      
      if (f.feedbackType === 'mentor') {
        feedbackByMentor[f.mentorId].totalFeedback++;
        feedbackByMentor[f.mentorId].averageRating += f.overallRating;
        if (f.strengths) feedbackByMentor[f.mentorId].strengths.push(f.strengths);
        if (f.improvements) feedbackByMentor[f.mentorId].improvements.push(f.improvements);
      }
      
      // Group by mentee
      if (!feedbackByMentee[f.menteeId]) {
        feedbackByMentee[f.menteeId] = {
          totalSessions: 0,
          totalFeedback: 0,
          averageRating: 0,
          learnings: []
        };
      }
      
      if (f.feedbackType === 'mentee') {
        feedbackByMentee[f.menteeId].totalFeedback++;
        feedbackByMentee[f.menteeId].averageRating += f.overallRating;
        if (f.learnings) feedbackByMentee[f.menteeId].learnings.push(f.learnings);
      }
    });
    
    // Calculate averages
    Object.keys(feedbackByMentor).forEach(mentorId => {
      const mentor = feedbackByMentor[mentorId];
      if (mentor.totalFeedback > 0) {
        mentor.averageRating = mentor.averageRating / mentor.totalFeedback;
      }
    });
    
    Object.keys(feedbackByMentee).forEach(menteeId => {
      const mentee = feedbackByMentee[menteeId];
      if (mentee.totalFeedback > 0) {
        mentee.averageRating = mentee.averageRating / mentee.totalFeedback;
      }
    });
    
    return {
      totalFeedback,
      averageRating: Math.round(averageRating * 10) / 10,
      feedbackByMentor,
      feedbackByMentee,
      recentFeedback: feedback.slice(0, 10)
    };
  };

  const renderStarRating = (rating: number) => {
    return (
      <div className="star-display">
        {[1, 2, 3, 4, 5].map(star => (
          <FaStar
            key={star}
            className={star <= rating ? 'filled' : 'empty'}
          />
        ))}
        <span className="rating-text">{rating.toFixed(1)}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="feedback-analytics">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading feedback analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="feedback-analytics">
        <div className="error-container">
          <h2>Error</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="feedback-analytics">
        <div className="empty-container">
          <h2>No Feedback Data</h2>
          <p>No feedback has been submitted yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="feedback-analytics">
      <div className="analytics-header">
        <h2>Feedback Analytics</h2>
        <p>Insights from mentor and mentee feedback</p>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card">
          <div className="card-icon">
            <FaComments />
          </div>
          <div className="card-content">
            <h3>{analytics.totalFeedback}</h3>
            <p>Total Feedback</p>
          </div>
        </div>
        
        <div className="summary-card">
          <div className="card-icon">
            <FaStar />
          </div>
          <div className="card-content">
            <h3>{analytics.averageRating}</h3>
            <p>Average Rating</p>
          </div>
        </div>
        
        <div className="summary-card">
          <div className="card-icon">
            <FaUsers />
          </div>
          <div className="card-content">
            <h3>{Object.keys(analytics.feedbackByMentor).length}</h3>
            <p>Mentors with Feedback</p>
          </div>
        </div>
        
        <div className="summary-card">
          <div className="card-icon">
            <FaThumbsUp />
          </div>
          <div className="card-content">
            <h3>{Math.round((analytics.averageRating / 5) * 100)}%</h3>
            <p>Satisfaction Rate</p>
          </div>
        </div>
      </div>

      {/* Recent Feedback */}
      <div className="recent-feedback">
        <h3>Recent Feedback</h3>
        <div className="feedback-list">
          {analytics.recentFeedback.map(feedback => (
            <div key={feedback.id} className="feedback-item">
                             <div className="feedback-header">
                 <div className="feedback-meta">
                   <span className="feedback-type">{feedback.feedbackType}</span>
                   <span className="feedback-date">
                     {feedback.submittedAt.toLocaleDateString('en-GB')}
                   </span>
                   {feedback.isCalComBooking && (
                     <span className="calcom-badge">Cal.com</span>
                   )}
                 </div>
                 {renderStarRating(feedback.overallRating)}
               </div>
              
              <div className="feedback-content">
                <div className="feedback-session">
                  <strong>Session:</strong> {feedback.mentorName} & {feedback.menteeName}
                </div>
                
                <div className="feedback-text">
                  <div className="feedback-section">
                    <strong>Strengths:</strong> {feedback.strengths}
                  </div>
                  <div className="feedback-section">
                    <strong>Improvements:</strong> {feedback.improvements}
                  </div>
                  <div className="feedback-section">
                    <strong>Learnings:</strong> {feedback.learnings}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mentor Performance */}
      <div className="mentor-performance">
        <h3>Mentor Performance</h3>
        <div className="performance-grid">
                     {Object.entries(analytics.feedbackByMentor)
             .filter(([, data]) => data.totalFeedback > 0)
             .sort(([, a], [, b]) => b.averageRating - a.averageRating)
            .slice(0, 5)
            .map(([mentorId, data]) => (
              <div key={mentorId} className="performance-card">
                <div className="mentor-info">
                  <h4>Mentor ID: {mentorId}</h4>
                  <p>{data.totalFeedback} feedback received</p>
                </div>
                <div className="mentor-rating">
                  {renderStarRating(data.averageRating)}
                </div>
                <div className="mentor-insights">
                  <div className="insight-section">
                    <strong>Top Strengths:</strong>
                    <ul>
                      {data.strengths.slice(0, 3).map((strength, idx) => (
                        <li key={idx}>{strength}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="insight-section">
                    <strong>Areas for Improvement:</strong>
                    <ul>
                      {data.improvements.slice(0, 3).map((improvement, idx) => (
                        <li key={idx}>{improvement}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
} 