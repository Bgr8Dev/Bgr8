import React, { useState, useMemo } from 'react';
import { 
  FaPaperPlane, 
  FaUsers, 
  FaCalendarAlt, 
  FaCheckCircle, 
  FaCopy, 
  FaEye,
  FaSearch,
  FaFilter,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaTimes
} from 'react-icons/fa';
import { SentEmail } from '../../../services/emailService';
import { sanitizeHtml } from '../../../utils/inputSanitization';

interface SentTabProps {
  sentEmails: SentEmail[];
  onResendEmail: (email: SentEmail) => void;
}

export const SentTab: React.FC<SentTabProps> = ({
  sentEmails,
  onResendEmail
}) => {
  // Filter and sort state
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'subject' | 'recipients' | 'status'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterStatus, setFilterStatus] = useState<'all' | 'sent' | 'delivered' | 'failed'>('all');
  const [dateRange, setDateRange] = useState<'all' | 'today' | 'week' | 'month' | 'year'>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Filter and sort emails
  const filteredAndSortedEmails = useMemo(() => {
    let filtered = [...sentEmails];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(email =>
        email.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        email.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        email.recipients?.some(recipient => recipient.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(email => email.status === filterStatus);
    }

    // Date range filter
    if (dateRange !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (dateRange) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          filterDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      filtered = filtered.filter(email => {
        const emailDate = email.sentAt ? new Date(email.sentAt) : new Date(0);
        return emailDate >= filterDate;
      });
    }

    // Sort emails
    filtered.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortBy) {
        case 'date':
          aValue = a.sentAt ? new Date(a.sentAt).getTime() : 0;
          bValue = b.sentAt ? new Date(b.sentAt).getTime() : 0;
          break;
        case 'subject':
          aValue = a.subject || '';
          bValue = b.subject || '';
          break;
        case 'recipients':
          aValue = a.recipients?.length || 0;
          bValue = b.recipients?.length || 0;
          break;
        case 'status':
          aValue = a.status || '';
          bValue = b.status || '';
          break;
        default:
          aValue = 0;
          bValue = 0;
      }

      if (sortBy === 'date' || sortBy === 'recipients') {
        const aNum = typeof aValue === 'number' ? aValue : 0;
        const bNum = typeof bValue === 'number' ? bValue : 0;
        return sortOrder === 'asc' ? aNum - bNum : bNum - aNum;
      } else {
        const comparison = aValue.toString().localeCompare(bValue.toString());
        return sortOrder === 'asc' ? comparison : -comparison;
      }
    });

    return filtered;
  }, [sentEmails, searchTerm, sortBy, sortOrder, filterStatus, dateRange]);

  const handleSort = (newSortBy: typeof sortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
  };

  const getSortIcon = (column: typeof sortBy) => {
    if (sortBy !== column) return <FaSort />;
    return sortOrder === 'asc' ? <FaSortUp /> : <FaSortDown />;
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterStatus('all');
    setDateRange('all');
    setSortBy('date');
    setSortOrder('desc');
  };

  const handlePreview = (email: SentEmail) => {
    const previewWindow = window.open('', '_blank', 'width=800,height=600');
    if (previewWindow) {
      previewWindow.document.write(`
        <html>
          <head><title>Email Preview: ${email.subject}</title></head>
          <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>${email.subject}</h2>
            <div>${email.content}</div>
          </body>
        </html>
      `);
    }
  };

  return (
    <div className="email-sent-section">
      <div className="email-sent-header">
        <h3>Sent Emails</h3>
        <p>View and manage your sent email campaigns</p>
      </div>

      {/* Search and Filter Controls */}
      <div className="email-sent-controls">
        <div className="email-sent-search-filter">
          <div className="email-search-box">
            <FaSearch />
            <input
              type="text"
              placeholder="Search emails..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                className="email-search-clear"
                onClick={() => setSearchTerm('')}
                title="Clear search"
              >
                <FaTimes />
              </button>
            )}
          </div>
          
          <button
            className={`email-filter-toggle ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
            title="Toggle filters"
          >
            <FaFilter />
            Filters
            {(filterStatus !== 'all' || dateRange !== 'all') && (
              <span className="email-filter-badge">●</span>
            )}
          </button>
        </div>

        {showFilters && (
          <div className="email-sent-filters">
            <div className="email-filter-group">
              <label>Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
              >
                <option value="all">All Status</option>
                <option value="sent">Sent</option>
                <option value="delivered">Delivered</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            <div className="email-filter-group">
              <label>Date Range</label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as typeof dateRange)}
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
                <option value="year">Last Year</option>
              </select>
            </div>

            <button
              className="email-filter-clear"
              onClick={clearFilters}
              title="Clear all filters"
            >
              <FaTimes />
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Sort Controls */}
      <div className="email-sent-sort">
        <span className="email-sort-label">Sort by:</span>
        <div className="email-sort-options">
          <button
            className={`email-sort-btn ${sortBy === 'date' ? 'active' : ''}`}
            onClick={() => handleSort('date')}
          >
            Date {getSortIcon('date')}
          </button>
          <button
            className={`email-sort-btn ${sortBy === 'subject' ? 'active' : ''}`}
            onClick={() => handleSort('subject')}
          >
            Subject {getSortIcon('subject')}
          </button>
          <button
            className={`email-sort-btn ${sortBy === 'recipients' ? 'active' : ''}`}
            onClick={() => handleSort('recipients')}
          >
            Recipients {getSortIcon('recipients')}
          </button>
          <button
            className={`email-sort-btn ${sortBy === 'status' ? 'active' : ''}`}
            onClick={() => handleSort('status')}
          >
            Status {getSortIcon('status')}
          </button>
        </div>
      </div>

      {/* Results Summary */}
      <div className="email-sent-results">
        <span className="email-results-count">
          Showing {filteredAndSortedEmails.length} of {sentEmails.length} emails
        </span>
      </div>
      
      {sentEmails.length === 0 ? (
        <div className="email-sent-placeholder">
          <FaPaperPlane className="email-placeholder-icon" />
          <h3>No Sent Emails Yet</h3>
          <p>Your sent emails will appear here once you start sending campaigns</p>
        </div>
      ) : filteredAndSortedEmails.length === 0 ? (
        <div className="email-sent-placeholder">
          <FaSearch className="email-placeholder-icon" />
          <h3>No Emails Found</h3>
          <p>Try adjusting your search terms or filters</p>
          <button
            className="email-clear-search-btn"
            onClick={clearFilters}
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="email-sent-list">
          {filteredAndSortedEmails.map(email => (
            <div key={email.id} className={`email-sent-card email-sent-card-${email.status || 'sent'}`}>
              <div className="email-sent-status-bar"></div>
              <div className="email-sent-header-card">
                <h4>{email.subject || 'No Subject'}</h4>
                <div className="email-sent-actions">
                  <button 
                    className="email-sent-action-btn"
                    onClick={() => onResendEmail(email)}
                    title="Resend Email"
                  >
                    <FaCopy />
                  </button>
                  <button 
                    className="email-sent-action-btn"
                    onClick={() => handlePreview(email)}
                    title="Preview Email"
                  >
                    <FaEye />
                  </button>
                </div>
              </div>
              
              <div className="email-sent-content">
                <div className="email-sent-meta">
                  <span className="email-sent-recipients">
                    <FaUsers /> {email.recipients?.length || 0} recipients
                  </span>
                  <span className="email-sent-date">
                    <FaCalendarAlt /> {email.sentAt?.toLocaleDateString() || 'Unknown date'}
                  </span>
                  <span className={`email-sent-status email-sent-status-${email.status || 'sent'}`}>
                    <FaCheckCircle /> {email.status || 'sent'}
                  </span>
                </div>
                
                <div className="email-sent-preview">
                  {email.content ? (
                    <div dangerouslySetInnerHTML={{ 
                      __html: sanitizeHtml(email.content.replace(/<[^>]*>/g, '').substring(0, 150) + '...')
                    }} />
                  ) : (
                    <p>No content preview available</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SentTab;
