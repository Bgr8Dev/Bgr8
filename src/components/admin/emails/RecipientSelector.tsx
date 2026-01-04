import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { 
  FaSearch, 
  FaPlus, 
  FaEdit, 
  FaUsers, 
  FaCheck, 
  FaTimes, 
  FaSpinner,
  FaInfoCircle,
  FaUser,
  FaAddressBook,
  FaFilter
} from 'react-icons/fa';
import { EmailService, Recipient } from '../../../services/emailService';
import { useAuth } from '../../../hooks/useAuth';
import { firestore } from '../../../firebase/firebase';
import { collection, query, getDocs, orderBy, Timestamp, doc, getDoc } from 'firebase/firestore';
import { loggers } from '../../../utils/logger';
import './RecipientSelector.css';

interface UserData {
  uid: string;
  email: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  dateCreated?: Timestamp | Date;
  lastLogin?: Date | Timestamp;
  roles?: {
    admin?: boolean;
    developer?: boolean;
    committee?: boolean;
    audit?: boolean;
    marketing?: boolean;
    'vetting-officer'?: boolean;
    'social-media'?: boolean;
    outreach?: boolean;
    events?: boolean;
    tester?: boolean;
    ambassador?: boolean;
  };
  isMentor?: boolean;
  isMentee?: boolean;
  [key: string]: unknown;
}

interface RecipientSelectorProps {
  selectedRecipients: string[]; // Array of recipient IDs or email addresses
  onRecipientsChange: (recipients: string[]) => void; // Callback with recipient IDs or email addresses
  onClose: () => void;
  onUserEmailsSelected?: (emails: string[]) => void; // Callback for when users are selected (returns emails directly)
}

