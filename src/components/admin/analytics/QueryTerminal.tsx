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
  startAfter,
  endAt,
  startAt,
  endBefore,
  limitToLast,
  documentId,
  Timestamp,
  QueryConstraint,
  CollectionReference,
  DocumentData
} from 'firebase/firestore';
import { QueryResult } from '../../../pages/adminPages/AdminAnalytics';
import { FaPlay, FaHistory, FaCopy, FaDownload, FaTrash, FaLightbulb, FaCode, FaBook } from 'react-icons/fa';
import { formatFirestoreDateTime, formatRoles, convertTimestampToDate } from '../../../utils/firestoreUtils';
import '../../../styles/adminStyles/QueryTerminal.css';

interface QueryTerminalProps {
  onQueryResult: (result: QueryResult) => void;
  queryHistory: QueryResult[];
}

// Native Firestore query presets
const QUERY_PRESETS = [
  { 
    name: 'Get All Users (limit 50)', 
    code: `// Fetch first 50 users
const snapshot = await getDocs(
  query(collection(db, 'users'), limit(50))
);
return snapshot;`,
    description: 'Basic collection query with limit'
  },
  { 
    name: 'Query with Where Clause', 
    code: `// Find admin users (nested field)
const snapshot = await getDocs(
  query(
    collection(db, 'users'),
    where('roles.admin', '==', true)
  )
);
return snapshot;`,
    description: 'Filter documents with conditions'
  },
  { 
    name: 'Order By + Limit', 
    code: `// Get 20 most recent bookings
const snapshot = await getDocs(
  query(
    collection(db, 'bookings'),
    orderBy('createdAt', 'desc'),
    limit(20)
  )
);
return snapshot;`,
    description: 'Sort and limit results'
  },
  { 
    name: 'Multiple Where Conditions', 
    code: `// Find pending enquiries from today
const today = new Date();
today.setHours(0, 0, 0, 0);

const snapshot = await getDocs(
  query(
    collection(db, 'enquiries'),
    where('status', '==', 'pending'),
    where('createdAt', '>=', Timestamp.fromDate(today))
  )
);
return snapshot;`,
    description: 'Compound queries with multiple filters'
  },
  { 
    name: 'Get Single Document', 
    code: `// Get a specific document by ID
const docId = 'YOUR_DOCUMENT_ID';
const docSnap = await getDoc(doc(db, 'users', docId));

if (docSnap.exists()) {
  return { id: docSnap.id, ...docSnap.data() };
} else {
  throw new Error('Document not found');
}`,
    description: 'Fetch a single document by ID'
  },
  {
    name: 'Count Documents',
    code: `// Count all documents in a collection
const snapshot = await getDocs(collection(db, 'users'));
console.log('Total users:', snapshot.size);
return snapshot;`,
    description: 'Get document count'
  },
  {
    name: 'Nested Collection Query',
    code: `// Query a subcollection
const userId = 'USER_ID_HERE';
const snapshot = await getDocs(
  collection(db, 'users', userId, 'mentorProgram')
);
return snapshot;`,
    description: 'Access subcollections'
  },
  {
    name: 'Range Query',
    code: `// Find users within age range
const snapshot = await getDocs(
  query(
    collection(db, 'users'),
    where('age', '>=', 18),
    where('age', '<=', 30),
    orderBy('age'),
    limit(50)
  )
);
return snapshot;`,
    description: 'Query with range conditions'
  }
];

