import React, { useState, useEffect, useMemo } from 'react';
import { firestore } from '../../firebase/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { SessionFeedback } from '../../types/b8fc';
import type { FeedbackAnalytics } from '../../types/b8fc';
import { 
  FaStar, 
  FaComments, 
  FaUsers, 
  FaThumbsUp, 
  FaSearch, 
  FaFilter, 
  FaDownload, 
  FaChevronDown, 
  FaChevronUp, 
  FaCheckSquare, 
  FaSquare,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaSync
} from 'react-icons/fa';
import '../../styles/adminStyles/FeedbackAnalytics.css';

export default function FeedbackAnalytics() {
  const [feedbackData, setFeedbackData] = useState<SessionFeedback[]>([]);
  const [analytics, setAnalytics] = useState<FeedbackAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Enhanced filtering and management state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFeedbackType, setSelectedFeedbackType] = useState<string>('all');
  const [selectedMentor, setSelectedMentor] = useState<string>('all');
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'rating' | 'mentor' | 'type'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [modalData, setModalData] = useState<SessionFeedback | null>(null);

  useEffect(() => {
    const fetchFeedbackData = async () => {
      try {
        setLoading(true);
        const feedbackQuery = query(
          collection(firestore, 'feedback'),
          orderBy('submittedAt', 'desc')
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
        setLastRefresh(new Date());
        
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

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && modalData) {
        handleCloseModal();
      }
    };

    if (modalData) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [modalData]);

  // Enhanced filtering and sorting logic
  const filteredAndSortedFeedback = useMemo(() => {
    let filtered = [...feedbackData];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(feedback => 
        feedback.mentorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        feedback.menteeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        feedback.strengths?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        feedback.improvements?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        feedback.learnings?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply feedback type filter
    if (selectedFeedbackType !== 'all') {
      filtered = filtered.filter(feedback => feedback.feedbackType === selectedFeedbackType);
    }

    // Apply mentor filter
    if (selectedMentor !== 'all') {
      filtered = filtered.filter(feedback => feedback.mentorId === selectedMentor);
    }

    // Apply rating filter
    if (ratingFilter !== 'all') {
      const rating = parseInt(ratingFilter);
      filtered = filtered.filter(feedback => feedback.overallRating >= rating && feedback.overallRating < rating + 1);
    }

    // Apply date range filter
    if (dateRange !== 'all') {
      const now = new Date();
      const cutoffDate = new Date();
      
      switch (dateRange) {
        case '7days':
          cutoffDate.setDate(now.getDate() - 7);
          break;
        case '30days':
          cutoffDate.setDate(now.getDate() - 30);
          break;
        case '90days':
          cutoffDate.setDate(now.getDate() - 90);
          break;
        case '1year':
          cutoffDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      filtered = filtered.filter(feedback => feedback.submittedAt >= cutoffDate);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: string | number | Date, bValue: string | number | Date;
      
      switch (sortBy) {
        case 'date':
          aValue = a.submittedAt;
          bValue = b.submittedAt;
          break;
        case 'rating':
          aValue = a.overallRating;
          bValue = b.overallRating;
          break;
        case 'mentor':
          aValue = a.mentorName?.toLowerCase() || '';
          bValue = b.mentorName?.toLowerCase() || '';
          break;
        case 'type':
          aValue = a.feedbackType;
          bValue = b.feedbackType;
          break;
        default:
          return 0;
      }
      
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [feedbackData, searchTerm, selectedFeedbackType, selectedMentor, ratingFilter, dateRange, sortBy, sortOrder]);

  // Pagination logic
  const paginatedFeedback = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAndSortedFeedback.slice(startIndex, endIndex);
  }, [filteredAndSortedFeedback, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredAndSortedFeedback.length / itemsPerPage);

  // Get unique mentors for filter dropdown
  const uniqueMentors = useMemo(() => {
    const mentorSet = new Set(feedbackData.map(f => f.mentorId));
    const mentors = Array.from(mentorSet);
    return mentors.map(mentorId => ({
      id: mentorId,
      name: feedbackData.find(f => f.mentorId === mentorId)?.mentorName || mentorId
    }));
  }, [feedbackData]);

  // Utility functions for handling selections and actions
  const handleSelectItem = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedItems.size === paginatedFeedback.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(paginatedFeedback.map(f => f.id)));
    }
  };


  const handleCardClick = (feedback: SessionFeedback, event: React.MouseEvent) => {
    // Don't show modal if clicking on selection checkbox
    if ((event.target as HTMLElement).closest('.select-item-btn')) {
      return;
    }

    setModalData(feedback);
  };

  const handleCloseModal = () => {
    setModalData(null);
  };

  const handleModalClick = (event: React.MouseEvent) => {
    // Prevent modal from closing when clicking inside it
    event.stopPropagation();
  };

  const handleOverlayClick = () => {
    handleCloseModal();
  };

  const handleSort = (newSortBy: 'date' | 'rating' | 'mentor' | 'type') => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
    setCurrentPage(1); // Reset to first page when sorting changes
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const feedbackQuery = query(
        collection(firestore, 'feedback'),
        orderBy('submittedAt', 'desc')
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
      setLastRefresh(new Date());
      const analyticsData = calculateAnalytics(feedback);
      setAnalytics(analyticsData);
      setSelectedItems(new Set());
    } catch (err) {
      console.error('Error refreshing feedback data:', err);
      setError('Failed to refresh feedback data');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = [
      'ID', 'Feedback Type', 'Mentor Name', 'Mentee Name', 'Overall Rating',
      'Strengths', 'Improvements', 'Learnings', 'Submitted At', 'Session Date',
      'Is Cal.com Booking', 'Cal.com Booking ID'
    ];
    
    const csvContent = [
      headers.join(','),
      ...filteredAndSortedFeedback.map(feedback => [
        feedback.id,
        feedback.feedbackType,
        feedback.mentorName || '',
        feedback.menteeName || '',
        feedback.overallRating,
        `"${(feedback.strengths || '').replace(/"/g, '""')}"`,
        `"${(feedback.improvements || '').replace(/"/g, '""')}"`,
        `"${(feedback.learnings || '').replace(/"/g, '""')}"`,
        feedback.submittedAt.toISOString(),
        feedback.sessionDate?.toISOString() || '',
        feedback.isCalComBooking,
        feedback.calComBookingId || ''
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `feedback-analytics-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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

  const renderStarRating = (rating: number, showText: boolean = true) => {
    return (
      <div className="star-display">
        {[1, 2, 3, 4, 5].map(star => (
          <FaStar
            key={star}
            className={star <= rating ? 'filled' : 'empty'}
          />
        ))}
        {showText && <span className="rating-text">{rating.toFixed(1)}</span>}
      </div>
    );
  };

  const getSortIcon = (column: 'date' | 'rating' | 'mentor' | 'type') => {
    if (sortBy !== column) return <FaSort className="sort-icon" />;
    return sortOrder === 'asc' ? <FaSortUp className="sort-icon" /> : <FaSortDown className="sort-icon" />;
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
        <div className="header-content">
          <h2>Feedback Analytics</h2>
          <p>Comprehensive insights from mentor and mentee feedback</p>
        </div>
        <div className="header-actions">
          <button 
            className="refresh-btn" 
            onClick={handleRefresh}
            disabled={loading}
            title="Refresh data"
          >
            <FaSync className={loading ? 'spinning' : ''} />
          </button>
          <button 
            className="export-btn" 
            onClick={exportToCSV}
            disabled={filteredAndSortedFeedback.length === 0}
            title="Export to CSV"
          >
            <FaDownload />
          </button>
        </div>
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
            <small>Showing {filteredAndSortedFeedback.length} filtered</small>
          </div>
        </div>
        
        <div className="summary-card">
          <div className="card-icon">
            <FaStar />
          </div>
          <div className="card-content">
            <h3>{analytics.averageRating}</h3>
            <p>Average Rating</p>
            <small>Based on all feedback</small>
          </div>
        </div>
        
        <div className="summary-card">
          <div className="card-icon">
            <FaUsers />
          </div>
          <div className="card-content">
            <h3>{Object.keys(analytics.feedbackByMentor).length}</h3>
            <p>Mentors with Feedback</p>
            <small>Active mentors</small>
          </div>
        </div>
        
        <div className="summary-card">
          <div className="card-icon">
            <FaThumbsUp />
          </div>
          <div className="card-content">
            <h3>{Math.round((analytics.averageRating / 5) * 100)}%</h3>
            <p>Satisfaction Rate</p>
            <small>Overall satisfaction</small>
          </div>
        </div>
      </div>

      {/* Enhanced Controls */}
      <div className="controls-section">
        <div className="search-controls">
          <div className="search-input-container">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search feedback content, mentors, or mentees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          
          <button 
            className="filter-toggle-btn"
            onClick={() => setShowFilters(!showFilters)}
          >
            <FaFilter />
            Filters
            {showFilters ? <FaChevronUp /> : <FaChevronDown />}
          </button>
        </div>

        {showFilters && (
          <div className="filters-panel">
            <div className="filter-row">
              <div className="filter-group">
                <label>Feedback Type</label>
                <select 
                  value={selectedFeedbackType} 
                  onChange={(e) => setSelectedFeedbackType(e.target.value)}
                >
                  <option value="all">All Types</option>
                  <option value="mentor">Mentor Feedback</option>
                  <option value="mentee">Mentee Feedback</option>
                </select>
              </div>
              
              <div className="filter-group">
                <label>Mentor</label>
                <select 
                  value={selectedMentor} 
                  onChange={(e) => setSelectedMentor(e.target.value)}
                >
                  <option value="all">All Mentors</option>
                  {uniqueMentors.map(mentor => (
                    <option key={mentor.id} value={mentor.id}>
                      {mentor.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="filter-group">
                <label>Rating</label>
                <select 
                  value={ratingFilter} 
                  onChange={(e) => setRatingFilter(e.target.value)}
                >
                  <option value="all">All Ratings</option>
                  <option value="5">5 Stars</option>
                  <option value="4">4+ Stars</option>
                  <option value="3">3+ Stars</option>
                  <option value="2">2+ Stars</option>
                  <option value="1">1+ Stars</option>
                </select>
              </div>
              
              <div className="filter-group">
                <label>Date Range</label>
                <select 
                  value={dateRange} 
                  onChange={(e) => setDateRange(e.target.value)}
                >
                  <option value="all">All Time</option>
                  <option value="7days">Last 7 Days</option>
                  <option value="30days">Last 30 Days</option>
                  <option value="90days">Last 90 Days</option>
                  <option value="1year">Last Year</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Actions */}
      {selectedItems.size > 0 && (
        <div className="bulk-actions">
          <div className="bulk-info">
            <span>{selectedItems.size} item{selectedItems.size !== 1 ? 's' : ''} selected</span>
          </div>
          <div className="bulk-buttons">
            <button 
              className="bulk-btn"
              onClick={() => setSelectedItems(new Set())}
            >
              Clear Selection
            </button>
            <button 
              className="bulk-btn primary"
              onClick={() => {
                // Export only selected items
                const selectedFeedback = feedbackData.filter(f => selectedItems.has(f.id));
                console.log('Selected feedback:', selectedFeedback);
              }}
            >
              Export Selected
            </button>
          </div>
        </div>
      )}

      {/* Enhanced Feedback List */}
      <div className="feedback-management">
        <div className="list-header">
          <div className="list-controls">
            <div className="selection-control">
              <button 
                className="select-all-btn"
                onClick={handleSelectAll}
                title={selectedItems.size === paginatedFeedback.length ? "Deselect All" : "Select All"}
              >
                {selectedItems.size === paginatedFeedback.length ? <FaCheckSquare /> : <FaSquare />}
                {selectedItems.size === paginatedFeedback.length ? "Deselect All" : "Select All"}
              </button>
            </div>
            
            <div className="view-controls">
              <select 
                value={itemsPerPage} 
                onChange={(e) => {
                  setItemsPerPage(parseInt(e.target.value));
                  setCurrentPage(1);
                }}
                className="items-per-page"
              >
                <option value={10}>10 per page</option>
                <option value={20}>20 per page</option>
                <option value={50}>50 per page</option>
                <option value={100}>100 per page</option>
              </select>
            </div>
          </div>
          
          <div className="sort-controls">
            <span>Sort by:</span>
            <button 
              className={`sort-btn ${sortBy === 'date' ? 'active' : ''}`}
              onClick={() => handleSort('date')}
            >
              Date {getSortIcon('date')}
            </button>
            <button 
              className={`sort-btn ${sortBy === 'rating' ? 'active' : ''}`}
              onClick={() => handleSort('rating')}
            >
              Rating {getSortIcon('rating')}
            </button>
            <button 
              className={`sort-btn ${sortBy === 'mentor' ? 'active' : ''}`}
              onClick={() => handleSort('mentor')}
            >
              Mentor {getSortIcon('mentor')}
            </button>
            <button 
              className={`sort-btn ${sortBy === 'type' ? 'active' : ''}`}
              onClick={() => handleSort('type')}
            >
              Type {getSortIcon('type')}
            </button>
          </div>
        </div>

        <div className="feedback-list">
          {paginatedFeedback.map(feedback => (
            <div 
              key={feedback.id} 
              className={`feedback-item ${selectedItems.has(feedback.id) ? 'selected' : ''} ${modalData?.id === feedback.id ? 'modal-active' : ''}`}
              onClick={(e) => handleCardClick(feedback, e)}
            >
              <div className="feedback-header">
                <div className="feedback-selection">
                  <button 
                    className="select-item-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectItem(feedback.id);
                    }}
                  >
                    {selectedItems.has(feedback.id) ? <FaCheckSquare /> : <FaSquare />}
                  </button>
                </div>
                
                <div className="feedback-meta">
                  <span className="feedback-type">{feedback.feedbackType}</span>
                  <span className="feedback-date">
                    {feedback.submittedAt.toLocaleDateString('en-GB')} at {feedback.submittedAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {feedback.isCalComBooking && (
                    <span className="calcom-badge">Cal.com</span>
                  )}
                </div>
                
                <div className="feedback-rating">
                  {renderStarRating(feedback.overallRating, false)}
                </div>
                
                <div className="feedback-actions">
                  <div className="click-hint">
                    Click to view details
                  </div>
                </div>
              </div>
              
              <div className="feedback-summary">
                <div className="session-info">
                  <strong>Session:</strong> {feedback.mentorName} & {feedback.menteeName}
                </div>
                <div className="rating-display">
                  {renderStarRating(feedback.overallRating)}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="pagination">
          <div className="pagination-info">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredAndSortedFeedback.length)} of {filteredAndSortedFeedback.length} results
          </div>
          
          <div className="pagination-controls">
            <button 
              className="pagination-btn"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              First
            </button>
            <button 
              className="pagination-btn"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            
            <div className="page-numbers">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                if (pageNum > totalPages) return null;
                
                return (
                  <button
                    key={pageNum}
                    className={`pagination-btn page-number ${pageNum === currentPage ? 'active' : ''}`}
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            <button 
              className="pagination-btn"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
            <button 
              className="pagination-btn"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              Last
            </button>
          </div>
        </div>
      </div>

      {/* Last Updated */}
      <div className="last-updated">
        Last updated: {lastRefresh.toLocaleString()}
      </div>

      {/* Feedback Details Modal */}
      {modalData && (
        <div className="feedback-modal-overlay" onClick={handleOverlayClick}>
          <div className="feedback-modal" onClick={handleModalClick}>
            <div className="modal-header">
              <h3>Feedback Details</h3>
              <button 
                className="modal-close"
                onClick={handleCloseModal}
                title="Close modal"
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <table className="feedback-details-table">
                <tbody>
                  <tr>
                    <td className="table-label">Feedback Type</td>
                    <td className="table-value">
                      <span className="feedback-type">{modalData.feedbackType}</span>
                    </td>
                  </tr>
                  
                  <tr>
                    <td className="table-label">Overall Rating</td>
                    <td className="table-value">
                      {renderStarRating(modalData.overallRating, false)}
                      <span className="rating-number">{modalData.overallRating}/5</span>
                    </td>
                  </tr>
                  
                  <tr>
                    <td className="table-label">Submitted</td>
                    <td className="table-value">
                      {modalData.submittedAt.toLocaleDateString('en-GB')} at {modalData.submittedAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                  
                  <tr>
                    <td className="table-label">Session Date</td>
                    <td className="table-value">
                      {modalData.sessionDate?.toLocaleDateString('en-GB') || 'N/A'}
                    </td>
                  </tr>
                  
                  <tr>
                    <td className="table-label">Mentor</td>
                    <td className="table-value">{modalData.mentorName}</td>
                  </tr>
                  
                  <tr>
                    <td className="table-label">Mentee</td>
                    <td className="table-value">{modalData.menteeName}</td>
                  </tr>
                  
                  {modalData.isCalComBooking && (
                    <tr>
                      <td className="table-label">Booking Type</td>
                      <td className="table-value">
                        <span className="calcom-badge">Cal.com</span>
                      </td>
                    </tr>
                  )}
                  
                  {modalData.strengths && (
                    <tr>
                      <td className="table-label">Strengths</td>
                      <td className="table-value table-text">
                        {modalData.strengths}
                      </td>
                    </tr>
                  )}
                  
                  {modalData.improvements && (
                    <tr>
                      <td className="table-label">Improvements</td>
                      <td className="table-value table-text">
                        {modalData.improvements}
                      </td>
                    </tr>
                  )}
                  
                  {modalData.learnings && (
                    <tr>
                      <td className="table-label">Learnings</td>
                      <td className="table-value table-text">
                        {modalData.learnings}
                      </td>
                    </tr>
                  )}
                  
                  <tr>
                    <td className="table-label">Feedback ID</td>
                    <td className="table-value table-id">{modalData.id}</td>
                  </tr>
                  
                  {modalData.calComBookingId && (
                    <tr>
                      <td className="table-label">Cal.com Booking ID</td>
                      <td className="table-value table-id">{modalData.calComBookingId}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="modal-footer">
              <button className="modal-close-btn" onClick={handleCloseModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 