import { BusinessStats } from '../../types/admin';

interface BusinessSectionProps {
  stats: BusinessStats;
  businessName: string;
}

export function BusinessSection({ stats}: BusinessSectionProps) {
  return (
    <div className="business-section">
      <div className="business-stats-grid">
        <div className="business-stat-card">
          <h4>Total Members</h4>
          <p>{stats.totalMembers}</p>
        </div>
        <div className="business-stat-card">
          <h4>Active Members</h4>
          <p>{stats.activeMembers}</p>
        </div>
        <div className="business-stat-card">
          <h4>Revenue</h4>
          <p>£{stats.revenue.toLocaleString()}</p>
        </div>
        <div className="business-stat-card">
          <h4>Engagement Rate</h4>
          <p>{stats.activeMembers > 0 ? 
            ((stats.activeMembers / stats.totalMembers) * 100).toFixed(1) : 0}%</p>
        </div>
      </div>

      <div className="business-actions">
        <button className="action-button">
          Manage Members
        </button>
        <button className="action-button">
          View Reports
        </button>
        <button className="action-button">
          Settings
        </button>
      </div>
    </div>
  );
} 