import React, { useState } from 'react';
import { QueryResult } from '../../../pages/adminPages/AdminAnalytics';
import { FaDownload, FaFileCsv, FaFileCode, FaTrash, FaChartBar } from 'react-icons/fa';
import '../../../styles/adminStyles/ReportsPanel.css';

interface ReportsPanelProps {
  queryHistory: QueryResult[];
}

const ReportsPanel: React.FC<ReportsPanelProps> = ({ queryHistory }) => {
  const [selectedQueries, setSelectedQueries] = useState<Set<number>>(new Set());

  const toggleSelection = (index: number) => {
    setSelectedQueries(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    if (selectedQueries.size === queryHistory.length) {
      setSelectedQueries(new Set());
    } else {
      setSelectedQueries(new Set(queryHistory.map((_, i) => i)));
    }
  };

  const exportAsJSON = () => {
    const selectedData = Array.from(selectedQueries).map(i => queryHistory[i]);
    const exportData = {
      exportDate: new Date().toISOString(),
      queryCount: selectedData.length,
      queries: selectedData.map(q => ({
        collection: q.collection,
        query: q.query,
        resultCount: q.count,
        executionTime: q.executionTime,
        timestamp: q.timestamp.toISOString(),
        data: q.data
      }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    downloadBlob(blob, `analytics-report-${Date.now()}.json`);
  };

  const exportAsCSV = () => {
    const selectedData = Array.from(selectedQueries).map(i => queryHistory[i]);
    
    // Flatten all data into CSV
    let csvContent = '';
    
    selectedData.forEach(result => {
      if (result.data.length === 0) return;
      
      // Add header row
      const headers = Object.keys(result.data[0]);
      csvContent += `\n--- ${result.collection} (${result.query}) ---\n`;
      csvContent += headers.join(',') + '\n';
      
      // Add data rows
      result.data.forEach(row => {
        const values = headers.map(h => {
          const val = row[h];
          if (typeof val === 'object') return JSON.stringify(val).replace(/,/g, ';');
          return String(val ?? '').replace(/,/g, ';');
        });
        csvContent += values.join(',') + '\n';
      });
    });

    const blob = new Blob([csvContent], { type: 'text/csv' });
    downloadBlob(blob, `analytics-report-${Date.now()}.csv`);
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getCollectionSummary = () => {
    const summary: Record<string, { queries: number; totalResults: number; avgTime: number }> = {};
    
    queryHistory.forEach(q => {
      if (!summary[q.collection]) {
        summary[q.collection] = { queries: 0, totalResults: 0, avgTime: 0 };
      }
      summary[q.collection].queries++;
      summary[q.collection].totalResults += q.count;
      summary[q.collection].avgTime += q.executionTime;
    });

    // Calculate averages
    Object.keys(summary).forEach(key => {
      summary[key].avgTime = Math.round(summary[key].avgTime / summary[key].queries);
    });

    return summary;
  };

  const collectionSummary = getCollectionSummary();

  return (
    <div className="reports-panel">
      {/* Summary Section */}
      <div className="reports-summary">
        <h3>Session Summary</h3>
        <div className="summary-cards">
          <div className="summary-card">
            <FaChartBar />
            <div className="summary-info">
              <span className="summary-value">{queryHistory.length}</span>
              <span className="summary-label">Total Queries</span>
            </div>
          </div>
          <div className="summary-card">
            <FaChartBar />
            <div className="summary-info">
              <span className="summary-value">
                {queryHistory.reduce((acc, q) => acc + q.count, 0).toLocaleString()}
              </span>
              <span className="summary-label">Documents Retrieved</span>
            </div>
          </div>
          <div className="summary-card">
            <FaChartBar />
            <div className="summary-info">
              <span className="summary-value">{Object.keys(collectionSummary).length}</span>
              <span className="summary-label">Collections Queried</span>
            </div>
          </div>
        </div>
      </div>

      {/* Collection Breakdown */}
      {Object.keys(collectionSummary).length > 0 && (
        <div className="collection-breakdown">
          <h3>Collection Breakdown</h3>
          <table className="breakdown-table">
            <thead>
              <tr>
                <th>Collection</th>
                <th>Queries</th>
                <th>Total Results</th>
                <th>Avg Time</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(collectionSummary).map(([name, stats]) => (
                <tr key={name}>
                  <td>{name}</td>
                  <td>{stats.queries}</td>
                  <td>{stats.totalResults.toLocaleString()}</td>
                  <td>{stats.avgTime}ms</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Query History for Export */}
      <div className="export-section">
        <div className="export-header">
          <h3>Query History</h3>
          <div className="export-actions">
            <button 
              className="select-all-btn"
              onClick={selectAll}
            >
              {selectedQueries.size === queryHistory.length ? 'Deselect All' : 'Select All'}
            </button>
            <button 
              className="export-btn"
              onClick={exportAsJSON}
              disabled={selectedQueries.size === 0}
            >
              <FaFileCode /> Export JSON
            </button>
            <button 
              className="export-btn"
              onClick={exportAsCSV}
              disabled={selectedQueries.size === 0}
            >
              <FaFileCsv /> Export CSV
            </button>
          </div>
        </div>

        {queryHistory.length === 0 ? (
          <div className="no-history">
            <p>No queries executed yet.</p>
            <span>Run some queries in the Query Terminal to see them here.</span>
          </div>
        ) : (
          <div className="history-table-container">
            <table className="history-table">
              <thead>
                <tr>
                  <th>
                    <input 
                      type="checkbox" 
                      checked={selectedQueries.size === queryHistory.length && queryHistory.length > 0}
                      onChange={selectAll}
                    />
                  </th>
                  <th>#</th>
                  <th>Collection</th>
                  <th>Query</th>
                  <th>Results</th>
                  <th>Time</th>
                  <th>Executed At</th>
                </tr>
              </thead>
              <tbody>
                {queryHistory.map((q, idx) => (
                  <tr key={idx} className={selectedQueries.has(idx) ? 'selected' : ''}>
                    <td>
                      <input 
                        type="checkbox" 
                        checked={selectedQueries.has(idx)}
                        onChange={() => toggleSelection(idx)}
                      />
                    </td>
                    <td>{idx + 1}</td>
                    <td><code>{q.collection}</code></td>
                    <td className="query-cell">
                      <code>{q.query.length > 50 ? q.query.substring(0, 50) + '...' : q.query}</code>
                    </td>
                    <td>{q.count}</td>
                    <td>{q.executionTime}ms</td>
                    <td>{q.timestamp.toLocaleTimeString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsPanel;
