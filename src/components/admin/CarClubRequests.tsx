import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, doc, updateDoc, orderBy, where, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { CarClubRequest } from '../../types/admin';
import { FaSpinner, FaCheck, FaTimes, FaEdit, FaSave, FaCarAlt, FaInstagram, FaPhone, FaEnvelope, FaUser, FaCalendarAlt } from 'react-icons/fa';
import { toast } from 'react-toastify';

export const CarClubRequests: React.FC = () => {
  const [requests, setRequests] = useState<CarClubRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesText, setNotesText] = useState('');
  const [viewMode, setViewMode] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [expandedRequests, setExpandedRequests] = useState<Record<string, boolean>>({});

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    
    try {
      let requestQuery;
      
      if (viewMode === 'all') {
        requestQuery = query(
          collection(db, 'carClubRequests'),
          orderBy('requestDate', 'desc')
        );
      } else {
        requestQuery = query(
          collection(db, 'carClubRequests'),
          where('status', '==', viewMode),
          orderBy('requestDate', 'desc')
        );
      }
      
      const querySnapshot = await getDocs(requestQuery);
      const requestsData: CarClubRequest[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data() as Omit<CarClubRequest, 'id'>;
        requestsData.push({
          id: doc.id,
          ...data
        });
      });
      
      setRequests(requestsData);
    } catch (err) {
      console.error('Error fetching car club requests:', err);
      setError('Failed to load car club requests. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [viewMode]);

  const handleStatusChange = async (requestId: string, newStatus: 'approved' | 'rejected') => {
    try {
      const requestRef = doc(db, 'carClubRequests', requestId);
      
      // Find the request to get the userId
      const request = requests.find(req => req.id === requestId);
      if (!request) return;
      
      // Update the request status
      await updateDoc(requestRef, {
        status: newStatus,
        reviewDate: new Date(),
        reviewedBy: 'Admin' // In a real app, you'd use the current admin's name/ID
      });
      
      // If approved, update the user's membership status
      if (newStatus === 'approved') {
        const userRef = doc(db, 'users', request.userId);
        await updateDoc(userRef, {
          'carClub.membershipType': 'active',
          'lastUpdated': new Date()
        });
      }
      
      // Update local state
      setRequests(prevRequests => 
        prevRequests.map(req => 
          req.id === requestId 
            ? { 
                ...req, 
                status: newStatus,
                reviewDate: new Date() as unknown as Timestamp,
                reviewedBy: 'Admin'
              } 
            : req
        )
      );
      
      toast.success(`Request ${newStatus === 'approved' ? 'approved' : 'rejected'} successfully`);
    } catch (err) {
      console.error(`Error ${newStatus === 'approved' ? 'approving' : 'rejecting'} request:`, err);
      toast.error(`Failed to ${newStatus === 'approved' ? 'approve' : 'reject'} request. Please try again.`);
    }
  };

  const handleSaveNotes = async (requestId: string) => {
    try {
      const requestRef = doc(db, 'carClubRequests', requestId);
      await updateDoc(requestRef, {
        notes: notesText
      });
      
      // Update local state
      setRequests(prevRequests => 
        prevRequests.map(req => 
          req.id === requestId 
            ? { ...req, notes: notesText } 
            : req
        )
      );
      
      setEditingNotes(null);
      toast.success('Notes saved successfully');
    } catch (err) {
      console.error('Error saving notes:', err);
      toast.error('Failed to save notes. Please try again.');
    }
  };

  const toggleRequestExpansion = (requestId: string) => {
    setExpandedRequests(prev => ({
      ...prev,
      [requestId]: !prev[requestId]
    }));
  };

  const startEditingNotes = (requestId: string, currentNotes: string) => {
    setEditingNotes(requestId);
    setNotesText(currentNotes);
  };

  const cancelEditingNotes = () => {
    setEditingNotes(null);
    setNotesText('');
  };

  const formatDate = (timestamp: Timestamp | Date | null | undefined) => {
    if (!timestamp) return 'N/A';
    
    const date = timestamp instanceof Timestamp ? timestamp.toDate() : timestamp instanceof Date ? timestamp : new Date();
    
    // Format the date as a relative time (e.g., "2 days ago")
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} ${months === 1 ? 'month' : 'months'} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (loading) {
    return (
      <div className="car-club-requests-container">
        <div className="car-club-requests-header">
          <h3>Car Club Join Requests</h3>
        </div>
        <div className="car-club-requests-loading">
          <FaSpinner className="spinner" />
          <p>Loading requests...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="car-club-requests-container">
        <div className="car-club-requests-header">
          <h3>Car Club Join Requests</h3>
        </div>
        <div className="car-club-requests-error">
          <p>{error}</p>
          <button onClick={fetchRequests}>Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="car-club-requests-container">
      <div className="car-club-requests-header">
        <h3>Car Club Join Requests</h3>
        <div className="view-mode-selector">
          <button 
            className={viewMode === 'all' ? 'active' : ''} 
            onClick={() => setViewMode('all')}
          >
            All Requests
          </button>
          <button 
            className={viewMode === 'pending' ? 'active' : ''} 
            onClick={() => setViewMode('pending')}
          >
            Pending
          </button>
          <button 
            className={viewMode === 'approved' ? 'active' : ''} 
            onClick={() => setViewMode('approved')}
          >
            Approved
          </button>
          <button 
            className={viewMode === 'rejected' ? 'active' : ''} 
            onClick={() => setViewMode('rejected')}
          >
            Rejected
          </button>
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="no-requests">
          <p>No {viewMode !== 'all' ? viewMode : ''} requests found.</p>
        </div>
      ) : (
        <div className="car-club-requests-list">
          {requests.map(request => (
            <div 
              key={request.id} 
              className={`request-card status-${request.status}`}
            >
              <div 
                className="request-header" 
                onClick={() => toggleRequestExpansion(request.id)}
              >
                <div className="request-basic-info">
                  <h4>{request.name}</h4>
                  <p className="car-info">{request.carMakeModel} • {request.numberPlate}</p>
                </div>
                <div className="request-meta">
                  <span className={`status-badge ${request.status}`}>
                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                  </span>
                  <span className="request-date">{formatDate(request.requestDate)}</span>
                </div>
              </div>

              {expandedRequests[request.id] && (
                <div className="request-details">
                  <div className="request-info-grid">
                    <div className="info-item">
                      <label>Name</label>
                      <p><FaUser /> {request.name}</p>
                    </div>
                    <div className="info-item">
                      <label>Email</label>
                      <p><FaEnvelope /> {request.userEmail}</p>
                    </div>
                    <div className="info-item">
                      <label>Phone</label>
                      <p><FaPhone /> {request.phone}</p>
                    </div>
                    <div className="info-item">
                      <label>Car</label>
                      <p><FaCarAlt /> {request.carMakeModel}</p>
                    </div>
                    <div className="info-item">
                      <label>Number Plate</label>
                      <p>{request.numberPlate}</p>
                    </div>
                    <div className="info-item">
                      <label>Instagram</label>
                      <p><FaInstagram /> {request.instagramHandle || 'N/A'}</p>
                    </div>
                    <div className="info-item">
                      <label>Request Date</label>
                      <p><FaCalendarAlt /> {formatDate(request.requestDate)}</p>
                    </div>
                    {request.reviewDate && (
                      <div className="info-item">
                        <label>Review Date</label>
                        <p><FaCalendarAlt /> {formatDate(request.reviewDate)}</p>
                      </div>
                    )}
                  </div>

                  <div className="request-notes">
                    <div className="notes-header">
                      <h5>Admin Notes</h5>
                      {editingNotes !== request.id && (
                        <button 
                          className="edit-notes-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            startEditingNotes(request.id, request.notes || '');
                          }}
                        >
                          <FaEdit /> Edit Notes
                        </button>
                      )}
                    </div>
                    
                    {editingNotes === request.id ? (
                      <div className="notes-editor">
                        <textarea
                          value={notesText}
                          onChange={(e) => setNotesText(e.target.value)}
                          placeholder="Add notes about this request..."
                        />
                        <div className="notes-actions">
                          <button 
                            className="cancel-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              cancelEditingNotes();
                            }}
                          >
                            <FaTimes /> Cancel
                          </button>
                          <button 
                            className="save-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSaveNotes(request.id);
                            }}
                          >
                            <FaSave /> Save Notes
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="notes-content">
                        {request.notes || 'No notes added yet.'}
                      </p>
                    )}
                  </div>

                  {request.status === 'pending' && (
                    <div className="request-actions">
                      <button 
                        className="approve-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusChange(request.id, 'approved');
                        }}
                      >
                        <FaCheck /> Approve Request
                      </button>
                      <button 
                        className="reject-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusChange(request.id, 'rejected');
                        }}
                      >
                        <FaTimes /> Reject Request
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}; 