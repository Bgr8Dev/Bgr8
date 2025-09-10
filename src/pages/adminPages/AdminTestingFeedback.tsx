import React, { useState, useEffect, useCallback } from 'react';
import { FaBug, FaPlus, FaSearch, FaSort, FaEye, FaEdit, FaTrash, FaThumbsUp, FaThumbsDown, FaTag, FaUser, FaCalendar, FaClock, FaExclamationTriangle, FaCheckCircle, FaTimesCircle, FaPause, FaCopy, FaTimes } from 'react-icons/fa';
import { FeedbackService } from '../../services/feedbackService';
import { FeedbackTicket, FeedbackStats, FeedbackFilters, FeedbackStatus, FeedbackPriority, FeedbackCategory } from '../../types/feedback';
import { useAuth } from '../../hooks/useAuth';
import '../../styles/adminStyles/AdminTestingFeedback.css';

const STATUS_OPTIONS: FeedbackStatus[] = ['open', 'in_progress', 'resolved', 'closed', 'duplicate'];
const PRIORITY_OPTIONS: FeedbackPriority[] = ['low', 'medium', 'high', 'critical'];
const CATEGORY_OPTIONS: FeedbackCategory[] = ['bug', 'feature_request', 'ui_issue', 'performance', 'security', 'accessibility', 'other'];

const STATUS_COLORS = {
  open: '#3b82f6',
  in_progress: '#f59e0b',
  resolved: '#10b981',
  closed: '#6b7280',
  duplicate: '#ef4444'
};

const PRIORITY_COLORS = {
  low: '#10b981',
  medium: '#f59e0b',
  high: '#f97316',
  critical: '#ef4444'
};

const CATEGORY_ICONS = {
  bug: FaBug,
  feature_request: FaPlus,
  ui_issue: FaEdit,
  performance: FaClock,
  security: FaExclamationTriangle,
  accessibility: FaUser,
  other: FaTag
};

