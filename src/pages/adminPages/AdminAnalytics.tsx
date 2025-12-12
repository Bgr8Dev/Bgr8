import React, { useState, useCallback } from 'react';
import BannerWrapper from '../../components/ui/BannerWrapper';
import QueryTerminal from '../../components/admin/analytics/QueryTerminal';
import DataExplorer from '../../components/admin/analytics/DataExplorer';
import AnalyticsOverview from '../../components/admin/analytics/AnalyticsOverview';
import ReportsPanel from '../../components/admin/analytics/ReportsPanel';
import { FaTerminal, FaChartBar, FaDatabase, FaFileAlt, FaExpand, FaCompress } from 'react-icons/fa';
import '../../styles/adminStyles/AdminAnalytics.css';

type TabType = 'terminal' | 'overview' | 'explorer' | 'reports';

export interface QueryResult {
  data: Record<string, unknown>[];
  count: number;
  executionTime: number;
  collection: string;
  query: string;
  timestamp: Date;
}

const AdminAnalytics: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('terminal');
  const [queryHistory, setQueryHistory] = useState<QueryResult[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleQueryResult = useCallback((result: QueryResult) => {
    setQueryHistory(prev => [result, ...prev].slice(0, 50)); // Keep last 50 queries
  }, []);

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'terminal', label: 'Query Terminal', icon: <FaTerminal /> },
    { id: 'overview', label: 'Overview', icon: <FaChartBar /> },
    { id: 'explorer', label: 'Data Explorer', icon: <FaDatabase /> },
    { id: 'reports', label: 'Reports', icon: <FaFileAlt /> },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'terminal':
        return (
          <QueryTerminal 
            onQueryResult={handleQueryResult} 
            queryHistory={queryHistory}
          />
        );
      case 'overview':
        return <AnalyticsOverview queryHistory={queryHistory} />;
      case 'explorer':
        return <DataExplorer onQueryResult={handleQueryResult} />;
      case 'reports':
        return <ReportsPanel queryHistory={queryHistory} />;
      default:
        return null;
    }
  };

  return (
    <BannerWrapper sectionId="analytics" className={`admin-analytics ${isFullscreen ? 'fullscreen' : ''}`}>
      <div className="analytics-container">
        {/* Header */}
        <div className="analytics-header">
          <div className="header-left">
            <h1>Analytics Dashboard</h1>
            <span className="header-subtitle">Query and analyze your Firestore data</span>
          </div>
          <div className="header-right">
            <button 
              className="fullscreen-btn"
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
              {isFullscreen ? <FaCompress /> : <FaExpand />}
            </button>
          </div>
        </div>

        {/* Tabs */}
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

        {/* Tab Content */}
        <div className="analytics-content">
          {renderTabContent()}
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