import React, { useState, useMemo } from 'react';
import { 
  FaTrophy, 
  FaMedal, 
  FaAward, 
  FaArrowUp, 
  FaArrowDown, 
  FaMinus,
  FaStar,
  FaUsers,
  FaChartLine,
  FaFilter,
  FaSearch,
  FaChevronDown,
  FaChevronUp,
  FaEye,
  FaEyeSlash,
  FaDownload,
  FaSync
} from 'react-icons/fa';
import { MentorMetrics } from '../../../types/b8fc';
import '../../../styles/adminStyles/MentorRanking.css';

interface MentorRankingProps {
  mentorMetrics: MentorMetrics[];
  loading?: boolean;
  onRefresh?: () => void;
  onExport?: (mentors: MentorMetrics[]) => void;
}

type SortField = 'rank' | 'averageRating' | 'totalFeedback' | 'consistency' | 'responseRate' | 'trend';
type TimeFilter = 'all' | '30days' | '90days' | '6months' | '1year';

export default function MentorRanking({ 
  mentorMetrics, 
  loading = false, 
  onRefresh, 
  onExport 
}: MentorRankingProps) {
  const [sortBy, setSortBy] = useState<SortField>('rank');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedMentors, setSelectedMentors] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'leaderboard' | 'detailed' | 'comparison'>('leaderboard');
  const [expandedMentor, setExpandedMentor] = useState<string | null>(null);

  // Filter and sort mentors
  const filteredAndSortedMentors = useMemo(() => {
    let filtered = [...mentorMetrics];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(mentor => 
        mentor.mentorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mentor.mentorId.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply time filter (this would need to be implemented based on your data structure)
    // For now, we'll show all mentors

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: number | string, bValue: number | string;
      
      switch (sortBy) {
        case 'rank':
          aValue = a.rank;
          bValue = b.rank;
          break;
        case 'averageRating':
          aValue = a.averageRating;
          bValue = b.averageRating;
          break;
        case 'totalFeedback':
          aValue = a.totalFeedback;
          bValue = b.totalFeedback;
          break;
        case 'consistency':
          aValue = a.consistency;
          bValue = b.consistency;
          break;
        case 'responseRate':
          aValue = a.responseRate;
          bValue = b.responseRate;
          break;
        case 'trend': {
          const trendOrder = { 'improving': 3, 'stable': 2, 'declining': 1 };
          aValue = trendOrder[a.trend];
          bValue = trendOrder[b.trend];
          break;
        }
        default:
          return 0;
      }
      
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [mentorMetrics, searchTerm, sortBy, sortOrder]);

  const handleSelectMentor = (mentorId: string) => {
    const newSelected = new Set(selectedMentors);
    if (newSelected.has(mentorId)) {
      newSelected.delete(mentorId);
    } else {
      newSelected.add(mentorId);
    }
    setSelectedMentors(newSelected);
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <FaTrophy className="rank-icon gold" />;
    if (rank === 2) return <FaMedal className="rank-icon silver" />;
    if (rank === 3) return <FaAward className="rank-icon bronze" />;
    return <span className="rank-number">{rank}</span>;
  };

  const getTrendIcon = (trend: 'improving' | 'stable' | 'declining') => {
    switch (trend) {
      case 'improving':
        return <FaArrowUp className="trend-icon improving" />;
      case 'declining':
        return <FaArrowDown className="trend-icon declining" />;
      default:
        return <FaMinus className="trend-icon stable" />;
    }
  };

  const renderStarRating = (rating: number, showNumber: boolean = true) => {
    return (
      <div className="star-rating">
        {[1, 2, 3, 4, 5].map(star => (
          <FaStar
            key={star}
            className={star <= rating ? 'star filled' : 'star empty'}
          />
        ))}
        {showNumber && <span className="rating-number">{rating.toFixed(1)}</span>}
      </div>
    );
  };

  const renderLeaderboardCard = (mentor: MentorMetrics) => (
    <div 
      key={mentor.mentorId} 
      className={`mentor-rankings-card ${selectedMentors.has(mentor.mentorId) ? 'mentor-rankings-selected' : ''}`}
      onClick={() => handleSelectMentor(mentor.mentorId)}
    >
      <div className="mentor-rankings-card-header">
        <div className="mentor-rankings-rank-section">
          {getRankIcon(mentor.rank)}
        </div>
        <div className="mentor-rankings-mentor-info">
          <h3 className="mentor-rankings-mentor-name">{mentor.mentorName}</h3>
          <p className="mentor-rankings-mentor-id">ID: {mentor.mentorId.substring(0, 8)}...</p>
        </div>
        <div className="mentor-rankings-trend-section">
          {getTrendIcon(mentor.trend)}
        </div>
      </div>
      
      <div className="mentor-rankings-card-metrics">
        <div className="mentor-rankings-metric">
          <span className="mentor-rankings-metric-label">Overall Rating</span>
          <div className="mentor-rankings-metric-value">
            {renderStarRating(mentor.averageRating)}
          </div>
        </div>
        
        <div className="mentor-rankings-metric">
          <span className="mentor-rankings-metric-label">Feedback Count</span>
          <span className="mentor-rankings-metric-value">{mentor.totalFeedback}</span>
        </div>
        
        <div className="mentor-rankings-metric">
          <span className="mentor-rankings-metric-label">Response Rate</span>
          <span className="mentor-rankings-metric-value">{mentor.responseRate.toFixed(1)}%</span>
        </div>
        
        <div className="mentor-rankings-metric">
          <span className="mentor-rankings-metric-label">Consistency</span>
          <span className="mentor-rankings-metric-value">{mentor.consistency.toFixed(2)}</span>
        </div>
      </div>
      
      <div className="mentor-rankings-card-footer">
        <div className="mentor-rankings-percentile">
          Top {mentor.percentile}% of mentors
        </div>
        <div className="mentor-rankings-last-activity">
          Last active: {mentor.lastActivity.toLocaleDateString()}
        </div>
      </div>
    </div>
  );

  const renderDetailedTable = () => (
    <div className="mentor-rankings-detailed-table-container">
      <table className="mentor-rankings-table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Mentor</th>
            <th>Overall Rating</th>
            <th>Helpfulness</th>
            <th>Comfort</th>
            <th>Support</th>
            <th>Feedback Count</th>
            <th>Response Rate</th>
            <th>Consistency</th>
            <th>Trend</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredAndSortedMentors.map(mentor => (
            <tr key={mentor.mentorId} className={selectedMentors.has(mentor.mentorId) ? 'mentor-rankings-selected' : ''}>
              <td className="mentor-rankings-rank-cell">
                {getRankIcon(mentor.rank)}
              </td>
              <td className="mentor-rankings-mentor-cell">
                <div className="mentor-rankings-mentor-info">
                  <div className="mentor-rankings-mentor-name">{mentor.mentorName}</div>
                  <div className="mentor-rankings-mentor-id">{mentor.mentorId.substring(0, 8)}...</div>
                </div>
              </td>
              <td className="mentor-rankings-rating-cell">
                {renderStarRating(mentor.averageRating)}
              </td>
              <td className="mentor-rankings-rating-cell">
                {renderStarRating(mentor.averageHelpfulness)}
              </td>
              <td className="mentor-rankings-rating-cell">
                {renderStarRating(mentor.averageComfort)}
              </td>
              <td className="mentor-rankings-rating-cell">
                {renderStarRating(mentor.averageSupport)}
              </td>
              <td className="mentor-rankings-number-cell">{mentor.totalFeedback}</td>
              <td className="mentor-rankings-number-cell">{mentor.responseRate.toFixed(1)}%</td>
              <td className="mentor-rankings-number-cell">{mentor.consistency.toFixed(2)}</td>
              <td className="mentor-rankings-trend-cell">
                {getTrendIcon(mentor.trend)}
              </td>
              <td className="mentor-rankings-actions-cell">
                <button 
                  className="mentor-rankings-expand-btn"
                  onClick={() => setExpandedMentor(expandedMentor === mentor.mentorId ? null : mentor.mentorId)}
                >
                  {expandedMentor === mentor.mentorId ? <FaEyeSlash /> : <FaEye />}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderMentorDetails = (mentor: MentorMetrics) => (
    <div className="mentor-rankings-mentor-details">
      <div className="mentor-rankings-details-grid">
        <div className="mentor-rankings-detail-section">
          <h4>Top Strengths</h4>
          <ul>
            {mentor.topStrengths.map((strength, index) => (
              <li key={index}>{strength}</li>
            ))}
          </ul>
        </div>
        
        <div className="mentor-rankings-detail-section">
          <h4>Common Improvements</h4>
          <ul>
            {mentor.commonImprovements.map((improvement, index) => (
              <li key={index}>{improvement}</li>
            ))}
          </ul>
        </div>
        
        <div className="mentor-rankings-detail-section">
          <h4>Recent Feedback</h4>
          <div className="mentor-rankings-recent-feedback">
            {mentor.recentFeedback.slice(0, 3).map(feedback => (
              <div key={feedback.id} className="mentor-rankings-feedback-item">
                <div className="mentor-rankings-feedback-rating">
                  {renderStarRating(feedback.overallRating, false)}
                </div>
                <div className="mentor-rankings-feedback-text">
                  {feedback.strengths && (
                    <p><strong>Strength:</strong> {feedback.strengths}</p>
                  )}
                  {feedback.improvements && (
                    <p><strong>Improvement:</strong> {feedback.improvements}</p>
                  )}
                </div>
                <div className="mentor-rankings-feedback-date">
                  {feedback.submittedAt.toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="mentor-rankings">
        <div className="mentor-rankings-loading-container">
          <div className="mentor-rankings-loading-spinner"></div>
          <p>Loading mentor rankings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mentor-rankings">
      <div className="mentor-rankings-header">
        <div className="mentor-rankings-header-content">
          <h2>Mentor Rankings & Analytics</h2>
          <p>Comprehensive performance analysis and rankings</p>
        </div>
        <div className="mentor-rankings-header-actions">
          <button 
            className="mentor-rankings-refresh-btn" 
            onClick={onRefresh}
            disabled={loading}
            title="Refresh data"
          >
            <FaSync className={loading ? 'mentor-rankings-spinning' : ''} />
          </button>
          <button 
            className="mentor-rankings-export-btn" 
            onClick={() => onExport?.(filteredAndSortedMentors)}
            disabled={filteredAndSortedMentors.length === 0}
            title="Export rankings"
          >
            <FaDownload />
          </button>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="mentor-rankings-view-controls">
        <div className="mentor-rankings-view-mode-toggle">
          <button 
            className={`mentor-rankings-view-btn ${viewMode === 'leaderboard' ? 'mentor-rankings-active' : ''}`}
            onClick={() => setViewMode('leaderboard')}
          >
            <FaTrophy /> Leaderboard
          </button>
          <button 
            className={`mentor-rankings-view-btn ${viewMode === 'detailed' ? 'mentor-rankings-active' : ''}`}
            onClick={() => setViewMode('detailed')}
          >
            <FaChartLine /> Detailed
          </button>
          <button 
            className={`mentor-rankings-view-btn ${viewMode === 'comparison' ? 'mentor-rankings-active' : ''}`}
            onClick={() => setViewMode('comparison')}
          >
            <FaUsers /> Compare
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mentor-rankings-controls-section">
        <div className="mentor-rankings-search-controls">
          <div className="mentor-rankings-search-input-container">
            <FaSearch className="mentor-rankings-search-icon" />
            <input
              type="text"
              placeholder="Search mentors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mentor-rankings-search-input"
            />
          </div>
          
          <button 
            className="mentor-rankings-filter-toggle-btn"
            onClick={() => setShowFilters(!showFilters)}
          >
            <FaFilter />
            Filters
            {showFilters ? <FaChevronUp /> : <FaChevronDown />}
          </button>
        </div>

        {showFilters && (
          <div className="mentor-rankings-filters-panel">
            <div className="mentor-rankings-filter-row">
              <div className="mentor-rankings-filter-group">
                <label>Time Period</label>
                <select 
                  value={timeFilter} 
                  onChange={(e) => setTimeFilter(e.target.value as TimeFilter)}
                >
                  <option value="all">All Time</option>
                  <option value="30days">Last 30 Days</option>
                  <option value="90days">Last 90 Days</option>
                  <option value="6months">Last 6 Months</option>
                  <option value="1year">Last Year</option>
                </select>
              </div>
              
              <div className="mentor-rankings-filter-group">
                <label>Sort By</label>
                <select 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value as SortField)}
                >
                  <option value="rank">Rank</option>
                  <option value="averageRating">Average Rating</option>
                  <option value="totalFeedback">Feedback Count</option>
                  <option value="consistency">Consistency</option>
                  <option value="responseRate">Response Rate</option>
                  <option value="trend">Trend</option>
                </select>
              </div>
              
              <div className="mentor-rankings-filter-group">
                <label>Order</label>
                <select 
                  value={sortOrder} 
                  onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                >
                  <option value="asc">Ascending</option>
                  <option value="desc">Descending</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Selected Mentors Actions */}
      {selectedMentors.size > 0 && (
        <div className="mentor-rankings-bulk-actions">
          <div className="mentor-rankings-bulk-info">
            <span>{selectedMentors.size} mentor{selectedMentors.size !== 1 ? 's' : ''} selected</span>
          </div>
          <div className="mentor-rankings-bulk-buttons">
            <button 
              className="mentor-rankings-bulk-btn"
              onClick={() => setSelectedMentors(new Set())}
            >
              Clear Selection
            </button>
            <button 
              className="mentor-rankings-bulk-btn mentor-rankings-primary"
              onClick={() => {
                const selectedMentorData = mentorMetrics.filter(m => selectedMentors.has(m.mentorId));
                onExport?.(selectedMentorData);
              }}
            >
              Export Selected
            </button>
          </div>
        </div>
      )}

      {/* Content based on view mode */}
      <div className="mentor-rankings-content">
        {viewMode === 'leaderboard' && (
          <div className="mentor-rankings-leaderboard-grid">
            {filteredAndSortedMentors.map(renderLeaderboardCard)}
          </div>
        )}
        
        {viewMode === 'detailed' && (
          <div className="mentor-rankings-detailed-view">
            {renderDetailedTable()}
            {expandedMentor && (
              <div className="mentor-rankings-expanded-details">
                {renderMentorDetails(mentorMetrics.find(m => m.mentorId === expandedMentor)!)}
              </div>
            )}
          </div>
        )}
        
        {viewMode === 'comparison' && (
          <div className="mentor-rankings-comparison-view">
            <div className="mentor-rankings-comparison-placeholder">
              <h3>Mentor Comparison</h3>
              <p>Select mentors from the leaderboard to compare their performance side-by-side.</p>
              {selectedMentors.size > 0 && (
                <div className="mentor-rankings-selected-for-comparison">
                  <h4>Selected for Comparison:</h4>
                  <ul>
                    {Array.from(selectedMentors).map(mentorId => {
                      const mentor = mentorMetrics.find(m => m.mentorId === mentorId);
                      return mentor ? (
                        <li key={mentorId}>
                          {mentor.mentorName} - {mentor.averageRating.toFixed(1)}⭐
                        </li>
                      ) : null;
                    })}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
