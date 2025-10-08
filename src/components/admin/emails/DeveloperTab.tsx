import React from 'react';
import { 
  FaInfoCircle, 
  FaExclamationTriangle, 
  FaRocket, 
  FaPaperPlane, 
  FaUsers, 
  FaSpinner, 
  FaCheck, 
  FaTimes
} from 'react-icons/fa';
import TestButton from './TestButton';

interface TestStatus {
  status: 'idle' | 'testing' | 'success' | 'error';
  message: string;
  timestamp: Date | null;
}

interface DeveloperTabProps {
  testStatuses: {
    server: TestStatus;
    config: TestStatus;
    zoho: TestStatus;
    email: TestStatus;
  };
  currentDraftRecipients: string[];
  isLoading: boolean;
  onTestServer: () => void;
  onTestConfig: () => void;
  onTestZoho: () => void;
  onTestEmail: () => void;
  onCreateTestRecipients: () => void;
  onRefresh: () => void;
}

export const DeveloperTab: React.FC<DeveloperTabProps> = ({
  testStatuses,
  currentDraftRecipients,
  isLoading,
  onTestServer,
  onTestConfig,
  onTestZoho,
  onTestEmail,
  onCreateTestRecipients,
  onRefresh
}) => {
  return (
    <div className="email-developer-section">
      <div className="email-developer-header">
        <h3>Developer Tools</h3>
        <p>Test and debug email functionality</p>
      </div>
      
      <div className="email-developer-grid">
        <div className="email-developer-card">
          <div className="email-developer-card-header">
            <div className="email-developer-card-icon">
              <FaInfoCircle />
            </div>
            <div className="email-developer-card-title">
              <h4>Server Connection</h4>
              <p>Test email server connectivity</p>
            </div>
          </div>
          <div className="email-developer-card-content">
            <TestButton
              onClick={onTestServer}
              title="Test email server connection"
              icon={<FaInfoCircle />}
              text="Test Server"
              status={testStatuses.server}
            />
          </div>
        </div>

        <div className="email-developer-card">
          <div className="email-developer-card-header">
            <div className="email-developer-card-icon">
              <FaExclamationTriangle />
            </div>
            <div className="email-developer-card-title">
              <h4>Configuration</h4>
              <p>Validate email configuration</p>
            </div>
          </div>
          <div className="email-developer-card-content">
            <TestButton
              onClick={onTestConfig}
              title="Test email configuration and Zoho setup"
              icon={<FaExclamationTriangle />}
              text="Test Config"
              status={testStatuses.config}
            />
          </div>
        </div>

        <div className="email-developer-card">
          <div className="email-developer-card-header">
            <div className="email-developer-card-icon">
              <FaRocket />
            </div>
            <div className="email-developer-card-title">
              <h4>Zoho API</h4>
              <p>Test Zoho API integration</p>
            </div>
          </div>
          <div className="email-developer-card-content">
            <TestButton
              onClick={onTestZoho}
              title="Test Zoho API setup and permissions"
              icon={<FaRocket />}
              text="Test Zoho"
              status={testStatuses.zoho}
            />
          </div>
        </div>

        <div className="email-developer-card">
          <div className="email-developer-card-header">
            <div className="email-developer-card-icon">
              <FaPaperPlane />
            </div>
            <div className="email-developer-card-title">
              <h4>Email Sending</h4>
              <p>Test actual email delivery</p>
            </div>
          </div>
          <div className="email-developer-card-content">
            <TestButton
              onClick={onTestEmail}
              title={`Test email sending to ${currentDraftRecipients?.length ? currentDraftRecipients.join(', ') : 'first available recipient'}`}
              icon={<FaPaperPlane />}
              text={`Test Email ${currentDraftRecipients?.length ? `(${currentDraftRecipients.length})` : ''}`}
              status={testStatuses.email}
            />
          </div>
        </div>
      </div>

      <div className="email-developer-utilities">
        <h4>Utilities</h4>
        <div className="email-developer-utilities-grid">
          <button 
            className="email-developer-utility-btn"
            onClick={onCreateTestRecipients}
            title="Create test recipients for testing"
          >
            <FaUsers />
            <span>Create Test Recipients</span>
            <p>Generate sample recipients for testing</p>
          </button>
          
          <button 
            className="email-developer-utility-btn"
            onClick={onRefresh}
            disabled={isLoading}
            title="Refresh all email data"
          >
            <FaSpinner className={isLoading ? 'email-spinning' : ''} />
            <span>Refresh Data</span>
            <p>Reload templates, drafts, and sent emails</p>
          </button>
        </div>
      </div>

      <div className="email-developer-status-overview">
        <h4>System Status Overview</h4>
        <div className="email-developer-status-grid">
          {Object.entries(testStatuses).map(([key, status]) => (
            <div key={key} className={`email-developer-status-item email-developer-status-${status.status}`}>
              <div className="email-developer-status-icon">
                {status.status === 'idle' && <FaInfoCircle />}
                {status.status === 'testing' && <FaSpinner className="email-spinning" />}
                {status.status === 'success' && <FaCheck />}
                {status.status === 'error' && <FaTimes />}
              </div>
              <div className="email-developer-status-info">
                <div className="email-developer-status-label">
                  {key.charAt(0).toUpperCase() + key.slice(1)} Test
                </div>
                <div className="email-developer-status-message">
                  {status.status === 'idle' && 'Ready to test'}
                  {status.status === 'testing' && status.message}
                  {status.status === 'success' && status.message}
                  {status.status === 'error' && status.message}
                </div>
                {status.timestamp && (
                  <div className="email-developer-status-time">
                    Last run: {status.timestamp.toLocaleTimeString()}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DeveloperTab;
