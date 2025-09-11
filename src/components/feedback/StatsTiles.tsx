import React from 'react';
import { FaBug, FaCheckCircle, FaPause, FaTimesCircle, FaCopy } from 'react-icons/fa';
import { FeedbackStats } from '../../types/feedback';
import './StatsTiles.css';

interface StatsTilesProps {
  stats: FeedbackStats | null;
}

export const StatsTiles: React.FC<StatsTilesProps> = ({ stats }) => {
  if (!stats) return null;

  return (
    <div className="stats-tiles">
      <div className="stat-card total">
        <div className="stat-icon">
          <FaBug />
        </div>
        <div className="stat-content">
          <h3>Total Tickets</h3>
          <p>{stats.total}</p>
        </div>
      </div>
      
      <div className="stat-card draft">
        <div className="stat-icon">
          <FaPause />
        </div>
        <div className="stat-content">
          <h3>Draft</h3>
          <p>{stats.draft}</p>
        </div>
      </div>
      
      <div className="stat-card open">
        <div className="stat-icon">
          <FaCheckCircle />
        </div>
        <div className="stat-content">
          <h3>Open</h3>
          <p>{stats.open}</p>
        </div>
      </div>
      
      <div className="stat-card in-progress">
        <div className="stat-icon">
          <FaPause />
        </div>
        <div className="stat-content">
          <h3>In Progress</h3>
          <p>{stats.inProgress}</p>
        </div>
      </div>
      
      <div className="stat-card resolved">
        <div className="stat-icon">
          <FaCheckCircle />
        </div>
        <div className="stat-content">
          <h3>Resolved</h3>
          <p>{stats.resolved}</p>
        </div>
      </div>
      
      <div className="stat-card closed">
        <div className="stat-icon">
          <FaTimesCircle />
        </div>
        <div className="stat-content">
          <h3>Closed</h3>
          <p>{stats.closed}</p>
        </div>
      </div>
      
      <div className="stat-card duplicate">
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
