import React, { useState } from 'react';
import { FaEdit, FaTimes, FaComments, FaDesktop } from 'react-icons/fa';
import { FeedbackTicket, FeedbackCategory, FeedbackPriority, FeedbackStatus } from '../../types/feedback';
import { detectScreenResolution } from '../../utils/screenResolution';
import CommentsSidebar from './CommentsSidebar';
import './EditTicketModal.css';

interface EditTicketModalProps {
  isOpen: boolean;
  ticket: FeedbackTicket | null;
  onClose: () => void;
  onUpdate: (ticketData: Partial<FeedbackTicket>) => void;
  onAddComment?: (content: string, isInternal: boolean, attachments: File[]) => void;
}

const CATEGORY_OPTIONS: FeedbackCategory[] = ['bug', 'feature_request', 'ui_issue', 'performance', 'security', 'accessibility', 'other'];
const PRIORITY_OPTIONS: FeedbackPriority[] = ['low', 'medium', 'high', 'critical'];
const STATUS_OPTIONS: FeedbackStatus[] = ['open', 'in_progress', 'resolved', 'closed', 'duplicate'];

export const EditTicketModal: React.FC<EditTicketModalProps> = ({
  isOpen,
  ticket,
  onClose,
  onUpdate,
  onAddComment
}) => {
  const [showComments, setShowComments] = useState(false);

  if (!isOpen || !ticket) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(ticket);
    onClose();
  };

  const handleInputChange = (field: keyof FeedbackTicket, value: string | boolean | string[] | Date) => {
    if (!ticket) return;
    
    onUpdate({
      ...ticket,
      [field]: value
    });
  };

  const detectResolution = () => {
    try {
      const resolutionInfo = detectScreenResolution();
      if (resolutionInfo.isDetected) {
        // Set the exact detected resolution, not just the matching option
        handleInputChange('screenResolution', resolutionInfo.formatted);
        console.log(`Detected resolution: ${resolutionInfo.displayName}`);
      } else {
        console.warn('Failed to detect screen resolution');
      }
    } catch (error) {
      console.error('Error detecting screen resolution:', error);
    }
  };

  const handleResolutionSelect = (value: string) => {
    handleInputChange('screenResolution', value);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Edit Ticket</h3>
          <div className="modal-header-actions">
            <button 
              className="modal-action-btn comments-btn"
              onClick={() => setShowComments(!showComments)}
              title="Toggle comments"
              aria-label="Toggle comments"
            >
              <FaComments />
              <span>Comments</span>
            </button>
            <button 
              className="modal-close"
              onClick={onClose}
              title="Close modal"
              aria-label="Close modal"
            >
              <FaTimes />
            </button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label htmlFor="edit-ticket-title">Title *</label>
              <input
                id="edit-ticket-title"
                type="text"
                value={ticket.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Brief description of the issue"
                className="form-input"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="edit-ticket-description">Description *</label>
              <textarea
                id="edit-ticket-description"
                value={ticket.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
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
                  value={ticket.category}
                  onChange={(e) => handleInputChange('category', e.target.value as FeedbackCategory)}
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
                  value={ticket.priority}
                  onChange={(e) => handleInputChange('priority', e.target.value as FeedbackPriority)}
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
                value={ticket.status}
                onChange={(e) => handleInputChange('status', e.target.value as FeedbackStatus)}
                className="form-select"
              >
                {STATUS_OPTIONS.map(status => (
                  <option key={status} value={status}>
                    {status.replace('_', ' ').toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            {/* Testing-Specific Fields */}
            <div className="form-section-divider">
              <h4>Testing Information</h4>
            </div>

            <div className="form-group">
              <label htmlFor="edit-ticket-url">URL to Page</label>
              <input
                id="edit-ticket-url"
                type="url"
                value={ticket.urlToPage || ''}
                onChange={(e) => handleInputChange('urlToPage', e.target.value)}
                placeholder="https://example.com/page"
                className="form-input"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="edit-ticket-browser">Browser</label>
                <select
                  id="edit-ticket-browser"
                  value={ticket.browser || ''}
                  onChange={(e) => handleInputChange('browser', e.target.value)}
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
                <label htmlFor="edit-ticket-browser-version">Browser Version</label>
                <input
                  id="edit-ticket-browser-version"
                  type="text"
                  value={ticket.browserVersion || ''}
                  onChange={(e) => handleInputChange('browserVersion', e.target.value)}
                  placeholder="e.g., 120.0.6099.109"
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="edit-ticket-os">Operating System</label>
                <select
                  id="edit-ticket-os"
                  value={ticket.operatingSystem || ''}
                  onChange={(e) => handleInputChange('operatingSystem', e.target.value)}
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
                <label htmlFor="edit-ticket-device">Device Type</label>
                <select
                  id="edit-ticket-device"
                  value={ticket.deviceType}
                  onChange={(e) => handleInputChange('deviceType', e.target.value as 'desktop' | 'mobile' | 'tablet')}
                  className="form-select"
                >
                  <option value="desktop">Desktop</option>
                  <option value="mobile">Mobile</option>
                  <option value="tablet">Tablet</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <div className="form-group-header">
                <label htmlFor="edit-ticket-resolution">Screen Resolution</label>
                <button
                  type="button"
                  onClick={detectResolution}
                  className="detect-resolution-btn"
                  title="Auto-detect screen resolution"
                  aria-label="Auto-detect screen resolution"
                >
                  <FaDesktop /> Auto Detect
                </button>
              </div>
              <div className="resolution-input-container">
                <input
                  id="edit-ticket-resolution"
                  type="text"
                  value={ticket.screenResolution || ''}
                  onChange={(e) => handleInputChange('screenResolution', e.target.value)}
                  placeholder="e.g., 1920x1080 or select from dropdown"
                  className="form-input resolution-input"
                />
                <select
                  value=""
                  onChange={(e) => handleResolutionSelect(e.target.value)}
                  className="resolution-dropdown"
                  title="Quick select common resolution"
                >
                  <option value="">Quick Select</option>
                  <option value="1920x1080">1920x1080 (Full HD)</option>
                  <option value="2560x1440">2560x1440 (2K/QHD)</option>
                  <option value="3840x2160">3840x2160 (4K/UHD)</option>
                  <option value="1366x768">1366x768 (HD)</option>
                  <option value="1440x900">1440x900</option>
                  <option value="1600x900">1600x900</option>
                  <option value="1680x1050">1680x1050</option>
                  <option value="1280x720">1280x720 (HD)</option>
                  <option value="1024x768">1024x768</option>
                  <option value="800x600">800x600</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="edit-ticket-steps">Steps to Reproduce</label>
              <textarea
                id="edit-ticket-steps"
                value={ticket.stepsToReproduce || ''}
                onChange={(e) => handleInputChange('stepsToReproduce', e.target.value)}
                placeholder="1. Go to the page...&#10;2. Click on the button...&#10;3. Observe the issue..."
                className="form-textarea"
                rows={3}
              />
            </div>

            <div className="form-group">
              <label htmlFor="edit-ticket-expected">Expected Behavior</label>
              <textarea
                id="edit-ticket-expected"
                value={ticket.expectedBehavior || ''}
                onChange={(e) => handleInputChange('expectedBehavior', e.target.value)}
                placeholder="What should happen when following the steps?"
                className="form-textarea"
                rows={2}
              />
            </div>

            <div className="form-group">
              <label htmlFor="edit-ticket-actual">Actual Behavior</label>
              <textarea
                id="edit-ticket-actual"
                value={ticket.actualBehavior || ''}
                onChange={(e) => handleInputChange('actualBehavior', e.target.value)}
                placeholder="What actually happens instead?"
                className="form-textarea"
                rows={2}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="edit-ticket-severity">Severity</label>
                <select
                  id="edit-ticket-severity"
                  value={ticket.severity}
                  onChange={(e) => handleInputChange('severity', e.target.value as 'cosmetic' | 'minor' | 'major' | 'critical' | 'blocker')}
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
                <label htmlFor="edit-ticket-environment">Environment</label>
                <select
                  id="edit-ticket-environment"
                  value={ticket.environment}
                  onChange={(e) => handleInputChange('environment', e.target.value as 'development' | 'staging' | 'production')}
                  className="form-select"
                >
                  <option value="development">Development</option>
                  <option value="staging">Staging</option>
                  <option value="production">Production</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="edit-ticket-testcase">Test Case ID</label>
              <input
                id="edit-ticket-testcase"
                type="text"
                value={ticket.testCaseId || ''}
                onChange={(e) => handleInputChange('testCaseId', e.target.value)}
                placeholder="e.g., TC-001, Test-123"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={ticket.regression}
                  onChange={(e) => handleInputChange('regression', e.target.checked)}
                  className="checkbox-input"
                />
                <span className="checkbox-text">This is a regression bug</span>
              </label>
            </div>

            <div className="form-group">
              <label htmlFor="edit-ticket-workaround">Workaround</label>
              <textarea
                id="edit-ticket-workaround"
                value={ticket.workaround || ''}
                onChange={(e) => handleInputChange('workaround', e.target.value)}
                placeholder="Any temporary workaround or solution?"
                className="form-textarea"
                rows={2}
              />
            </div>
          </div>
          
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
            >
              <FaEdit /> Update Ticket
            </button>
          </div>
        </form>
      </div>
      
      {/* Comments Sidebar */}
      {showComments && onAddComment && (
        <CommentsSidebar
          isOpen={showComments}
          ticket={ticket}
          onClose={() => setShowComments(false)}
          onAddComment={onAddComment}
        />
      )}
    </div>
  );
};

export default EditTicketModal;
