import { useEffect, useState } from 'react';
import { db } from '../../firebase/firebase';
import { collection, query, getDocs, orderBy, doc, updateDoc, deleteDoc, Timestamp, addDoc } from 'firebase/firestore';
import { FaCheck, FaTrash, FaEnvelope, FaUndo, FaArrowLeft, FaTimes, FaPaperPlane } from 'react-icons/fa';
import '../../styles/adminStyles/AdminEnquiries.css';

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

export function AdminEnquiries() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'read' | 'responded'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Response modal state
  const [isResponseModalOpen, setIsResponseModalOpen] = useState(false);
  const [currentEnquiry, setCurrentEnquiry] = useState<Enquiry | null>(null);
  const [responseSubject, setResponseSubject] = useState('');
  const [responseMessage, setResponseMessage] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [emailSuccess, setEmailSuccess] = useState('');

  useEffect(() => {
    fetchEnquiries();
  }, []);

  // Set default response subject and message when current enquiry changes
  useEffect(() => {
    if (currentEnquiry) {
      setResponseSubject(`RE: Enquiry from ${currentEnquiry.source}`);
      setResponseMessage(`Dear ${currentEnquiry.name},\n\nThank you for your enquiry regarding "${currentEnquiry.message}".\n\n\n\nBest regards,\nbgr8 Team`);
    }
  }, [currentEnquiry]);

  const fetchEnquiries = async () => {
    setLoading(true);
    try {
      const enquiriesRef = collection(db, 'enquiries');
      const q = query(enquiriesRef, orderBy('dateSubmitted', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const enquiriesData: Enquiry[] = [];
      querySnapshot.forEach((doc) => {
        enquiriesData.push({ id: doc.id, ...doc.data() } as Enquiry);
      });
      
      setEnquiries(enquiriesData);
    } catch (error) {
      console.error('Error fetching enquiries:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const enquiryRef = doc(db, 'enquiries', id);
      await updateDoc(enquiryRef, {
        status: 'read'
      });
      // Update local state
      setEnquiries(enquiries.map(enq => 
        enq.id === id ? { ...enq, status: 'read' } : enq
      ));
    } catch (error) {
      console.error('Error updating enquiry status:', error);
    }
  };

  const markAsResponded = async (id: string) => {
    try {
      const enquiryRef = doc(db, 'enquiries', id);
      await updateDoc(enquiryRef, {
        status: 'responded'
      });
      // Update local state
      setEnquiries(enquiries.map(enq => 
        enq.id === id ? { ...enq, status: 'responded' } : enq
      ));
    } catch (error) {
      console.error('Error updating enquiry status:', error);
    }
  };

  const deleteEnquiry = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this enquiry? This action cannot be undone.')) {
      try {
        await deleteDoc(doc(db, 'enquiries', id));
        // Update local state
        setEnquiries(enquiries.filter(enq => enq.id !== id));
      } catch (error) {
        console.error('Error deleting enquiry:', error);
      }
    }
  };

  const markAsPending = async (id: string) => {
    try {
      const enquiryRef = doc(db, 'enquiries', id);
      await updateDoc(enquiryRef, {
        status: 'pending'
      });
      // Update local state
      setEnquiries(enquiries.map(enq => 
        enq.id === id ? { ...enq, status: 'pending' } : enq
      ));
    } catch (error) {
      console.error('Error updating enquiry status:', error);
    }
  };

  const undoResponded = async (id: string) => {
    try {
      const enquiryRef = doc(db, 'enquiries', id);
      await updateDoc(enquiryRef, {
        status: 'read'
      });
      // Update local state
      setEnquiries(enquiries.map(enq => 
        enq.id === id ? { ...enq, status: 'read' } : enq
      ));
    } catch (error) {
      console.error('Error updating enquiry status:', error);
    }
  };

  // Open the response modal for a specific enquiry
  const openResponseModal = (enquiry: Enquiry) => {
    setCurrentEnquiry(enquiry);
    setEmailError('');
    setEmailSuccess('');
    setIsResponseModalOpen(true);
  };

  // Close the response modal
  const closeResponseModal = () => {
    setIsResponseModalOpen(false);
    setCurrentEnquiry(null);
    setResponseSubject('');
    setResponseMessage('');
  };

  // Send email response
  const sendEmailResponse = async () => {
    if (!currentEnquiry) return;
    if (!responseSubject.trim() || !responseMessage.trim()) {
      setEmailError('Please fill in both subject and message.');
      return;
    }

    setSendingEmail(true);
    setEmailError('');
    
    try {
      // Create a record of the response in Firestore
      await addDoc(collection(db, 'emailResponses'), {
        enquiryId: currentEnquiry.id,
        to: currentEnquiry.email,
        subject: responseSubject,
        message: responseMessage,
        timestamp: Timestamp.now(),
        status: 'pending' // This will be updated by the cloud function when it's processed
      });
      
      // Mark the enquiry as responded
      await markAsResponded(currentEnquiry.id);
      
      setEmailSuccess(`Email has been queued to be sent to ${currentEnquiry.email}`);
      
      // Close modal after 3 seconds
      setTimeout(() => {
        closeResponseModal();
      }, 3000);
    } catch (error) {
      console.error('Error sending email response:', error);
      setEmailError('Failed to send email. Please try again.');
    } finally {
      setSendingEmail(false);
    }
  };

  const filteredEnquiries = enquiries.filter(enquiry => {
    // Apply status filter
    if (filter !== 'all' && enquiry.status !== filter) {
      return false;
    }
    
    // Apply search term
    const searchLower = searchTerm.toLowerCase();
    return (
      enquiry.name.toLowerCase().includes(searchLower) ||
      enquiry.email.toLowerCase().includes(searchLower) ||
      enquiry.message.toLowerCase().includes(searchLower) ||
      (enquiry.phone && enquiry.phone.includes(searchLower))
    );
  });

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'pending': return 'status-badge-pending';
      case 'new': return 'status-badge-new';
      case 'read': return 'status-badge-read';
      case 'responded': return 'status-badge-responded';
      default: return '';
    }
  };

  const getCounts = () => {
    const pendingCount = enquiries.filter(e => e.status === 'pending').length;
    const newCount = enquiries.filter(e => e.status === 'new').length;
    const readCount = enquiries.filter(e => e.status === 'read').length;
    const respondedCount = enquiries.filter(e => e.status === 'responded').length;
    
    return { pendingCount, newCount, readCount, respondedCount, totalCount: enquiries.length };
  };

  const counts = getCounts();

  return (
    <div className="enquiries-container">
      <h2><FaEnvelope /> Enquiries Management</h2>
      
      <div className="stats-cards">
        <div className="stat-card" onClick={() => setFilter('all')}>
          <h3>Total Enquiries</h3>
          <p>{counts.totalCount}</p>
        </div>
        <div className="stat-card" onClick={() => setFilter('pending')}>
          <h3>Pending</h3>
          <p>{counts.pendingCount}</p>
        </div>
        <div className="stat-card" onClick={() => setFilter('read')}>
          <h3>Read</h3>
          <p>{counts.readCount}</p>
        </div>
        <div className="stat-card" onClick={() => setFilter('responded')}>
          <h3>Responded</h3>
          <p>{counts.respondedCount}</p>
        </div>
      </div>

      <div className="enquiries-controls">
        <div className="filter-buttons">
          <button 
            className={`filter-button ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button 
            className={`filter-button ${filter === 'pending' ? 'active' : ''}`}
            onClick={() => setFilter('pending')}
          >
            Pending
          </button>
          <button 
            className={`filter-button ${filter === 'read' ? 'active' : ''}`}
            onClick={() => setFilter('read')}
          >
            Read
          </button>
          <button 
            className={`filter-button ${filter === 'responded' ? 'active' : ''}`}
            onClick={() => setFilter('responded')}
          >
            Responded
          </button>
        </div>
        
        <input
          type="text"
          placeholder="Search enquiries..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      {loading ? (
        <div className="loading">Loading enquiries...</div>
      ) : filteredEnquiries.length > 0 ? (
        <div className="enquiries-table">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Source</th>
                <th>Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEnquiries.map(enquiry => (
                <tr key={enquiry.id} className={enquiry.status === 'pending' ? 'pending-enquiry' : ''}>
                  <td>{enquiry.name}</td>
                  <td>
                    <a href={`mailto:${enquiry.email}`} className="email-link">
                      {enquiry.email}
                    </a>
                  </td>
                  <td>{enquiry.source}</td>
                  <td>{enquiry.dateSubmitted?.toDate().toLocaleDateString()}</td>
                  <td>
                    <span className={`status-badge ${getStatusBadgeClass(enquiry.status)}`}>
                      {enquiry.status}
                    </span>
                  </td>
                  <td className="action-buttons">
                    {(enquiry.status === 'pending' || enquiry.status === 'new') && (
                      <button 
                        className="action-button"
                        onClick={() => markAsRead(enquiry.id)}
                        title="Mark as read"
                      >
                        <FaCheck />
                      </button>
                    )}
                    {enquiry.status === 'read' && (
                      <button 
                        className="action-button undo"
                        onClick={() => markAsPending(enquiry.id)}
                        title="Mark as pending"
                      >
                        <FaUndo />
                      </button>
                    )}
                    {(enquiry.status === 'pending' || enquiry.status === 'new' || enquiry.status === 'read') && (
                      <>
                        <button 
                          className="action-button respond"
                          onClick={() => openResponseModal(enquiry)}
                          title="Respond via email"
                        >
                          <FaPaperPlane />
                        </button>
                        <button 
                          className="action-button"
                          onClick={() => markAsResponded(enquiry.id)}
                          title="Mark as responded (without sending email)"
                        >
                          <FaEnvelope />
                        </button>
                      </>
                    )}
                    {enquiry.status === 'responded' && (
                      <button 
                        className="action-button undo"
                        onClick={() => undoResponded(enquiry.id)}
                        title="Mark as read"
                      >
                        <FaArrowLeft />
                      </button>
                    )}
                    <button 
                      className="action-button delete"
                      onClick={() => deleteEnquiry(enquiry.id)}
                      title="Delete enquiry"
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="no-enquiries">No enquiries found matching your criteria.</div>
      )}

      <div className="enquiries-details">
        {filteredEnquiries.map(enquiry => (
          <div key={enquiry.id} className="enquiry-detail-card">
            <div className="enquiry-header">
              <h4>{enquiry.name}</h4>
              <span className={`status-badge ${getStatusBadgeClass(enquiry.status)}`}>
                {enquiry.status}
              </span>
            </div>
            <div className="enquiry-contact">
              <p><strong>Email:</strong> {enquiry.email}</p>
              {enquiry.phone && <p><strong>Phone:</strong> {enquiry.phone}</p>}
            </div>
            <div className="enquiry-meta">
              <p><strong>Source:</strong> {enquiry.source}</p>
              <p><strong>Date:</strong> {enquiry.dateSubmitted?.toDate().toLocaleString()}</p>
            </div>
            <div className="enquiry-message">
              <p><strong>Message:</strong></p>
              <div className="message-content">{enquiry.message}</div>
            </div>
            <div className="enquiry-actions">
              {(enquiry.status === 'pending' || enquiry.status === 'new') && (
                <button 
                  className="action-button full-width"
                  onClick={() => markAsRead(enquiry.id)}
                >
                  <FaCheck /> Mark as Read
                </button>
              )}
              {enquiry.status === 'read' && (
                <button 
                  className="action-button undo full-width"
                  onClick={() => markAsPending(enquiry.id)}
                >
                  <FaUndo /> Mark as Pending
                </button>
              )}
              {(enquiry.status === 'pending' || enquiry.status === 'new' || enquiry.status === 'read') && (
                <>
                  <button 
                    className="action-button respond full-width"
                    onClick={() => openResponseModal(enquiry)}
                  >
                    <FaPaperPlane /> Respond via Email
                  </button>
                  <button 
                    className="action-button full-width"
                    onClick={() => markAsResponded(enquiry.id)}
                  >
                    <FaEnvelope /> Mark as Responded
                  </button>
                </>
              )}
              {enquiry.status === 'responded' && (
                <button 
                  className="action-button undo full-width"
                  onClick={() => undoResponded(enquiry.id)}
                >
                  <FaArrowLeft /> Mark as Read
                </button>
              )}
              <button 
                className="action-button delete full-width"
                onClick={() => deleteEnquiry(enquiry.id)}
              >
                <FaTrash /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Response Modal */}
      {isResponseModalOpen && currentEnquiry && (
        <div className="modal-overlay">
          <div className="response-modal">
            <div className="modal-header">
              <h3>Respond to {currentEnquiry.name}</h3>
              <button className="close-button" onClick={closeResponseModal} title="Close">
                <FaTimes />
              </button>
            </div>
            
            <div className="modal-content">
              <div className="enquiry-preview">
                <p><strong>Original Message:</strong></p>
                <div className="message-preview">{currentEnquiry.message}</div>
              </div>
              
              <div className="response-form">
                <div className="form-group">
                  <label htmlFor="recipient">To:</label>
                  <input 
                    type="text" 
                    id="recipient" 
                    value={currentEnquiry.email} 
                    disabled 
                    className="form-control"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="subject">Subject:</label>
                  <input 
                    type="text" 
                    id="subject" 
                    value={responseSubject} 
                    onChange={(e) => setResponseSubject(e.target.value)} 
                    className="form-control"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="message">Message:</label>
                  <textarea 
                    id="message" 
                    value={responseMessage} 
                    onChange={(e) => setResponseMessage(e.target.value)} 
                    className="form-control message-area"
                    rows={8}
                  ></textarea>
                </div>
                
                {emailError && <div className="error-message">{emailError}</div>}
                {emailSuccess && <div className="success-message">{emailSuccess}</div>}
                
                <div className="modal-actions">
                  <button 
                    className="cancel-button" 
                    onClick={closeResponseModal}
                    disabled={sendingEmail}
                  >
                    Cancel
                  </button>
                  <button 
                    className="send-button" 
                    onClick={sendEmailResponse}
                    disabled={sendingEmail}
                  >
                    {sendingEmail ? 'Sending...' : 'Send Email'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 