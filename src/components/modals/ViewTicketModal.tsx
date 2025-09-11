import React, { useState } from 'react';
import { FaTimes, FaTag, FaEdit, FaCheckCircle, FaPause, FaTimesCircle, FaCopy, FaComments } from 'react-icons/fa';
import { FeedbackTicket, FeedbackPriority } from '../../types/feedback';
import CommentsSidebar from './CommentsSidebar';
import './ViewTicketModal.css';

interface ViewTicketModalProps {
  isOpen: boolean;
  ticket: FeedbackTicket | null;
  onClose: () => void;
  onEdit: (ticket: FeedbackTicket) => void;
  onAddComment?: (content: string, isInternal: boolean, attachments: File[]) => void;
}

const PRIORITY_COLORS = {
  low: '#10b981',
  medium: '#f59e0b',
  high: '#f97316',
  critical: '#ef4444'
};

const STATUS_COLORS = {
  open: '#3b82f6',
  in_progress: '#f59e0b',
  resolved: '#10b981',
  closed: '#6b7280',
  duplicate: '#ef4444'
};

export const ViewTicketModal: React.FC<ViewTicketModalProps> = ({
  isOpen,
  ticket,
  onClose,
  onEdit,
  onAddComment
}) => {
  const [showComments, setShowComments] = useState(false);

  if (!isOpen || !ticket) return null;

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <FaCheckCircle />;
      case 'in_progress': return <FaPause />;
      case 'resolved': return <FaCheckCircle />;
      case 'closed': return <FaTimesCircle />;
      case 'duplicate': return <FaCopy />;
      default: return <FaCheckCircle />;
    }
  };

  const handleEdit = () => {
    onEdit(ticket);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Ticket Details</h3>
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
        
        <div className="modal-body">
          <div className="ticket-detail-section">
            <h4>Title</h4>
            <p className="ticket-detail-value">{ticket.title}</p>
          </div>
          
          <div className="ticket-detail-section">
            <h4>Description</h4>
            <p className="ticket-detail-value">{ticket.description}</p>
          </div>
          
          <div className="ticket-detail-row">
            <div className="ticket-detail-section">
              <h4>Category</h4>
              <span className="ticket-detail-badge category">
                {ticket.category.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            
            <div className="ticket-detail-section">
              <h4>Priority</h4>
              <span 
                className="ticket-detail-badge priority"
                style={{ backgroundColor: PRIORITY_COLORS[ticket.priority] }}
              >
                {ticket.priority.toUpperCase()}
              </span>
            </div>
          </div>
          
          <div className="ticket-detail-section">
            <h4>Status</h4>
            <span 
              className="ticket-detail-badge status"
              style={{ backgroundColor: STATUS_COLORS[ticket.status] }}
            >
              {getStatusIcon(ticket.status)}
              {ticket.status.replace('_', ' ').toUpperCase()}
            </span>
          </div>
          
          {ticket.tags.length > 0 && (
            <div className="ticket-detail-section">
              <h4>Tags</h4>
              <div className="ticket-detail-tags">
                {ticket.tags.map(tag => (
                  <span key={tag} className="ticket-detail-tag">
                    <FaTag /> {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {ticket.attachments && ticket.attachments.length > 0 && (
            <div className="ticket-detail-section">
              <h4>Attachments</h4>
              <div className="ticket-detail-attachments">
                {ticket.attachments.map(attachment => (
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

          {/* Testing-Specific Fields */}
          {ticket.urlToPage && (
            <div className="ticket-detail-section">
              <h4>URL to Page</h4>
              <p className="ticket-detail-value">
                <a href={ticket.urlToPage} target="_blank" rel="noopener noreferrer" className="attachment-link">
                  {ticket.urlToPage}
                </a>
              </p>
            </div>
          )}

          {(ticket.browser || ticket.browserVersion || ticket.operatingSystem) && (
            <div className="ticket-detail-row">
              {ticket.browser && (
                <div className="ticket-detail-section">
                  <h4>Browser</h4>
                  <p className="ticket-detail-value">{ticket.browser}</p>
                </div>
              )}
              
              {ticket.browserVersion && (
                <div className="ticket-detail-section">
                  <h4>Browser Version</h4>
                  <p className="ticket-detail-value">{ticket.browserVersion}</p>
                </div>
              )}
            </div>
          )}

          {(ticket.operatingSystem || ticket.deviceType || ticket.screenResolution) && (
            <div className="ticket-detail-row">
              {ticket.operatingSystem && (
                <div className="ticket-detail-section">
                  <h4>Operating System</h4>
                  <p className="ticket-detail-value">{ticket.operatingSystem}</p>
                </div>
              )}
              
              <div className="ticket-detail-section">
                <h4>Device Type</h4>
                <p className="ticket-detail-value">{ticket.deviceType}</p>
              </div>
            </div>
          )}

          {ticket.screenResolution && (
            <div className="ticket-detail-section">
              <h4>Screen Resolution</h4>
              <p className="ticket-detail-value">{ticket.screenResolution}</p>
            </div>
          )}

          {ticket.stepsToReproduce && (
            <div className="ticket-detail-section">
              <h4>Steps to Reproduce</h4>
              <p className="ticket-detail-value" style={{ whiteSpace: 'pre-wrap' }}>{ticket.stepsToReproduce}</p>
            </div>
          )}

          {ticket.expectedBehavior && (
            <div className="ticket-detail-section">
              <h4>Expected Behavior</h4>
              <p className="ticket-detail-value" style={{ whiteSpace: 'pre-wrap' }}>{ticket.expectedBehavior}</p>
            </div>
          )}

          {ticket.actualBehavior && (
            <div className="ticket-detail-section">
              <h4>Actual Behavior</h4>
              <p className="ticket-detail-value" style={{ whiteSpace: 'pre-wrap' }}>{ticket.actualBehavior}</p>
            </div>
          )}

          {(ticket.severity || ticket.environment) && (
            <div className="ticket-detail-row">
              <div className="ticket-detail-section">
                <h4>Severity</h4>
                <span className="ticket-detail-badge" style={{ backgroundColor: PRIORITY_COLORS[ticket.severity as FeedbackPriority] }}>
                  {ticket.severity?.toUpperCase()}
                </span>
              </div>
              
              <div className="ticket-detail-section">
                <h4>Environment</h4>
                <span className="ticket-detail-badge" style={{ backgroundColor: '#6b7280' }}>
                  {ticket.environment?.toUpperCase()}
                </span>
              </div>
            </div>
          )}

          {ticket.testCaseId && (
            <div className="ticket-detail-section">
              <h4>Test Case ID</h4>
              <p className="ticket-detail-value">{ticket.testCaseId}</p>
            </div>
          )}

          <div className="ticket-detail-section">
            <h4>Regression Bug</h4>
            <p className="ticket-detail-value">
              {ticket.regression ? (
                <span style={{ color: '#dc2626', fontWeight: '600' }}>Yes</span>
              ) : (
                <span style={{ color: '#059669', fontWeight: '600' }}>No</span>
              )}
            </p>
          </div>

          {ticket.workaround && (
            <div className="ticket-detail-section">
              <h4>Workaround</h4>
              <p className="ticket-detail-value" style={{ whiteSpace: 'pre-wrap' }}>{ticket.workaround}</p>
            </div>
          )}
          
          <div className="ticket-detail-row">
            <div className="ticket-detail-section">
              <h4>Created</h4>
              <p className="ticket-detail-value">
                {formatDate(ticket.createdAt)} by {ticket.reporterName}
              </p>
            </div>
            
            <div className="ticket-detail-section">
              <h4>Last Updated</h4>
              <p className="ticket-detail-value">
                {formatDate(ticket.updatedAt)}
              </p>
            </div>
          </div>
          
          <div className="ticket-detail-section">
            <h4>Votes</h4>
            <div className="ticket-detail-votes">
              <span className="vote-count">{ticket.votes}</span>
              <span className="vote-label">votes</span>
            </div>
          </div>
        </div>
        
        <div className="modal-footer">
          <button
            className="btn btn-secondary"
            onClick={onClose}
          >
            Close
          </button>
          <button
            className="btn btn-primary"
            onClick={handleEdit}
          >
            <FaEdit /> Edit Ticket
          </button>
        </div>
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

export default ViewTicketModal;
