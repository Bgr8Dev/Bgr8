import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { 
  FaSearch, 
  FaPlus, 
  FaEdit, 
  FaUsers, 
  FaCheck, 
  FaTimes, 
  FaSpinner
} from 'react-icons/fa';
import { EmailService, Recipient } from '../../../services/emailService';
import { useAuth } from '../../../hooks/useAuth';
import './RecipientSelector.css';

interface RecipientSelectorProps {
  selectedRecipients: string[]; // Array of recipient IDs
  onRecipientsChange: (recipients: string[]) => void; // Callback with recipient IDs
  onClose: () => void;
}

export const RecipientSelector: React.FC<RecipientSelectorProps> = ({
  selectedRecipients,
  onRecipientsChange,
  onClose
}) => {
  const { userProfile } = useAuth();
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [filteredRecipients, setFilteredRecipients] = useState<Recipient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
      console.error('Error loading recipients:', error);
    } finally {
      setIsLoading(false);
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
  }, [loadRecipients]);

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

  // Handle recipient selection
  const handleRecipientToggle = (recipientId: string) => {
    if (selectedRecipients.includes(recipientId)) {
      onRecipientsChange(selectedRecipients.filter(id => id !== recipientId));
    } else {
      onRecipientsChange([...selectedRecipients, recipientId]);
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
    } catch (error) {
      console.error('Error adding recipient:', error);
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
      } catch (error) {
        console.error('Error deleting recipient:', error);
        alert('Failed to delete recipient. Please try again.');
      }
    }
  };

  // Edit recipient (placeholder for future implementation)
  const handleEditRecipient = (recipientId: string) => {
    // TODO: Implement edit functionality
    alert('Edit functionality coming soon!');
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

        <div className="recipient-selector-content">
          {/* Search and Filters */}
          <div className="recipient-search-section">
            <div className="recipient-search-box">
              <FaSearch className="recipient-search-icon" />
              <input
                type="text"
                placeholder="Search recipients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="recipient-search-input"
              />
            </div>

            <button
              className="recipient-add-btn"
              onClick={() => setShowAddForm(!showAddForm)}
            >
              <FaPlus />
              Add New
            </button>
          </div>

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

          {/* Add New Recipient Form */}
          {showAddForm && (
            <div className="recipient-add-form">
              <h4>Add New Recipient</h4>
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
                  onClick={handleAddRecipient}
                  disabled={!newRecipient.email || isSaving}
                >
                  {isSaving ? <FaSpinner className="recipient-spinner" /> : <FaPlus />}
                  {isSaving ? 'Adding...' : 'Add Recipient'}
                </button>
                <button
                  className="recipient-cancel-btn"
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Recipients List */}
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
        </div>

        <div className="recipient-selector-footer">
          <div className="recipient-selection-summary">
            {selectedRecipients.length} recipient{selectedRecipients.length !== 1 ? 's' : ''} selected
          </div>
          <div className="recipient-footer-actions">
            <button className="recipient-cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button className="recipient-confirm-btn" onClick={onClose}>
              Done ({selectedRecipients.length})
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
