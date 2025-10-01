import React from 'react';
import { EmailTemplate } from '../../../services/emailService';

interface TemplateModalProps {
  show: boolean;
  selectedTemplate: EmailTemplate | null;
  templateForm: Partial<EmailTemplate>;
  isSaving: boolean;
  onClose: () => void;
  onSave: () => void;
  onFormChange: (updates: Partial<EmailTemplate>) => void;
}

export const TemplateModal: React.FC<TemplateModalProps> = ({
  show,
  selectedTemplate,
  templateForm,
  isSaving,
  onClose,
  onSave,
  onFormChange
}) => {
  if (!show) return null;

  return (
    <div className="email-template-modal-overlay" onClick={onClose}>
      <div className="email-template-modal" onClick={(e) => e.stopPropagation()}>
        <div className="email-modal-header">
          <h3>{selectedTemplate ? 'Edit Template' : 'Create Template'}</h3>
          <button 
            className="email-close-btn"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        
        <div className="email-modal-content">
          <div className="email-form-group">
            <label>Template Name</label>
            <input
              type="text"
              value={templateForm.name || ''}
              onChange={(e) => onFormChange({ name: e.target.value })}
              placeholder="Enter template name..."
            />
          </div>
          
          <div className="email-form-group">
            <label>Category</label>
            <select
              value={templateForm.category || 'custom'}
              onChange={(e) => onFormChange({ category: e.target.value as 'announcement' | 'newsletter' | 'notification' | 'invitation' | 'reminder' | 'custom' })}
            >
              <option value="announcement">Announcement</option>
              <option value="newsletter">Newsletter</option>
              <option value="notification">Notification</option>
              <option value="invitation">Invitation</option>
              <option value="reminder">Reminder</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          
          <div className="email-form-group">
            <label>Subject</label>
            <input
              type="text"
              value={templateForm.subject || ''}
              onChange={(e) => onFormChange({ subject: e.target.value })}
              placeholder="Enter email subject..."
            />
          </div>
          
          <div className="email-form-group">
            <label>Content</label>
            <textarea
              value={templateForm.content || ''}
              onChange={(e) => onFormChange({ content: e.target.value })}
              placeholder="Enter email content..."
              rows={10}
            />
          </div>
          
          <div className="email-form-group">
            <label>Tags (comma-separated)</label>
            <input
              type="text"
              value={templateForm.tags?.join(', ') || ''}
              onChange={(e) => onFormChange({ 
                tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) 
              })}
              placeholder="e.g., newsletter, announcement, welcome"
            />
          </div>
          
          <div className="email-form-group">
            <label className="email-setting-label">
              <input
                type="checkbox"
                checked={templateForm.isPublic || false}
                onChange={(e) => onFormChange({ isPublic: e.target.checked })}
              />
              Make this template public (visible to other admins)
            </label>
          </div>
        </div>
        
        <div className="email-modal-actions">
          <button
            className="email-modal-btn email-cancel"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="email-modal-btn email-save"
            onClick={onSave}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : (selectedTemplate ? 'Update Template' : 'Create Template')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TemplateModal;
