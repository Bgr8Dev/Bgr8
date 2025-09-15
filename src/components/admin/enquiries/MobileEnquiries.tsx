import React, { useEffect, useState } from 'react';
import { firestore } from '../../../firebase/firebase';
import { collection, query, getDocs, orderBy, doc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { 
  FaCheck, 
  FaTrash, 
  FaEnvelope, 
  FaUndo, 
  FaTimes, 
  FaPaperPlane,
  FaSearch,
  FaFilter,
  FaEye,
  FaReply,
  FaCalendarAlt,
  FaUser,
  FaPhone,
  FaGlobe
} from 'react-icons/fa';
import './MobileEnquiries.css';

interface Enquiry {
  id: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  source: string;
  dateSubmitted: Timestamp;
  status: 'pending' | 'new' | 'read' | 'responded';
}

export function MobileEnquiries() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'read' | 'responded'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);
  const [showEnquiryModal, setShowEnquiryModal] = useState(false);

  useEffect(() => {
    fetchEnquiries();
  }, []);

  const fetchEnquiries = async () => {
    setLoading(true);
    try {
      const enquiriesRef = collection(firestore, 'enquiries');
      const q = query(enquiriesRef, orderBy('dateSubmitted', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const enquiriesData: Enquiry[] = [];
      querySnapshot.forEach((doc) => {
        enquiriesData.push({
          id: doc.id,
          ...doc.data()
        } as Enquiry);
      });
      
      setEnquiries(enquiriesData);
    } catch (error) {
      console.error('Error fetching enquiries:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateEnquiryStatus = async (enquiryId: string, newStatus: Enquiry['status']) => {
    try {
      const enquiryRef = doc(firestore, 'enquiries', enquiryId);
      await updateDoc(enquiryRef, { status: newStatus });
      
      setEnquiries(prev => 
        prev.map(enquiry => 
          enquiry.id === enquiryId 
            ? { ...enquiry, status: newStatus }
            : enquiry
        )
      );
    } catch (error) {
      console.error('Error updating enquiry status:', error);
    }
  };

  const deleteEnquiry = async (enquiryId: string) => {
    if (!window.confirm('Are you sure you want to delete this enquiry?')) {
      return;
    }

    try {
      await deleteDoc(doc(firestore, 'enquiries', enquiryId));
      setEnquiries(prev => prev.filter(enquiry => enquiry.id !== enquiryId));
    } catch (error) {
      console.error('Error deleting enquiry:', error);
    }
  };

  const filteredEnquiries = enquiries.filter(enquiry => {
    const matchesFilter = filter === 'all' || enquiry.status === filter;
    const matchesSearch = searchTerm === '' || 
      enquiry.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enquiry.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enquiry.message.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  const getStatusColor = (status: Enquiry['status']) => {
    switch (status) {
      case 'new': return '#3b82f6';
      case 'pending': return '#f59e0b';
      case 'read': return '#10b981';
      case 'responded': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status: Enquiry['status']) => {
    switch (status) {
      case 'new': return <FaEnvelope />;
      case 'pending': return <FaEye />;
      case 'read': return <FaCheck />;
      case 'responded': return <FaReply />;
      default: return <FaEnvelope />;
    }
  };

  const formatDate = (timestamp: Timestamp) => {
    return timestamp.toDate().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateMessage = (message: string, maxLength: number = 100) => {
    return message.length > maxLength ? message.substring(0, maxLength) + '...' : message;
  };

  if (loading) {
    return (
      <div className="mobile-enquiries">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading enquiries...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-enquiries">
      {/* Stats Overview */}
      <div className="enquiries-stats">
        <div className="stat-card total">
          <div className="stat-icon">
            <FaEnvelope />
          </div>
          <div className="stat-content">
            <h4>Total</h4>
            <p>{enquiries.length}</p>
          </div>
        </div>
        
        <div className="stat-card new">
          <div className="stat-icon">
            <FaEnvelope />
          </div>
          <div className="stat-content">
            <h4>New</h4>
            <p>{enquiries.filter(e => e.status === 'new').length}</p>
          </div>
        </div>
        
        <div className="stat-card pending">
          <div className="stat-icon">
            <FaEye />
          </div>
          <div className="stat-content">
            <h4>Pending</h4>
            <p>{enquiries.filter(e => e.status === 'pending').length}</p>
          </div>
        </div>
        
        <div className="stat-card responded">
          <div className="stat-icon">
            <FaReply />
          </div>
          <div className="stat-content">
            <h4>Responded</h4>
            <p>{enquiries.filter(e => e.status === 'responded').length}</p>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="enquiries-controls">
        <div className="search-container">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search enquiries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          {searchTerm && (
            <button 
              className="clear-search-btn"
              onClick={() => setSearchTerm('')}
            >
              <FaTimes />
            </button>
          )}
        </div>

        <div className="filter-tabs">
          {[
            { key: 'all', label: 'All', count: enquiries.length },
            { key: 'new', label: 'New', count: enquiries.filter(e => e.status === 'new').length },
            { key: 'pending', label: 'Pending', count: enquiries.filter(e => e.status === 'pending').length },
            { key: 'responded', label: 'Responded', count: enquiries.filter(e => e.status === 'responded').length }
          ].map(filterOption => (
            <button
              key={filterOption.key}
              className={`filter-tab ${filter === filterOption.key ? 'active' : ''}`}
              onClick={() => setFilter(filterOption.key as any)}
            >
              {filterOption.label}
              <span className="filter-count">({filterOption.count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Enquiries List */}
      <div className="enquiries-list">
        {filteredEnquiries.map((enquiry) => (
          <div 
            key={enquiry.id} 
            className={`enquiry-card ${enquiry.status}`}
            onClick={() => {
              setSelectedEnquiry(enquiry);
              setShowEnquiryModal(true);
              if (enquiry.status === 'new') {
                updateEnquiryStatus(enquiry.id, 'read');
              }
            }}
          >
            <div className="enquiry-header">
              <div className="enquiry-info">
                <h4 className="enquiry-name">{enquiry.name}</h4>
                <p className="enquiry-email">{enquiry.email}</p>
                <p className="enquiry-date">
                  <FaCalendarAlt />
                  {formatDate(enquiry.dateSubmitted)}
                </p>
              </div>
              <div className="enquiry-status">
                <span 
                  className="status-badge"
                  style={{ backgroundColor: getStatusColor(enquiry.status) }}
                >
                  {getStatusIcon(enquiry.status)}
                  {enquiry.status}
                </span>
              </div>
            </div>
            
            <div className="enquiry-content">
              <p className="enquiry-message">{truncateMessage(enquiry.message)}</p>
              <div className="enquiry-source">
                <FaGlobe />
                <span>From: {enquiry.source}</span>
              </div>
            </div>
            
            <div className="enquiry-actions">
              <button
                className="action-btn view"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedEnquiry(enquiry);
                  setShowEnquiryModal(true);
                }}
              >
                <FaEye />
                View
              </button>
              
              {enquiry.status !== 'responded' && (
                <button
                  className="action-btn mark-responded"
                  onClick={(e) => {
                    e.stopPropagation();
                    updateEnquiryStatus(enquiry.id, 'responded');
                  }}
                >
                  <FaReply />
                  Mark Responded
                </button>
              )}
              
              <button
                className="action-btn delete"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteEnquiry(enquiry.id);
                }}
              >
                <FaTrash />
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredEnquiries.length === 0 && (
        <div className="no-enquiries">
          <FaEnvelope className="no-enquiries-icon" />
          <h3>No enquiries found</h3>
          <p>Try adjusting your search or filter criteria</p>
        </div>
      )}

      {/* Enquiry Detail Modal */}
      {selectedEnquiry && showEnquiryModal && (
        <div className="enquiry-modal-overlay" onClick={() => setShowEnquiryModal(false)}>
          <div className="enquiry-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Enquiry Details</h3>
              <button 
                className="close-btn"
                onClick={() => setShowEnquiryModal(false)}
              >
                <FaTimes />
              </button>
            </div>
            
            <div className="modal-content">
              <div className="enquiry-detail-header">
                <div className="detail-info">
                  <h4>{selectedEnquiry.name}</h4>
                  <p className="detail-email">{selectedEnquiry.email}</p>
                  {selectedEnquiry.phone && (
                    <p className="detail-phone">
                      <FaPhone />
                      {selectedEnquiry.phone}
                    </p>
                  )}
                  <p className="detail-date">
                    <FaCalendarAlt />
                    {formatDate(selectedEnquiry.dateSubmitted)}
                  </p>
                  <p className="detail-source">
                    <FaGlobe />
                    From: {selectedEnquiry.source}
                  </p>
                </div>
                <div className="detail-status">
                  <span 
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(selectedEnquiry.status) }}
                  >
                    {getStatusIcon(selectedEnquiry.status)}
                    {selectedEnquiry.status}
                  </span>
                </div>
              </div>
              
              <div className="enquiry-detail-message">
                <h5>Message:</h5>
                <p>{selectedEnquiry.message}</p>
              </div>
            </div>
            
            <div className="modal-actions">
              {selectedEnquiry.status !== 'responded' && (
                <button
                  className="modal-btn primary"
                  onClick={() => {
                    updateEnquiryStatus(selectedEnquiry.id, 'responded');
                    setShowEnquiryModal(false);
                  }}
                >
                  <FaReply />
                  Mark as Responded
                </button>
              )}
              
              <button
                className="modal-btn secondary"
                onClick={() => {
                  window.open(`mailto:${selectedEnquiry.email}?subject=RE: Your Enquiry&body=Dear ${selectedEnquiry.name},%0D%0A%0D%0AThank you for your enquiry.%0D%0A%0D%0ABest regards,%0D%0Abgr8 Team`);
                }}
              >
                <FaPaperPlane />
                Reply via Email
              </button>
              
              <button
                className="modal-btn danger"
                onClick={() => {
                  deleteEnquiry(selectedEnquiry.id);
                  setShowEnquiryModal(false);
                }}
              >
                <FaTrash />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
