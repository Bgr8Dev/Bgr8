import React, { useState, useRef, useEffect, useCallback } from 'react';
import { firestore } from '../../../firebase/firebase';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  doc,
  getDoc,
  QueryConstraint
} from 'firebase/firestore';
import { QueryResult } from '../../../pages/adminPages/AdminAnalytics';
import { FaPlay, FaHistory, FaCopy, FaDownload, FaTrash, FaLightbulb } from 'react-icons/fa';
import '../../../styles/adminStyles/QueryTerminal.css';

interface QueryTerminalProps {
  onQueryResult: (result: QueryResult) => void;
  queryHistory: QueryResult[];
}

interface ParsedQuery {
  collection: string;
  conditions: { field: string; operator: string; value: string | number | boolean }[];
  orderByField?: string;
  orderDirection?: 'asc' | 'desc';
  limitCount?: number;
  docId?: string;
}

// Query presets for quick access
const QUERY_PRESETS = [
  { 
    name: 'All Users', 
    query: 'SELECT * FROM users LIMIT 50',
    description: 'Fetch all user documents'
  },
  { 
    name: 'Recent Bookings', 
    query: 'SELECT * FROM bookings ORDER BY createdAt DESC LIMIT 20',
    description: 'Get latest booking records'
  },
  { 
    name: 'Pending Enquiries', 
    query: "SELECT * FROM enquiries WHERE status == 'pending'",
    description: 'Find unresolved enquiries'
  },
  { 
    name: 'Active Sessions', 
    query: "SELECT * FROM sessions WHERE status == 'scheduled'",
    description: 'Get upcoming sessions'
  },
  { 
    name: 'Feedback Summary', 
    query: 'SELECT * FROM feedback LIMIT 30',
    description: 'Recent feedback entries'
  },
  {
    name: 'Mentor Applications',
    query: "SELECT * FROM mentorApplications WHERE status == 'pending'",
    description: 'Pending mentor applications'
  },
  {
    name: 'Ambassador Apps',
    query: 'SELECT * FROM ambassadorApplications LIMIT 20',
    description: 'Ambassador application data'
  },
  {
    name: 'All Mentors',
    query: "SELECT * FROM users WHERE mentorProfileRef != null",
    description: 'Users with mentor profiles'
  }
];

