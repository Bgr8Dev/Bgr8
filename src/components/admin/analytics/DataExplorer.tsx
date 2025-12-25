import React, { useState, useEffect } from 'react';
import { firestore } from '../../../firebase/firebase';
import { collection, getDocs, query, limit, doc, getDoc } from 'firebase/firestore';
import { QueryResult } from '../../../pages/adminPages/AdminAnalytics';
import { FaFolder, FaFolderOpen, FaFile, FaSync, FaSearch } from 'react-icons/fa';
import { formatFirestoreDateTime } from '../../../utils/firestoreUtils';
import '../../../styles/adminStyles/DataExplorer.css';

interface DataExplorerProps {
  onQueryResult: (result: QueryResult) => void;
}

interface CollectionInfo {
  name: string;
  count: number;
  isExpanded: boolean;
  documentIds: string[];
  isLoading: boolean;
}

const KNOWN_COLLECTIONS = [
  'users',
  'bookings',
  'sessions',
  'feedback',
  'enquiries',
  'mentorApplications',
  'ambassadorApplications',
  'announcements',
  'mentorProgram',
  'Generated Mentors',
  'Generated Mentees'
];

const DataExplorer: React.FC<DataExplorerProps> = ({ onQueryResult }) => {
  const [collections, setCollections] = useState<CollectionInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<{ collection: string; id: string; data: Record<string, unknown> } | null>(null);

  useEffect(() => {
    loadCollections();
  }, []);

  const loadCollections = async () => {
    setLoading(true);
    try {
      const collectionPromises = KNOWN_COLLECTIONS.map(async (name) => {
        try {
          // Get count
          const fullSnapshot = await getDocs(collection(firestore, name));
          
          return {
            name,
            count: fullSnapshot.size,
            isExpanded: false,
            documentIds: [],
            isLoading: false
          };
        } catch {
          return {
            name,
            count: 0,
            isExpanded: false,
            documentIds: [],
            isLoading: false
          };
        }
      });

      const results = await Promise.all(collectionPromises);
      // Filter out empty collections
      setCollections(results.filter(c => c.count > 0));
    } catch (error) {
      console.error('Error loading collections:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCollection = async (collectionName: string) => {
    setCollections(prev => prev.map(col => {
      if (col.name === collectionName) {
        if (!col.isExpanded && col.documentIds.length === 0) {
          // Need to load document IDs
          loadCollectionDocumentIds(collectionName);
          return { ...col, isExpanded: true, isLoading: true };
        }
        return { ...col, isExpanded: !col.isExpanded };
      }
      return col;
    }));
  };

  const loadCollectionDocumentIds = async (collectionName: string) => {
    try {
      const snapshot = await getDocs(collection(firestore, collectionName));
      const documentIds = snapshot.docs.map(doc => doc.id);

      setCollections(prev => prev.map(col => {
        if (col.name === collectionName) {
          return { ...col, documentIds, isLoading: false };
        }
        return col;
      }));
    } catch (error) {
      console.error('Error loading document IDs:', error);
      setCollections(prev => prev.map(col => {
        if (col.name === collectionName) {
          return { ...col, isLoading: false };
        }
        return col;
      }));
    }
  };

  const viewDocument = async (collectionName: string, docId: string) => {
    try {
      const docRef = doc(firestore, collectionName, docId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSelectedDoc({ collection: collectionName, id: docId, data });

        // Add to query results
        const result: QueryResult = {
          data: [{ _id: docId, ...data }],
          count: 1,
          executionTime: 0,
          collection: collectionName,
          query: `Viewed document ${docId}`,
          timestamp: new Date()
        };
        onQueryResult(result);
      }
    } catch (error) {
      console.error('Error loading document:', error);
    }
  };

  const filteredCollections = collections.filter(col => 
    col.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'object') {
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
      // Firestore Timestamp - use utility function
      if ('seconds' in (value as any)) {
        const formatted = formatFirestoreDateTime(value);
        return formatted || 'Invalid Date';
      }
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  return (
    <div className="data-explorer">
      {/* Toolbar */}
      <div className="explorer-toolbar">
        <div className="search-box">
          <FaSearch />
          <input
            type="text"
            placeholder="Search collections..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="refresh-btn" onClick={loadCollections} disabled={loading}>
          <FaSync className={loading ? 'spinning' : ''} />
          Refresh
        </button>
      </div>

      <div className="explorer-content">
        {/* Collection Tree */}
        <div className="collection-tree">
          <div className="tree-header">
            <h3>Collections</h3>
            <span className="collection-count">{collections.length} found</span>
          </div>
          
          {loading ? (
            <div className="tree-loading">Loading collections...</div>
          ) : (
            <div className="tree-list">
              {filteredCollections.map(col => (
                <div key={col.name} className="tree-item">
                  <div 
                    className={`tree-collection ${col.isExpanded ? 'expanded' : ''}`}
                    onClick={() => toggleCollection(col.name)}
                  >
                    {col.isExpanded ? <FaFolderOpen /> : <FaFolder />}
                    <span className="collection-name">{col.name}</span>
                    <span className="collection-badge">{col.count}</span>
                  </div>
                  
                  {col.isExpanded && (
                    <div className="tree-documents">
                      {col.isLoading ? (
                        <div className="loading-docs">Loading...</div>
                      ) : (
                        col.documentIds.map(docId => (
                          <div 
                            key={docId} 
                            className="tree-document"
                            onClick={() => viewDocument(col.name, docId)}
                          >
                            <FaFile />
                            <span className="doc-id">{docId.substring(0, 30)}...</span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Document Viewer */}
        <div className="document-viewer">
          {selectedDoc ? (
            <>
              <div className="viewer-header">
                <h3>Document Details</h3>
                <div className="doc-path">
                  <span>{selectedDoc.collection}</span>
                  <span>/</span>
                  <span>{selectedDoc.id}</span>
                </div>
              </div>
              <div className="viewer-content">
                <table className="doc-table">
                  <thead>
                    <tr>
                      <th>Field</th>
                      <th>Type</th>
                      <th>Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(selectedDoc.data)
                      .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
                      .map(([key, value]) => (
                      <tr key={key}>
                        <td className="field-name">{key}</td>
                        <td className="field-type">{typeof value}</td>
                        <td className="field-value">
                          <pre>{formatValue(value)}</pre>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="viewer-empty">
              <FaFile size={48} />
              <p>Select a document to view its contents</p>
              <span>Click on any document in the collection tree</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DataExplorer;
