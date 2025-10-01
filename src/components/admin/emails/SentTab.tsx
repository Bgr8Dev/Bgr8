import React from 'react';
import { 
  FaPaperPlane, 
  FaUsers, 
  FaCalendarAlt, 
  FaCheckCircle, 
  FaCopy, 
  FaEye
} from 'react-icons/fa';
import { SentEmail } from '../../../services/emailService';

interface SentTabProps {
  sentEmails: SentEmail[];
  onResendEmail: (email: SentEmail) => void;
}

export const SentTab: React.FC<SentTabProps> = ({
  sentEmails,
  onResendEmail
}) => {
  const handlePreview = (email: SentEmail) => {
    const previewWindow = window.open('', '_blank', 'width=800,height=600');
    if (previewWindow) {
      previewWindow.document.write(`
        <html>
          <head><title>Email Preview: ${email.subject}</title></head>
          <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>${email.subject}</h2>
            <div>${email.content}</div>
          </body>
        </html>
      `);
    }
  };

  return (
    <div className="email-sent-section">
      <div className="email-sent-header">
        <h3>Sent Emails</h3>
        <p>View and manage your sent email campaigns</p>
      </div>
      
      {sentEmails.length === 0 ? (
        <div className="email-sent-placeholder">
          <FaPaperPlane className="email-placeholder-icon" />
          <h3>No Sent Emails Yet</h3>
          <p>Your sent emails will appear here once you start sending campaigns</p>
        </div>
      ) : (
        <div className="email-sent-list">
          {sentEmails.map(email => (
            <div key={email.id} className="email-sent-card">
              <div className="email-sent-header-card">
                <h4>{email.subject || 'No Subject'}</h4>
                <div className="email-sent-actions">
                  <button 
                    className="email-sent-action-btn"
                    onClick={() => onResendEmail(email)}
                    title="Resend Email"
                  >
                    <FaCopy />
                  </button>
                  <button 
                    className="email-sent-action-btn"
                    onClick={() => handlePreview(email)}
                    title="Preview Email"
                  >
                    <FaEye />
                  </button>
                </div>
              </div>
              
              <div className="email-sent-content">
                <div className="email-sent-meta">
                  <span className="email-sent-recipients">
                    <FaUsers /> {email.recipients?.length || 0} recipients
                  </span>
                  <span className="email-sent-date">
                    <FaCalendarAlt /> {email.sentAt?.toLocaleDateString() || 'Unknown date'}
                  </span>
                  <span className="email-sent-status">
                    <FaCheckCircle /> {email.status || 'sent'}
                  </span>
                </div>
                
                <div className="email-sent-preview">
                  {email.content ? (
                    <div dangerouslySetInnerHTML={{ 
                      __html: email.content.replace(/<[^>]*>/g, '').substring(0, 150) + '...' 
                    }} />
                  ) : (
                    <p>No content preview available</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SentTab;
