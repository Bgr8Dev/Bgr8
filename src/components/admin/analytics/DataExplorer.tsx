import React, { useState, useEffect } from 'react';
import { firestore } from '../../../firebase/firebase';
import { collection, getDocs, doc, getDoc, collectionGroup, query, where, limit } from 'firebase/firestore';
import { QueryResult } from '../../../pages/adminPages/AdminAnalytics';
import { FaFolder, FaFolderOpen, FaFile, FaSync, FaChevronRight, FaChevronDown } from 'react-icons/fa';
import { formatFirestoreDateTime } from '../../../utils/firestoreUtils';
import '../../../styles/adminStyles/DataExplorer.css';

interface DataExplorerProps {
  onQueryResult: (result: QueryResult) => void;
}

interface DocumentNode {
  id: string;
  isExpanded: boolean;
  subcollections: CollectionInfo[];
  isLoadingSubcollections: boolean;
}

interface CollectionInfo {
  name: string;
  path: string; // Full path like "users" or "users/userId/subcollection"
  count: number;
  isExpanded: boolean;
  documents: DocumentNode[];
  isLoading: boolean;
  level: number; // Nesting level for indentation
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

// Recursive component for rendering collection tree
interface CollectionTreeItemProps {
  collection: CollectionInfo;
  onToggleCollection: (path: string) => void;
  onViewDocument: (path: string, docId: string) => void;
  onToggleDocument: (path: string, docId: string) => void;
}

const CollectionTreeItem: React.FC<CollectionTreeItemProps> = ({
  collection,
  onToggleCollection,
  onViewDocument,
  onToggleDocument
}) => {
  const indentStyle = { paddingLeft: `${collection.level * 20}px` };
  
  console.log(`🌲 Rendering CollectionTreeItem: ${collection.name} (${collection.path})`, {
    documentsCount: collection.documents.length,
    isExpanded: collection.isExpanded,
    level: collection.level
  });

  return (
    <div className="tree-item">
      <div 
        className={`tree-collection ${collection.isExpanded ? 'expanded' : ''}`}
        onClick={() => onToggleCollection(collection.path)}
        style={indentStyle}
      >
        {collection.isExpanded ? <FaFolderOpen /> : <FaFolder />}
        <span className="collection-name">{collection.name}</span>
        <span className="collection-badge">{collection.count}</span>
      </div>
      
      {collection.isExpanded && (
        <div className="tree-documents">
          {collection.isLoading ? (
            <div className="loading-docs" style={{ paddingLeft: `${(collection.level + 1) * 20}px` }}>
              Loading...
            </div>
          ) : (
            collection.documents.map(document => {
              console.log(`📄 Rendering document: ${document.id}`, {
                isExpanded: document.isExpanded,
                subcollectionsCount: document.subcollections.length,
                isLoadingSubcollections: document.isLoadingSubcollections
              });
              return (
              <div key={document.id} className="tree-document-container">
                <div 
                  className={`tree-document ${document.isExpanded ? 'expanded' : ''}`}
                  style={{ paddingLeft: `${(collection.level + 1) * 20}px` }}
                  onClick={() => onViewDocument(collection.path, document.id)}
                >
                  <span 
                    className="doc-toggle"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleDocument(collection.path, document.id);
                    }}
                  >
                    {document.subcollections.length > 0 || document.isLoadingSubcollections ? (
                      document.isExpanded ? <FaChevronDown /> : <FaChevronRight />
                    ) : (
                      <span className="no-toggle">•</span>
                    )}
                  </span>
                  <FaFile />
                  <span 
                    className="doc-id" 
                    title={document.id}
                  >
                    {document.id.substring(0, 25)}
                    {document.id.length > 25 && '...'}
                  </span>
                  {document.isLoadingSubcollections && (
                    <span className="loading-indicator">⏳</span>
                  )}
                </div>
                
                {/* Render subcollections */}
                {document.isExpanded && document.subcollections.length > 0 && (
                  <div className="tree-subcollections">
                    {document.subcollections.map(subcol => (
                      <CollectionTreeItem
                        key={subcol.path}
                        collection={subcol}
                        onToggleCollection={onToggleCollection}
                        onViewDocument={onViewDocument}
                        onToggleDocument={onToggleDocument}
                      />
                    ))}
                  </div>
                )}
              </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

const DataExplorer: React.FC<DataExplorerProps> = ({ onQueryResult }) => {
  const [collections, setCollections] = useState<CollectionInfo[]>([]);
  const [loading, setLoading] = useState(true);
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
            path: name,
            count: fullSnapshot.size,
            isExpanded: false,
            documents: [],
            isLoading: false,
            level: 0
          };
        } catch {
          return {
            name,
            path: name,
            count: 0,
            isExpanded: false,
            documents: [],
            isLoading: false,
            level: 0
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

  const toggleCollection = async (collectionPath: string) => {
    setCollections(prev => prev.map(col => {
      if (col.path === collectionPath) {
        if (!col.isExpanded && col.documents.length === 0) {
          // Need to load documents
          loadCollectionDocuments(collectionPath, col.level);
          return { ...col, isExpanded: true, isLoading: true };
        }
        return { ...col, isExpanded: !col.isExpanded };
      }
      return col;
    }));
  };

  const loadCollectionDocuments = async (collectionPath: string, level: number) => {
    try {
      const snapshot = await getDocs(collection(firestore, collectionPath));
      const documents: DocumentNode[] = snapshot.docs.map(d => ({
        id: d.id,
        isExpanded: false,
        subcollections: [],
        isLoadingSubcollections: false
      }));

      setCollections(prev => prev.map(col => {
        if (col.path === collectionPath) {
          return { ...col, documents, isLoading: false };
        }
        return col;
      }));
    } catch (error) {
      console.error('Error loading documents:', error);
      setCollections(prev => prev.map(col => {
        if (col.path === collectionPath) {
          return { ...col, isLoading: false };
        }
        return col;
      }));
    }
  };

  const toggleDocument = async (collectionPath: string, docId: string) => {
    console.log('🔄 Toggle document called:', collectionPath, docId);
    setCollections(prev => prev.map(col => {
      if (col.path === collectionPath) {
        return {
          ...col,
          documents: col.documents.map(d => {
            if (d.id === docId) {
              console.log('📌 Found matching document, current state:', {
                isExpanded: d.isExpanded,
                subcollectionsCount: d.subcollections.length,
                isLoadingSubcollections: d.isLoadingSubcollections
              });
              if (!d.isExpanded && d.subcollections.length === 0) {
                // Load subcollections
                console.log('🚀 Loading subcollections...');
                loadSubcollections(collectionPath, docId);
                return { ...d, isExpanded: true, isLoadingSubcollections: true };
              }
              console.log('🔃 Toggling expansion state to:', !d.isExpanded);
              return { ...d, isExpanded: !d.isExpanded };
            }
            return d;
          })
        };
      }
      return col;
    }));
  };

  const loadSubcollections = async (collectionPath: string, docId: string) => {
    console.log('🔍 Loading subcollections for:', collectionPath, '/', docId);
    try {
      const docRef = doc(firestore, collectionPath, docId);
      
      // Firestore doesn't have a direct listCollections() in the client SDK
      // We'll try common subcollection names
      const commonSubcollectionNames = ['sessions', 'bookings', 'messages', 'notifications', 'events', 'history', 'logs'];
      console.log('📋 Checking subcollection names:', commonSubcollectionNames);
      
      const subcollectionPromises = commonSubcollectionNames.map(async (subName) => {
        try {
          const subColRef = collection(docRef, subName);
          const snapshot = await getDocs(query(subColRef, limit(1)));
          
          if (snapshot.size > 0) {
            // Get full count
            const fullSnapshot = await getDocs(subColRef);
            console.log(`✅ Found subcollection "${subName}" with ${fullSnapshot.size} documents`);
            return {
              name: subName,
              path: `${collectionPath}/${docId}/${subName}`,
              count: fullSnapshot.size,
              isExpanded: false,
              documents: [],
              isLoading: false,
              level: collectionPath.split('/').length / 2 // Calculate nesting level
            };
          } else {
            console.log(`❌ No documents in "${subName}"`);
          }
          return null;
        } catch (error) {
          console.log(`⚠️ Error checking "${subName}":`, error);
          return null;
        }
      });

      const results = await Promise.all(subcollectionPromises);
      const foundSubcollections = results.filter(s => s !== null) as CollectionInfo[];
      console.log('📦 Total subcollections found:', foundSubcollections.length, foundSubcollections);

      setCollections(prev => prev.map(col => {
        if (col.path === collectionPath) {
          const updatedCol = {
            ...col,
            documents: col.documents.map(d => {
              if (d.id === docId) {
                console.log(`💾 Updating document ${docId} with ${foundSubcollections.length} subcollections:`, foundSubcollections);
                return {
                  ...d,
                  subcollections: foundSubcollections,
                  isLoadingSubcollections: false
                };
              }
              return d;
            })
          };
          console.log('🔄 Updated collection state:', updatedCol);
          return updatedCol;
        }
        return col;
      }));

      // Also add subcollections to main collections list for easy expansion
      if (foundSubcollections.length > 0) {
        console.log('➕ Adding subcollections to main collections list');
        setCollections(prev => {
          const existingPaths = new Set(prev.map(c => c.path));
          const newCollections = foundSubcollections.filter(sc => !existingPaths.has(sc.path));
          console.log('📝 New collections to add:', newCollections);
          return [...prev, ...newCollections];
        });
      }
    } catch (error) {
      console.error('💥 Error loading subcollections:', error);
      setCollections(prev => prev.map(col => {
        if (col.path === collectionPath) {
          return {
            ...col,
            documents: col.documents.map(d => {
              if (d.id === docId) {
                return { ...d, isLoadingSubcollections: false };
              }
              return d;
            })
          };
        }
        return col;
      }));
    }
  };

  const viewDocument = async (collectionPath: string, docId: string) => {
    try {
      const docRef = doc(firestore, collectionPath, docId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSelectedDoc({ collection: collectionPath, id: docId, data });

        // Add to query results
        const result: QueryResult = {
          data: [{ _id: docId, ...data }],
          count: 1,
          executionTime: 0,
          collection: collectionPath,
          query: `Viewed document ${docId}`,
          timestamp: new Date()
        };
        onQueryResult(result);

        // Automatically toggle to show subcollections
        toggleDocument(collectionPath, docId);
      }
    } catch (error) {
      console.error('Error loading document:', error);
    }
  };

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
              {collections
                .filter(col => col.level === 0) // Only show root collections here
                .map(col => (
                  <CollectionTreeItem
                    key={col.path}
                    collection={col}
                    onToggleCollection={toggleCollection}
                    onViewDocument={viewDocument}
                    onToggleDocument={toggleDocument}
                  />
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
