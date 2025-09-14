import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc, getDoc, getDocs } from 'firebase/firestore';
import { firestore } from '../../firebase/firebase';
import { 
  FaEye, 
  FaCheck, 
  FaTimes, 
  FaTrash, 
  FaSearch, 
  FaFilter,
  FaEnvelope,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaInstagram,
  FaLinkedin,
  FaTwitter,
  FaFacebook,
  FaTiktok,
  FaYoutube
} from 'react-icons/fa';
import './AmbassadorApplications.css';

interface SocialMediaHandles {
  instagram: { enabled: boolean; handle: string };
  linkedin: { enabled: boolean; handle: string };
  twitter: { enabled: boolean; handle: string };
  facebook: { enabled: boolean; handle: string };
  tiktok: { enabled: boolean; handle: string };
  youtube: { enabled: boolean; handle: string };
}

interface AmbassadorApplication {
  id: string;
  uid: string; // User's unique ID
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  location: string;
  experience: string;
  motivation: string;
  availability: string;
  socialMedia: SocialMediaHandles;
  referral: string;
  submittedAt: Date;
  status: 'pending' | 'approved' | 'rejected';
  applicationId: string;
}

const AmbassadorApplications: React.FC = () => {
  const [applications, setApplications] = useState<AmbassadorApplication[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<AmbassadorApplication[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<AmbassadorApplication | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [ambassadorCount, setAmbassadorCount] = useState(0);
  const [notificationModal, setNotificationModal] = useState<{
    show: boolean;
    type: 'info' | 'warning' | 'error' | 'success';
    title: string;
    message: string;
    onConfirm?: () => void;
    confirmText?: string;
    showCancel?: boolean;
  }>({
    show: false,
    type: 'info',
    title: '',
    message: '',
    confirmText: 'OK',
    showCancel: false
  });

  useEffect(() => {
    const q = query(
      collection(firestore, 'ambassadorApplications'),
      orderBy('submittedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const apps = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AmbassadorApplication[];
      
      setApplications(apps);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Fetch count of users with ambassador role
  useEffect(() => {
    const fetchAmbassadorCount = async () => {
      try {
        console.log('🔍 Fetching ambassador count...');
        const usersCollection = collection(firestore, 'users');
        const usersSnapshot = await getDocs(usersCollection);
        
        let count = 0;
        usersSnapshot.forEach((docSnapshot) => {
          const userData = docSnapshot.data();
          if (userData.roles && userData.roles.ambassador === true) {
            count++;
          }
        });
        
        console.log(`✅ Found ${count} users with ambassador role`);
        setAmbassadorCount(count);
      } catch (error) {
        console.error('❌ Error fetching ambassador count:', error);
      }
    };

    fetchAmbassadorCount();
  }, []);

  useEffect(() => {
    let filtered = applications;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(app => 
        app.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(app => app.status === statusFilter);
    }

    setFilteredApplications(filtered);
  }, [applications, searchTerm, statusFilter]);

  const showNotificationModal = (type: 'info' | 'warning' | 'error' | 'success', title: string, message: string, onConfirm?: () => void, confirmText = 'OK', showCancel = false) => {
    setNotificationModal({
      show: true,
      type,
      title,
      message,
      onConfirm,
      confirmText,
      showCancel
    });
  };

  const hideNotificationModal = () => {
    setNotificationModal(prev => ({ ...prev, show: false }));
  };

  const handleNotificationConfirm = () => {
    if (notificationModal.onConfirm) {
      notificationModal.onConfirm();
    }
    hideNotificationModal();
  };

  const updateUserProfileWithAmbassadorRole = async (uid: string, email: string) => {
    try {
      console.log(`🔍 Updating user profile for UID: ${uid} (${email})`);
      
      // Get the user's document directly using their UID
      const userRef = doc(firestore, 'users', uid);
      
      // First, get the current user document to check existing roles
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log(`📋 Found user document: ${email}`);
        
        // Get current roles or initialize if they don't exist
        const currentRoles = (userData as { roles?: Record<string, boolean> }).roles || {};
        console.log(`🔑 Current roles:`, currentRoles);
        
        // Update roles with ambassador set to true
        const updatedRoles = {
          ...currentRoles,
          ambassador: true
        };
        console.log(`🔑 Updated roles:`, updatedRoles);
        
        await updateDoc(userRef, {
          roles: updatedRoles,
          lastUpdated: new Date()
        });
        
        console.log(`✅ Successfully added ambassador role to user: ${email} (UID: ${uid})`);
        showNotificationModal('success', 'Role Added Successfully', `Ambassador role has been successfully added to ${email}!`);
        
        // Update ambassador count
        setAmbassadorCount(prev => prev + 1);
        
        return true;
      } else {
        console.warn(`❌ User document not found for UID: ${uid} (${email})`);
        showNotificationModal('warning', 'User Profile Not Found', `User profile not found for ${email}. They may need to complete their profile setup.`);
        return false;
      }
    } catch (error) {
      console.error('❌ Error updating user profile with ambassador role:', error);
      showNotificationModal('error', 'Update Failed', `Error updating user profile: ${error}`);
      return false;
    }
  };

  const updateApplicationStatus = async (id: string, status: 'pending' | 'approved' | 'rejected') => {
    try {
      console.log(`🔄 Updating application ${id} to status: ${status}`);
      
      // Find the application to get the email
      const application = applications.find(app => app.id === id);
      if (!application) {
        showNotificationModal('error', 'Application Not Found', 'The application could not be found. Please refresh the page and try again.');
        return;
      }

      // Update the application status
      const appRef = doc(firestore, 'ambassadorApplications', id);
      await updateDoc(appRef, { 
        status,
        reviewedAt: new Date(),
        reviewedBy: 'admin'
      });
      
      console.log(`✅ Application status updated to: ${status}`);

      // If approving the application, also update the user's profile with ambassador role
      if (status === 'approved') {
        console.log(`🎯 Approving application - will add ambassador role to ${application.email} (UID: ${application.uid})`);
        const roleUpdateSuccess = await updateUserProfileWithAmbassadorRole(application.uid, application.email);
        
        if (roleUpdateSuccess) {
          console.log(`🎉 Successfully approved application and added ambassador role to ${application.email}`);
        } else {
          console.warn(`⚠️ Application approved but failed to add ambassador role to ${application.email}`);
        }
      } else if (status === 'rejected') {
        showNotificationModal('warning', 'Application Rejected', `Application has been rejected for ${application.email}.`);
      }
    } catch (error) {
      console.error('❌ Error updating application status:', error);
      showNotificationModal('error', 'Update Failed', `Error updating application: ${error}`);
    }
  };

  const deleteApplication = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this application?')) {
      try {
        await deleteDoc(doc(firestore, 'ambassadorApplications', id));
      } catch (error) {
        console.error('Error deleting application:', error);
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="status-badge pending">Pending</span>;
      case 'approved':
        return <span className="status-badge approved">Approved</span>;
      case 'rejected':
        return <span className="status-badge rejected">Rejected</span>;
      default:
        return <span className="status-badge pending">Pending</span>;
    }
  };

  const getSocialMediaIcon = (platform: string) => {
    switch (platform) {
      case 'instagram': return FaInstagram;
      case 'linkedin': return FaLinkedin;
      case 'twitter': return FaTwitter;
      case 'facebook': return FaFacebook;
      case 'tiktok': return FaTiktok;
      case 'youtube': return FaYoutube;
      default: return FaInstagram;
    }
  };

  const getSocialMediaColor = (platform: string) => {
    switch (platform) {
      case 'instagram': return '#E4405F';
      case 'linkedin': return '#0077B5';
      case 'twitter': return '#1DA1F2';
      case 'facebook': return '#1877F2';
      case 'tiktok': return '#000000';
      case 'youtube': return '#FF0000';
      default: return '#6B7280';
    }
  };

  const formatDate = (timestamp: Date | { toDate: () => Date } | unknown) => {
    if (!timestamp) return 'N/A';
    let date: Date;
    if (timestamp && typeof timestamp === 'object' && 'toDate' in timestamp && typeof timestamp.toDate === 'function') {
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else {
      date = new Date(timestamp as string | number);
    }
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  if (loading) {
    return (
      <div className="ambassador-admin-loading">
        <div className="loading-spinner"></div>
        <p>Loading ambassador applications...</p>
      </div>
    );
  }

  return (
    <div className="ambassador-applications-admin">
      <div className="admin-section">
        <div className="admin-header">
          <div className="header-content">
            <h2>Ambassador Applications</h2>
            <p className="admin-section-subtitle">Manage and review ambassador applications with style ✨</p>
          </div>
          <div className="admin-stats">
            <div className="stat-item">
              <span className="stat-number">{applications.length}</span>
              <span className="stat-label">Applications</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{ambassadorCount}</span>
              <span className="stat-label">Active Ambassadors</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{applications.filter(app => app.status === 'pending').length}</span>
              <span className="stat-label">Pending</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{applications.filter(app => app.status === 'approved').length}</span>
              <span className="stat-label">Approved</span>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="admin-filters">
          <div className="search-bar">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search applications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="filter-group">
            <FaFilter className="filter-icon" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'pending' | 'approved' | 'rejected')}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Applications Table */}
        <div className="applications-table-container">
          <table className="applications-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Location</th>
                <th>Availability</th>
                <th>Status</th>
                <th>Submitted</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredApplications.map((application) => (
                <tr key={application.id}>
                  <td>
                    <div className="applicant-info">
                      <div className="applicant-name">
                        {application.firstName} {application.lastName}
                      </div>
                      <div className="applicant-id">
                        ID: {application.applicationId}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="contact-info">
                      <FaEnvelope className="contact-icon" />
                      {application.email}
                    </div>
                  </td>
                  <td>
                    <div className="location-info">
                      <FaMapMarkerAlt className="location-icon" />
                      {application.location}
                    </div>
                  </td>
                  <td>{application.availability}</td>
                  <td>{getStatusBadge(application.status)}</td>
                  <td>
                    <div className="date-info">
                      <FaCalendarAlt className="date-icon" />
                      {formatDate(application.submittedAt)}
                    </div>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="action-btn view-btn tooltip-container"
                        onClick={() => {
                          setSelectedApplication(application);
                          setShowModal(true);
                        }}
                        title="View full application details"
                      >
                        <FaEye />
                        <span className="tooltip">View Details</span>
                      </button>
                      {application.status !== 'approved' && (
                        <button
                          className="action-btn approve-btn tooltip-container"
                          onClick={() => updateApplicationStatus(application.id, 'approved')}
                          title="Approve application and grant ambassador role"
                        >
                          <FaCheck />
                          <span className="tooltip">Approve & Grant Role</span>
                        </button>
                      )}
                      {application.status !== 'rejected' && (
                        <button
                          className="action-btn reject-btn tooltip-container"
                          onClick={() => updateApplicationStatus(application.id, 'rejected')}
                          title="Reject the ambassador application"
                        >
                          <FaTimes />
                          <span className="tooltip">Reject Application</span>
                        </button>
                      )}
                      <button
                        className="action-btn delete-btn tooltip-container"
                        onClick={() => deleteApplication(application.id)}
                        title="Permanently delete this application"
                      >
                        <FaTrash />
                        <span className="tooltip">Delete Forever</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredApplications.length === 0 && (
          <div className="no-applications">
            <p>No applications found matching your criteria.</p>
          </div>
        )}
      </div>

      {/* Application Detail Modal */}
      {showModal && selectedApplication && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Application Details</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="application-details">
                <div className="detail-section">
                  <h4>Personal Information</h4>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <label>Name:</label>
                      <span>{selectedApplication.firstName} {selectedApplication.lastName}</span>
                    </div>
                    <div className="detail-item">
                      <label>Email:</label>
                      <span>{selectedApplication.email}</span>
                    </div>
                    <div className="detail-item">
                      <label>Phone:</label>
                      <span>{selectedApplication.phone || 'Not provided'}</span>
                    </div>
                    <div className="detail-item">
                      <label>Location:</label>
                      <span>{selectedApplication.location}</span>
                    </div>
                    <div className="detail-item">
                      <label>Availability:</label>
                      <span>{selectedApplication.availability}</span>
                    </div>
                    <div className="detail-item">
                      <label>Application ID:</label>
                      <span>{selectedApplication.applicationId}</span>
                    </div>
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Experience & Motivation</h4>
                  <div className="detail-text">
                    <label>Relevant Experience:</label>
                    <p>{selectedApplication.experience}</p>
                  </div>
                  <div className="detail-text">
                    <label>Motivation:</label>
                    <p>{selectedApplication.motivation}</p>
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Social Media Presence</h4>
                  <div className="social-media-display">
                    {Object.entries(selectedApplication.socialMedia).map(([platform, data]) => {
                      if (!data.enabled) return null;
                      const IconComponent = getSocialMediaIcon(platform);
                      return (
                        <div key={platform} className="social-platform-item">
                          <IconComponent 
                            style={{ color: getSocialMediaColor(platform) }}
                            className="platform-icon"
                          />
                          <span className="platform-name">{platform.charAt(0).toUpperCase() + platform.slice(1)}</span>
                          <span className="platform-handle">{data.handle}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Additional Information</h4>
                  <div className="detail-item">
                    <label>How they heard about BGr8:</label>
                    <span>{selectedApplication.referral || 'Not specified'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Submitted:</label>
                    <span>{formatDate(selectedApplication.submittedAt)}</span>
                  </div>
                  <div className="detail-item">
                    <label>Status:</label>
                    {getStatusBadge(selectedApplication.status)}
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <div className="modal-actions">
                {selectedApplication.status !== 'approved' && (
                  <button
                    className="modal-btn approve-btn tooltip-container"
                    onClick={() => {
                      updateApplicationStatus(selectedApplication.id, 'approved');
                      setShowModal(false);
                    }}
                    title="Approve this application and automatically grant the user the ambassador role"
                  >
                    <FaCheck /> Approve
                    <span className="tooltip">Approve & Grant Ambassador Role</span>
                  </button>
                )}
                {selectedApplication.status !== 'rejected' && (
                  <button
                    className="modal-btn reject-btn tooltip-container"
                    onClick={() => {
                      updateApplicationStatus(selectedApplication.id, 'rejected');
                      setShowModal(false);
                    }}
                    title="Reject this ambassador application"
                  >
                    <FaTimes /> Reject
                    <span className="tooltip">Reject Application</span>
                  </button>
                )}
                <button
                  className="modal-btn delete-btn tooltip-container"
                  onClick={() => {
                    deleteApplication(selectedApplication.id);
                    setShowModal(false);
                  }}
                  title="Permanently delete this application from the system"
                >
                  <FaTrash /> Delete
                  <span className="tooltip">Delete Forever</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification Modal */}
      {notificationModal.show && (
        <div className="ambassador-modal-overlay" onClick={hideNotificationModal}>
          <div className="ambassador-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className={`ambassador-modal-header ${notificationModal.type}`}>
              <div className="modal-icon">
                {notificationModal.type === 'success' && '✅'}
                {notificationModal.type === 'error' && '❌'}
                {notificationModal.type === 'warning' && '⚠️'}
                {notificationModal.type === 'info' && 'ℹ️'}
              </div>
              <h3 className="modal-title">{notificationModal.title}</h3>
              <button className="modal-close" onClick={hideNotificationModal}>
                ×
              </button>
            </div>
            
            <div className="ambassador-modal-body">
              <p className="modal-message">{notificationModal.message}</p>
            </div>
            
            <div className="ambassador-modal-footer">
              <div className="modal-actions">
                {notificationModal.showCancel && (
                  <button 
                    className="modal-btn cancel-btn" 
                    onClick={hideNotificationModal}
                  >
                    Cancel
                  </button>
                )}
                <button 
                  className={`modal-btn ${notificationModal.type}-btn`} 
                  onClick={handleNotificationConfirm}
                >
                  {notificationModal.confirmText}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AmbassadorApplications;
