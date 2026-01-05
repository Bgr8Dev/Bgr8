import React from 'react';
import { 
  FaEdit, 
  FaFolderOpen, 
  FaPaperPlane, 
  FaSave, 
  FaChartLine, 
  FaRocket,
  FaCheckSquare
} from 'react-icons/fa';

interface EmailTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  templatesCount: number;
  sentEmailsCount: number;
  draftsCount: number;
}

export const EmailTabs: React.FC<EmailTabsProps> = ({
  activeTab,
  onTabChange,
  templatesCount,
  sentEmailsCount,
  draftsCount
}) => {
  return (
    <div className="email-emails-tabs">
      <button 
        className={`email-emails-tab ${activeTab === 'compose' ? 'active' : ''}`}
        onClick={() => onTabChange('compose')}
      >
        <FaEdit />
        <span>Compose</span>
        <div className="email-tab-indicator"></div>
      </button>
      <button 
        className={`email-emails-tab ${activeTab === 'templates' ? 'active' : ''}`}
        onClick={() => onTabChange('templates')}
      >
        <FaFolderOpen />
        <span>Templates</span>
        <div className="email-tab-badge">{templatesCount}</div>
        <div className="email-tab-indicator"></div>
      </button>
      <button 
        className={`email-emails-tab ${activeTab === 'sent' ? 'active' : ''}`}
        onClick={() => onTabChange('sent')}
      >
        <FaPaperPlane />
        <span>Sent</span>
        <div className="email-tab-badge">{sentEmailsCount}</div>
        <div className="email-tab-indicator"></div>
      </button>
      <button 
        className={`email-emails-tab ${activeTab === 'drafts' ? 'active' : ''}`}
        onClick={() => onTabChange('drafts')}
      >
        <FaSave />
        <span>Drafts</span>
        <div className="email-tab-badge">{draftsCount}</div>
        <div className="email-tab-indicator"></div>
      </button>
      <button 
        className={`email-emails-tab ${activeTab === 'analytics' ? 'active' : ''}`}
        onClick={() => onTabChange('analytics')}
      >
        <FaChartLine />
        <span>Analytics</span>
        <div className="email-tab-indicator"></div>
      </button>
      <button 
        className={`email-emails-tab ${activeTab === 'use-cases' ? 'active' : ''}`}
        onClick={() => onTabChange('use-cases')}
      >
        <FaCheckSquare />
        <span>Use Cases</span>
        <div className="email-tab-indicator"></div>
      </button>
      <button 
        className={`email-emails-tab ${activeTab === 'developer' ? 'active' : ''}`}
        onClick={() => onTabChange('developer')}
      >
        <FaRocket />
        <span>Developer</span>
        <div className="email-tab-indicator"></div>
      </button>
    </div>
  );
};

export default EmailTabs;
