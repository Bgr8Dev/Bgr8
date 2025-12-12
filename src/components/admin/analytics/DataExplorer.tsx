import React, { useState, useEffect } from 'react';
import { firestore } from '../../../firebase/firebase';
import { collection, getDocs, query, limit, doc, getDoc } from 'firebase/firestore';
import { QueryResult } from '../../../pages/adminPages/AdminAnalytics';
import { FaFolder, FaFolderOpen, FaFile, FaSync, FaSearch, FaEye } from 'react-icons/fa';
import '../../../styles/adminStyles/DataExplorer.css';

interface DataExplorerProps {
  onQueryResult: (result: QueryResult) => void;
}

interface CollectionInfo {
  name: string;
  count: number;
  sampleFields: string[];
  isExpanded: boolean;
  documents: { id: string; data: Record<string, unknown> }[];
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
          const snapshot = await getDocs(query(collection(firestore, name), limit(1)));
          const sampleFields = snapshot.docs.length > 0 
            ? Object.keys(snapshot.docs[0].data()).slice(0, 8)
            : [];
          
          // Get count
          const fullSnapshot = await getDocs(collection(firestore, name));
          
          return {
            name,
            count: fullSnapshot.size,
            sampleFields,
            isExpanded: false,
            documents: [],
            isLoading: false
          };
        } catch {
          return {
            name,
            count: 0,
            sampleFields: [],
            isExpanded: false,
            documents: [],
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
        if (!col.isExpanded && col.documents.length === 0) {
          // Need to load documents
          loadCollectionDocuments(collectionName);
          return { ...col, isExpanded: true, isLoading: true };
        }
        return { ...col, isExpanded: !col.isExpanded };
      }
      return col;
    }));
  };

  const loadCollectionDocuments = async (collectionName: string) => {
    try {
      const snapshot = await getDocs(query(collection(firestore, collectionName), limit(20)));
      const documents = snapshot.docs.map(doc => ({
        id: doc.id,
        data: doc.data()
      }));

      setCollections(prev => prev.map(col => {
        if (col.name === collectionName) {
          return { ...col, documents, isLoading: false };
        }
        return col;
      }));

      // Also add to query results
      const result: QueryResult = {
        data: documents.map(d => ({ _id: d.id, ...d.data })),
        count: documents.length,
        executionTime: 0,
        collection: collectionName,
        query: `Explored ${collectionName}`,
        timestamp: new Date()
      };
      onQueryResult(result);
    } catch (error) {
      console.error('Error loading documents:', error);
      setCollections(prev => prev.map(col => {
        if (col.name === collectionName) {
          return { ...col, isLoading: false };
        }
        return col;
      }));
    }
  };

  const viewDocument = (collectionName: string, docId: string, data: Record<string, unknown>) => {
    setSelectedDoc({ collection: collectionName, id: docId, data });
  };

  const filteredCollections = collections.filter(col => 
    col.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'object') {
      if (value instanceof Date) return value.toISOString();
      if ('seconds' in (value as any)) {
        // Firestore Timestamp
        return new Date((value as any).seconds * 1000).toISOString();
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
                        col.documents.map(docItem => (
                          <div 
                            key={docItem.id} 
                            className="tree-document"
                            onClick={() => viewDocument(col.name, docItem.id, docItem.data)}
                          >
                            <FaFile />
                            <span className="doc-id">{docItem.id.substring(0, 20)}...</span>
                            <button className="view-btn" title="View Document">
                              <FaEye />
                            </button>
                          </div>
                        ))
                      )}
                      {col.documents.length >= 20 && (
                        <div className="more-docs">+ more documents available</div>
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
                    {Object.entries(selectedDoc.data).map(([key, value]) => (
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
