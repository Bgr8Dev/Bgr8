import React from 'react';
import { 
  FaPaperPlane, 
  FaEye, 
  FaMousePointer, 
  FaChartLine, 
  FaExclamationTriangle
} from 'react-icons/fa';

interface AnalyticsTabProps {
  analytics: {
    totalSent: number;
    totalOpens: number;
    totalClicks: number;
    openRate: number;
    clickRate: number;
    bounceRate: number;
  };
}

export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({ analytics }) => {
  return (
    <div className="email-analytics-section">
      <div className="email-analytics-header">
        <h3>Email Analytics</h3>
        <p>Track your email performance and engagement</p>
      </div>
      <div className="email-analytics-grid">
        <div className="email-analytics-card email-analytics-sent">
          <div className="email-analytics-icon">
            <FaPaperPlane />
          </div>
          <div className="email-analytics-content">
            <h4>Total Sent</h4>
            <span className="email-analytics-number">{analytics.totalSent}</span>
          </div>
        </div>
        <div className="email-analytics-card email-analytics-opens">
          <div className="email-analytics-icon">
            <FaEye />
          </div>
          <div className="email-analytics-content">
            <h4>Total Opens</h4>
            <span className="email-analytics-number">{analytics.totalOpens}</span>
          </div>
        </div>
        <div className="email-analytics-card email-analytics-clicks">
          <div className="email-analytics-icon">
            <FaMousePointer />
          </div>
          <div className="email-analytics-content">
            <h4>Total Clicks</h4>
            <span className="email-analytics-number">{analytics.totalClicks}</span>
          </div>
        </div>
        <div className="email-analytics-card email-analytics-open-rate">
          <div className="email-analytics-icon">
            <FaChartLine />
          </div>
          <div className="email-analytics-content">
            <h4>Open Rate</h4>
            <span className="email-analytics-number">{analytics.openRate.toFixed(1)}%</span>
          </div>
        </div>
        <div className="email-analytics-card email-analytics-click-rate">
          <div className="email-analytics-icon">
            <FaMousePointer />
          </div>
          <div className="email-analytics-content">
            <h4>Click Rate</h4>
            <span className="email-analytics-number">{analytics.clickRate.toFixed(1)}%</span>
          </div>
        </div>
        <div className="email-analytics-card email-analytics-bounce-rate">
          <div className="email-analytics-icon">
            <FaExclamationTriangle />
          </div>
          <div className="email-analytics-content">
            <h4>Bounce Rate</h4>
            <span className="email-analytics-number">{analytics.bounceRate.toFixed(1)}%</span>
          </div>
        </div>
      </div>
      <div className="email-analytics-chart">
        <h4>Email Performance Over Time</h4>
        <div className="email-chart-placeholder">
          <FaChartLine className="email-chart-icon" />
          <p>Chart visualization coming soon</p>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsTab;
