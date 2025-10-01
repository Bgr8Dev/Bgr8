import React from 'react';
import { 
  FaSave, 
  FaPaperPlane, 
  FaEye, 
  FaEyeSlash, 
  FaSpinner, 
  FaPlus, 
  FaUsers, 
  FaTimes, 
  FaCopy
} from 'react-icons/fa';
import RichTextEditor from './RichTextEditor';
import { EmailDraft, RecipientGroup, EmailTemplate } from '../../../services/emailService';

interface ComposeTabProps {
  currentDraft: Partial<EmailDraft>;
  recipientGroups: RecipientGroup[];
  templates: EmailTemplate[];
  showPreview: boolean;
  individualEmailInput: string;
  emailValidationError: string;
  showBulkImport: boolean;
  bulkEmailInput: string;
  isSaving: boolean;
  isSending: boolean;
  onDraftChange: (updates: Partial<EmailDraft>) => void;
  onSaveDraft: () => void;
  onSendEmail: () => void;
  onTogglePreview: () => void;
  onEmailInputChange: (value: string) => void;
  onEmailInputKeyPress: (e: React.KeyboardEvent) => void;
  onAddIndividualRecipient: () => void;
  onRemoveIndividualRecipient: (email: string) => void;
  onClearIndividualRecipients: () => void;
  onClearAllRecipients: () => void;
  onShowRecipientSelector: () => void;
  onToggleBulkImport: () => void;
  onBulkImportChange: (value: string) => void;
  onBulkImport: () => void;
  onLoadTemplate: (template: EmailTemplate) => void;
}

