import React from 'react';
import { FaTimes, FaTrash, FaExclamationTriangle } from 'react-icons/fa';
import { FeedbackTicket } from '../../types/feedback';
import './DeleteTicketModal.css';

interface DeleteTicketModalProps {
  isOpen: boolean;
  ticket: FeedbackTicket | null;
  onClose: () => void;
  onConfirm: () => void;
}

const PRIORITY_COLORS = {
  low: '#10b981',
  medium: '#f59e0b',
  high: '#f97316',
  critical: '#ef4444'
};

export const DeleteTicketModal: React.FC<DeleteTicketModalProps> = ({
  isOpen,
  ticket,
  onClose,
  onConfirm
}) => {
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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content delete-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Delete Ticket</h3>
          <button 
            className="modal-close"
            onClick={onClose}
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
                  {ticket.category.replace('_', ' ').toUpperCase()}
                </span>
                <span 
                  className="ticket-priority"
                  style={{ backgroundColor: PRIORITY_COLORS[ticket.priority as keyof typeof PRIORITY_COLORS] }}
                >
                  {ticket.priority.toUpperCase()}
                </span>
              </div>
              <h4 className="ticket-title">{ticket.title}</h4>
              <p className="ticket-description">
                {ticket.description.length > 100 
                  ? `${ticket.description.substring(0, 100)}...` 
                  : ticket.description
                }
              </p>
              <div className="ticket-meta">
                <span className="ticket-reporter">by {ticket.reporterName}</span>
                <span className="ticket-date">{formatDate(ticket.createdAt)}</span>
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
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="btn btn-danger"
            onClick={onConfirm}
          >
            <FaTrash /> Delete Permanently
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteTicketModal;
