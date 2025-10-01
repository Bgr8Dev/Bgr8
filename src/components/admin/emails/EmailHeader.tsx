import React from 'react';
import { 
  FaRocket, 
  FaFolderOpen, 
  FaUsers, 
  FaPaperPlane, 
  FaEye, 
  FaSpinner,
  FaExclamationTriangle
} from 'react-icons/fa';

interface EmailHeaderProps {
  emailConfigValid: boolean;
  emailConfigErrors: string[];
  templatesCount: number;
  totalRecipients: number;
  totalSent: number;
  openRate: number;
  isLoading: boolean;
  onRefresh: () => void;
}

export const EmailHeader: React.FC<EmailHeaderProps> = ({
  emailConfigValid,
  emailConfigErrors,
  templatesCount,
  totalRecipients,
  totalSent,
  openRate,
  isLoading,
  onRefresh
}) => {
  return (
    <div className="email-emails-header">
      <div className="email-emails-header-content">
        <div className="email-header-title">
          <h1>
            <FaRocket className="email-title-icon" />
            Email Management
          </h1>
          <p>Compose, manage templates, and send emails to your community</p>
          {!emailConfigValid && (
            <div className="email-config-warning">
              <FaExclamationTriangle />
              <span>Email service not configured: {emailConfigErrors.join(', ')}</span>
            </div>
          )}
        </div>
        <div className="email-header-actions">
          <button 
            className="email-refresh-btn"
            onClick={onRefresh}
            disabled={isLoading}
          >
            <FaSpinner className={isLoading ? 'email-spinning' : ''} />
            Refresh
          </button>
        </div>
      </div>
      <div className="email-emails-header-stats">
        <div className="email-stat-item email-stat-templates">
          <div className="email-stat-icon">
            <FaFolderOpen />
          </div>
          <div className="email-stat-content">
            <span className="email-stat-number">{templatesCount}</span>
            <span className="email-stat-label">Templates</span>
          </div>
        </div>
        <div className="email-stat-item email-stat-recipients">
          <div className="email-stat-icon">
            <FaUsers />
          </div>
          <div className="email-stat-content">
            <span className="email-stat-number">{totalRecipients}</span>
            <span className="email-stat-label">Recipients</span>
          </div>
        </div>
        <div className="email-stat-item email-stat-sent">
          <div className="email-stat-icon">
            <FaPaperPlane />
          </div>
          <div className="email-stat-content">
            <span className="email-stat-number">{totalSent}</span>
            <span className="email-stat-label">Sent</span>
          </div>
        </div>
        <div className="email-stat-item email-stat-opens">
          <div className="email-stat-icon">
            <FaEye />
          </div>
          <div className="email-stat-content">
            <span className="email-stat-number">{openRate.toFixed(1)}%</span>
            <span className="email-stat-label">Open Rate</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailHeader;