export const ComposeTab: React.FC<ComposeTabProps> = ({
  currentDraft,
  recipientGroups,
  templates,
  showPreview,
  individualEmailInput,
  emailValidationError,
  showBulkImport,
  bulkEmailInput,
  isSaving,
  isSending,
  onDraftChange,
  onSaveDraft,
  onSendEmail,
  onTogglePreview,
  onEmailInputChange,
  onEmailInputKeyPress,
  onAddIndividualRecipient,
  onRemoveIndividualRecipient,
  onClearIndividualRecipients,
  onClearAllRecipients,
  onShowRecipientSelector,
  onToggleBulkImport,
  onBulkImportChange,
  onBulkImport,
  onLoadTemplate
}) => {
  const getTotalRecipients = () => {
    let total = currentDraft.recipients?.length || 0;
    (currentDraft.recipientGroups || []).forEach(groupId => {
      const group = recipientGroups.find(g => g.id === groupId);
      if (group) total += group.count;
    });
    return total;
  };

  return (
    <div className="email-compose-section">
      <div className="email-compose-layout">
        <div className="email-compose-main">
          <div className="email-compose-header">
            <div className="email-compose-subject">
              <input
                type="text"
                placeholder="Email subject..."
                value={currentDraft.subject}
                onChange={(e) => onDraftChange({ subject: e.target.value })}
                className="email-subject-input"
              />
            </div>
            <div className="email-compose-actions">
              <button 
                className="email-action-btn email-preview"
                onClick={onTogglePreview}
              >
                {showPreview ? <FaEyeSlash /> : <FaEye />}
                {showPreview ? 'Hide Preview' : 'Preview'}
              </button>
              <button 
                className="email-action-btn email-save"
                onClick={onSaveDraft}
                disabled={isSaving}
              >
                {isSaving ? <FaSpinner className="email-spinning" /> : <FaSave />}
                {isSaving ? 'Saving...' : 'Save Draft'}
              </button>
              <button 
                className="email-action-btn email-send"
                onClick={onSendEmail}
                disabled={isSending}
              >
                {isSending ? <FaSpinner className="email-spinning" /> : <FaPaperPlane />}
                {isSending ? 'Sending...' : 'Send Email'}
              </button>
            </div>
          </div>

          <div className="email-compose-body">
            <RichTextEditor
              content={currentDraft.content || ''}
              onChange={(content) => onDraftChange({ content })}
              placeholder="Start writing your email..."
              className="email-rich-text-editor"
              showToolbar={true}
              showWordCount={true}
              showCharCount={true}
              maxLength={10000}
              allowImages={true}
              allowLinks={true}
              allowTables={true}
              allowCode={true}
              allowEmojis={true}
              allowFileUpload={true}
              onSave={onSaveDraft}
              onPreview={onTogglePreview}
              onExport={() => {
                const blob = new Blob([currentDraft.content || ''], { type: 'text/html' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `email-draft-${Date.now()}.html`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              onImport={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.html,.txt,.rtf';
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      const content = event.target?.result as string;
                      onDraftChange({ content });
                    };
                    reader.readAsText(file);
                  }
                };
                input.click();
              }}
            />
          </div>
        </div>

        <div className="email-compose-sidebar">
          <div className="email-sidebar-section">
            <h3>Recipients</h3>
            <div className="email-recipients-summary">
              <span className="email-recipients-count">{getTotalRecipients()} recipients</span>
              {getTotalRecipients() > 0 && (
                <button
                  onClick={onClearAllRecipients}
                  style={{
                    background: 'rgba(239, 68, 68, 0.2)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#ef4444',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '6px',
                    fontSize: '0.7rem',
                    cursor: 'pointer',
                    marginLeft: '0.5rem',
                    transition: 'all 0.2s ease'
                  }}
                  title="Clear all recipients"
                >
                  Clear All
                </button>
              )}
            </div>
            
            <div className="email-recipient-groups">
              <h4>Groups</h4>
              {recipientGroups.map(group => (
                <label key={group.id} className="email-recipient-group-item">
                  <input
                    type="checkbox"
                    checked={(currentDraft.recipientGroups || []).includes(group.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        onDraftChange({
                          recipientGroups: [...(currentDraft.recipientGroups || []), group.id]
                        });
                      } else {
                        onDraftChange({
                          recipientGroups: (currentDraft.recipientGroups || []).filter(id => id !== group.id)
                        });
                      }
                    }}
                  />
                  <div className="email-group-info">
                    <span className="email-group-name">{group.name}</span>
                    <span className="email-group-count">({group.count})</span>
                  </div>
                </label>
              ))}
            </div>

            <div className="email-individual-recipients">
              <h4>Individual Recipients</h4>
              <div className="email-recipient-input">
                <input
                  type="email"
                  placeholder="Add email address..."
                  className="email-email-input"
                  value={individualEmailInput}
                  onChange={(e) => onEmailInputChange(e.target.value)}
                  onKeyPress={onEmailInputKeyPress}
                />
                <button 
                  className="email-add-recipient-btn" 
                  title="Add recipient"
                  onClick={onAddIndividualRecipient}
                >
                  <FaPlus />
                </button>
              </div>

              {/* Select from Saved Recipients */}
              <div style={{ marginTop: '0.75rem' }}>
                <button
                  onClick={onShowRecipientSelector}
                  style={{
                    background: 'rgba(16, 185, 129, 0.2)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    color: '#10b981',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                  title="Select from saved recipients"
                >
                  <FaUsers />
                  Select from Saved Recipients
                </button>
              </div>

              {/* Bulk Import Toggle */}
              <div style={{ marginTop: '0.75rem' }}>
                <button
                  onClick={onToggleBulkImport}
                  style={{
                    background: 'rgba(59, 130, 246, 0.2)',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    color: '#3b82f6',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                  title="Bulk import emails"
                >
                  <FaPlus />
                  {showBulkImport ? 'Hide Bulk Import' : 'Bulk Import'}
                </button>
              </div>

              {/* Bulk Import Textarea */}
              {showBulkImport && (
                <div style={{ marginTop: '0.75rem' }}>
                  <label style={{ 
                    color: '#ffffff', 
                    fontSize: '0.8rem', 
                    fontWeight: '600',
                    marginBottom: '0.5rem',
                    display: 'block'
                  }}>
                    Paste emails (comma, semicolon, or line separated):
                  </label>
                  <textarea
                    value={bulkEmailInput}
                    onChange={(e) => onBulkImportChange(e.target.value)}
                    placeholder="email1@example.com, email2@example.com&#10;email3@example.com&#10;email4@example.com"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      color: '#ffffff',
                      fontSize: '0.8rem',
                      minHeight: '80px',
                      resize: 'vertical',
                      fontFamily: 'monospace'
                    }}
                  />
                  <div style={{ 
                    display: 'flex', 
                    gap: '0.5rem', 
                    marginTop: '0.5rem' 
                  }}>
                    <button
                      onClick={onBulkImport}
                      style={{
                        background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                        border: 'none',
                        color: '#ffffff',
                        padding: '0.5rem 1rem',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      Import Emails
                    </button>
                    <button
                      onClick={() => {
                        onToggleBulkImport();
                        onBulkImportChange('');
                      }}
                      style={{
                        background: 'rgba(107, 114, 128, 0.2)',
                        border: '1px solid rgba(107, 114, 128, 0.3)',
                        color: '#9ca3af',
                        padding: '0.5rem 1rem',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
              
              {emailValidationError && (
                <div className="email-validation-error" style={{ 
                  color: '#ef4444', 
                  fontSize: '0.8rem', 
                  marginTop: '0.5rem' 
                }}>
                  {emailValidationError}
                </div>
              )}

              {/* Display individual recipients */}
              {currentDraft.recipients && currentDraft.recipients.length > 0 && (
                <div className="email-individual-recipients-list" style={{ marginTop: '1rem' }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '0.5rem'
                  }}>
                    <h5 style={{ 
                      color: '#ffffff', 
                      fontSize: '0.9rem', 
                      margin: 0,
                      fontWeight: '600'
                    }}>
                      Added Recipients ({currentDraft.recipients.length})
                    </h5>
                    <button
                      onClick={onClearIndividualRecipients}
                      style={{
                        background: 'rgba(239, 68, 68, 0.2)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        color: '#ef4444',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '6px',
                        fontSize: '0.7rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      title="Clear all individual recipients"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="email-recipients-tags">
                    {currentDraft.recipients.map((email, index) => (
                      <div 
                        key={index} 
                        className="email-recipient-tag"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.5rem 0.75rem',
                          background: 'rgba(59, 130, 246, 0.2)',
                          border: '1px solid rgba(59, 130, 246, 0.3)',
                          borderRadius: '8px',
                          margin: '0.25rem',
                          fontSize: '0.8rem',
                          color: '#ffffff'
                        }}
                      >
                        <span>{email}</span>
                        <button
                          onClick={() => onRemoveIndividualRecipient(email)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#ef4444',
                            cursor: 'pointer',
                            padding: '0.25rem',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          title="Remove recipient"
                        >
                          <FaTimes />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="email-sidebar-section">
            <h3>Email Settings</h3>
            
            <div className="email-setting-group">
              <label className="email-setting-label">
                <input
                  type="checkbox"
                  checked={currentDraft.isScheduled}
                  onChange={(e) => onDraftChange({ isScheduled: e.target.checked })}
                />
                Schedule Email
              </label>
              {currentDraft.isScheduled && (
                <input
                  type="datetime-local"
                  className="email-datetime-input"
                />
              )}
            </div>

            <div className="email-setting-group">
              <label className="email-setting-label">Priority</label>
              <select
                value={currentDraft.priority}
                onChange={(e) => onDraftChange({ priority: e.target.value as 'low' | 'normal' | 'high' })}
                className="email-priority-select"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
              </select>
            </div>

            <div className="email-setting-group">
              <label className="email-setting-label">
                <input
                  type="checkbox"
                  checked={currentDraft.trackOpens}
                  onChange={(e) => onDraftChange({ trackOpens: e.target.checked })}
                />
                Track Opens
              </label>
            </div>

            <div className="email-setting-group">
              <label className="email-setting-label">
                <input
                  type="checkbox"
                  checked={currentDraft.trackClicks}
                  onChange={(e) => onDraftChange({ trackClicks: e.target.checked })}
                />
                Track Clicks
              </label>
            </div>
          </div>

          <div className="email-sidebar-section">
            <h3>Templates</h3>
            <div className="email-template-quick-access">
              {templates.slice(0, 3).map(template => (
                <button
                  key={template.id}
                  className="email-template-quick-btn"
                  onClick={() => onLoadTemplate(template)}
                >
                  <span className="email-template-name">{template.name}</span>
                  <FaCopy />
                </button>
              ))}
              <button
                className="email-template-quick-btn email-view-all"
                onClick={() => {/* Switch to templates tab */}}
              >
                View All Templates
              </button>
            </div>
          </div>
        </div>
      </div>

      {showPreview && (
        <div className="email-email-preview">
          <h3>Email Preview</h3>
          <div className="email-preview-content">
            <div className="email-preview-header">
              <strong>Subject:</strong> {currentDraft.subject || 'No subject'}
            </div>
            <div className="email-preview-body">
              {currentDraft.content ? (
                <div dangerouslySetInnerHTML={{ __html: currentDraft.content.replace(/\n/g, '<br>') }} />
              ) : (
                <p>No content yet</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComposeTab;
