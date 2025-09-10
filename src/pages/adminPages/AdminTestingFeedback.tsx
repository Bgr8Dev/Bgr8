import React, { useState, useEffect, useCallback } from 'react';
import { FaBug, FaPlus, FaSearch, FaSort, FaEye, FaEdit, FaTrash, FaThumbsUp, FaThumbsDown, FaTag, FaUser, FaCalendar, FaClock, FaExclamationTriangle, FaCheckCircle, FaTimesCircle, FaPause, FaCopy, FaTimes, FaComments } from 'react-icons/fa';
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingTicket, setDeletingTicket] = useState<FeedbackTicket | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTicket, setNewTicket] = useState({
    title: '',
    description: '',
    category: 'bug' as FeedbackCategory,
    priority: 'medium' as FeedbackPriority,
    tags: [] as string[],
    tagInput: '',
    attachments: [] as File[],
    // Testing-specific fields
    urlToPage: '',
    browser: '',
    browserVersion: '',
    operatingSystem: '',
    deviceType: 'desktop' as 'desktop' | 'mobile' | 'tablet',
    screenResolution: '',
    stepsToReproduce: '',
    expectedBehavior: '',
    actualBehavior: '',
    severity: 'minor' as 'cosmetic' | 'minor' | 'major' | 'critical' | 'blocker',
    environment: 'production' as 'development' | 'staging' | 'production',
    testCaseId: '',
    regression: false,
    workaround: ''
  });
  const [filters, setFilters] = useState<FeedbackFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'createdAt' | 'updatedAt' | 'priority' | 'votes'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showCommentsSidebar, setShowCommentsSidebar] = useState(false);
  const [selectedTicketForComments, setSelectedTicketForComments] = useState<FeedbackTicket | null>(null);
  const [newComment, setNewComment] = useState({
    content: '',
    isInternal: false,
    attachments: [] as File[]
  });
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [hoveredTicket, setHoveredTicket] = useState<string | null>(null);
  const [selectedCardRef, setSelectedCardRef] = useState<HTMLDivElement | null>(null);

  // Close floating buttons when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (hoveredTicket && !(event.target as Element).closest('.floating-actions')) {
        setHoveredTicket(null);
        setSelectedCardRef(null);
      }
    };

    if (hoveredTicket) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [hoveredTicket]);

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
    const userId = userProfile?.uid || '';
    const actionKey = `vote-${ticketId}-${voteType}`;
    
    // Set loading state
    setActionLoading(prev => ({ ...prev, [actionKey]: true }));
    
    // Optimistic update
    setTickets(prevTickets => 
      prevTickets.map(ticket => {
        if (ticket.id === ticketId) {
          const isUpvoting = voteType === 'up';
          const wasUpvoted = ticket.upvoters.includes(userId);
          const wasDownvoted = ticket.downvoters.includes(userId);
          
          let newUpvoters = [...ticket.upvoters];
          let newDownvoters = [...ticket.downvoters];
          let newVotes = ticket.votes;
          
          if (isUpvoting) {
            if (wasUpvoted) {
              // Remove upvote
              newUpvoters = newUpvoters.filter(id => id !== userId);
              newVotes -= 1;
            } else {
              // Add upvote, remove downvote if exists
              if (wasDownvoted) {
                newDownvoters = newDownvoters.filter(id => id !== userId);
                newVotes += 2; // +1 for upvote, +1 for removing downvote
              } else {
                newVotes += 1;
              }
              newUpvoters.push(userId);
            }
          } else {
            if (wasDownvoted) {
              // Remove downvote
              newDownvoters = newDownvoters.filter(id => id !== userId);
              newVotes += 1;
            } else {
              // Add downvote, remove upvote if exists
              if (wasUpvoted) {
                newUpvoters = newUpvoters.filter(id => id !== userId);
                newVotes -= 2; // -1 for downvote, -1 for removing upvote
              } else {
                newVotes -= 1;
              }
              newDownvoters.push(userId);
            }
          }
          
          return {
            ...ticket,
            votes: newVotes,
            upvoters: newUpvoters,
            downvoters: newDownvoters
          };
        }
        return ticket;
      })
    );

    try {
      await FeedbackService.voteTicket(ticketId, userId, voteType);
    } catch (err) {
      console.error('Error voting on ticket:', err);
      setError('Failed to vote on ticket');
      // Revert optimistic update
      await loadTickets();
    } finally {
      // Clear loading state
      setActionLoading(prev => ({ ...prev, [actionKey]: false }));
    }
  };


  const handleCreateTicket = async () => {
    if (!newTicket.title.trim() || !newTicket.description.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    // Create optimistic ticket
    const optimisticTicket: FeedbackTicket = {
      id: `temp-${Date.now()}`,
      sequentialId: 0, // Will be updated when real ticket is created
      title: newTicket.title.trim(),
      description: newTicket.description.trim(),
      category: newTicket.category,
      priority: newTicket.priority,
      status: 'open',
      reporterId: userProfile?.uid || '',
      reporterName: userProfile?.displayName || 'Unknown User',
      reporterEmail: userProfile?.email || '',
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: newTicket.tags,
      attachments: [],
      comments: [],
      votes: 0,
      upvoters: [],
      downvoters: [],
      // Testing-specific fields
      urlToPage: newTicket.urlToPage.trim() || undefined,
      browser: newTicket.browser.trim() || undefined,
      browserVersion: newTicket.browserVersion.trim() || undefined,
      operatingSystem: newTicket.operatingSystem.trim() || undefined,
      deviceType: newTicket.deviceType,
      screenResolution: newTicket.screenResolution.trim() || undefined,
      stepsToReproduce: newTicket.stepsToReproduce.trim() || undefined,
      expectedBehavior: newTicket.expectedBehavior.trim() || undefined,
      actualBehavior: newTicket.actualBehavior.trim() || undefined,
      severity: newTicket.severity,
      environment: newTicket.environment,
      testCaseId: newTicket.testCaseId.trim() || undefined,
      regression: newTicket.regression,
      workaround: newTicket.workaround.trim() || undefined
    };

    // Add optimistic ticket to the list
    setTickets(prevTickets => [optimisticTicket, ...prevTickets]);

    // Close modal and reset form immediately
    setShowCreateModal(false);
    setNewTicket({
      title: '',
      description: '',
      category: 'bug',
      priority: 'medium',
      tags: [],
      tagInput: '',
      attachments: [],
      // Testing-specific fields
      urlToPage: '',
      browser: '',
      browserVersion: '',
      operatingSystem: '',
      deviceType: 'desktop',
      screenResolution: '',
      stepsToReproduce: '',
      expectedBehavior: '',
      actualBehavior: '',
      severity: 'minor',
      environment: 'production',
      testCaseId: '',
      regression: false,
      workaround: ''
    });

    try {
      const ticketId = await FeedbackService.createTicket(
        {
          title: newTicket.title.trim(),
          description: newTicket.description.trim(),
          category: newTicket.category,
          priority: newTicket.priority,
          tags: newTicket.tags,
          attachments: newTicket.attachments,
          // Testing-specific fields
          urlToPage: newTicket.urlToPage.trim() || undefined,
          browser: newTicket.browser.trim() || undefined,
          browserVersion: newTicket.browserVersion.trim() || undefined,
          operatingSystem: newTicket.operatingSystem.trim() || undefined,
          deviceType: newTicket.deviceType,
          screenResolution: newTicket.screenResolution.trim() || undefined,
          stepsToReproduce: newTicket.stepsToReproduce.trim() || undefined,
          expectedBehavior: newTicket.expectedBehavior.trim() || undefined,
          actualBehavior: newTicket.actualBehavior.trim() || undefined,
          severity: newTicket.severity,
          environment: newTicket.environment,
          testCaseId: newTicket.testCaseId.trim() || undefined,
          regression: newTicket.regression,
          workaround: newTicket.workaround.trim() || undefined
        },
        userProfile?.uid || '',
        userProfile?.displayName || 'Unknown User',
        userProfile?.email || ''
      );

      // Replace optimistic ticket with real one
      setTickets(prevTickets => 
        prevTickets.map(ticket => 
          ticket.id === optimisticTicket.id 
            ? { ...ticket, id: ticketId }
            : ticket
        )
      );
    } catch (err) {
      console.error('Error creating ticket:', err);
      setError('Failed to create ticket');
      // Remove optimistic ticket on error
      setTickets(prevTickets => 
        prevTickets.filter(ticket => ticket.id !== optimisticTicket.id)
      );
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

    const originalTicket = tickets.find(t => t.id === editingTicket.id);
    if (!originalTicket) return;

    // Optimistic update
    setTickets(prevTickets => 
      prevTickets.map(ticket => 
        ticket.id === editingTicket.id 
          ? { ...ticket, ...editingTicket, updatedAt: new Date() }
          : ticket
      )
    );

    // Close modal immediately
    setShowEditModal(false);
    setEditingTicket(null);

    try {
      await FeedbackService.updateTicket(editingTicket.id, {
        title: editingTicket.title,
        description: editingTicket.description,
        category: editingTicket.category,
        priority: editingTicket.priority,
        status: editingTicket.status,
        tags: editingTicket.tags
      });
    } catch (err) {
      console.error('Error updating ticket:', err);
      setError('Failed to update ticket');
      // Revert optimistic update on error
      setTickets(prevTickets => 
        prevTickets.map(ticket => 
          ticket.id === editingTicket.id ? originalTicket : ticket
        )
      );
    }
  };

  const handleDeleteClick = (ticket: FeedbackTicket) => {
    setDeletingTicket(ticket);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingTicket) return;

    const ticketToDelete = deletingTicket;
    
    // Optimistic update - remove ticket from list immediately
    setTickets(prevTickets => 
      prevTickets.filter(ticket => ticket.id !== ticketToDelete.id)
    );

    // Close modal immediately
    setShowDeleteModal(false);
    setDeletingTicket(null);

    try {
      await FeedbackService.deleteTicket(ticketToDelete.id);
    } catch (err) {
      console.error('Error deleting ticket:', err);
      setError('Failed to delete ticket');
      // Revert optimistic update on error
      setTickets(prevTickets => [ticketToDelete, ...prevTickets]);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setDeletingTicket(null);
  };

  const handleOpenComments = (ticket: FeedbackTicket) => {
    setSelectedTicketForComments(ticket);
    setShowCommentsSidebar(true);
  };

  const handleCloseComments = () => {
    setShowCommentsSidebar(false);
    setSelectedTicketForComments(null);
    setNewComment({
      content: '',
      isInternal: false,
      attachments: []
    });
  };

  const handleAddComment = async () => {
    if (!selectedTicketForComments || !newComment.content.trim()) return;

    const optimisticComment = {
      id: `temp-${Date.now()}`,
      ticketId: selectedTicketForComments.id,
      authorId: userProfile?.uid || '',
      authorName: userProfile?.displayName || 'Unknown User',
      content: newComment.content.trim(),
      createdAt: new Date(),
      updatedAt: new Date(),
      isInternal: newComment.isInternal,
      attachments: []
    };

    // Optimistic update - add comment to the selected ticket
    setSelectedTicketForComments(prev => 
      prev ? {
        ...prev,
        comments: [...prev.comments, optimisticComment],
        updatedAt: new Date()
      } : null
    );

    // Update the main tickets list as well
    setTickets(prevTickets => 
      prevTickets.map(ticket => 
        ticket.id === selectedTicketForComments.id 
          ? {
              ...ticket,
              comments: [...ticket.comments, optimisticComment],
              updatedAt: new Date()
            }
          : ticket
      )
    );

    // Clear comment form immediately
    setNewComment({
      content: '',
      isInternal: false,
      attachments: []
    });

    try {
      const commentId = await FeedbackService.addComment(selectedTicketForComments.id, {
        content: newComment.content.trim(),
        isInternal: newComment.isInternal,
        attachments: newComment.attachments
      }, userProfile?.uid || '', userProfile?.displayName || 'Unknown User');

      // Replace optimistic comment with real one
      setSelectedTicketForComments(prev => 
        prev ? {
          ...prev,
          comments: prev.comments.map(comment => 
            comment.id === optimisticComment.id 
              ? { ...comment, id: commentId }
              : comment
          )
        } : null
      );

      setTickets(prevTickets => 
        prevTickets.map(ticket => 
          ticket.id === selectedTicketForComments.id 
            ? {
                ...ticket,
                comments: ticket.comments.map(comment => 
                  comment.id === optimisticComment.id 
                    ? { ...comment, id: commentId }
                    : comment
                )
              }
            : ticket
        )
      );
    } catch (err) {
      console.error('Error adding comment:', err);
      setError('Failed to add comment');
      // Revert optimistic update on error
      setSelectedTicketForComments(prev => 
        prev ? {
          ...prev,
          comments: prev.comments.filter(comment => comment.id !== optimisticComment.id)
        } : null
      );
      setTickets(prevTickets => 
        prevTickets.map(ticket => 
          ticket.id === selectedTicketForComments.id 
            ? {
                ...ticket,
                comments: ticket.comments.filter(comment => comment.id !== optimisticComment.id)
              }
            : ticket
        )
      );
    }
  };

  const handleCommentFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setNewComment(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...files]
    }));
  };

  const handleRemoveCommentFile = (indexToRemove: number) => {
    setNewComment(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, index) => index !== indexToRemove)
    }));
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
            <div 
              key={ticket.id} 
              ref={(el) => {
                if (hoveredTicket === ticket.id) {
                  setSelectedCardRef(el);
                }
              }}
              className={`ticket-card ${ticket.id.startsWith('temp-') ? 'optimistic' : ''}`}
              onClick={(e) => {
                setSelectedCardRef(e.currentTarget);
                setHoveredTicket(hoveredTicket === ticket.id ? null : ticket.id);
              }}
              style={{ cursor: 'pointer' }}
            >
              <div className="ticket-card__header">
                <div className="ticket-card__title">
                  <CategoryIcon className="category-icon" />
                  <div className="ticket-title-content">
                    <div className="ticket-id">#{ticket.sequentialId}</div>
                    <h3>{ticket.title}</h3>
                  </div>
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
                      className={`vote-btn up ${actionLoading[`vote-${ticket.id}-up`] ? 'loading' : ''}`}
                      onClick={() => handleVote(ticket.id, 'up')}
                      disabled={ticket.upvoters.includes(userProfile?.uid || '') || actionLoading[`vote-${ticket.id}-up`]}
                      title="Upvote this ticket"
                      aria-label="Upvote this ticket"
                    >
                      <FaThumbsUp />
                    </button>
                    <span className="vote-count">{ticket.votes}</span>
                    <button
                      className={`vote-btn down ${actionLoading[`vote-${ticket.id}-down`] ? 'loading' : ''}`}
                      onClick={() => handleVote(ticket.id, 'down')}
                      disabled={ticket.downvoters.includes(userProfile?.uid || '') || actionLoading[`vote-${ticket.id}-down`]}
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

      {/* Floating Action Buttons */}
      {hoveredTicket && selectedCardRef && (
        <div className="floating-actions">
          <div 
            className="floating-actions__container"
            style={{
              position: 'absolute',
              top: selectedCardRef.getBoundingClientRect().top - 80,
              left: selectedCardRef.getBoundingClientRect().left + (selectedCardRef.getBoundingClientRect().width / 2),
              transform: 'translateX(-50%)'
            }}
          >
            <button
              className="floating-action-btn view"
              onClick={(e) => {
                e.stopPropagation();
                const ticket = tickets.find(t => t.id === hoveredTicket);
                if (ticket) handleViewTicket(ticket);
              }}
              title="View Details"
              aria-label="View ticket details"
            >
              <FaEye />
            </button>
            <button
              className="floating-action-btn comments"
              onClick={(e) => {
                e.stopPropagation();
                const ticket = tickets.find(t => t.id === hoveredTicket);
                if (ticket) handleOpenComments(ticket);
              }}
              title="View Comments"
              aria-label="View ticket comments"
            >
              <FaComments />
            </button>
            <button
              className="floating-action-btn edit"
              onClick={(e) => {
                e.stopPropagation();
                const ticket = tickets.find(t => t.id === hoveredTicket);
                if (ticket) handleEditTicket(ticket);
              }}
              title="Edit Ticket"
              aria-label="Edit ticket"
            >
              <FaEdit />
            </button>
            <button
              className="floating-action-btn delete"
              onClick={(e) => {
                e.stopPropagation();
                const ticket = tickets.find(t => t.id === hoveredTicket);
                if (ticket) handleDeleteClick(ticket);
              }}
              title="Delete Ticket"
              aria-label="Delete ticket"
            >
              <FaTrash />
            </button>
            <button
              className="floating-action-btn close"
              onClick={(e) => {
                e.stopPropagation();
                setHoveredTicket(null);
                setSelectedCardRef(null);
              }}
              title="Close"
              aria-label="Close floating actions"
            >
              <FaTimes />
            </button>
          </div>
        </div>
      )}

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

              {/* Testing-Specific Fields */}
              <div className="form-section-divider">
                <h4>Testing Information</h4>
              </div>

              <div className="form-group">
                <label htmlFor="ticket-url">URL to Page</label>
                <input
                  id="ticket-url"
                  type="url"
                  value={newTicket.urlToPage}
                  onChange={(e) => setNewTicket(prev => ({ ...prev, urlToPage: e.target.value }))}
                  placeholder="https://example.com/page"
                  className="form-input"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="ticket-browser">Browser</label>
                  <select
                    id="ticket-browser"
                    value={newTicket.browser}
                    onChange={(e) => setNewTicket(prev => ({ ...prev, browser: e.target.value }))}
                    className="form-select"
                  >
                    <option value="">Select Browser</option>
                    <option value="Chrome">Chrome</option>
                    <option value="Firefox">Firefox</option>
                    <option value="Safari">Safari</option>
                    <option value="Edge">Edge</option>
                    <option value="Opera">Opera</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="ticket-browser-version">Browser Version</label>
                  <input
                    id="ticket-browser-version"
                    type="text"
                    value={newTicket.browserVersion}
                    onChange={(e) => setNewTicket(prev => ({ ...prev, browserVersion: e.target.value }))}
                    placeholder="e.g., 120.0.6099.109"
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="ticket-os">Operating System</label>
                  <select
                    id="ticket-os"
                    value={newTicket.operatingSystem}
                    onChange={(e) => setNewTicket(prev => ({ ...prev, operatingSystem: e.target.value }))}
                    className="form-select"
                  >
                    <option value="">Select OS</option>
                    <option value="Windows 11">Windows 11</option>
                    <option value="Windows 10">Windows 10</option>
                    <option value="macOS">macOS</option>
                    <option value="Linux">Linux</option>
                    <option value="iOS">iOS</option>
                    <option value="Android">Android</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="ticket-device">Device Type</label>
                  <select
                    id="ticket-device"
                    value={newTicket.deviceType}
                    onChange={(e) => setNewTicket(prev => ({ ...prev, deviceType: e.target.value as 'desktop' | 'mobile' | 'tablet' }))}
                    className="form-select"
                  >
                    <option value="desktop">Desktop</option>
                    <option value="mobile">Mobile</option>
                    <option value="tablet">Tablet</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="ticket-resolution">Screen Resolution</label>
                <input
                  id="ticket-resolution"
                  type="text"
                  value={newTicket.screenResolution}
                  onChange={(e) => setNewTicket(prev => ({ ...prev, screenResolution: e.target.value }))}
                  placeholder="e.g., 1920x1080"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="ticket-steps">Steps to Reproduce</label>
                <textarea
                  id="ticket-steps"
                  value={newTicket.stepsToReproduce}
                  onChange={(e) => setNewTicket(prev => ({ ...prev, stepsToReproduce: e.target.value }))}
                  placeholder="1. Go to the page...&#10;2. Click on the button...&#10;3. Observe the issue..."
                  className="form-textarea"
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label htmlFor="ticket-expected">Expected Behavior</label>
                <textarea
                  id="ticket-expected"
                  value={newTicket.expectedBehavior}
                  onChange={(e) => setNewTicket(prev => ({ ...prev, expectedBehavior: e.target.value }))}
                  placeholder="What should happen when following the steps?"
                  className="form-textarea"
                  rows={2}
                />
              </div>

              <div className="form-group">
                <label htmlFor="ticket-actual">Actual Behavior</label>
                <textarea
                  id="ticket-actual"
                  value={newTicket.actualBehavior}
                  onChange={(e) => setNewTicket(prev => ({ ...prev, actualBehavior: e.target.value }))}
                  placeholder="What actually happens instead?"
                  className="form-textarea"
                  rows={2}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="ticket-severity">Severity</label>
                  <select
                    id="ticket-severity"
                    value={newTicket.severity}
                    onChange={(e) => setNewTicket(prev => ({ ...prev, severity: e.target.value as 'cosmetic' | 'minor' | 'major' | 'critical' | 'blocker' }))}
                    className="form-select"
                  >
                    <option value="cosmetic">Cosmetic</option>
                    <option value="minor">Minor</option>
                    <option value="major">Major</option>
                    <option value="critical">Critical</option>
                    <option value="blocker">Blocker</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="ticket-environment">Environment</label>
                  <select
                    id="ticket-environment"
                    value={newTicket.environment}
                    onChange={(e) => setNewTicket(prev => ({ ...prev, environment: e.target.value as 'development' | 'staging' | 'production' }))}
                    className="form-select"
                  >
                    <option value="development">Development</option>
                    <option value="staging">Staging</option>
                    <option value="production">Production</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="ticket-testcase">Test Case ID</label>
                <input
                  id="ticket-testcase"
                  type="text"
                  value={newTicket.testCaseId}
                  onChange={(e) => setNewTicket(prev => ({ ...prev, testCaseId: e.target.value }))}
                  placeholder="e.g., TC-001, Test-123"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={newTicket.regression}
                    onChange={(e) => setNewTicket(prev => ({ ...prev, regression: e.target.checked }))}
                    className="checkbox-input"
                  />
                  <span className="checkbox-text">This is a regression bug</span>
                </label>
              </div>

              <div className="form-group">
                <label htmlFor="ticket-workaround">Workaround</label>
                <textarea
                  id="ticket-workaround"
                  value={newTicket.workaround}
                  onChange={(e) => setNewTicket(prev => ({ ...prev, workaround: e.target.value }))}
                  placeholder="Any temporary workaround or solution?"
                  className="form-textarea"
                  rows={2}
                />
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deletingTicket && (
        <div className="modal-overlay" onClick={handleCancelDelete}>
          <div className="modal-content delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Delete Ticket</h3>
              <button 
                className="modal-close"
                onClick={handleCancelDelete}
                title="Close modal"
                aria-label="Close modal"
              >
                <FaTimes />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="delete-warning">
                <FaExclamationTriangle className="warning-icon" />
                <h4>Are you sure you want to delete this ticket?</h4>
                <p>This action cannot be undone. The following ticket will be permanently deleted:</p>
              </div>
              
              <div className="ticket-to-delete">
                <div className="ticket-preview">
                  <div className="ticket-preview-header">
                    <span className="ticket-category">
                      {deletingTicket.category.replace('_', ' ').toUpperCase()}
                    </span>
                    <span 
                      className="ticket-priority"
                      style={{ backgroundColor: PRIORITY_COLORS[deletingTicket.priority] }}
                    >
                      {deletingTicket.priority.toUpperCase()}
                    </span>
                  </div>
                  <h4 className="ticket-title">{deletingTicket.title}</h4>
                  <p className="ticket-description">
                    {deletingTicket.description.length > 100 
                      ? `${deletingTicket.description.substring(0, 100)}...` 
                      : deletingTicket.description
                    }
                  </p>
                  <div className="ticket-meta">
                    <span className="ticket-reporter">by {deletingTicket.reporterName}</span>
                    <span className="ticket-date">{formatDate(deletingTicket.createdAt)}</span>
                  </div>
                </div>
              </div>
              
              <div className="delete-consequences">
                <h5>This will also delete:</h5>
                <ul>
                  <li>All comments on this ticket</li>
                  <li>All file attachments</li>
                  <li>Vote history</li>
                  <li>All related data</li>
                </ul>
              </div>
            </div>
            
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={handleCancelDelete}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={handleConfirmDelete}
              >
                <FaTrash /> Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comments Sidebar */}
      {showCommentsSidebar && selectedTicketForComments && (
        <div className="comments-sidebar-overlay" onClick={handleCloseComments}>
          <div className="comments-sidebar" onClick={(e) => e.stopPropagation()}>
            <div className="comments-header">
              <h3>Comments - {selectedTicketForComments.title}</h3>
              <button 
                className="comments-close"
                onClick={handleCloseComments}
                title="Close comments"
                aria-label="Close comments"
              >
                <FaTimes />
              </button>
            </div>
            
            <div className="comments-content">
              <div className="comments-list">
                {selectedTicketForComments.comments.map(comment => (
                  <div key={comment.id} className={`comment ${comment.isInternal ? 'internal' : 'public'}`}>
                    <div className="comment-header">
                      <div className="comment-author">
                        <FaUser className="comment-author-icon" />
                        <span className="comment-author-name">{comment.authorName}</span>
                        {comment.isInternal && (
                          <span className="comment-internal-badge">Internal</span>
                        )}
                      </div>
                      <span className="comment-date">{formatDate(comment.createdAt)}</span>
                    </div>
                    <div className="comment-body">
                      <p>{comment.content}</p>
                      {comment.attachments && comment.attachments.length > 0 && (
                        <div className="comment-attachments">
                          {comment.attachments.map(attachment => (
                            <a
                              key={attachment.id}
                              href={attachment.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="comment-attachment"
                            >
                              <FaTag /> {attachment.name}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {selectedTicketForComments.comments.length === 0 && (
                  <div className="comments-empty">
                    <FaComments className="comments-empty-icon" />
                    <p>No comments yet. Be the first to comment!</p>
                  </div>
                )}
              </div>
              
              <div className="comments-form">
                <div className="comment-form-header">
                  <h4>Add Comment</h4>
                  <label className="comment-internal-toggle">
                    <input
                      type="checkbox"
                      checked={newComment.isInternal}
                      onChange={(e) => setNewComment(prev => ({ ...prev, isInternal: e.target.checked }))}
                      className="checkbox-input"
                    />
                    <span className="checkbox-text">Internal comment</span>
                  </label>
                </div>
                
                <textarea
                  value={newComment.content}
                  onChange={(e) => setNewComment(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Write your comment here..."
                  className="comment-textarea"
                  rows={4}
                />
                
                <div className="comment-file-input">
                  <input
                    type="file"
                    multiple
                    onChange={handleCommentFileSelect}
                    className="file-input"
                    accept="image/*,video/*,.pdf,.doc,.docx,.txt,.csv,.xlsx,.zip"
                  />
                  <label className="file-input-label">
                    <FaPlus /> Attach Files
                  </label>
                </div>
                
                {newComment.attachments.length > 0 && (
                  <div className="comment-file-list">
                    {newComment.attachments.map((file, index) => (
                      <div key={index} className="comment-file-item">
                        <span className="comment-file-name">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveCommentFile(index)}
                          className="comment-file-remove"
                          title="Remove file"
                        >
                          <FaTimes />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                <button
                  className="btn btn-primary comment-submit"
                  onClick={handleAddComment}
                  disabled={!newComment.content.trim()}
                >
                  <FaComments /> Add Comment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