const QueryTerminal: React.FC<QueryTerminalProps> = ({ onQueryResult, queryHistory }) => {
  const [queryInput, setQueryInput] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentResult, setCurrentResult] = useState<QueryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPresets, setShowPresets] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState<string[]>([
    '╔══════════════════════════════════════════════════════════════╗',
    '║          BGr8 Analytics Query Terminal v1.0                  ║',
    '║  Type SQL-like queries to explore your Firestore data        ║',
    '╚══════════════════════════════════════════════════════════════╝',
    '',
    'Syntax: SELECT * FROM <collection> [WHERE field == value] [ORDER BY field ASC|DESC] [LIMIT n]',
    'Example: SELECT * FROM users WHERE admin == true LIMIT 10',
    '',
    'Type "help" for more commands, or click "Presets" for common queries.',
    ''
  ]);
  
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll terminal to bottom
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalOutput]);

  const addOutput = useCallback((lines: string | string[]) => {
    const newLines = Array.isArray(lines) ? lines : [lines];
    setTerminalOutput(prev => [...prev, ...newLines]);
  }, []);

  const parseQuery = (queryStr: string): ParsedQuery | null => {
    const normalized = queryStr.trim().toUpperCase();
    
    // Handle special commands
    if (normalized === 'HELP') {
      addOutput([
        '',
        '═══════════════════════════════════════════════════════════════',
        '                         HELP MENU                              ',
        '═══════════════════════════════════════════════════════════════',
        '',
        'QUERY SYNTAX:',
        '  SELECT * FROM <collection>                    - Get all documents',
        '  SELECT * FROM <collection> LIMIT <n>          - Limit results',
        '  SELECT * FROM <collection> WHERE <condition>  - Filter results',
        '  SELECT * FROM <collection> ORDER BY <field>   - Sort results',
        '',
        'WHERE CONDITIONS:',
        '  field == value     - Equal to',
        '  field != value     - Not equal to', 
        '  field > value      - Greater than',
        '  field < value      - Less than',
        '  field >= value     - Greater than or equal',
        '  field <= value     - Less than or equal',
        '',
        'SPECIAL COMMANDS:',
        '  SHOW COLLECTIONS   - List all available collections',
        '  DESCRIBE <coll>    - Show sample document structure',
        '  COUNT <collection> - Count documents in collection',
        '  CLEAR              - Clear terminal output',
        '  HELP               - Show this help menu',
        '',
        'EXAMPLES:',
        '  SELECT * FROM users LIMIT 10',
        '  SELECT * FROM bookings WHERE status == "confirmed"',
        '  SELECT * FROM sessions ORDER BY createdAt DESC LIMIT 5',
        '',
        '═══════════════════════════════════════════════════════════════',
        ''
      ]);
      return null;
    }

    if (normalized === 'CLEAR') {
      setTerminalOutput([]);
      return null;
    }

    if (normalized === 'SHOW COLLECTIONS') {
      addOutput([
        '',
        '📁 Available Collections:',
        '   • users              - User profiles and accounts',
        '   • bookings           - Mentor/mentee booking records',
        '   • sessions           - Completed/scheduled sessions',
        '   • feedback           - User feedback submissions',
        '   • enquiries          - Contact form enquiries',
        '   • mentorApplications - Mentor verification requests',
        '   • ambassadorApplications - Ambassador applications',
        '   • announcements      - System announcements',
        '   • Generated Mentors  - AI-generated test mentors',
        '   • Generated Mentees  - AI-generated test mentees',
        ''
      ]);
      return null;
    }

    if (normalized.startsWith('COUNT ')) {
      const collectionName = queryStr.substring(6).trim();
      return { collection: collectionName, conditions: [], limitCount: undefined };
    }

    if (normalized.startsWith('DESCRIBE ')) {
      const collectionName = queryStr.substring(9).trim();
      return { collection: collectionName, conditions: [], limitCount: 1, docId: 'describe' };
    }

    // Parse SELECT query
    const selectMatch = queryStr.match(/SELECT\s+\*\s+FROM\s+(\S+)/i);
    if (!selectMatch) {
      throw new Error('Invalid query syntax. Use: SELECT * FROM <collection>');
    }

    const result: ParsedQuery = {
      collection: selectMatch[1].replace(/['"]/g, ''),
      conditions: []
    };

    // Parse WHERE clause
    const whereMatch = queryStr.match(/WHERE\s+(.+?)(?=\s+ORDER|\s+LIMIT|$)/i);
    if (whereMatch) {
      const conditionStr = whereMatch[1];
      // Support multiple operators
      const condMatch = conditionStr.match(/(\w+)\s*(==|!=|>=|<=|>|<)\s*(.+)/);
      if (condMatch) {
        let value: string | number | boolean = condMatch[3].trim().replace(/['"]/g, '');
        
        // Type conversion
        if (value === 'true') value = true;
        else if (value === 'false') value = false;
        else if (value === 'null') value = 'null';
        else if (!isNaN(Number(value))) value = Number(value);
        
        result.conditions.push({
          field: condMatch[1],
          operator: condMatch[2],
          value
        });
      }
    }

    // Parse ORDER BY clause
    const orderMatch = queryStr.match(/ORDER\s+BY\s+(\w+)(?:\s+(ASC|DESC))?/i);
    if (orderMatch) {
      result.orderByField = orderMatch[1];
      result.orderDirection = (orderMatch[2]?.toUpperCase() === 'DESC' ? 'desc' : 'asc');
    }

    // Parse LIMIT clause
    const limitMatch = queryStr.match(/LIMIT\s+(\d+)/i);
    if (limitMatch) {
      result.limitCount = parseInt(limitMatch[1], 10);
    }

    return result;
  };

  const executeQuery = async () => {
    if (!queryInput.trim()) return;

    setIsExecuting(true);
    setError(null);
    const startTime = performance.now();

    addOutput([``, `> ${queryInput}`, ``]);

    try {
      const parsed = parseQuery(queryInput);
      
      if (!parsed) {
        setIsExecuting(false);
        return;
      }

      // Handle COUNT query
      if (queryInput.trim().toUpperCase().startsWith('COUNT ')) {
        const snapshot = await getDocs(collection(firestore, parsed.collection));
        addOutput([
          `📊 Count Result:`,
          `   Collection: ${parsed.collection}`,
          `   Documents: ${snapshot.size}`,
          ``
        ]);
        setIsExecuting(false);
        return;
      }

      // Handle DESCRIBE query
      if (parsed.docId === 'describe') {
        const snapshot = await getDocs(query(collection(firestore, parsed.collection), limit(1)));
        if (snapshot.empty) {
          addOutput([`⚠️ Collection "${parsed.collection}" is empty or doesn't exist.`, ``]);
        } else {
          const sampleDoc = snapshot.docs[0].data();
          addOutput([
            `📋 Structure of "${parsed.collection}":`,
            `   Fields:`,
            ...Object.keys(sampleDoc).map(key => `     • ${key}: ${typeof sampleDoc[key]}`),
            ``
          ]);
        }
        setIsExecuting(false);
        return;
      }

      // Build Firestore query
      const constraints: QueryConstraint[] = [];

      // Add WHERE conditions
      for (const cond of parsed.conditions) {
        const op = cond.operator === '==' ? '==' :
                   cond.operator === '!=' ? '!=' :
                   cond.operator === '>' ? '>' :
                   cond.operator === '<' ? '<' :
                   cond.operator === '>=' ? '>=' :
                   cond.operator === '<=' ? '<=' : '==';
        constraints.push(where(cond.field, op as any, cond.value));
      }

      // Add ORDER BY
      if (parsed.orderByField) {
        constraints.push(orderBy(parsed.orderByField, parsed.orderDirection || 'asc'));
      }

      // Add LIMIT
      if (parsed.limitCount) {
        constraints.push(limit(parsed.limitCount));
      }

      // Execute query
      const collectionRef = collection(firestore, parsed.collection);
      const q = constraints.length > 0 
        ? query(collectionRef, ...constraints)
        : query(collectionRef, limit(100)); // Default limit

      const snapshot = await getDocs(q);
      const endTime = performance.now();
      const executionTime = Math.round(endTime - startTime);

      const data = snapshot.docs.map(doc => ({
        _id: doc.id,
        ...doc.data()
      }));

      const result: QueryResult = {
        data,
        count: data.length,
        executionTime,
        collection: parsed.collection,
        query: queryInput,
        timestamp: new Date()
      };

      setCurrentResult(result);
      onQueryResult(result);

      // Format output
      addOutput([
        `✅ Query executed successfully`,
        `   Collection: ${parsed.collection}`,
        `   Results: ${data.length} documents`,
        `   Time: ${executionTime}ms`,
        ``
      ]);

      if (data.length > 0) {
        addOutput([
          `📄 Results Preview (showing first ${Math.min(3, data.length)}):`,
          `─────────────────────────────────────────────────────────────`,
        ]);
        
        data.slice(0, 3).forEach((doc, idx) => {
          addOutput([
            `[${idx + 1}] ID: ${doc._id}`,
            `    ${JSON.stringify(doc, null, 2).split('\n').slice(1, 6).join('\n    ')}...`,
            ``
          ]);
        });

        if (data.length > 3) {
          addOutput([`   ... and ${data.length - 3} more results (see Results Panel below)`, ``]);
        }
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      addOutput([
        `❌ Error: ${errorMessage}`,
        `   Check your query syntax and try again.`,
        ``
      ]);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      executeQuery();
    }
  };

  const copyResults = () => {
    if (currentResult) {
      navigator.clipboard.writeText(JSON.stringify(currentResult.data, null, 2));
      addOutput(['📋 Results copied to clipboard!', '']);
    }
  };

  const downloadResults = () => {
    if (currentResult) {
      const blob = new Blob([JSON.stringify(currentResult.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `query-results-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      addOutput(['💾 Results downloaded!', '']);
    }
  };

  const applyPreset = (presetQuery: string) => {
    setQueryInput(presetQuery);
    setShowPresets(false);
    inputRef.current?.focus();
  };

  const applyHistoryQuery = (historyItem: QueryResult) => {
    setQueryInput(historyItem.query);
    setShowHistory(false);
    inputRef.current?.focus();
  };

  return (
    <div className="query-terminal">
      {/* Terminal Output */}
      <div className="terminal-window">
        <div className="terminal-header">
          <div className="terminal-dots">
            <span className="dot red"></span>
            <span className="dot yellow"></span>
            <span className="dot green"></span>
          </div>
          <span className="terminal-title">BGr8 Query Terminal</span>
          <div className="terminal-actions">
            <button onClick={() => setShowPresets(!showPresets)} title="Query Presets">
              <FaLightbulb />
            </button>
            <button onClick={() => setShowHistory(!showHistory)} title="Query History">
              <FaHistory />
            </button>
            <button onClick={() => setTerminalOutput([])} title="Clear Terminal">
              <FaTrash />
            </button>
          </div>
        </div>
        
        <div className="terminal-output" ref={terminalRef}>
          {terminalOutput.map((line, idx) => (
            <div key={idx} className="terminal-line">
              {line}
            </div>
          ))}
          {isExecuting && (
            <div className="terminal-line executing">
              <span className="loading-dots">Executing query</span>
            </div>
          )}
        </div>
      </div>

      {/* Presets Dropdown */}
      {showPresets && (
        <div className="presets-dropdown">
          <div className="presets-header">
            <h4>Query Presets</h4>
            <button onClick={() => setShowPresets(false)}>×</button>
          </div>
          <div className="presets-list">
            {QUERY_PRESETS.map((preset, idx) => (
              <div 
                key={idx} 
                className="preset-item"
                onClick={() => applyPreset(preset.query)}
              >
                <span className="preset-name">{preset.name}</span>
                <span className="preset-desc">{preset.description}</span>
                <code className="preset-query">{preset.query}</code>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History Dropdown */}
      {showHistory && queryHistory.length > 0 && (
        <div className="history-dropdown">
          <div className="history-header">
            <h4>Query History</h4>
            <button onClick={() => setShowHistory(false)}>×</button>
          </div>
          <div className="history-list">
            {queryHistory.slice(0, 10).map((item, idx) => (
              <div 
                key={idx} 
                className="history-item"
                onClick={() => applyHistoryQuery(item)}
              >
                <code>{item.query}</code>
                <span className="history-meta">
                  {item.count} results • {item.executionTime}ms • {item.timestamp.toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Query Input */}
      <div className="query-input-container">
        <div className="input-wrapper">
          <span className="input-prompt">{'>'}</span>
          <textarea
            ref={inputRef}
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter your query here... (Ctrl+Enter to execute)"
            rows={3}
            className="query-input"
          />
        </div>
        <div className="input-actions">
          <button 
            className="execute-btn"
            onClick={executeQuery}
            disabled={isExecuting || !queryInput.trim()}
          >
            <FaPlay /> Execute
          </button>
        </div>
      </div>

      {/* Results Panel */}
      {currentResult && currentResult.data.length > 0 && (
        <div className="results-panel">
          <div className="results-header">
            <h3>Query Results</h3>
            <div className="results-meta">
              <span>{currentResult.count} documents</span>
              <span>{currentResult.executionTime}ms</span>
              <span>{currentResult.collection}</span>
            </div>
            <div className="results-actions">
              <button onClick={copyResults} title="Copy to Clipboard">
                <FaCopy /> Copy
              </button>
              <button onClick={downloadResults} title="Download JSON">
                <FaDownload /> Export
              </button>
            </div>
          </div>
          <div className="results-table-container">
            <table className="results-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>ID</th>
                  {currentResult.data.length > 0 && 
                    Object.keys(currentResult.data[0])
                      .filter(k => k !== '_id')
                      .slice(0, 6)
                      .map(key => <th key={key}>{key}</th>)
                  }
                </tr>
              </thead>
              <tbody>
                {currentResult.data.slice(0, 20).map((row, idx) => (
                  <tr key={idx}>
                    <td>{idx + 1}</td>
                    <td className="cell-id">{String(row._id).substring(0, 12)}...</td>
                    {Object.entries(row)
                      .filter(([k]) => k !== '_id')
                      .slice(0, 6)
                      .map(([key, value]) => (
                        <td key={key} className="cell-value">
                          {typeof value === 'object' 
                            ? JSON.stringify(value).substring(0, 30) + '...'
                            : String(value).substring(0, 30)}
                        </td>
                      ))
                    }
                  </tr>
                ))}
              </tbody>
            </table>
            {currentResult.data.length > 20 && (
              <div className="results-overflow">
                Showing 20 of {currentResult.data.length} results
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="error-banner">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}
    </div>
  );
};

export default QueryTerminal;
