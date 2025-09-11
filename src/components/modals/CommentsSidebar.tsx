import React, { useState } from 'react';
import { FaTimes, FaComments, FaLock, FaGlobe, FaUser } from 'react-icons/fa';
import { FeedbackTicket } from '../../types/feedback';
import { useAuth } from '../../hooks/useAuth';
import { hasRole } from '../../utils/userProfile';
import './CommentsSidebar.css';

interface CommentsSidebarProps {
  isOpen: boolean;
  ticket: FeedbackTicket | null;
  onClose: () => void;
  onAddComment: (content: string, isInternal: boolean, attachments: File[]) => void;
}

export const CommentsSidebar: React.FC<CommentsSidebarProps> = ({
  isOpen,
  ticket,
  onClose,
  onAddComment
}) => {
  const { userProfile } = useAuth();
  const isDeveloper = hasRole(userProfile, 'developer');
  
  const [newComment, setNewComment] = useState({
    content: '',
    isInternal: false
  });

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const handleAddComment = () => {
    if (!newComment.content.trim()) return;

    onAddComment(newComment.content.trim(), newComment.isInternal, []);
    
    // Reset form
    setNewComment({
      content: '',
      isInternal: false
    });
  };


  if (!isOpen || !ticket) return null;

  return (
    <div className="comments-sidebar-overlay" onClick={onClose}>
      <div className="comments-sidebar" onClick={(e) => e.stopPropagation()}>
        <div className="comments-header">
          <div className="comments-title">
            <FaComments className="comments-icon" />
            <h3>Comments</h3>
            <span className="ticket-title">#{ticket.sequentialId} {ticket.title}</span>
          </div>
          <button 
            className="comments-close"
            onClick={onClose}
            title="Close comments"
            aria-label="Close comments"
          >
            <FaTimes />
          </button>
        </div>
        
        <div className="comments-content">
          <div className="comments-list">
            {ticket.comments.map(comment => {
              // Only show internal comments to developers
              if (comment.isInternal && !isDeveloper) {
                return null;
              }
              
              return (
                <div key={comment.id} className={`comment ${comment.isInternal ? 'internal' : 'public'}`}>
                  <div className="comment-header">
                    <span className="comment-author">{comment.authorName}</span>
                    {comment.isInternal && (
                      <span className="comment-type-badge">
                        <FaLock /> Internal
                      </span>
                    )}
                    <span className="comment-date">{formatDate(comment.createdAt)}</span>
                  </div>
                  <div className="comment-body">
                    {comment.content}
                  </div>
                </div>
              );
            })}
            {ticket.comments.filter(comment => !comment.isInternal || isDeveloper).length === 0 && (
              <div className="comments-empty">
                <FaComments className="comments-empty-icon" />
                <p>No comments yet</p>
                <p className="empty-subtitle">Start the conversation below</p>
                {!isDeveloper && ticket.comments.some(comment => comment.isInternal) && (
                  <div className="internal-comments-notice">
                    <FaLock className="notice-icon" />
                    <p>Some internal comments are hidden (developer access required)</p>
                  </div>
                )}
              </div>
            )}
            
            {/* Show notice if there are internal comments but no visible comments */}
            {!isDeveloper && ticket.comments.some(comment => comment.isInternal) && ticket.comments.filter(comment => !comment.isInternal).length === 0 && ticket.comments.length > 0 && (
              <div className="internal-comments-notice">
                <FaLock className="notice-icon" />
                <p>This ticket has internal comments that are only visible to developers.</p>
              </div>
            )}
          </div>
          
          <div className="comments-form">
            <div className="comment-form-header">
              <div className="form-title">
                <FaUser className="form-user-icon" />
                <span>Add a comment</span>
              </div>
              {isDeveloper && (
                <label className="comment-internal-toggle">
                  <input
                    type="checkbox"
                    checked={newComment.isInternal}
                    onChange={(e) => setNewComment(prev => ({ ...prev, isInternal: e.target.checked }))}
                    className="checkbox-input"
                  />
                  <span className="checkbox-text">
                    {newComment.isInternal ? <FaLock /> : <FaGlobe />}
                    {newComment.isInternal ? ' Internal' : ' Public'}
                  </span>
                </label>
              )}
            </div>
            
            <div className="comment-input-wrapper">
              <textarea
                value={newComment.content}
                onChange={(e) => setNewComment(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Share your thoughts..."
                className="comment-textarea"
                rows={3}
              />
              <div className="comment-actions">
                <button
                  className="comment-submit-btn"
                  onClick={handleAddComment}
                  disabled={!newComment.content.trim()}
                >
                  <FaComments /> Comment
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommentsSidebar;
