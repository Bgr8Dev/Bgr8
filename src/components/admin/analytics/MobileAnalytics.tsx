import React from 'react';
import { 
  FaChartBar, 
  FaUsers, 
  FaCalendarAlt, 
  FaComments,
  FaEnvelope,
  FaChalkboardTeacher,
  FaBug,
  FaHandshake,
  FaCog,
  FaArrowUp,
  FaArrowDown,
  FaMinus
} from 'react-icons/fa';
import './MobileAnalytics.css';

interface AnalyticsData {
  totalUsers: number;
  newUsersThisMonth: number;
  totalMentors: number;
  activeMentors: number;
  totalSessions: number;
  sessionsThisMonth: number;
  totalEnquiries: number;
  pendingEnquiries: number;
  totalFeedback: number;
  averageRating: number;
  totalTestingFeedback: number;
  pendingTestingFeedback: number;
  totalAmbassadors: number;
  pendingAmbassadors: number;
}

const MobileAnalytics: React.FC = () => {
  // Mock data - in a real app, this would come from your backend
  const analyticsData: AnalyticsData = {
    totalUsers: 1247,
    newUsersThisMonth: 89,
    totalMentors: 156,
    activeMentors: 142,
    totalSessions: 2341,
    sessionsThisMonth: 187,
    totalEnquiries: 456,
    pendingEnquiries: 23,
    totalFeedback: 1892,
    averageRating: 4.7,
    totalTestingFeedback: 234,
    pendingTestingFeedback: 12,
    totalAmbassadors: 45,
    pendingAmbassadors: 8
  };

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) return <FaArrowUp className="trend-up" />;
    if (current < previous) return <FaArrowDown className="trend-down" />;
    return <FaMinus className="trend-neutral" />;
  };

  const getTrendPercentage = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  return (
    <div className="mobile-analytics">
      {/* Overview Cards */}
      <div className="analytics-overview">
        <h3>Platform Overview</h3>
        <div className="overview-grid">
          <div className="overview-card users">
            <div className="card-icon">
              <FaUsers />
            </div>
            <div className="card-content">
              <h4>Total Users</h4>
              <p className="card-number">{analyticsData.totalUsers.toLocaleString()}</p>
              <div className="card-trend">
                {getTrendIcon(analyticsData.newUsersThisMonth, 75)}
                <span>+{analyticsData.newUsersThisMonth} this month</span>
              </div>
            </div>
          </div>

          <div className="overview-card mentors">
            <div className="card-icon">
              <FaChalkboardTeacher />
            </div>
            <div className="card-content">
              <h4>Active Mentors</h4>
              <p className="card-number">{analyticsData.activeMentors}</p>
              <div className="card-trend">
                {getTrendIcon(analyticsData.activeMentors, 138)}
                <span>{getTrendPercentage(analyticsData.activeMentors, 138)}% vs last month</span>
              </div>
            </div>
          </div>

          <div className="overview-card sessions">
            <div className="card-icon">
              <FaCalendarAlt />
            </div>
            <div className="card-content">
              <h4>Sessions</h4>
              <p className="card-number">{analyticsData.sessionsThisMonth}</p>
              <div className="card-trend">
                {getTrendIcon(analyticsData.sessionsThisMonth, 165)}
                <span>{getTrendPercentage(analyticsData.sessionsThisMonth, 165)}% vs last month</span>
              </div>
            </div>
          </div>

          <div className="overview-card rating">
            <div className="card-icon">
              <FaComments />
            </div>
            <div className="card-content">
              <h4>Avg Rating</h4>
              <p className="card-number">{analyticsData.averageRating}</p>
              <div className="card-trend">
                {getTrendIcon(analyticsData.averageRating, 4.6)}
                <span>{getTrendPercentage(analyticsData.averageRating * 10, 4.6 * 10)}% vs last month</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Metrics */}
      <div className="analytics-metrics">
        <h3>Detailed Metrics</h3>
        
        <div className="metrics-section">
          <h4>User Management</h4>
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-header">
                <FaUsers className="metric-icon" />
                <span className="metric-title">Total Users</span>
              </div>
              <div className="metric-value">{analyticsData.totalUsers.toLocaleString()}</div>
              <div className="metric-subtitle">+{analyticsData.newUsersThisMonth} new this month</div>
            </div>

            <div className="metric-card">
              <div className="metric-header">
                <FaChalkboardTeacher className="metric-icon" />
                <span className="metric-title">Total Mentors</span>
              </div>
              <div className="metric-value">{analyticsData.totalMentors}</div>
              <div className="metric-subtitle">{analyticsData.activeMentors} currently active</div>
            </div>
          </div>
        </div>

        <div className="metrics-section">
          <h4>Sessions & Engagement</h4>
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-header">
                <FaCalendarAlt className="metric-icon" />
                <span className="metric-title">Total Sessions</span>
              </div>
              <div className="metric-value">{analyticsData.totalSessions.toLocaleString()}</div>
              <div className="metric-subtitle">{analyticsData.sessionsThisMonth} this month</div>
            </div>

            <div className="metric-card">
              <div className="metric-header">
                <FaComments className="metric-icon" />
                <span className="metric-title">Total Feedback</span>
              </div>
              <div className="metric-value">{analyticsData.totalFeedback.toLocaleString()}</div>
              <div className="metric-subtitle">Avg rating: {analyticsData.averageRating}/5</div>
            </div>
          </div>
        </div>

        <div className="metrics-section">
          <h4>Support & Applications</h4>
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-header">
                <FaEnvelope className="metric-icon" />
                <span className="metric-title">Enquiries</span>
              </div>
              <div className="metric-value">{analyticsData.totalEnquiries}</div>
              <div className="metric-subtitle">{analyticsData.pendingEnquiries} pending</div>
            </div>

            <div className="metric-card">
              <div className="metric-header">
                <FaBug className="metric-icon" />
                <span className="metric-title">Testing Feedback</span>
              </div>
              <div className="metric-value">{analyticsData.totalTestingFeedback}</div>
              <div className="metric-subtitle">{analyticsData.pendingTestingFeedback} pending</div>
            </div>

            <div className="metric-card">
              <div className="metric-header">
                <FaHandshake className="metric-icon" />
                <span className="metric-title">Ambassadors</span>
              </div>
              <div className="metric-value">{analyticsData.totalAmbassadors}</div>
              <div className="metric-subtitle">{analyticsData.pendingAmbassadors} pending</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="analytics-actions">
        <h3>Quick Actions</h3>
        <div className="actions-grid">
          <button className="action-btn primary">
            <FaChartBar />
            <span>View Detailed Reports</span>
          </button>
          <button className="action-btn secondary">
            <FaUsers />
            <span>User Analytics</span>
          </button>
          <button className="action-btn secondary">
            <FaComments />
            <span>Feedback Analysis</span>
          </button>
          <button className="action-btn secondary">
            <FaCog />
            <span>Export Data</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobileAnalytics;
