import React from 'react';
import { 
  FaSave, 
  FaEdit, 
  FaEye, 
  FaTrash
} from 'react-icons/fa';
import { EmailDraft } from '../../../services/emailService';

interface DraftsTabProps {
  drafts: EmailDraft[];
  onEditDraft: (draft: EmailDraft) => void;
  onDeleteDraft: (draftId: string) => void;
}

export const DraftsTab: React.FC<DraftsTabProps> = ({
  drafts,
  onEditDraft,
  onDeleteDraft
}) => {
  const handlePreview = (draft: EmailDraft) => {
    const previewWindow = window.open('', '_blank', 'width=800,height=600');
    if (previewWindow) {
      previewWindow.document.write(`
        <html>
          <head><title>Draft Preview: ${draft.subject}</title></head>
          <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>${draft.subject}</h2>
            <div>${draft.content}</div>
          </body>
        </html>
      `);
    }
  };

  return (
    <div className="email-drafts-section">
      <div className="email-drafts-header">
        <h3>Saved Drafts</h3>
        <p>Manage your email drafts</p>
      </div>
      <div className="email-drafts-list">
        {drafts.length === 0 ? (
          <div className="email-drafts-placeholder">
            <FaSave className="email-placeholder-icon" />
            <h3>No Drafts Yet</h3>
            <p>Your saved drafts will appear here</p>
          </div>
        ) : (
          drafts.map(draft => (
            <div key={draft.id} className="email-draft-card">
              <div className="email-draft-header">
                <h4>{draft.subject || 'Untitled Draft'}</h4>
                <div className="email-draft-actions">
                  <button 
                    className="email-draft-action-btn"
                    onClick={() => onEditDraft(draft)}
                    title="Edit Draft"
                  >
                    <FaEdit />
                  </button>
                  <button 
                    className="email-draft-action-btn"
                    onClick={() => handlePreview(draft)}
                    title="Preview Draft"
                  >
                    <FaEye />
                  </button>
                  <button 
                    className="email-draft-action-btn email-delete"
                    onClick={() => onDeleteDraft(draft.id!)}
                    title="Delete Draft"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
              <div className="email-draft-content">
                <p>{draft.content.replace(/<[^>]*>/g, '').substring(0, 100)}...</p>
              </div>
              <div className="email-draft-footer">
                <span className="email-draft-date">
                  Updated {draft.updatedAt?.toLocaleDateString() || 'Unknown date'}
                </span>
                <span className="email-draft-recipients">
                  {(draft.recipients?.length || 0) + (draft.recipientGroups?.length || 0)} recipients
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DraftsTab;
