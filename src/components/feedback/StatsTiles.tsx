import React from 'react';
import { FaBug, FaCheckCircle, FaPause, FaTimesCircle, FaCopy } from 'react-icons/fa';
import { FeedbackStats, FeedbackStatus } from '../../types/feedback';
import './StatsTiles.css';

interface StatsTilesProps {
  stats: FeedbackStats | null;
  onStatusClick?: (status: FeedbackStatus | 'all') => void;
  activeStatus?: FeedbackStatus | 'all';
}

export const StatsTiles: React.FC<StatsTilesProps> = ({ 
  stats, 
  onStatusClick, 
  activeStatus = 'all' 
}) => {
  if (!stats) return null;

  const handleStatusClick = (status: FeedbackStatus | 'all') => {
    if (onStatusClick) {
      onStatusClick(status);
    }
  };

  return (
    <div className="stats-tiles">
      <div 
        className={`stat-card total ${activeStatus === 'all' ? 'active' : ''}`}
        onClick={() => handleStatusClick('all')}
        title="Click to show all tickets"
      >
        <div className="stat-icon">
          <FaBug />
        </div>
        <div className="stat-content">
          <h3>Total Tickets</h3>
          <p>{stats.total}</p>
        </div>
      </div>
      
      <div 
        className={`stat-card draft ${activeStatus === 'draft' ? 'active' : ''}`}
        onClick={() => handleStatusClick('draft')}
        title="Click to filter by draft tickets"
      >
        <div className="stat-icon">
          <FaPause />
        </div>
        <div className="stat-content">
          <h3>Draft</h3>
          <p>{stats.draft}</p>
        </div>
      </div>
      
      <div 
        className={`stat-card open ${activeStatus === 'open' ? 'active' : ''}`}
        onClick={() => handleStatusClick('open')}
        title="Click to filter by open tickets"
      >
        <div className="stat-icon">
          <FaCheckCircle />
        </div>
        <div className="stat-content">
          <h3>Open</h3>
          <p>{stats.open}</p>
        </div>
      </div>
      
      <div 
        className={`stat-card in-progress ${activeStatus === 'in_progress' ? 'active' : ''}`}
        onClick={() => handleStatusClick('in_progress')}
        title="Click to filter by in progress tickets"
      >
        <div className="stat-icon">
          <FaPause />
        </div>
        <div className="stat-content">
          <h3>In Progress</h3>
          <p>{stats.inProgress}</p>
        </div>
      </div>
      
      <div 
        className={`stat-card resolved ${activeStatus === 'resolved' ? 'active' : ''}`}
        onClick={() => handleStatusClick('resolved')}
        title="Click to filter by resolved tickets"
      >
        <div className="stat-icon">
          <FaCheckCircle />
        </div>
        <div className="stat-content">
          <h3>Resolved</h3>
          <p>{stats.resolved}</p>
        </div>
      </div>
      
      <div 
        className={`stat-card closed ${activeStatus === 'closed' ? 'active' : ''}`}
        onClick={() => handleStatusClick('closed')}
        title="Click to filter by closed tickets"
      >
        <div className="stat-icon">
          <FaTimesCircle />
        </div>
        <div className="stat-content">
          <h3>Closed</h3>
          <p>{stats.closed}</p>
        </div>
      </div>
      
      <div 
        className={`stat-card duplicate ${activeStatus === 'duplicate' ? 'active' : ''}`}
        onClick={() => handleStatusClick('duplicate')}
        title="Click to filter by duplicate tickets"
      >
        <div className="stat-icon">
          <FaCopy />
        </div>
        <div className="stat-content">
          <h3>Duplicate</h3>
          <p>{stats.duplicate}</p>
        </div>
      </div>
    </div>
  );
};

export default StatsTiles;