export const RecipientSelector: React.FC<RecipientSelectorProps> = ({
  selectedRecipients,
  onRecipientsChange,
  onClose,
  onUserEmailsSelected
}) => {
  const { userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'recipients' | 'users'>('users'); // Default to users tab
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [filteredRecipients, setFilteredRecipients] = useState<Recipient[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRecipient, setNewRecipient] = useState({
    email: '',
    name: '',
    firstName: '',
    lastName: '',
    tags: [] as string[],
    notes: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [editingRecipient, setEditingRecipient] = useState<Recipient | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [selectedUserEmails, setSelectedUserEmails] = useState<Set<string>>(new Set());
  
  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [lastLoginFilter, setLastLoginFilter] = useState<'all' | 'last-7-days' | 'last-30-days' | 'last-90-days' | 'never'>('all');
  const [mentorMenteeFilter, setMentorMenteeFilter] = useState<'all' | 'mentor' | 'mentee' | 'neither'>('all');
  const [ambassadorFilter, setAmbassadorFilter] = useState<boolean | null>(null); // null = all, true = ambassador, false = not ambassador

  // Show notification
  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Load recipients
  const loadRecipients = useCallback(async () => {
    try {
      setIsLoading(true);
      const recipientsData = await EmailService.getRecipients();
      setRecipients(recipientsData);
      
      // Extract unique tags
      const tags = new Set<string>();
      recipientsData.forEach(recipient => {
        recipient.tags.forEach(tag => tags.add(tag));
      });
      setAvailableTags(Array.from(tags).sort());
    } catch (error) {
      loggers.error.error('Error loading recipients:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load users from Firebase with mentor/mentee status
  const loadUsers = useCallback(async () => {
    try {
      setIsLoadingUsers(true);
      const usersRef = collection(firestore, 'users');
      const q = query(usersRef, orderBy('dateCreated', 'desc'));
      const querySnapshot = await getDocs(q);
      
      // Process users in parallel batches
      const userPromises = querySnapshot.docs.map(async (userDoc) => {
        const user = userDoc.data() as UserData;
        if (!user.email) return null; // Skip users without email
        
        // Fetch mentor program profile to check mentor/mentee status
        let isMentor = false;
        let isMentee = false;
        
        try {
          const mentorProgramDoc = await getDoc(
            doc(firestore, 'users', userDoc.id, 'mentorProgram', 'profile')
          );
          
          if (mentorProgramDoc.exists()) {
            const mentorData = mentorProgramDoc.data();
            isMentor = mentorData.isMentor === true || mentorData.type?.toLowerCase() === 'mentor';
            isMentee = mentorData.isMentee === true || mentorData.type?.toLowerCase() === 'mentee';
          }
        } catch {
          // If mentor program doesn't exist, that's fine - user is neither mentor nor mentee
          loggers.email.debug(`No mentor program profile for user ${userDoc.id}`);
        }
        
        // Convert lastLogin if it's a Timestamp
        let lastLogin: Date | undefined;
        if (user.lastLogin) {
          if (user.lastLogin instanceof Timestamp) {
            lastLogin = user.lastLogin.toDate();
          } else if (user.lastLogin instanceof Date) {
            lastLogin = user.lastLogin;
          }
        } else if (user.activityLog && typeof user.activityLog === 'object' && 'lastLogin' in user.activityLog) {
          const activityLogin = (user.activityLog as { lastLogin?: Date | Timestamp }).lastLogin;
          if (activityLogin) {
            if (activityLogin instanceof Timestamp) {
              lastLogin = activityLogin.toDate();
            } else if (activityLogin instanceof Date) {
              lastLogin = activityLogin;
            }
          }
        }
        
        return {
          ...user,
          uid: userDoc.id,
          isMentor,
          isMentee,
          lastLogin
        } as UserData;
      });
      
      const resolvedUsers = await Promise.all(userPromises);
      const validUsers = resolvedUsers.filter((user): user is UserData => user !== null);
      
      setUsers(validUsers);
      loggers.email.log(`Loaded ${validUsers.length} users from Firebase`);
    } catch (error) {
      loggers.error.error('Error loading users:', error);
      showNotification('error', 'Failed to load users. Please try again.');
    } finally {
      setIsLoadingUsers(false);
    }
  }, []);

  // Prevent body scroll when modal is open and handle keyboard shortcuts
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    
    // Handle Escape key to close modal
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.body.style.overflow = 'unset';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  useEffect(() => {
    loadRecipients();
    loadUsers();
  }, [loadRecipients, loadUsers]);

  // Filter recipients based on search and tags
  useEffect(() => {
    let filtered = recipients;

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(recipient =>
        recipient.email.toLowerCase().includes(term) ||
        recipient.name?.toLowerCase().includes(term) ||
        recipient.firstName?.toLowerCase().includes(term) ||
        recipient.lastName?.toLowerCase().includes(term)
      );
    }

    // Filter by selected tags
    if (selectedTags.length > 0) {
      filtered = filtered.filter(recipient =>
        selectedTags.some(tag => recipient.tags.includes(tag))
      );
    }

    setFilteredRecipients(filtered);
  }, [recipients, searchTerm, selectedTags]);

  // Filter users based on search and filters
  useEffect(() => {
    let filtered = users;

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(user =>
        user.email?.toLowerCase().includes(term) ||
        user.firstName?.toLowerCase().includes(term) ||
        user.lastName?.toLowerCase().includes(term) ||
        user.displayName?.toLowerCase().includes(term)
      );
    }

    // Filter by roles
    if (selectedRoles.length > 0) {
      filtered = filtered.filter(user => {
        if (!user.roles) return false;
        return selectedRoles.some(role => user.roles?.[role as keyof typeof user.roles] === true);
      });
    }

    // Filter by last login
    if (lastLoginFilter !== 'all') {
      const now = new Date();
      filtered = filtered.filter(user => {
        if (!user.lastLogin) {
          return lastLoginFilter === 'never';
        }
        
        const loginDate = user.lastLogin instanceof Date 
          ? user.lastLogin 
          : (user.lastLogin as Timestamp).toDate();
        
        const daysSinceLogin = Math.floor((now.getTime() - loginDate.getTime()) / (1000 * 60 * 60 * 24));
        
        switch (lastLoginFilter) {
          case 'last-7-days':
            return daysSinceLogin <= 7;
          case 'last-30-days':
            return daysSinceLogin <= 30;
          case 'last-90-days':
            return daysSinceLogin <= 90;
          case 'never':
            return false; // Already handled above
          default:
            return true;
        }
      });
    }

    // Filter by mentor/mentee status
    if (mentorMenteeFilter !== 'all') {
      filtered = filtered.filter(user => {
        switch (mentorMenteeFilter) {
          case 'mentor':
            return user.isMentor === true;
          case 'mentee':
            return user.isMentee === true;
          case 'neither':
            return !user.isMentor && !user.isMentee;
          default:
            return true;
        }
      });
    }

    // Filter by ambassador status
    if (ambassadorFilter !== null) {
      filtered = filtered.filter(user => {
        const isAmbassador = user.roles?.ambassador === true;
        return ambassadorFilter ? isAmbassador : !isAmbassador;
      });
    }

    setFilteredUsers(filtered);
  }, [users, searchTerm, selectedRoles, lastLoginFilter, mentorMenteeFilter, ambassadorFilter]);

  // Handle recipient selection
  const handleRecipientToggle = (recipientId: string) => {
    if (selectedRecipients.includes(recipientId)) {
      onRecipientsChange(selectedRecipients.filter(id => id !== recipientId));
    } else {
      onRecipientsChange([...selectedRecipients, recipientId]);
    }
  };

  // Handle user selection (users are selected by email)
  const handleUserToggle = (userEmail: string) => {
    const newSelected = new Set(selectedUserEmails);
    if (newSelected.has(userEmail)) {
      newSelected.delete(userEmail);
    } else {
      newSelected.add(userEmail);
    }
    setSelectedUserEmails(newSelected);
    
    // If callback is provided, call it with the selected emails
    if (onUserEmailsSelected) {
      onUserEmailsSelected(Array.from(newSelected));
    }
  };

  // Handle tag selection
  const handleTagToggle = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  // Handle role filter toggle
  const handleRoleToggle = (role: string) => {
    if (selectedRoles.includes(role)) {
      setSelectedRoles(selectedRoles.filter(r => r !== role));
    } else {
      setSelectedRoles([...selectedRoles, role]);
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedRoles([]);
    setLastLoginFilter('all');
    setMentorMenteeFilter('all');
    setAmbassadorFilter(null);
    setSearchTerm('');
  };

  // Get available roles from users
  const availableRoles = React.useMemo(() => {
    const rolesSet = new Set<string>();
    users.forEach(user => {
      if (user.roles) {
        Object.keys(user.roles).forEach(role => {
          if (user.roles?.[role as keyof typeof user.roles] === true) {
            rolesSet.add(role);
          }
        });
      }
    });
    return Array.from(rolesSet).sort();
  }, [users]);

  // Add new recipient
  const handleAddRecipient = async () => {
    if (!newRecipient.email) return;

    try {
      setIsSaving(true);
      const recipientData = {
        email: newRecipient.email,
        name: newRecipient.name || undefined,
        firstName: newRecipient.firstName || undefined,
        lastName: newRecipient.lastName || undefined,
        tags: newRecipient.tags,
        groups: [],
        isActive: true,
        isVerified: false,
        createdBy: userProfile?.uid || '',
        notes: newRecipient.notes || undefined,
        metadata: {
          source: 'manual'
        }
      };

      const recipientId = await EmailService.saveRecipient(recipientData);
      
      // Add to selected recipients
      onRecipientsChange([...selectedRecipients, recipientId]);
      
      // Reset form
      setNewRecipient({
        email: '',
        name: '',
        firstName: '',
        lastName: '',
        tags: [],
        notes: ''
      });
      setShowAddForm(false);
      
      // Reload recipients
      await loadRecipients();
      showNotification('success', 'Recipient added successfully!');
    } catch (error) {
      loggers.error.error('Error adding recipient:', error);
      showNotification('error', 'Failed to add recipient. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Add tag to new recipient
  const handleAddTag = (tag: string) => {
    if (tag && !newRecipient.tags.includes(tag)) {
      setNewRecipient(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
    }
  };

  // Remove tag from new recipient
  const handleRemoveTag = (tagToRemove: string) => {
    setNewRecipient(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  // Delete recipient
  const handleDeleteRecipient = async (recipientId: string) => {
    if (window.confirm('Are you sure you want to delete this recipient? This action cannot be undone.')) {
      try {
        await EmailService.deleteRecipient(recipientId);
        
        // Remove from selected recipients if it was selected
        if (selectedRecipients.includes(recipientId)) {
          onRecipientsChange(selectedRecipients.filter(id => id !== recipientId));
        }
        
        // Reload recipients to update the list
        await loadRecipients();
        showNotification('success', 'Recipient deleted successfully!');
      } catch (error) {
        loggers.error.error('Error deleting recipient:', error);
        showNotification('error', 'Failed to delete recipient. Please try again.');
      }
    }
  };

  // Edit recipient
  const handleEditRecipient = (recipientId: string) => {
    const recipient = recipients.find(r => r.id === recipientId);
    if (recipient) {
      setEditingRecipient(recipient);
      setNewRecipient({
        email: recipient.email,
        name: recipient.name || '',
        firstName: recipient.firstName || '',
        lastName: recipient.lastName || '',
        tags: [...recipient.tags],
        notes: recipient.notes || ''
      });
      setIsEditing(true);
      setShowAddForm(true);
    }
  };

  // Save edited recipient
  const handleSaveEditedRecipient = async () => {
    if (!editingRecipient || !newRecipient.email) {
      showNotification('error', 'Please fill in all required fields');
      return;
    }

    try {
      setIsSaving(true);
      
      const updatedRecipient = {
        ...editingRecipient,
        email: newRecipient.email,
        name: newRecipient.name || undefined,
        firstName: newRecipient.firstName || undefined,
        lastName: newRecipient.lastName || undefined,
        tags: newRecipient.tags,
        notes: newRecipient.notes || undefined
      };

      await EmailService.updateRecipient(editingRecipient.id, updatedRecipient);
      
      // Reset form and editing state
      setEditingRecipient(null);
      setIsEditing(false);
      setNewRecipient({
        email: '',
        name: '',
        firstName: '',
        lastName: '',
        tags: [],
        notes: ''
      });
      setShowAddForm(false);
      
      // Reload recipients
      await loadRecipients();
      showNotification('success', 'Recipient updated successfully!');
    } catch (error) {
      loggers.error.error('Error updating recipient:', error);
      showNotification('error', 'Failed to update recipient. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingRecipient(null);
    setIsEditing(false);
    setNewRecipient({
      email: '',
      name: '',
      firstName: '',
      lastName: '',
      tags: [],
      notes: ''
    });
    setShowAddForm(false);
  };

  const modalContent = (
    <div className="recipient-selector-overlay" onClick={(e) => {
      // Only close if clicking directly on the overlay, not on modal content
      if (e.target === e.currentTarget) {
        onClose();
      }
    }}>
      <div className="recipient-selector-modal" onClick={(e) => e.stopPropagation()}>
        {isLoading ? (
          <div className="recipient-selector-loading">
            <FaSpinner className="recipient-spinner" />
            <p>Loading recipients...</p>
          </div>
        ) : (
          <>
            {/* Notification */}
            {notification && (
              <div className={`recipient-notification recipient-notification-${notification.type}`}>
                <div className="recipient-notification-content">
                  {notification.type === 'success' && <FaCheck />}
                  {notification.type === 'error' && <FaTimes />}
                  {notification.type === 'info' && <FaInfoCircle />}
                  <span>{notification.message}</span>
                </div>
                <button 
                  className="recipient-notification-close"
                  onClick={() => setNotification(null)}
                  title="Close notification"
                >
                  <FaTimes />
                </button>
              </div>
            )}

            <div className="recipient-selector-header">
              <h3>Select Recipients</h3>
              <button 
                className="recipient-close-btn" 
                onClick={onClose}
                title="Close recipient selector"
                aria-label="Close recipient selector"
              >
                <FaTimes />
              </button>
            </div>

            {/* Tabs for Recipients vs Users */}
            <div className="recipient-selector-tabs">
              <button
                className={`recipient-tab ${activeTab === 'users' ? 'active' : ''}`}
                onClick={() => setActiveTab('users')}
              >
                <FaUsers />
                <span>Users ({users.length})</span>
              </button>
              <button
                className={`recipient-tab ${activeTab === 'recipients' ? 'active' : ''}`}
                onClick={() => setActiveTab('recipients')}
              >
                <FaAddressBook />
                <span>Saved Recipients ({recipients.length})</span>
              </button>
            </div>

        <div className="recipient-selector-content">
          {/* Search and Filters */}
          <div className="recipient-search-section">
            <div className="recipient-search-box">
              <FaSearch className="recipient-search-icon" />
              <input
                type="text"
                placeholder={activeTab === 'users' ? "Search users..." : "Search recipients..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="recipient-search-input"
              />
            </div>

            {activeTab === 'users' && (
              <button
                className="recipient-filter-toggle-btn"
                onClick={() => setShowFilters(!showFilters)}
                title="Toggle filters"
              >
                <FaFilter />
                Filters
                {(selectedRoles.length > 0 || lastLoginFilter !== 'all' || mentorMenteeFilter !== 'all' || ambassadorFilter !== null) && (
                  <span className="recipient-filter-badge">{[
                    selectedRoles.length,
                    lastLoginFilter !== 'all' ? 1 : 0,
                    mentorMenteeFilter !== 'all' ? 1 : 0,
                    ambassadorFilter !== null ? 1 : 0
                  ].reduce((a, b) => a + b, 0)}</span>
                )}
              </button>
            )}

            {activeTab === 'recipients' && (
              <button
                className="recipient-add-btn"
                onClick={() => setShowAddForm(!showAddForm)}
              >
                <FaPlus />
                Add New
              </button>
            )}
          </div>

          {/* User Filters Panel */}
          {activeTab === 'users' && showFilters && (
            <div className="recipient-filters-panel">
              <div className="recipient-filters-header">
                <h4>Filter Users</h4>
                <button
                  className="recipient-filter-clear-btn"
                  onClick={clearFilters}
                  disabled={selectedRoles.length === 0 && lastLoginFilter === 'all' && mentorMenteeFilter === 'all' && ambassadorFilter === null}
                >
                  Clear All
                </button>
              </div>

              {/* Roles Filter */}
              <div className="recipient-filter-group">
                <label className="recipient-filter-label">Roles</label>
                <div className="recipient-filter-options">
                  {availableRoles.map(role => (
                    <label key={role} className="recipient-filter-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedRoles.includes(role)}
                        onChange={() => handleRoleToggle(role)}
                      />
                      <span>{role.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Last Login Filter */}
              <div className="recipient-filter-group">
                <label className="recipient-filter-label">Last Login</label>
                <select
                  className="recipient-filter-select"
                  value={lastLoginFilter}
                  onChange={(e) => setLastLoginFilter(e.target.value as typeof lastLoginFilter)}
                >
                  <option value="all">All Users</option>
                  <option value="last-7-days">Last 7 Days</option>
                  <option value="last-30-days">Last 30 Days</option>
                  <option value="last-90-days">Last 90 Days</option>
                  <option value="never">Never Logged In</option>
                </select>
              </div>

              {/* Mentor/Mentee Filter */}
              <div className="recipient-filter-group">
                <label className="recipient-filter-label">Mentor Program</label>
                <select
                  className="recipient-filter-select"
                  value={mentorMenteeFilter}
                  onChange={(e) => setMentorMenteeFilter(e.target.value as typeof mentorMenteeFilter)}
                >
                  <option value="all">All Users</option>
                  <option value="mentor">Mentors Only</option>
                  <option value="mentee">Mentees Only</option>
                  <option value="neither">Not in Program</option>
                </select>
              </div>

              {/* Ambassador Filter */}
              <div className="recipient-filter-group">
                <label className="recipient-filter-label">Ambassador Status</label>
                <select
                  className="recipient-filter-select"
                  value={ambassadorFilter === null ? 'all' : ambassadorFilter ? 'yes' : 'no'}
                  onChange={(e) => {
                    const value = e.target.value;
                    setAmbassadorFilter(value === 'all' ? null : value === 'yes');
                  }}
                >
                  <option value="all">All Users</option>
                  <option value="yes">Ambassadors Only</option>
                  <option value="no">Non-Ambassadors</option>
                </select>
              </div>
            </div>
          )}

          {/* Tag Filters */}
          {availableTags.length > 0 && (
            <div className="recipient-tag-filters">
              <h4>Filter by Tags:</h4>
              <div className="recipient-tag-list">
                {availableTags.map(tag => (
                  <button
                    key={tag}
                    className={`recipient-tag-filter ${selectedTags.includes(tag) ? 'active' : ''}`}
                    onClick={() => handleTagToggle(tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Add/Edit Recipient Form */}
          {showAddForm && (
            <div className="recipient-add-form">
              <h4>{isEditing ? 'Edit Recipient' : 'Add New Recipient'}</h4>
              <div className="recipient-form-grid">
                <div className="recipient-form-field">
                  <label>Email *</label>
                  <input
                    type="email"
                    value={newRecipient.email}
                    onChange={(e) => setNewRecipient(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="recipient@example.com"
                    required
                  />
                </div>
                <div className="recipient-form-field">
                  <label>Full Name</label>
                  <input
                    type="text"
                    value={newRecipient.name}
                    onChange={(e) => setNewRecipient(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="John Doe"
                  />
                </div>
                <div className="recipient-form-field">
                  <label>First Name</label>
                  <input
                    type="text"
                    value={newRecipient.firstName}
                    onChange={(e) => setNewRecipient(prev => ({ ...prev, firstName: e.target.value }))}
                    placeholder="John"
                  />
                </div>
                <div className="recipient-form-field">
                  <label>Last Name</label>
                  <input
                    type="text"
                    value={newRecipient.lastName}
                    onChange={(e) => setNewRecipient(prev => ({ ...prev, lastName: e.target.value }))}
                    placeholder="Doe"
                  />
                </div>
                <div className="recipient-form-field">
                  <label>Notes</label>
                  <textarea
                    value={newRecipient.notes}
                    onChange={(e) => setNewRecipient(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Additional notes..."
                    rows={2}
                  />
                </div>
              </div>

              <div className="recipient-tags-section">
                <label>Tags</label>
                <div className="recipient-tags-input">
                  <input
                    type="text"
                    placeholder="Add tag and press Enter"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const tag = e.currentTarget.value.trim();
                        if (tag) {
                          handleAddTag(tag);
                          e.currentTarget.value = '';
                        }
                      }
                    }}
                  />
                  <div className="recipient-tags-list">
                    {newRecipient.tags.map(tag => (
                      <span key={tag} className="recipient-tag">
                        {tag}
                        <button 
                          onClick={() => handleRemoveTag(tag)}
                          title="Remove tag"
                          aria-label="Remove tag"
                        >
                          <FaTimes />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="recipient-form-actions">
                <button
                  className="recipient-save-btn"
                  onClick={isEditing ? handleSaveEditedRecipient : handleAddRecipient}
                  disabled={!newRecipient.email || isSaving}
                >
                  {isSaving ? <FaSpinner className="recipient-spinner" /> : (isEditing ? <FaCheck /> : <FaPlus />)}
                  {isSaving ? (isEditing ? 'Updating...' : 'Adding...') : (isEditing ? 'Update Recipient' : 'Add Recipient')}
                </button>
                <button
                  className="recipient-cancel-btn"
                  onClick={isEditing ? handleCancelEdit : () => setShowAddForm(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Users List */}
          {activeTab === 'users' && (
            <div className="recipient-list-section">
              <div className="recipient-list-header">
                <h4>Users ({filteredUsers.length})</h4>
                <span className="recipient-selected-count">
                  {selectedUserEmails.size} selected
                </span>
              </div>

              {isLoadingUsers ? (
                <div className="recipient-selector-loading">
                  <FaSpinner className="recipient-spinner" />
                  <p>Loading users...</p>
                </div>
              ) : (
                <div className="recipient-list">
                  {filteredUsers.map(user => {
                    const isSelected = selectedUserEmails.has(user.email);
                    return (
                      <div
                        key={user.uid}
                        className={`recipient-item ${isSelected ? 'selected' : ''}`}
                        onClick={() => handleUserToggle(user.email)}
                      >
                        <div className="recipient-checkbox">
                          {isSelected ? (
                            <FaCheck className="recipient-check-icon" />
                          ) : (
                            <div className="recipient-check-empty" />
                          )}
                        </div>
                        
                        <div className="recipient-info">
                          <div className="recipient-main">
                            <span className="recipient-email">{user.email}</span>
                            {(user.displayName || (user.firstName && user.lastName)) && (
                              <span className="recipient-name">
                                {user.displayName || `${user.firstName} ${user.lastName}`}
                              </span>
                            )}
                          </div>
                          
                          {/* User metadata badges */}
                          <div className="recipient-user-badges">
                            {user.isMentor && (
                              <span className="recipient-badge recipient-badge-mentor">Mentor</span>
                            )}
                            {user.isMentee && (
                              <span className="recipient-badge recipient-badge-mentee">Mentee</span>
                            )}
                            {user.roles?.ambassador && (
                              <span className="recipient-badge recipient-badge-ambassador">Ambassador</span>
                            )}
                            {user.roles && Object.entries(user.roles)
                              .filter(([, value]) => value === true)
                              .filter(([key]) => key !== 'ambassador')
                              .slice(0, 2)
                              .map(([role]) => (
                                <span key={role} className="recipient-badge recipient-badge-role">
                                  {role.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </span>
                              ))
                            }
                            {user.lastLogin && (
                              <span className="recipient-badge recipient-badge-login">
                                Last: {user.lastLogin instanceof Date 
                                  ? new Date(user.lastLogin).toLocaleDateString()
                                  : (user.lastLogin as Timestamp).toDate().toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {!isLoadingUsers && filteredUsers.length === 0 && (
                <div className="recipient-empty">
                  <FaUser className="recipient-empty-icon" />
                  <p>No users found</p>
                  {searchTerm && (
                    <p>Try adjusting your search terms</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Recipients List */}
          {activeTab === 'recipients' && (
            <div className="recipient-list-section">
              <div className="recipient-list-header">
                <h4>Recipients ({filteredRecipients.length})</h4>
                <span className="recipient-selected-count">
                  {selectedRecipients.length} selected
                </span>
              </div>

            <div className="recipient-list">
              {filteredRecipients.map(recipient => (
                <div
                  key={recipient.id}
                  className={`recipient-item ${selectedRecipients.includes(recipient.id) ? 'selected' : ''}`}
                  onClick={() => handleRecipientToggle(recipient.id)}
                >
                  <div className="recipient-checkbox">
                    {selectedRecipients.includes(recipient.id) ? (
                      <FaCheck className="recipient-check-icon" />
                    ) : (
                      <div className="recipient-check-empty" />
                    )}
                  </div>
                  
                  <div className="recipient-info">
                    <div className="recipient-main">
                      <span className="recipient-email">{recipient.email}</span>
                      {recipient.name && (
                        <span className="recipient-name">{recipient.name}</span>
                      )}
                    </div>
                    
                    {recipient.tags.length > 0 && (
                      <div className="recipient-tags">
                        {recipient.tags.map(tag => (
                          <span key={tag} className="recipient-tag-small">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="recipient-actions">
                    <button
                      className="recipient-action-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditRecipient(recipient.id);
                      }}
                      title="Edit recipient"
                      aria-label="Edit recipient"
                    >
                      <FaEdit />
                    </button>
                    <button
                      className="recipient-action-btn recipient-delete-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteRecipient(recipient.id);
                      }}
                      title="Delete recipient"
                      aria-label="Delete recipient"
                    >
                      <FaTimes />
                    </button>
                  </div>
                </div>
              ))}
            </div>

              {filteredRecipients.length === 0 && (
                <div className="recipient-empty">
                  <FaUsers className="recipient-empty-icon" />
                  <p>No recipients found</p>
                  {searchTerm && (
                    <p>Try adjusting your search terms</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="recipient-selector-footer">
          <div className="recipient-selection-summary">
            {activeTab === 'users' 
              ? `${selectedUserEmails.size} user${selectedUserEmails.size !== 1 ? 's' : ''} selected`
              : `${selectedRecipients.length} recipient${selectedRecipients.length !== 1 ? 's' : ''} selected`
            }
          </div>
          <div className="recipient-footer-actions">
            <button className="recipient-cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button 
              className="recipient-confirm-btn" 
              onClick={() => {
                // If users are selected, add their emails to the recipients
                if (activeTab === 'users' && selectedUserEmails.size > 0 && onUserEmailsSelected) {
                  onUserEmailsSelected(Array.from(selectedUserEmails));
                }
                onClose();
              }}
            >
              Done ({activeTab === 'users' ? selectedUserEmails.size : selectedRecipients.length})
            </button>
          </div>
        </div>
          </>
        )}
      </div>
    </div>
  );

  // Use createPortal to render the modal at the document root
  return createPortal(modalContent, document.body);
};

export default RecipientSelector;