const QueryTerminal: React.FC<QueryTerminalProps> = ({ onQueryResult, queryHistory }) => {
  const [codeInput, setCodeInput] = useState<string>(`// Write your Firestore query here
// Available: db, collection, getDocs, query, where, orderBy, limit, doc, getDoc, Timestamp
// Return a QuerySnapshot or data object

const snapshot = await getDocs(
  query(collection(db, 'users'), limit(10))
);
return snapshot;`);
  
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentResult, setCurrentResult] = useState<QueryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPresets, setShowPresets] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showDocs, setShowDocs] = useState(false);
  const [terminalExpanded, setTerminalExpanded] = useState(false);
  
  // New state for table sorting and expansion
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [expandedCells, setExpandedCells] = useState<Set<string>>(new Set());
  
  const [terminalOutput, setTerminalOutput] = useState<string[]>([
    '╔══════════════════════════════════════════════════════════════╗',
    '║       BGr8 Firestore Query Terminal v2.0 (Native JS)        ║',
    '║   Write native Firestore SDK queries in JavaScript/Node.js  ║',
    '╚══════════════════════════════════════════════════════════════╝',
    '',
    '📌 Available globals: db, collection, getDocs, query, where, orderBy, limit,',
    '                      doc, getDoc, Timestamp, startAt, endAt, limitToLast',
    '',
    '💡 Click "Presets" for example queries or "Docs" for reference.',
    ''
  ]);
  
  const terminalRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  // Sort data based on column
  const handleSort = useCallback((key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  }, [sortConfig]);

  // Toggle cell expansion
  const toggleCellExpansion = useCallback((rowIdx: number, colKey: string) => {
    const cellId = `${rowIdx}-${colKey}`;
    setExpandedCells(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cellId)) {
        newSet.delete(cellId);
      } else {
        newSet.add(cellId);
      }
      return newSet;
    });
  }, []);

  // Get sorted data
  const getSortedData = useCallback((data: Record<string, unknown>[]) => {
    if (!sortConfig) return data;

    const sortedData = [...data].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];

      // Handle null/undefined
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      // Handle different types
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
      }

      // String comparison
      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();
      if (aStr < bStr) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aStr > bStr) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return sortedData;
  }, [sortConfig]);

  // Format cell value for display
  const formatCellValue = useCallback((value: unknown, rowIdx: number, colKey: string, isExpanded: boolean) => {
    if (value == null) return <span className="cell-null">null</span>;
    
    // Handle Firestore Timestamp objects (for backwards compatibility, though they should be pre-converted)
    if (typeof value === 'object' && value !== null && 'seconds' in value) {
      const date = convertTimestampToDate(value);
      if (date) {
        return date.toLocaleString('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
      }
    }

    // Handle Date objects (for backwards compatibility, though they should be pre-converted)
    if (value instanceof Date) {
      return value.toLocaleString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    }
    
    // Handle other objects (but not already-formatted strings)
    if (typeof value === 'object') {
      const jsonStr = JSON.stringify(value, null, 2);
      if (isExpanded) {
        return <pre className="cell-expanded-object">{jsonStr}</pre>;
      }
      return jsonStr.substring(0, 50) + (jsonStr.length > 50 ? '...' : '');
    }

    const strValue = String(value);
    if (isExpanded || strValue.length <= 50) {
      return strValue;
    }
    return strValue.substring(0, 50) + '...';
  }, []);

  // Normalize data: convert Timestamps to UK format and sort columns alphabetically
  const normalizeData = useCallback((data: Record<string, unknown>[]): Record<string, unknown>[] => {
    return data.map(row => {
      const normalized: Record<string, unknown> = {};
      
      // Get all keys and sort them alphabetically (except _id which stays first)
      const keys = Object.keys(row).sort((a, b) => {
        if (a === '_id') return -1;
        if (b === '_id') return 1;
        return a.localeCompare(b);
      });
      
      // Process each field
      keys.forEach(key => {
        const value = row[key];
        
        // Convert Firestore Timestamps to sortable format using utility
        if (value && typeof value === 'object' && 'seconds' in value) {
          normalized[key] = formatFirestoreDateTime(value);
        }
        // Convert Date objects to sortable format using utility
        else if (value instanceof Date) {
          normalized[key] = formatFirestoreDateTime(value);
        }
        // Convert roles object to comma-separated active roles using utility
        else if (key === 'roles' && value && typeof value === 'object' && !Array.isArray(value)) {
          normalized[key] = formatRoles(value as Record<string, boolean>);
        }
        // Keep other values as-is
        else {
          normalized[key] = value;
        }
      });
      
      return normalized;
    });
  }, []);

  // Execute the native Firestore query
  const executeQuery = async () => {
    if (!codeInput.trim()) return;

    setIsExecuting(true);
    setError(null);
    const startTime = performance.now();

    // Show the query being executed
    addOutput([
      '',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      '▶ Executing query...',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    ]);

    try {
      // Create a sandboxed execution context with Firestore methods
      const executeCode = new Function(
        'db',
        'collection',
        'getDocs',
        'query',
        'where',
        'orderBy',
        'limit',
        'doc',
        'getDoc',
        'Timestamp',
        'startAt',
        'startAfter',
        'endAt',
        'endBefore',
        'limitToLast',
        'documentId',
        'console',
        `
        return (async () => {
          ${codeInput}
        })();
        `
      );

      // Custom console to capture logs
      const logs: string[] = [];
      const customConsole = {
        log: (...args: unknown[]) => {
          logs.push(args.map(a => 
            typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)
          ).join(' '));
        },
        error: (...args: unknown[]) => {
          logs.push('ERROR: ' + args.map(a => 
            typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)
          ).join(' '));
        },
        warn: (...args: unknown[]) => {
          logs.push('WARN: ' + args.map(a => 
            typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)
          ).join(' '));
        }
      };

      // Execute the query
      const result = await executeCode(
        firestore,
        collection,
        getDocs,
        query,
        where,
        orderBy,
        limit,
        doc,
        getDoc,
        Timestamp,
        startAt,
        startAfter,
        endAt,
        endBefore,
        limitToLast,
        documentId,
        customConsole
      );

      const endTime = performance.now();
      const executionTime = Math.round(endTime - startTime);

      // Output any console logs
      if (logs.length > 0) {
        addOutput(['', '📝 Console Output:']);
        logs.forEach(log => addOutput(`   ${log}`));
      }

      // Process the result
      let data: Record<string, unknown>[] = [];
      let collectionName = 'query';

      if (result && typeof result === 'object') {
        // Check if it's a QuerySnapshot
        if ('docs' in result && Array.isArray(result.docs)) {
          data = result.docs.map((docSnap: DocumentData) => ({
            _id: docSnap.id,
            ...docSnap.data()
          }));
          
          // Try to extract collection name from the query
          if (result.query && result.query._path) {
            collectionName = result.query._path.segments.join('/');
          }
        } 
        // Check if it's a single document
        else if ('id' in result && '_id' in result === false) {
          data = [{ _id: result.id, ...result }];
          collectionName = 'document';
        }
        // It's a plain object or array
        else if (Array.isArray(result)) {
          data = result.map((item, idx) => ({ _id: `item_${idx}`, ...item }));
        } else {
          data = [{ _id: 'result', ...result }];
        }
      }

      // Normalize the data (convert timestamps, sort columns, format roles)
      data = normalizeData(data);

      const queryResult: QueryResult = {
        data,
        count: data.length,
        executionTime,
        collection: collectionName,
        query: codeInput.substring(0, 100) + (codeInput.length > 100 ? '...' : ''),
        timestamp: new Date()
      };

      setCurrentResult(queryResult);
      onQueryResult(queryResult);

      // Format output
      addOutput([
        '',
        `✅ Query executed successfully`,
        `   Results: ${data.length} document(s)`,
        `   Execution time: ${executionTime}ms`,
        ''
      ]);

      if (data.length > 0) {
        addOutput([
          `📄 Results Preview (first ${Math.min(3, data.length)}):`,
          '─────────────────────────────────────────────────────────────',
        ]);
        
        data.slice(0, 3).forEach((docData, idx) => {
          const preview = JSON.stringify(docData, null, 2)
            .split('\n')
            .slice(0, 8)
            .join('\n');
          addOutput([
            `[${idx + 1}] ID: ${docData._id}`,
            preview,
            ''
          ]);
        });

        if (data.length > 3) {
          addOutput([`   ... and ${data.length - 3} more results (see Results Panel below)`, '']);
        }
      } else {
        addOutput(['📭 No documents found matching your query.', '']);
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      addOutput([
        '',
        `❌ Error: ${errorMessage}`,
        '',
        '💡 Tips:',
        '   • Make sure collection names are correct',
        '   • Check field names exist in your documents',
        '   • Verify you have proper read permissions',
        '   • Compound queries may require indexes',
        ''
      ]);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Execute on Ctrl+Enter or Cmd+Enter
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      executeQuery();
    }
    
    // Handle Tab for indentation
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const newValue = codeInput.substring(0, start) + '  ' + codeInput.substring(end);
        setCodeInput(newValue);
        // Reset cursor position
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + 2;
        }, 0);
      }
    }
  };

  const copyResults = () => {
    if (currentResult) {
      navigator.clipboard.writeText(JSON.stringify(currentResult.data, null, 2));
      addOutput(['📋 Results copied to clipboard!', '']);
    }
  };

  const convertToCSV = (data: Record<string, unknown>[]): string => {
    if (data.length === 0) return '';

    // Get all unique keys from all objects
    const allKeys = new Set<string>();
    data.forEach(row => {
      Object.keys(row).forEach(key => allKeys.add(key));
    });

    const headers = Array.from(allKeys);
    
    // Helper to escape CSV values
    const escapeCSV = (value: unknown): string => {
      if (value == null) return '';
      
      let strValue: string;
      if (typeof value === 'object') {
        strValue = JSON.stringify(value);
      } else {
        strValue = String(value);
      }
      
      // Escape quotes and wrap in quotes if contains comma, quote, or newline
      if (strValue.includes(',') || strValue.includes('"') || strValue.includes('\n')) {
        return `"${strValue.replace(/"/g, '""')}"`;
      }
      return strValue;
    };

    // Build CSV
    const csvRows: string[] = [];
    
    // Header row
    csvRows.push(headers.map(h => escapeCSV(h)).join(','));
    
    // Data rows
    data.forEach(row => {
      const values = headers.map(header => escapeCSV(row[header]));
      csvRows.push(values.join(','));
    });

    return csvRows.join('\n');
  };

  const downloadJSON = () => {
    if (currentResult) {
      const blob = new Blob([JSON.stringify(currentResult.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `firestore-query-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      addOutput(['💾 Results downloaded as JSON!', '']);
    }
  };

  const downloadCSV = () => {
    if (currentResult) {
      const csv = convertToCSV(currentResult.data);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `firestore-query-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      addOutput(['💾 Results downloaded as CSV!', '']);
    }
  };

  const downloadResults = downloadJSON; // Keep for backward compatibility


  const applyPreset = (preset: typeof QUERY_PRESETS[0]) => {
    setCodeInput(preset.code);
    setShowPresets(false);
    textareaRef.current?.focus();
    addOutput([`📝 Loaded preset: ${preset.name}`, '']);
  };

  const applyHistoryQuery = (historyItem: QueryResult) => {
    // Try to find the full query from the history
    setCodeInput(historyItem.query.endsWith('...') 
      ? `// Previous query (truncated)\n${historyItem.query}`
      : historyItem.query
    );
    setShowHistory(false);
    textareaRef.current?.focus();
  };

  const showDocumentation = () => {
    setShowDocs(!showDocs);
    if (!showDocs) {
      addOutput([
        '',
        '═══════════════════════════════════════════════════════════════',
        '                    FIRESTORE SDK REFERENCE                     ',
        '═══════════════════════════════════════════════════════════════',
        '',
        '📚 AVAILABLE FUNCTIONS:',
        '',
        '  collection(db, "collectionName")     - Reference a collection',
        '  doc(db, "collection", "docId")       - Reference a document',
        '  getDocs(queryRef)                    - Execute query, get all docs',
        '  getDoc(docRef)                       - Get single document',
        '',
        '  query(collectionRef, ...constraints) - Build a query',
        '',
        '📚 QUERY CONSTRAINTS:',
        '',
        '  where("field", "==", value)          - Equal to',
        '  where("field", "!=", value)          - Not equal to',
        '  where("field", "<", value)           - Less than',
        '  where("field", "<=", value)          - Less than or equal',
        '  where("field", ">", value)           - Greater than',
        '  where("field", ">=", value)          - Greater than or equal',
        '  where("field", "array-contains", v)  - Array contains',
        '  where("field", "in", [v1, v2])       - In array',
        '',
        '  orderBy("field", "asc"|"desc")       - Sort results',
        '  limit(n)                             - Limit results',
        '  limitToLast(n)                       - Last n results',
        '  startAt(value)                       - Start at value',
        '  endAt(value)                         - End at value',
        '',
        '📚 TIMESTAMP:',
        '',
        '  Timestamp.now()                      - Current timestamp',
        '  Timestamp.fromDate(new Date())       - From JS Date',
        '',
        '═══════════════════════════════════════════════════════════════',
        ''
      ]);
    }
  };

  return (
    <div className="query-terminal">
      {/* Presets Dropdown */}
      {showPresets && (
        <div className="presets-dropdown">
          <div className="presets-header">
            <h4>Query Presets (Native Firestore)</h4>
            <button onClick={() => setShowPresets(false)}>×</button>
          </div>
          <div className="presets-list">
            {QUERY_PRESETS.map((preset, idx) => (
              <div 
                key={idx} 
                className="preset-item"
                onClick={() => applyPreset(preset)}
              >
                <span className="preset-name">{preset.name}</span>
                <span className="preset-desc">{preset.description}</span>
                <code className="preset-query">{preset.code.split('\n').slice(0, 2).join(' ').substring(0, 60)}...</code>
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
                  {item.count} results • {item.executionTime}ms • {item.timestamp.toLocaleTimeString('en-GB')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Code Editor */}
      <div className="code-editor-container">
        <div className="editor-header">
          <div className="editor-title">
            <FaCode />
            <span>Query Editor</span>
          </div>
          <div className="editor-toolbar">
            <button 
              onClick={() => setShowPresets(!showPresets)} 
              title="Query Presets" 
              className={`toolbar-btn ${showPresets ? 'active' : ''}`}
            >
              <FaLightbulb /> <span>Presets</span>
            </button>
            <button 
              onClick={showDocumentation} 
              title="SDK Documentation" 
              className={`toolbar-btn ${showDocs ? 'active' : ''}`}
            >
              <FaBook /> <span>Docs</span>
            </button>
            <button 
              onClick={() => setShowHistory(!showHistory)} 
              title="Query History" 
              className={`toolbar-btn ${showHistory ? 'active' : ''}`}
            >
              <FaHistory /> <span>History</span>
            </button>
          </div>
          <div className="editor-hint">
            Press <kbd>Ctrl</kbd>+<kbd>Enter</kbd> to execute
          </div>
        </div>
        <div className="code-editor-wrapper">
          <div className="line-numbers">
            {codeInput.split('\n').map((_, idx) => (
              <span key={idx}>{idx + 1}</span>
            ))}
          </div>
          <textarea
            ref={textareaRef}
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="code-editor"
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
          />
        </div>
        <div className="editor-actions">
          <button 
            className="execute-btn"
            onClick={executeQuery}
            disabled={isExecuting || !codeInput.trim()}
          >
            <FaPlay /> {isExecuting ? 'Executing...' : 'Execute Query'}
          </button>
        </div>
      </div>

      {/* Terminal Output */}
      <div className={`terminal-window ${terminalExpanded ? 'expanded' : 'collapsed'}`}>
        <div className="terminal-header">
          <div className="terminal-left">
            <span className="terminal-title">Console Output</span>
          </div>
          <div className="terminal-actions">
            <button onClick={() => setTerminalExpanded(!terminalExpanded)} title={terminalExpanded ? "Collapse" : "Expand"}>
              {terminalExpanded ? '▼' : '▲'}
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
              <button onClick={copyResults} title="Copy to Clipboard" className="action-btn copy-btn">
                <FaCopy /> Copy
              </button>
              <button onClick={downloadJSON} title="Download as JSON" className="action-btn json-btn">
                <FaDownload /> JSON
              </button>
              <button onClick={downloadCSV} title="Download as CSV" className="action-btn csv-btn">
                <FaDownload /> CSV
              </button>
            </div>
          </div>
          <div className="results-table-container">
            <table className="results-table sortable-table">
              <thead>
                <tr>
                  <th className="col-index">#</th>
                  <th 
                    className={`col-id sortable ${sortConfig?.key === '_id' ? 'sorted-' + sortConfig.direction : ''}`}
                    onClick={() => handleSort('_id')}
                    title="Click to sort"
                  >
                    ID
                    <span className="sort-indicator">
                      {sortConfig?.key === '_id' ? (sortConfig.direction === 'asc' ? ' ▲' : ' ▼') : ' ⇅'}
                    </span>
                  </th>
                  {currentResult.data.length > 0 && 
                    Object.keys(currentResult.data[0])
                      .filter(k => k !== '_id')
                      .map(key => (
                        <th 
                          key={key}
                          className={`sortable ${sortConfig?.key === key ? 'sorted-' + sortConfig.direction : ''}`}
                          onClick={() => handleSort(key)}
                          title="Click to sort"
                        >
                          {key}
                          <span className="sort-indicator">
                            {sortConfig?.key === key ? (sortConfig.direction === 'asc' ? ' ▲' : ' ▼') : ' ⇅'}
                          </span>
                        </th>
                      ))
                  }
                </tr>
              </thead>
              <tbody>
                {getSortedData(currentResult.data).slice(0, 100).map((row, idx) => (
                  <tr key={idx}>
                    <td className="cell-index">{idx + 1}</td>
                    <td 
                      className={`cell-id expandable ${expandedCells.has(`${idx}-_id`) ? 'expanded' : ''}`}
                      onClick={() => toggleCellExpansion(idx, '_id')}
                      title="Click to expand/collapse"
                    >
                      {expandedCells.has(`${idx}-_id`) 
                        ? String(row._id)
                        : String(row._id).substring(0, 20) + (String(row._id).length > 20 ? '...' : '')
                      }
                    </td>
                    {Object.entries(row)
                      .filter(([k]) => k !== '_id')
                      .map(([key, value]) => {
                        const cellId = `${idx}-${key}`;
                        const isExpanded = expandedCells.has(cellId);
                        return (
                          <td 
                            key={key} 
                            className={`cell-value expandable ${isExpanded ? 'expanded' : ''}`}
                            onClick={() => toggleCellExpansion(idx, key)}
                            title="Click to expand/collapse"
                          >
                            {formatCellValue(value, idx, key, isExpanded)}
                          </td>
                        );
                      })
                    }
                  </tr>
                ))}
              </tbody>
            </table>
            {currentResult.data.length > 100 && (
              <div className="results-overflow">
                Showing 100 of {currentResult.data.length} results
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
