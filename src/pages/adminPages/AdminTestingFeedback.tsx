import React, { useState, useEffect, useCallback } from 'react';
import { FaBug, FaPlus, FaSearch, FaSort, FaEye, FaEdit, FaTrash, FaThumbsUp, FaThumbsDown, FaTag, FaUser, FaCalendar, FaClock, FaExclamationTriangle, FaCheckCircle, FaTimesCircle, FaPause, FaCopy, FaTimes, FaComments } from 'react-icons/fa';
import { FeedbackService } from '../../services/feedbackService';
import { FeedbackTicket, FeedbackStats, FeedbackFilters, FeedbackStatus, FeedbackPriority, FeedbackCategory, TicketUpdateData } from '../../types/feedback';
import { useAuth } from '../../hooks/useAuth';
import { getUserProfile, getUserRoles, UserProfile } from '../../utils/userProfile';
import CreateTicketModal from '../../components/modals/CreateTicketModal';
import EditTicketModal from '../../components/modals/EditTicketModal';
import ViewTicketModal from '../../components/modals/ViewTicketModal';
import CommentsSidebar from '../../components/modals/CommentsSidebar';
import DeleteTicketModal from '../../components/modals/DeleteTicketModal';
import StatsTiles from '../../components/feedback/StatsTiles';
import BannerWrapper from '../../components/ui/BannerWrapper';
import '../../styles/adminStyles/AdminTestingFeedback.css';

const STATUS_OPTIONS: FeedbackStatus[] = ['draft', 'open', 'in_progress', 'resolved', 'closed', 'duplicate'];
const PRIORITY_OPTIONS: FeedbackPriority[] = ['low', 'medium', 'high', 'critical'];
const CATEGORY_OPTIONS: FeedbackCategory[] = ['bug', 'feature_request', 'ui_issue', 'performance', 'security', 'accessibility', 'other'];

const STATUS_COLORS = {
  draft: '#eab308',
  open: '#3b82f6',
  in_progress: '#f59e0b',
  resolved: '#10b981',
  closed: '#6b7280',
  duplicate: '#ef4444'
};

