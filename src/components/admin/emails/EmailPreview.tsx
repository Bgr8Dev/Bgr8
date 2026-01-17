import React from 'react';
import { FaTimes, FaEye, FaPaperPlane, FaCalendarAlt, FaUsers } from 'react-icons/fa';
import { sanitizeHtml } from '../../../utils/inputSanitization';

interface EmailPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  subject: string;
  content: string;
  recipients: string[];
  recipientGroups: string[];
  priority: 'low' | 'normal' | 'high';
  trackOpens: boolean;
  trackClicks: boolean;
  scheduledDate?: Date;
  isScheduled: boolean;
  recipientGroupsData: Array<{ id: string; name: string; count: number }>;
}

const EmailPreview: React.FC<EmailPreviewProps> = ({
  isOpen,
  onClose,
  subject,
  content,
  recipients,
  recipientGroups,
  priority,
  trackOpens,
  trackClicks,
  scheduledDate,
  isScheduled,
  recipientGroupsData
}) => {
  if (!isOpen) return null;

  const getTotalRecipients = () => {
    let total = recipients.length;
    recipientGroups.forEach(groupId => {
      const group = recipientGroupsData.find(g => g.id === groupId);
      if (group) total += group.count;
    });
    return total;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'normal': return '#3b82f6';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high': return 'High Priority';
      case 'normal': return 'Normal Priority';
      case 'low': return 'Low Priority';
      default: return 'Unknown Priority';
    }
  };

  return (
    <div className="email-preview-overlay" onClick={onClose}>
      <div className="email-preview-modal" onClick={(e) => e.stopPropagation()}>
        <div className="email-preview-header">
          <div className="email-preview-header-content">
            <div className="email-preview-title">
              <FaEye className="email-preview-icon" />
              <h3>Email Preview</h3>
            </div>
            <button
              className="email-preview-close"
              onClick={onClose}
              title="Close preview"
              aria-label="Close email preview"
            >
              <FaTimes />
            </button>
          </div>
        </div>

        <div className="email-preview-content">
          {/* Email Details */}
          <div className="email-preview-details">
            <div className="email-preview-detail-item">
              <div className="email-preview-detail-label">
                <FaPaperPlane />
                <span>Subject</span>
              </div>
              <div className="email-preview-detail-value">
                {subject || 'No subject'}
              </div>
            </div>

            <div className="email-preview-detail-item">
              <div className="email-preview-detail-label">
                <FaUsers />
                <span>Recipients</span>
              </div>
              <div className="email-preview-detail-value">
                <div className="email-preview-recipients-count">
                  {getTotalRecipients()} total recipients
                </div>
                {recipients.length > 0 && (
                  <div className="email-preview-recipients-list">
                    <strong>Individual:</strong> {recipients.join(', ')}
                  </div>
                )}
                {recipientGroups.length > 0 && (
                  <div className="email-preview-recipients-groups">
                    <strong>Groups:</strong> {
                      recipientGroups.map(groupId => {
                        const group = recipientGroupsData.find(g => g.id === groupId);
                        return group ? `${group.name} (${group.count})` : groupId;
                      }).join(', ')
                    }
                  </div>
                )}
              </div>
            </div>

            <div className="email-preview-detail-item">
              <div className="email-preview-detail-label">
                <div 
                  className="email-preview-priority-indicator"
                  style={{ backgroundColor: getPriorityColor(priority) }}
                ></div>
                <span>Priority</span>
              </div>
              <div className="email-preview-detail-value">
                {getPriorityLabel(priority)}
              </div>
            </div>

            {isScheduled && scheduledDate && (
              <div className="email-preview-detail-item">
                <div className="email-preview-detail-label">
                  <FaCalendarAlt />
                  <span>Scheduled</span>
                </div>
                <div className="email-preview-detail-value">
                  {scheduledDate.toLocaleString()}
                </div>
              </div>
            )}

            <div className="email-preview-detail-item">
              <div className="email-preview-detail-label">
                <span>Tracking</span>
              </div>
              <div className="email-preview-detail-value">
                <div className="email-preview-tracking-options">
                  <span className={`email-preview-tracking-item ${trackOpens ? 'enabled' : 'disabled'}`}>
                    Opens: {trackOpens ? 'Enabled' : 'Disabled'}
                  </span>
                  <span className={`email-preview-tracking-item ${trackClicks ? 'enabled' : 'disabled'}`}>
                    Clicks: {trackClicks ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Email Content */}
          <div className="email-preview-body">
            <div className="email-preview-body-header">
              <h4>Email Content</h4>
              <div className="email-preview-body-subject">
                <strong>Subject:</strong> {subject || 'No subject'}
              </div>
            </div>
            
            <div className="email-preview-body-content">
              {content ? (
                <div 
                  className="email-preview-html-content"
                  dangerouslySetInnerHTML={{ 
                    __html: sanitizeHtml(content.replace(/\n/g, '<br>'))
                  }} 
                />
              ) : (
                <div className="email-preview-empty-content">
                  <p>No content to preview</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="email-preview-footer">
          <button
            className="email-preview-btn email-preview-btn-secondary"
            onClick={onClose}
          >
            Close Preview
          </button>
          <div className="email-preview-info">
            This is how your email will appear to recipients
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailPreview;
