import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc, getDocs } from 'firebase/firestore';
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

  const updateUserProfileWithAmbassadorRole = async (email: string) => {
    try {
      // First, find the user by email in the users collection
      const usersCollection = collection(firestore, 'users');
      const usersSnapshot = await getDocs(usersCollection);
      
      let userDoc = null;
      let userDocId = null;
      
      usersSnapshot.forEach((docSnapshot) => {
        const userData = docSnapshot.data();
        if (userData.email === email) {
          userDoc = userData;
          userDocId = docSnapshot.id;
        }
      });
      
      if (userDoc && userDocId) {
        // Update the user's roles to include ambassador
        const userRef = doc(firestore, 'users', userDocId);
        
        // Get current roles or initialize if they don't exist
        const currentRoles = (userDoc as { roles?: Record<string, boolean> }).roles || {};
        
        // Update roles with ambassador set to true
        const updatedRoles = {
          ...currentRoles,
          ambassador: true
        };
        
        await updateDoc(userRef, {
          roles: updatedRoles,
          lastUpdated: new Date()
        });
        
        console.log(`Successfully added ambassador role to user: ${email}`);
        return true;
      } else {
        console.warn(`User with email ${email} not found in users collection`);
        return false;
      }
    } catch (error) {
      console.error('Error updating user profile with ambassador role:', error);
      return false;
    }
  };

  const updateApplicationStatus = async (id: string, status: 'pending' | 'approved' | 'rejected') => {
    try {
      const appRef = doc(firestore, 'ambassadorApplications', id);
      await updateDoc(appRef, { status });

      // If approving the application, also update the user's profile with ambassador role
      if (status === 'approved') {
        // Find the application to get the email
        const application = applications.find(app => app.id === id);
        if (application) {
          const roleUpdateSuccess = await updateUserProfileWithAmbassadorRole(application.email);
          
          if (roleUpdateSuccess) {
            console.log(`Ambassador role successfully added to ${application.email}`);
          } else {
            console.warn(`Failed to add ambassador role to ${application.email} - user may not exist in users collection`);
          }
        }
      }
    } catch (error) {
      console.error('Error updating application status:', error);
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
              <span className="stat-label">Total</span>
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
                        className="action-btn view-btn"
                        onClick={() => {
                          setSelectedApplication(application);
                          setShowModal(true);
                        }}
                        title="View Details"
                      >
                        <FaEye />
                      </button>
                      {application.status !== 'approved' && (
                        <button
                          className="action-btn approve-btn"
                          onClick={() => updateApplicationStatus(application.id, 'approved')}
                          title="Approve"
                        >
                          <FaCheck />
                        </button>
                      )}
                      {application.status !== 'rejected' && (
                        <button
                          className="action-btn reject-btn"
                          onClick={() => updateApplicationStatus(application.id, 'rejected')}
                          title="Reject"
                        >
                          <FaTimes />
                        </button>
                      )}
                      <button
                        className="action-btn delete-btn"
                        onClick={() => deleteApplication(application.id)}
                        title="Delete"
                      >
                        <FaTrash />
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
                    className="modal-btn approve-btn"
                    onClick={() => {
                      updateApplicationStatus(selectedApplication.id, 'approved');
                      setShowModal(false);
                    }}
                  >
                    <FaCheck /> Approve
                  </button>
                )}
                {selectedApplication.status !== 'rejected' && (
                  <button
                    className="modal-btn reject-btn"
                    onClick={() => {
                      updateApplicationStatus(selectedApplication.id, 'rejected');
                      setShowModal(false);
                    }}
                  >
                    <FaTimes /> Reject
                  </button>
                )}
                <button
                  className="modal-btn delete-btn"
                  onClick={() => {
                    deleteApplication(selectedApplication.id);
                    setShowModal(false);
                  }}
                >
                  <FaTrash /> Delete
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