const STATUS_THEMES = {
  draft: {
    primary: '#eab308',
    light: '#fef3c7',
    dark: '#a16207',
    background: '#fefce8',
    border: '#eab308',
    text: '#a16207'
  },
  open: {
    primary: '#3b82f6',
    light: '#dbeafe',
    dark: '#1e40af',
    background: '#f8fafc',
    border: '#3b82f6',
    text: '#1e40af'
  },
  in_progress: {
    primary: '#f59e0b',
    light: '#fef3c7',
    dark: '#d97706',
    background: '#fffbeb',
    border: '#f59e0b',
    text: '#d97706'
  },
  resolved: {
    primary: '#10b981',
    light: '#d1fae5',
    dark: '#059669',
    background: '#f0fdf4',
    border: '#10b981',
    text: '#059669'
  },
  closed: {
    primary: '#6b7280',
    light: '#f3f4f6',
    dark: '#374151',
    background: '#f9fafb',
    border: '#6b7280',
    text: '#374151'
  },
  duplicate: {
    primary: '#ef4444',
    light: '#fee2e2',
    dark: '#dc2626',
    background: '#fef2f2',
    border: '#ef4444',
    text: '#dc2626'
  }
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
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTicket, setEditingTicket] = useState<FeedbackTicket | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingTicket, setViewingTicket] = useState<FeedbackTicket | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingTicket, setDeletingTicket] = useState<FeedbackTicket | null>(null);
  const [showCommentsSidebar, setShowCommentsSidebar] = useState(false);
  const [selectedTicketForComments, setSelectedTicketForComments] = useState<FeedbackTicket | null>(null);
  const [filters, setFilters] = useState<FeedbackFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'createdAt' | 'updatedAt' | 'priority' | 'votes'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [hoveredTicket, setHoveredTicket] = useState<string | null>(null);
  const [selectedCardRef, setSelectedCardRef] = useState<HTMLDivElement | null>(null);
  const [userProfiles, setUserProfiles] = useState<Record<string, UserProfile>>({});
  const [activeStatusFilter, setActiveStatusFilter] = useState<FeedbackStatus | 'all'>('all');

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

  const fetchUserProfiles = useCallback(async (tickets: FeedbackTicket[]) => {
    const uniqueUserIds = Array.from(new Set(tickets.map(ticket => ticket.reporterId)));
    const profilesToFetch = uniqueUserIds.filter(id => !userProfiles[id]);
    
    if (profilesToFetch.length === 0) return;
    
    try {
      const profilePromises = profilesToFetch.map(async (userId) => {
        const profile = await getUserProfile(userId);
        return { userId, profile };
      });
      
      const results = await Promise.all(profilePromises);
      const newProfiles = results.reduce((acc, { userId, profile }) => {
        if (profile) {
          acc[userId] = profile;
        }
        return acc;
      }, {} as Record<string, UserProfile>);
      
      setUserProfiles(prev => ({ ...prev, ...newProfiles }));
    } catch (error) {
      console.error('Error fetching user profiles:', error);
    }
  }, [userProfiles]);

  // Store all tickets without filtering for seamless filtering
  const [allTickets, setAllTickets] = useState<FeedbackTicket[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const loadTickets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Only fetch from Firebase on initial load or when explicitly needed
      const [ticketsData, statsData] = await Promise.all([
        FeedbackService.getTickets(), // Get all tickets without filters
        FeedbackService.getFeedbackStats()
      ]);
      
      setAllTickets(ticketsData);
      setStats(statsData);
      setIsInitialLoad(false);
      
      // Fetch user profiles for the tickets
      await fetchUserProfiles(ticketsData);
    } catch (err) {
      console.error('Error loading tickets:', err);
      setError('Failed to load feedback tickets');
    } finally {
      setLoading(false);
    }
  }, [fetchUserProfiles]);

  // Apply filters to existing tickets without re-fetching
  const applyFiltersToTickets = useCallback(() => {
    if (allTickets.length === 0) return;

    let filteredTickets = [...allTickets];

    // Apply status filter
    if (filters.status && filters.status.length > 0) {
      filteredTickets = filteredTickets.filter(ticket => 
        filters.status!.includes(ticket.status)
      );
    }

    // Apply priority filter
    if (filters.priority && filters.priority.length > 0) {
      filteredTickets = filteredTickets.filter(ticket => 
        filters.priority!.includes(ticket.priority)
      );
    }

    // Apply category filter
    if (filters.category && filters.category.length > 0) {
      filteredTickets = filteredTickets.filter(ticket => 
        filters.category!.includes(ticket.category)
      );
    }

    // Apply search filter
    if (searchTerm && searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filteredTickets = filteredTickets.filter(ticket =>
        ticket.title.toLowerCase().includes(searchLower) ||
        ticket.description.toLowerCase().includes(searchLower) ||
        ticket.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    // Sort tickets
    const sortedTickets = filteredTickets.sort((a, b) => {
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
  }, [allTickets, filters, searchTerm, sortBy, sortOrder]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  // Apply filters whenever filter state changes (without re-fetching)
  useEffect(() => {
    if (!isInitialLoad) {
      applyFiltersToTickets();
    }
  }, [applyFiltersToTickets, isInitialLoad]);

  const handleVote = async (ticketId: string, voteType: 'up' | 'down') => {
    const userId = userProfile?.uid || '';
    const actionKey = `vote-${ticketId}-${voteType}`;
    
    // Set loading state
    setActionLoading(prev => ({ ...prev, [actionKey]: true }));
    
    // Optimistic update for both lists
    const updateVotes = (tickets: FeedbackTicket[]) => 
      tickets.map(ticket => {
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
      });

    setTickets(prevTickets => updateVotes(prevTickets));
    setAllTickets(prevTickets => updateVotes(prevTickets));

    try {
      await FeedbackService.voteTicket(ticketId, userId, voteType);
    } catch (err) {
      console.error('Error voting on ticket:', err);
      setError('Failed to vote on ticket');
      // Revert optimistic update - reload all tickets
      await loadTickets();
    } finally {
      // Clear loading state
      setActionLoading(prev => ({ ...prev, [actionKey]: false }));
    }
  };

  const handleSaveDraft = async (ticketData: {
    title: string;
    description: string;
    category: FeedbackCategory;
    priority: FeedbackPriority;
    tags: string[];
    attachments: File[];
    urlToPage?: string;
    browser?: string;
    browserVersion?: string;
    operatingSystem?: string;
    deviceType: 'desktop' | 'mobile' | 'tablet';
    screenResolution?: string;
    stepsToReproduce?: string;
    expectedBehavior?: string;
    actualBehavior?: string;
    severity: 'cosmetic' | 'minor' | 'major' | 'critical' | 'blocker';
    environment: 'development' | 'staging' | 'production';
    testCaseId?: string;
    regression: boolean;
    workaround?: string;
  }): Promise<void> => {
    // Create optimistic draft ticket
    const optimisticDraft: FeedbackTicket = {
      id: `draft-${Date.now()}`,
      sequentialId: 0, // Will be updated when real draft is created
      title: ticketData.title.trim() || 'Draft Ticket',
      description: ticketData.description.trim() || 'This is a draft ticket',
      category: ticketData.category,
      priority: ticketData.priority,
      status: 'draft', // Special status for drafts
      reporterId: userProfile?.uid || '',
      reporterName: userProfile?.displayName || 'Unknown User',
      reporterEmail: userProfile?.email || '',
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: ticketData.tags,
      attachments: [],
      comments: [],
      votes: 0,
      upvoters: [],
      downvoters: [],
      // Testing-specific fields
      urlToPage: ticketData.urlToPage?.trim() || undefined,
      browser: ticketData.browser?.trim() || undefined,
      browserVersion: ticketData.browserVersion?.trim() || undefined,
      operatingSystem: ticketData.operatingSystem?.trim() || undefined,
      deviceType: ticketData.deviceType,
      screenResolution: ticketData.screenResolution?.trim() || undefined,
      stepsToReproduce: ticketData.stepsToReproduce?.trim() || undefined,
      expectedBehavior: ticketData.expectedBehavior?.trim() || undefined,
      actualBehavior: ticketData.actualBehavior?.trim() || undefined,
      severity: ticketData.severity,
      environment: ticketData.environment,
      testCaseId: ticketData.testCaseId?.trim() || undefined,
      regression: ticketData.regression,
      workaround: ticketData.workaround?.trim() || undefined
    };

    // Add optimistic draft to both lists
    setTickets(prevTickets => [optimisticDraft, ...prevTickets]);
    setAllTickets(prevTickets => [optimisticDraft, ...prevTickets]);

    try {
      const draftId = await FeedbackService.createTicket(
        {
          ...ticketData,
          title: ticketData.title.trim() || 'Draft Ticket',
          description: ticketData.description.trim() || 'This is a draft ticket'
        },
        userProfile?.uid || '',
        userProfile?.displayName || 'Unknown User',
        userProfile?.email || '',
        'draft' // Pass draft status
      );

      // Replace optimistic draft with real one in both lists
      setTickets(prevTickets => 
        prevTickets.map(ticket => 
          ticket.id === optimisticDraft.id 
            ? { ...ticket, id: draftId, status: 'draft' as FeedbackStatus }
            : ticket
        )
      );
      setAllTickets(prevTickets => 
        prevTickets.map(ticket => 
          ticket.id === optimisticDraft.id 
            ? { ...ticket, id: draftId, status: 'draft' as FeedbackStatus }
            : ticket
        )
      );
    } catch (err) {
      console.error('Error saving draft:', err);
      setError('Failed to save draft');
      // Remove optimistic draft on error from both lists
      setTickets(prevTickets => 
        prevTickets.filter(ticket => ticket.id !== optimisticDraft.id)
      );
      setAllTickets(prevTickets => 
        prevTickets.filter(ticket => ticket.id !== optimisticDraft.id)
      );
      // Re-throw the error so the modal can handle it
      throw err;
    }
  };

  const handleCreateTicket = async (ticketData: {
    title: string;
    description: string;
    category: FeedbackCategory;
    priority: FeedbackPriority;
    tags: string[];
    attachments: File[];
    urlToPage?: string;
    browser?: string;
    browserVersion?: string;
    operatingSystem?: string;
    deviceType: 'desktop' | 'mobile' | 'tablet';
    screenResolution?: string;
    stepsToReproduce?: string;
    expectedBehavior?: string;
    actualBehavior?: string;
    severity: 'cosmetic' | 'minor' | 'major' | 'critical' | 'blocker';
    environment: 'development' | 'staging' | 'production';
    testCaseId?: string;
    regression: boolean;
    workaround?: string;
  }): Promise<void> => {
    // Create optimistic ticket
    const optimisticTicket: FeedbackTicket = {
      id: `temp-${Date.now()}`,
      sequentialId: 0, // Will be updated when real ticket is created
      title: ticketData.title.trim(),
      description: ticketData.description.trim(),
      category: ticketData.category,
      priority: ticketData.priority,
      status: 'open',
      reporterId: userProfile?.uid || '',
      reporterName: userProfile?.displayName || 'Unknown User',
      reporterEmail: userProfile?.email || '',
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: ticketData.tags,
      attachments: [],
      comments: [],
      votes: 0,
      upvoters: [],
      downvoters: [],
      // Testing-specific fields
      urlToPage: ticketData.urlToPage?.trim() || undefined,
      browser: ticketData.browser?.trim() || undefined,
      browserVersion: ticketData.browserVersion?.trim() || undefined,
      operatingSystem: ticketData.operatingSystem?.trim() || undefined,
      deviceType: ticketData.deviceType,
      screenResolution: ticketData.screenResolution?.trim() || undefined,
      stepsToReproduce: ticketData.stepsToReproduce?.trim() || undefined,
      expectedBehavior: ticketData.expectedBehavior?.trim() || undefined,
      actualBehavior: ticketData.actualBehavior?.trim() || undefined,
      severity: ticketData.severity,
      environment: ticketData.environment,
      testCaseId: ticketData.testCaseId?.trim() || undefined,
      regression: ticketData.regression,
      workaround: ticketData.workaround?.trim() || undefined
    };

    // Add optimistic ticket to both lists
    setTickets(prevTickets => [optimisticTicket, ...prevTickets]);
    setAllTickets(prevTickets => [optimisticTicket, ...prevTickets]);

    // Close modal immediately
    setShowCreateModal(false);

    try {
      const ticketId = await FeedbackService.createTicket(
        ticketData,
        userProfile?.uid || '',
        userProfile?.displayName || 'Unknown User',
        userProfile?.email || ''
      );

      // Replace optimistic ticket with real one in both lists
      setTickets(prevTickets => 
        prevTickets.map(ticket => 
          ticket.id === optimisticTicket.id 
            ? { ...ticket, id: ticketId }
            : ticket
        )
      );
      setAllTickets(prevTickets => 
        prevTickets.map(ticket => 
          ticket.id === optimisticTicket.id 
            ? { ...ticket, id: ticketId }
            : ticket
        )
      );
    } catch (err) {
      console.error('Error creating ticket:', err);
      setError('Failed to create ticket');
      // Remove optimistic ticket on error from both lists
      setTickets(prevTickets => 
        prevTickets.filter(ticket => ticket.id !== optimisticTicket.id)
      );
      setAllTickets(prevTickets => 
        prevTickets.filter(ticket => ticket.id !== optimisticTicket.id)
      );
      // Re-throw the error so the modal can handle it
      throw err;
    }
  };

  const handleViewTicket = (ticket: FeedbackTicket) => {
    setViewingTicket(ticket);
    setShowViewModal(true);
  };

  const handleEditTicket = (ticket: FeedbackTicket) => {
    setEditingTicket(ticket);
    setShowEditModal(true);
  };

  const handleUpdateTicket = async (ticketData: TicketUpdateData) => {
    if (!editingTicket) return;

    const originalTicket = tickets.find(t => t.id === editingTicket.id);
    if (!originalTicket) return;

    // Convert File[] attachments to FeedbackAttachment[] if needed
    // Here, we assume attachments are not updated via this modal, or you have a way to handle uploads elsewhere.
    // If you need to upload and convert File[] to FeedbackAttachment[], do it here.

    // Ensure attachments remain FeedbackAttachment[] (not File[])
    const updatedTicket = { 
      ...editingTicket, 
      ...ticketData, 
      updatedAt: new Date(),
      attachments: editingTicket.attachments // preserve original attachments type
    };

    // Optimistic update for both lists
    setTickets(prevTickets =>
      prevTickets.map(ticket =>
        ticket.id === editingTicket.id
          ? updatedTicket
          : ticket
      )
    );
    setAllTickets(prevTickets =>
      prevTickets.map(ticket =>
        ticket.id === editingTicket.id
          ? updatedTicket
          : ticket
      )
    );

    // Close modal immediately
    setShowEditModal(false);
    setEditingTicket(null);

    try {
      await FeedbackService.updateTicket(editingTicket.id, ticketData);
    } catch (err) {
      console.error('Error updating ticket:', err);
      setError('Failed to update ticket');
      // Revert optimistic update on error for both lists
      setTickets(prevTickets =>
        prevTickets.map(ticket =>
          ticket.id === editingTicket.id ? originalTicket : ticket
        )
      );
      setAllTickets(prevTickets =>
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
    
    // Optimistic update - remove ticket from both lists immediately
    setTickets(prevTickets => 
      prevTickets.filter(ticket => ticket.id !== ticketToDelete.id)
    );
    setAllTickets(prevTickets => 
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
      // Revert optimistic update on error for both lists
      setTickets(prevTickets => [ticketToDelete, ...prevTickets]);
      setAllTickets(prevTickets => [ticketToDelete, ...prevTickets]);
    }
  };


  const handleOpenComments = (ticket: FeedbackTicket) => {
    setSelectedTicketForComments(ticket);
    setShowCommentsSidebar(true);
  };

  const handleAddComment = async (content: string, isInternal: boolean, attachments: File[]) => {
    if (!selectedTicketForComments) return;

    const optimisticComment = {
      id: `temp-${Date.now()}`,
      ticketId: selectedTicketForComments.id,
      authorId: userProfile?.uid || '',
      authorName: userProfile?.displayName || 'Unknown User',
      content: content.trim(),
      createdAt: new Date(),
      updatedAt: new Date(),
      isInternal: isInternal,
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

    // Update both ticket lists
    const updateComments = (tickets: FeedbackTicket[]) => 
      tickets.map(ticket => 
        ticket.id === selectedTicketForComments.id 
          ? {
              ...ticket,
              comments: [...ticket.comments, optimisticComment],
              updatedAt: new Date()
            }
          : ticket
      );

    setTickets(prevTickets => updateComments(prevTickets));
    setAllTickets(prevTickets => updateComments(prevTickets));

    try {
      const commentId = await FeedbackService.addComment(selectedTicketForComments.id, {
        content: content.trim(),
        isInternal: isInternal,
        attachments: attachments
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

      const updateCommentId = (tickets: FeedbackTicket[]) => 
        tickets.map(ticket => 
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
        );

      setTickets(prevTickets => updateCommentId(prevTickets));
      setAllTickets(prevTickets => updateCommentId(prevTickets));
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
      const removeComment = (tickets: FeedbackTicket[]) => 
        tickets.map(ticket => 
          ticket.id === selectedTicketForComments.id 
            ? {
                ...ticket,
                comments: ticket.comments.filter(comment => comment.id !== optimisticComment.id)
              }
            : ticket
        );

      setTickets(prevTickets => removeComment(prevTickets));
      setAllTickets(prevTickets => removeComment(prevTickets));
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

  const formatRoleName = (role: string) => {
    return role.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const handleStatusTileClick = (status: FeedbackStatus | 'all') => {
    setActiveStatusFilter(status);
    setFilters(prev => ({
      ...prev,
      status: status === 'all' ? undefined : [status]
    }));
    
    // Don't trigger a full reload - just update the filter state
    // The existing tickets will be filtered by the new filter state
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
      <StatsTiles 
        stats={stats} 
        onStatusClick={handleStatusTileClick}
        activeStatus={activeStatusFilter}
      />

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
            value={activeStatusFilter}
            onChange={(e) => {
              const status = e.target.value as FeedbackStatus | 'all';
              handleStatusTileClick(status);
            }}
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
          const reporterProfile = userProfiles[ticket.reporterId];
          const reporterRoles = reporterProfile ? getUserRoles(reporterProfile) : [];
          
          return (
            <div 
              key={ticket.id} 
              ref={(el) => {
                if (hoveredTicket === ticket.id) {
                  setSelectedCardRef(el);
                }
              }}
              className={`ticket-card ${ticket.id.startsWith('temp-') ? 'optimistic' : ''} status-${ticket.status}`}
              onClick={(e) => {
                setSelectedCardRef(e.currentTarget);
                setHoveredTicket(hoveredTicket === ticket.id ? null : ticket.id);
              }}
              style={{ 
                cursor: 'pointer',
                '--status-primary': STATUS_THEMES[ticket.status].primary,
                '--status-light': STATUS_THEMES[ticket.status].light,
                '--status-dark': STATUS_THEMES[ticket.status].dark,
                '--status-background': STATUS_THEMES[ticket.status].background,
                '--status-border': STATUS_THEMES[ticket.status].border,
                '--status-text': STATUS_THEMES[ticket.status].text
              } as React.CSSProperties}
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
                
                {/* Reporter Information */}
                <div className="ticket-reporter">
                  <div className="reporter-info">
                    <FaUser className="reporter-icon" />
                    <div className="reporter-details">
                      <span className="reporter-name">
                        {reporterProfile ? reporterProfile.displayName : ticket.reporterName}
                      </span>
                      {reporterRoles.length > 0 && (
                        <div className="reporter-roles">
                          {reporterRoles.map(role => (
                            <span key={role} className="role-badge" data-role={role}>
                              {formatRoleName(role)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
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

      {/* Modals */}
      <CreateTicketModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateTicket}
        onSaveDraft={handleSaveDraft}
      />

      <ViewTicketModal
        isOpen={showViewModal}
        ticket={viewingTicket}
        onClose={() => setShowViewModal(false)}
        onEdit={handleEditTicket}
        onAddComment={handleAddComment}
      />

      <EditTicketModal
        isOpen={showEditModal}
        ticket={editingTicket}
        onClose={() => setShowEditModal(false)}
        onUpdate={handleUpdateTicket}
        onAddComment={handleAddComment}
      />

      <DeleteTicketModal
        isOpen={showDeleteModal}
        ticket={deletingTicket}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
      />

      <CommentsSidebar
        isOpen={showCommentsSidebar}
        ticket={selectedTicketForComments}
        onClose={() => setShowCommentsSidebar(false)}
        onAddComment={handleAddComment}
      />
    </div>
  );
}
