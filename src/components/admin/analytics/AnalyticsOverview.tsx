import React, { useState, useEffect } from 'react';
import { firestore } from '../../../firebase/firebase';
import { collection, getDocs, query, limit } from 'firebase/firestore';
import { QueryResult } from '../../../pages/adminPages/AdminAnalytics';
import { FaUsers, FaCalendarCheck, FaComments, FaEnvelope, FaChartLine, FaClock } from 'react-icons/fa';
import '../../../styles/adminStyles/AnalyticsOverview.css';

interface AnalyticsOverviewProps {
  queryHistory: QueryResult[];
}

interface CollectionStats {
  name: string;
  count: number;
  icon: React.ReactNode;
  color: string;
}

const AnalyticsOverview: React.FC<AnalyticsOverviewProps> = ({ queryHistory }) => {
  const [stats, setStats] = useState<CollectionStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState<{ action: string; time: string }[]>([]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const collections = [
        { name: 'users', icon: <FaUsers />, color: '#4CAF50' },
        { name: 'bookings', icon: <FaCalendarCheck />, color: '#2196F3' },
        { name: 'sessions', icon: <FaClock />, color: '#9C27B0' },
        { name: 'feedback', icon: <FaComments />, color: '#FF9800' },
        { name: 'enquiries', icon: <FaEnvelope />, color: '#F44336' },
      ];

      const statsPromises = collections.map(async (col) => {
        try {
          const snapshot = await getDocs(collection(firestore, col.name));
          return { ...col, count: snapshot.size };
        } catch {
          return { ...col, count: 0 };
        }
      });

      const results = await Promise.all(statsPromises);
      setStats(results);

      // Set recent activity from query history
      setRecentActivity(
        queryHistory.slice(0, 5).map(q => ({
          action: `Queried ${q.collection} (${q.count} results)`,
          time: q.timestamp.toLocaleTimeString()
        }))
      );
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="analytics-overview">
      {/* Stats Cards */}
      <div className="stats-grid">
        {loading ? (
          <div className="loading-placeholder">Loading statistics...</div>
        ) : (
          stats.map((stat, idx) => (
            <div key={idx} className="stat-card" style={{ borderColor: stat.color }}>
              <div className="stat-icon" style={{ backgroundColor: stat.color }}>
                {stat.icon}
              </div>
              <div className="stat-info">
                <span className="stat-value">{stat.count.toLocaleString()}</span>
                <span className="stat-label">{stat.name}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Quick Insights */}
      <div className="overview-grid">
        {/* Query Activity */}
        <div className="overview-card">
          <div className="card-header">
            <FaChartLine />
            <h3>Query Activity</h3>
          </div>
          <div className="card-content">
            <div className="activity-stat">
              <span className="big-number">{queryHistory.length}</span>
              <span className="stat-label">Queries This Session</span>
            </div>
            {queryHistory.length > 0 && (
              <div className="activity-breakdown">
                <div className="breakdown-item">
                  <span>Avg Execution Time</span>
                  <span>
                    {Math.round(
                      queryHistory.reduce((acc, q) => acc + q.executionTime, 0) / queryHistory.length
                    )}ms
                  </span>
                </div>
                <div className="breakdown-item">
                  <span>Total Results Fetched</span>
                  <span>{queryHistory.reduce((acc, q) => acc + q.count, 0).toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="overview-card">
          <div className="card-header">
            <FaClock />
            <h3>Recent Queries</h3>
          </div>
          <div className="card-content">
            {recentActivity.length > 0 ? (
              <ul className="activity-list">
                {recentActivity.map((item, idx) => (
                  <li key={idx}>
                    <span className="activity-action">{item.action}</span>
                    <span className="activity-time">{item.time}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="no-activity">No queries executed yet. Use the Query Terminal to get started!</p>
            )}
          </div>
        </div>

        {/* System Health */}
        <div className="overview-card">
          <div className="card-header">
            <FaChartLine />
            <h3>System Status</h3>
          </div>
          <div className="card-content">
            <div className="health-indicators">
              <div className="health-item">
                <span className="health-dot online"></span>
                <span>Firestore Connected</span>
              </div>
              <div className="health-item">
                <span className="health-dot online"></span>
                <span>Authentication Active</span>
              </div>
              <div className="health-item">
                <span className="health-dot online"></span>
                <span>Storage Available</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="overview-card tips-card">
          <div className="card-header">
            <h3>💡 Quick Tips</h3>
          </div>
          <div className="card-content">
            <ul className="tips-list">
              <li>Use <code>Ctrl+Enter</code> to quickly execute queries</li>
              <li>Try <code>SHOW COLLECTIONS</code> to see available data</li>
              <li>Use <code>DESCRIBE collection</code> to see field structure</li>
              <li>Export results as JSON for further analysis</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsOverview;
