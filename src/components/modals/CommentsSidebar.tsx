import React, { useState } from 'react';
import { FaTimes, FaUser, FaComments, FaPlus } from 'react-icons/fa';
import { FeedbackTicket } from '../../types/feedback';
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
  const [newComment, setNewComment] = useState({
    content: '',
    isInternal: false,
    attachments: [] as File[]
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

    onAddComment(newComment.content.trim(), newComment.isInternal, newComment.attachments);
    
    // Reset form
    setNewComment({
      content: '',
      isInternal: false,
      attachments: []
    });
  };

  const handleCommentFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setNewComment(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...files]
    }));
  };

  const handleRemoveCommentFile = (indexToRemove: number) => {
    setNewComment(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, index) => index !== indexToRemove)
    }));
  };

  if (!isOpen || !ticket) return null;

  return (
    <div className="comments-sidebar-overlay" onClick={onClose}>
      <div className="comments-sidebar" onClick={(e) => e.stopPropagation()}>
        <div className="comments-header">
          <h3>Comments - {ticket.title}</h3>
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
            {ticket.comments.map(comment => (
              <div key={comment.id} className={`comment ${comment.isInternal ? 'internal' : 'public'}`}>
                <div className="comment-header">
                  <div className="comment-author">
                    <FaUser className="comment-author-icon" />
                    <span className="comment-author-name">{comment.authorName}</span>
                    {comment.isInternal && (
                      <span className="comment-internal-badge">Internal</span>
                    )}
                  </div>
                  <span className="comment-date">{formatDate(comment.createdAt)}</span>
                </div>
                <div className="comment-body">
                  <p>{comment.content}</p>
                  {comment.attachments && comment.attachments.length > 0 && (
                    <div className="comment-attachments">
                      {comment.attachments.map(attachment => (
                        <a
                          key={attachment.id}
                          href={attachment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="comment-attachment"
                        >
                          <FaUser /> {attachment.name}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {ticket.comments.length === 0 && (
              <div className="comments-empty">
                <FaComments className="comments-empty-icon" />
                <p>No comments yet. Be the first to comment!</p>
              </div>
            )}
          </div>
          
          <div className="comments-form">
            <div className="comment-form-header">
              <h4>Add Comment</h4>
              <label className="comment-internal-toggle">
                <input
                  type="checkbox"
                  checked={newComment.isInternal}
                  onChange={(e) => setNewComment(prev => ({ ...prev, isInternal: e.target.checked }))}
                  className="checkbox-input"
                />
                <span className="checkbox-text">Internal comment</span>
              </label>
            </div>
            
            <textarea
              value={newComment.content}
              onChange={(e) => setNewComment(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Write your comment here..."
              className="comment-textarea"
              rows={4}
            />
            
            <div className="comment-file-input">
              <input
                type="file"
                multiple
                onChange={handleCommentFileSelect}
                className="file-input"
                accept="image/*,video/*,.pdf,.doc,.docx,.txt,.csv,.xlsx,.zip"
              />
              <label className="file-input-label">
                <FaPlus /> Attach Files
              </label>
            </div>
            
            {newComment.attachments.length > 0 && (
              <div className="comment-file-list">
                {newComment.attachments.map((file, index) => (
                  <div key={index} className="comment-file-item">
                    <span className="comment-file-name">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveCommentFile(index)}
                      className="comment-file-remove"
                      title="Remove file"
                    >
                      <FaTimes />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <button
              className="btn btn-primary comment-submit"
              onClick={handleAddComment}
              disabled={!newComment.content.trim()}
            >
              <FaComments /> Add Comment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommentsSidebar;