export default function AdminTestingFeedback() {
  const { userProfile } = useAuth();
  const [tickets, setTickets] = useState<FeedbackTicket[]>([]);
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<FeedbackTicket | null>(null);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTicket, setEditingTicket] = useState<FeedbackTicket | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTicket, setNewTicket] = useState({
    title: '',
    description: '',
    category: 'bug' as FeedbackCategory,
    priority: 'medium' as FeedbackPriority,
    tags: [] as string[],
    tagInput: '',
    attachments: [] as File[]
  });
  const [filters, setFilters] = useState<FeedbackFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'createdAt' | 'updatedAt' | 'priority' | 'votes'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const loadTickets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const ticketFilters: FeedbackFilters = {
        ...filters,
        searchTerm: searchTerm || undefined
      };
      
      const [ticketsData, statsData] = await Promise.all([
        FeedbackService.getTickets(ticketFilters),
        FeedbackService.getFeedbackStats()
      ]);
      
      // Sort tickets
      const sortedTickets = ticketsData.sort((a, b) => {
        let aValue: number, bValue: number;
        
        switch (sortBy) {
          case 'createdAt': {
            aValue = a.createdAt.getTime();
            bValue = b.createdAt.getTime();
            break;
          }
          case 'updatedAt': {
            aValue = a.updatedAt.getTime();
            bValue = b.updatedAt.getTime();
            break;
          }
          case 'priority': {
            const priorityOrder: Record<FeedbackPriority, number> = { critical: 4, high: 3, medium: 2, low: 1 };
            aValue = priorityOrder[a.priority];
            bValue = priorityOrder[b.priority];
            break;
          }
          case 'votes': {
            aValue = a.votes;
            bValue = b.votes;
            break;
          }
          default: {
            aValue = a.createdAt.getTime();
            bValue = b.createdAt.getTime();
          }
        }
        
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      });
      
      setTickets(sortedTickets);
      setStats(statsData);
    } catch (err) {
      console.error('Error loading tickets:', err);
      setError('Failed to load feedback tickets');
    } finally {
      setLoading(false);
    }
  }, [filters, searchTerm, sortBy, sortOrder]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  // const handleStatusChange = async (ticketId: string, newStatus: FeedbackStatus) => {
  //   try {
  //     await FeedbackService.updateTicket(ticketId, { status: newStatus });
  //     await loadTickets();
  //   } catch (err) {
  //     console.error('Error updating ticket status:', err);
  //     setError('Failed to update ticket status');
  //   }
  // };

  // const handlePriorityChange = async (ticketId: string, newPriority: FeedbackPriority) => {
  //   try {
  //     await FeedbackService.updateTicket(ticketId, { priority: newPriority });
  //     await loadTickets();
  //   } catch (err) {
  //     console.error('Error updating ticket priority:', err);
  //     setError('Failed to update ticket priority');
  //   }
  // };

  const handleVote = async (ticketId: string, voteType: 'up' | 'down') => {
    try {
      await FeedbackService.voteTicket(ticketId, userProfile?.uid || '', voteType);
      await loadTickets();
    } catch (err) {
      console.error('Error voting on ticket:', err);
      setError('Failed to vote on ticket');
    }
  };

  const handleDeleteTicket = async (ticketId: string) => {
    if (!window.confirm('Are you sure you want to delete this ticket?')) return;
    
    try {
      await FeedbackService.deleteTicket(ticketId);
      await loadTickets();
    } catch (err) {
      console.error('Error deleting ticket:', err);
      setError('Failed to delete ticket');
    }
  };

  const handleCreateTicket = async () => {
    if (!newTicket.title.trim() || !newTicket.description.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      await FeedbackService.createTicket(
        {
          title: newTicket.title.trim(),
          description: newTicket.description.trim(),
          category: newTicket.category,
          priority: newTicket.priority,
          tags: newTicket.tags,
          attachments: newTicket.attachments
        },
        userProfile?.uid || '',
        userProfile?.displayName || 'Unknown User',
        userProfile?.email || ''
      );
      
      setShowCreateModal(false);
      setNewTicket({
        title: '',
        description: '',
        category: 'bug',
        priority: 'medium',
        tags: [],
        tagInput: '',
        attachments: []
      });
      await loadTickets();
    } catch (err) {
      console.error('Error creating ticket:', err);
      setError('Failed to create ticket');
    }
  };

  const handleAddTag = () => {
    const tag = newTicket.tagInput.trim();
    if (tag && !newTicket.tags.includes(tag)) {
      setNewTicket(prev => ({
        ...prev,
        tags: [...prev.tags, tag],
        tagInput: ''
      }));
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setNewTicket(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setNewTicket(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...files]
    }));
  };

  const handleRemoveFile = (indexToRemove: number) => {
    setNewTicket(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, index) => index !== indexToRemove)
    }));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleViewTicket = (ticket: FeedbackTicket) => {
    setSelectedTicket(ticket);
    setShowTicketModal(true);
  };

  const handleEditTicket = (ticket: FeedbackTicket) => {
    setEditingTicket(ticket);
    setShowEditModal(true);
  };

  const handleUpdateTicket = async () => {
    if (!editingTicket) return;

    try {
      await FeedbackService.updateTicket(editingTicket.id, {
        title: editingTicket.title,
        description: editingTicket.description,
        category: editingTicket.category,
        priority: editingTicket.priority,
        tags: editingTicket.tags
      });
      
      setShowEditModal(false);
      setEditingTicket(null);
      await loadTickets();
    } catch (err) {
      console.error('Error updating ticket:', err);
      setError('Failed to update ticket');
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getStatusIcon = (status: FeedbackStatus) => {
    switch (status) {
      case 'open': return <FaCheckCircle />;
      case 'in_progress': return <FaPause />;
      case 'resolved': return <FaCheckCircle />;
      case 'closed': return <FaTimesCircle />;
      case 'duplicate': return <FaCopy />;
      default: return <FaCheckCircle />;
    }
  };

  if (loading) {
    return (
      <div className="admin-testing-feedback">
        <div className="admin-testing-feedback__loading">
          <FaBug className="spinner" />
          <p>Loading feedback tickets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-testing-feedback">
      <div className="admin-testing-feedback__header">
        <div className="admin-testing-feedback__title">
          <FaBug className="admin-testing-feedback__icon" />
          <h2>Testing Feedback</h2>
        </div>
        <button
          className="admin-testing-feedback__create-btn"
          onClick={() => setShowCreateModal(true)}
        >
          <FaPlus /> New Ticket
        </button>
      </div>

      {error && (
        <div className="admin-testing-feedback__error">
          <FaExclamationTriangle /> {error}
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="admin-testing-feedback__stats">
          <div className="stat-card total">
            <div className="stat-icon">
              <FaBug />
            </div>
            <div className="stat-content">
              <h3>Total Tickets</h3>
              <p>{stats.total}</p>
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
        </div>
      )}

      {/* Filters and Search */}
      <div className="admin-testing-feedback__controls">
        <div className="admin-testing-feedback__search">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search tickets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="admin-testing-feedback__filters">
          <select
            value={filters.status?.[0] || 'all'}
            onChange={(e) => setFilters(prev => ({
              ...prev,
              status: e.target.value === 'all' ? undefined : [e.target.value as FeedbackStatus]
            }))}
          >
            <option value="all">All Status</option>
            {STATUS_OPTIONS.map(status => (
              <option key={status} value={status}>
                {status.replace('_', ' ').toUpperCase()}
              </option>
            ))}
          </select>
          
          <select
            value={filters.priority?.[0] || 'all'}
            onChange={(e) => setFilters(prev => ({
              ...prev,
              priority: e.target.value === 'all' ? undefined : [e.target.value as FeedbackPriority]
            }))}
          >
            <option value="all">All Priority</option>
            {PRIORITY_OPTIONS.map(priority => (
              <option key={priority} value={priority}>
                {priority.toUpperCase()}
              </option>
            ))}
          </select>
          
          <select
            value={filters.category?.[0] || 'all'}
            onChange={(e) => setFilters(prev => ({
              ...prev,
              category: e.target.value === 'all' ? undefined : [e.target.value as FeedbackCategory]
            }))}
          >
            <option value="all">All Categories</option>
            {CATEGORY_OPTIONS.map(category => (
              <option key={category} value={category}>
                {category.replace('_', ' ').toUpperCase()}
              </option>
            ))}
          </select>
        </div>
        
        <div className="admin-testing-feedback__sort">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'createdAt' | 'updatedAt' | 'priority' | 'votes')}
          >
            <option value="createdAt">Created Date</option>
            <option value="updatedAt">Updated Date</option>
            <option value="priority">Priority</option>
            <option value="votes">Votes</option>
          </select>
          
          <button
            className="sort-order-btn"
            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
            title={`Sort ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
            aria-label={`Sort ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
          >
            <FaSort className={sortOrder === 'asc' ? 'asc' : 'desc'} />
          </button>
        </div>
      </div>

      {/* Tickets Grid */}
      <div className="admin-testing-feedback__grid">
        {tickets.map(ticket => {
          const CategoryIcon = CATEGORY_ICONS[ticket.category] as React.ComponentType<{ className?: string }>;
          
          return (
            <div key={ticket.id} className="ticket-card">
              <div className="ticket-card__header">
                <div className="ticket-card__title">
                  <CategoryIcon className="category-icon" />
                  <h3>{ticket.title}</h3>
                </div>
                <div className="ticket-card__actions">
                  <button
                    className="action-btn view"
                    onClick={() => handleViewTicket(ticket)}
                    title="View Details"
                    aria-label="View ticket details"
                  >
                    <FaEye />
                  </button>
                  <button
                    className="action-btn edit"
                    onClick={() => handleEditTicket(ticket)}
                    title="Edit Ticket"
                    aria-label="Edit ticket"
                  >
                    <FaEdit />
                  </button>
                  <button
                    className="action-btn delete"
                    onClick={() => handleDeleteTicket(ticket.id)}
                    title="Delete Ticket"
                    aria-label="Delete ticket"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
              
              <div className="ticket-card__content">
                <p className="ticket-description">
                  {ticket.description.length > 150 
                    ? `${ticket.description.substring(0, 150)}...` 
                    : ticket.description
                  }
                </p>
                
                <div className="ticket-tags">
                  {ticket.tags.map(tag => (
                    <span key={tag} className="tag">
                      <FaTag /> {tag}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="ticket-card__footer">
                <div className="ticket-meta">
                  <div className="ticket-status">
                    <span 
                      className="status-badge"
                      style={{ backgroundColor: STATUS_COLORS[ticket.status] }}
                    >
                      {getStatusIcon(ticket.status)}
                      {ticket.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="ticket-priority">
                    <span 
                      className="priority-badge"
                      style={{ backgroundColor: PRIORITY_COLORS[ticket.priority] }}
                    >
                      {ticket.priority.toUpperCase()}
                    </span>
                  </div>
                </div>
                
                <div className="ticket-info">
                  <div className="ticket-votes">
                    <button
                      className="vote-btn up"
                      onClick={() => handleVote(ticket.id, 'up')}
                      disabled={ticket.upvoters.includes(userProfile?.uid || '')}
                      title="Upvote this ticket"
                      aria-label="Upvote this ticket"
                    >
                      <FaThumbsUp />
                    </button>
                    <span className="vote-count">{ticket.votes}</span>
                    <button
                      className="vote-btn down"
                      onClick={() => handleVote(ticket.id, 'down')}
                      disabled={ticket.downvoters.includes(userProfile?.uid || '')}
                      title="Downvote this ticket"
                      aria-label="Downvote this ticket"
                    >
                      <FaThumbsDown />
                    </button>
                  </div>
                  
                  <div className="ticket-dates">
                    <span className="date">
                      <FaCalendar /> {formatDate(ticket.createdAt)}
                    </span>
                    {ticket.updatedAt.getTime() !== ticket.createdAt.getTime() && (
                      <span className="date">
                        <FaClock /> Updated {formatDate(ticket.updatedAt)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {tickets.length === 0 && !loading && (
        <div className="admin-testing-feedback__empty">
          <FaBug className="empty-icon" />
          <h3>No feedback tickets found</h3>
          <p>No tickets match your current filters. Try adjusting your search criteria.</p>
        </div>
      )}

      {/* Create Ticket Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create New Ticket</h3>
              <button 
                className="modal-close"
                onClick={() => setShowCreateModal(false)}
                title="Close modal"
                aria-label="Close modal"
              >
                <FaTimes />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="ticket-title">Title *</label>
                <input
                  id="ticket-title"
                  type="text"
                  value={newTicket.title}
                  onChange={(e) => setNewTicket(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Brief description of the issue"
                  className="form-input"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="ticket-description">Description *</label>
                <textarea
                  id="ticket-description"
                  value={newTicket.description}
                  onChange={(e) => setNewTicket(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Detailed description of the issue or feature request"
                  className="form-textarea"
                  rows={4}
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="ticket-category">Category</label>
                  <select
                    id="ticket-category"
                    value={newTicket.category}
                    onChange={(e) => setNewTicket(prev => ({ ...prev, category: e.target.value as FeedbackCategory }))}
                    className="form-select"
                  >
                    {CATEGORY_OPTIONS.map(category => (
                      <option key={category} value={category}>
                        {category.replace('_', ' ').toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="ticket-priority">Priority</label>
                  <select
                    id="ticket-priority"
                    value={newTicket.priority}
                    onChange={(e) => setNewTicket(prev => ({ ...prev, priority: e.target.value as FeedbackPriority }))}
                    className="form-select"
                  >
                    {PRIORITY_OPTIONS.map(priority => (
                      <option key={priority} value={priority}>
                        {priority.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="ticket-tags">Tags</label>
                <div className="tag-input-container">
                  <input
                    id="ticket-tags"
                    type="text"
                    value={newTicket.tagInput}
                    onChange={(e) => setNewTicket(prev => ({ ...prev, tagInput: e.target.value }))}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                    placeholder="Add a tag and press Enter"
                    className="form-input"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="tag-add-btn"
                    title="Add tag"
                    aria-label="Add tag"
                  >
                    <FaPlus />
                  </button>
                </div>
                {newTicket.tags.length > 0 && (
                  <div className="tag-list">
                    {newTicket.tags.map(tag => (
                      <span key={tag} className="tag">
                        <FaTag /> {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="tag-remove"
                          title="Remove tag"
                          aria-label={`Remove ${tag} tag`}
                        >
                          <FaTimes />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="ticket-attachments">Attachments</label>
                <div className="file-input-container">
                  <input
                    id="ticket-attachments"
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    className="file-input"
                    accept="image/*,video/*,.pdf,.doc,.docx,.txt,.csv,.xlsx,.zip"
                  />
                  <label htmlFor="ticket-attachments" className="file-input-label">
                    <FaPlus /> Choose Files
                  </label>
                  <span className="file-input-hint">
                    Images, videos, documents (max 10MB each)
                  </span>
                </div>
                {newTicket.attachments.length > 0 && (
                  <div className="file-list">
                    {newTicket.attachments.map((file, index) => (
                      <div key={index} className="file-item">
                        <div className="file-info">
                          <span className="file-name">{file.name}</span>
                          <span className="file-size">{formatFileSize(file.size)}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(index)}
                          className="file-remove"
                          title="Remove file"
                          aria-label={`Remove ${file.name}`}
                        >
                          <FaTimes />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleCreateTicket}
              >
                <FaPlus /> Create Ticket
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Ticket Modal */}
      {showTicketModal && selectedTicket && (
        <div className="modal-overlay" onClick={() => setShowTicketModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Ticket Details</h3>
              <button 
                className="modal-close"
                onClick={() => setShowTicketModal(false)}
                title="Close modal"
                aria-label="Close modal"
              >
                <FaTimes />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="ticket-detail-section">
                <h4>Title</h4>
                <p className="ticket-detail-value">{selectedTicket.title}</p>
              </div>
              
              <div className="ticket-detail-section">
                <h4>Description</h4>
                <p className="ticket-detail-value">{selectedTicket.description}</p>
              </div>
              
              <div className="ticket-detail-row">
                <div className="ticket-detail-section">
                  <h4>Category</h4>
                  <span className="ticket-detail-badge category">
                    {selectedTicket.category.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                
                <div className="ticket-detail-section">
                  <h4>Priority</h4>
                  <span 
                    className="ticket-detail-badge priority"
                    style={{ backgroundColor: PRIORITY_COLORS[selectedTicket.priority] }}
                  >
                    {selectedTicket.priority.toUpperCase()}
                  </span>
                </div>
              </div>
              
              <div className="ticket-detail-section">
                <h4>Status</h4>
                <span 
                  className="ticket-detail-badge status"
                  style={{ backgroundColor: STATUS_COLORS[selectedTicket.status] }}
                >
                  {getStatusIcon(selectedTicket.status)}
                  {selectedTicket.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>
              
              {selectedTicket.tags.length > 0 && (
                <div className="ticket-detail-section">
                  <h4>Tags</h4>
                  <div className="ticket-detail-tags">
                    {selectedTicket.tags.map(tag => (
                      <span key={tag} className="ticket-detail-tag">
                        <FaTag /> {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {selectedTicket.attachments && selectedTicket.attachments.length > 0 && (
                <div className="ticket-detail-section">
                  <h4>Attachments</h4>
                  <div className="ticket-detail-attachments">
                    {selectedTicket.attachments.map(attachment => (
                      <div key={attachment.id} className="ticket-detail-attachment">
                        <span className="attachment-name">{attachment.name}</span>
                        <span className="attachment-size">{formatFileSize(attachment.size)}</span>
                        <a 
                          href={attachment.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="attachment-link"
                        >
                          View
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="ticket-detail-row">
                <div className="ticket-detail-section">
                  <h4>Created</h4>
                  <p className="ticket-detail-value">
                    {formatDate(selectedTicket.createdAt)} by {selectedTicket.reporterName}
                  </p>
                </div>
                
                <div className="ticket-detail-section">
                  <h4>Last Updated</h4>
                  <p className="ticket-detail-value">
                    {formatDate(selectedTicket.updatedAt)}
                  </p>
                </div>
              </div>
              
              <div className="ticket-detail-section">
                <h4>Votes</h4>
                <div className="ticket-detail-votes">
                  <span className="vote-count">{selectedTicket.votes}</span>
                  <span className="vote-label">votes</span>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowTicketModal(false)}
              >
                Close
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setShowTicketModal(false);
                  handleEditTicket(selectedTicket);
                }}
              >
                <FaEdit /> Edit Ticket
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Ticket Modal */}
      {showEditModal && editingTicket && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Ticket</h3>
              <button 
                className="modal-close"
                onClick={() => setShowEditModal(false)}
                title="Close modal"
                aria-label="Close modal"
              >
                <FaTimes />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="edit-ticket-title">Title *</label>
                <input
                  id="edit-ticket-title"
                  type="text"
                  value={editingTicket.title}
                  onChange={(e) => setEditingTicket(prev => prev ? { ...prev, title: e.target.value } : null)}
                  placeholder="Brief description of the issue"
                  className="form-input"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="edit-ticket-description">Description *</label>
                <textarea
                  id="edit-ticket-description"
                  value={editingTicket.description}
                  onChange={(e) => setEditingTicket(prev => prev ? { ...prev, description: e.target.value } : null)}
                  placeholder="Detailed description of the issue or feature request"
                  className="form-textarea"
                  rows={4}
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="edit-ticket-category">Category</label>
                  <select
                    id="edit-ticket-category"
                    value={editingTicket.category}
                    onChange={(e) => setEditingTicket(prev => prev ? { ...prev, category: e.target.value as FeedbackCategory } : null)}
                    className="form-select"
                  >
                    {CATEGORY_OPTIONS.map(category => (
                      <option key={category} value={category}>
                        {category.replace('_', ' ').toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="edit-ticket-priority">Priority</label>
                  <select
                    id="edit-ticket-priority"
                    value={editingTicket.priority}
                    onChange={(e) => setEditingTicket(prev => prev ? { ...prev, priority: e.target.value as FeedbackPriority } : null)}
                    className="form-select"
                  >
                    {PRIORITY_OPTIONS.map(priority => (
                      <option key={priority} value={priority}>
                        {priority.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="edit-ticket-status">Status</label>
                <select
                  id="edit-ticket-status"
                  value={editingTicket.status}
                  onChange={(e) => setEditingTicket(prev => prev ? { ...prev, status: e.target.value as FeedbackStatus } : null)}
                  className="form-select"
                >
                  {STATUS_OPTIONS.map(status => (
                    <option key={status} value={status}>
                      {status.replace('_', ' ').toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowEditModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleUpdateTicket}
              >
                <FaEdit /> Update Ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
