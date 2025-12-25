import React, { useState, useCallback } from 'react';
import BannerWrapper from '../../components/ui/BannerWrapper';
import QueryTerminal from '../../components/admin/analytics/QueryTerminal';
import AnalyticsOverview from '../../components/admin/analytics/AnalyticsOverview';
import { FaTerminal, FaChartBar, FaExpand, FaCompress } from 'react-icons/fa';
import '../../styles/adminStyles/AdminAnalytics.css';

type TabType = 'terminal' | 'overview';

export interface QueryResult {
  data: Record<string, unknown>[];
  count: number;
  executionTime: number;
  collection: string;
  query: string;
  timestamp: Date;
}

const AdminAnalytics: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [queryHistory, setQueryHistory] = useState<QueryResult[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleQueryResult = useCallback((result: QueryResult) => {
    setQueryHistory(prev => [result, ...prev].slice(0, 50)); // Keep last 50 queries
  }, []);

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <FaChartBar /> },
    { id: 'terminal', label: 'Query Terminal', icon: <FaTerminal /> },
  ];

  // Render all tabs but hide inactive ones to preserve state
  const renderAllTabs = () => {
    return (
      <>
        <div className={`tab-content ${activeTab === 'overview' ? 'active' : ''}`}>
          <AnalyticsOverview />
        </div>
        <div className={`tab-content ${activeTab === 'terminal' ? 'active' : ''}`}>
          <QueryTerminal 
            onQueryResult={handleQueryResult} 
            queryHistory={queryHistory}
          />
        </div>
      </>
    );
  };

  return (
    <BannerWrapper sectionId="analytics" className={`admin-analytics ${isFullscreen ? 'fullscreen' : ''}`}>
      <div className="analytics-container">
        {/* Combined Header + Tabs Bar */}
        <div className="analytics-toolbar">
          <h1 className="toolbar-title">Analytics</h1>
          <div className="analytics-tabs">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
          <button 
            className="fullscreen-btn"
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? <FaCompress /> : <FaExpand />}
          </button>
        </div>

        {/* Tab Content */}
        <div className="analytics-content">
          {renderAllTabs()}
        </div>

        {/* Status Bar */}
        <div className="analytics-status-bar">
          <div className="status-left">
            <span className="status-item">
              <span className="status-dot connected"></span>
              Connected to Firestore
            </span>
            <span className="status-item">
              Queries executed: {queryHistory.length}
            </span>
          </div>
          <div className="status-right">
            <span className="status-item">
              {new Date().toLocaleString('en-GB', { timeZone: 'Europe/London' })}
            </span>
          </div>
        </div>
      </div>
    </BannerWrapper>
  );
};

export default AdminAnalytics; 