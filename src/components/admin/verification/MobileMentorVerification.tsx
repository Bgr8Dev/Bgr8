import React, { useEffect, useState } from 'react';
import { firestore } from '../../../firebase/firebase';
import { collection, query, getDocs, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { 
  FaUserCheck, 
  FaEye, 
  FaSearch,
  FaCalendarAlt,
  FaEnvelope,
  FaPhone,
  FaGraduationCap,
  FaBriefcase,
  FaCheck,
  FaTimes,
  FaSpinner
} from 'react-icons/fa';
import './MobileMentorVerification.css';

interface MentorApplication {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  university: string;
  degree: string;
  graduationYear: string;
  experience: string;
  motivation: string;
  availability: string;
  dateSubmitted: Timestamp;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: Timestamp;
  reviewNotes?: string;
}

export function MobileMentorVerification() {
  const [applications, setApplications] = useState<MentorApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedApplication, setSelectedApplication] = useState<MentorApplication | null>(null);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const applicationsRef = collection(firestore, 'mentorApplications');
      const q = query(applicationsRef);
      const querySnapshot = await getDocs(q);
      
      const applicationsData: MentorApplication[] = [];
      querySnapshot.forEach((doc) => {
        applicationsData.push({
          id: doc.id,
          ...doc.data()
        } as MentorApplication);
      });
      
      // Sort by date submitted (newest first)
      applicationsData.sort((a, b) => b.dateSubmitted.toDate().getTime() - a.dateSubmitted.toDate().getTime());
      setApplications(applicationsData);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateApplicationStatus = async (applicationId: string, status: 'approved' | 'rejected', notes?: string) => {
    try {
      setProcessing(applicationId);
      const applicationRef = doc(firestore, 'mentorApplications', applicationId);
      await updateDoc(applicationRef, {
        status,
        reviewedBy: 'Admin', // In a real app, this would be the current user
        reviewedAt: new Date(),
        reviewNotes: notes || ''
      });
      
      setApplications(prev => 
        prev.map(app => 
          app.id === applicationId 
            ? { ...app, status, reviewedBy: 'Admin', reviewedAt: Timestamp.now(), reviewNotes: notes || '' }
            : app
        )
      );
      
      setShowApplicationModal(false);
    } catch (error) {
      console.error('Error updating application status:', error);
    } finally {
      setProcessing(null);
    }
  };

  const filteredApplications = applications.filter(app => {
    const matchesFilter = filter === 'all' || app.status === filter;
    const matchesSearch = searchTerm === '' || 
      app.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.university.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'approved': return '#10b981';
      case 'rejected': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <FaSpinner />;
      case 'approved': return <FaCheck />;
      case 'rejected': return <FaTimes />;
      default: return <FaSpinner />;
    }
  };

  const formatDate = (timestamp: Timestamp) => {
    return timestamp.toDate().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="mobile-mentor-verification">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-mentor-verification">
      {/* Stats Overview */}
      <div className="verification-stats">
        <div className="stat-card total">
          <div className="stat-icon">
            <FaUserCheck />
          </div>
          <div className="stat-content">
            <h4>Total</h4>
            <p>{applications.length}</p>
          </div>
        </div>
        
        <div className="stat-card pending">
          <div className="stat-icon">
            <FaSpinner />
          </div>
          <div className="stat-content">
            <h4>Pending</h4>
            <p>{applications.filter(a => a.status === 'pending').length}</p>
          </div>
        </div>
        
        <div className="stat-card approved">
          <div className="stat-icon">
            <FaCheck />
          </div>
          <div className="stat-content">
            <h4>Approved</h4>
            <p>{applications.filter(a => a.status === 'approved').length}</p>
          </div>
        </div>
        
        <div className="stat-card rejected">
          <div className="stat-icon">
            <FaTimes />
          </div>
          <div className="stat-content">
            <h4>Rejected</h4>
            <p>{applications.filter(a => a.status === 'rejected').length}</p>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="verification-controls">
        <div className="search-container">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search applications..."
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
            { key: 'all', label: 'All', count: applications.length },
            { key: 'pending', label: 'Pending', count: applications.filter(a => a.status === 'pending').length },
            { key: 'approved', label: 'Approved', count: applications.filter(a => a.status === 'approved').length },
            { key: 'rejected', label: 'Rejected', count: applications.filter(a => a.status === 'rejected').length }
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

      {/* Applications List */}
      <div className="applications-list">
        {filteredApplications.map((application) => (
          <div 
            key={application.id} 
            className={`application-card ${application.status}`}
            onClick={() => {
              setSelectedApplication(application);
              setShowApplicationModal(true);
            }}
          >
            <div className="application-header">
              <div className="application-info">
                <h4 className="application-name">
                  {application.firstName} {application.lastName}
                </h4>
                <p className="application-email">{application.email}</p>
                <p className="application-university">
                  <FaGraduationCap />
                  {application.university} • {application.degree}
                </p>
                <p className="application-date">
                  <FaCalendarAlt />
                  Applied: {formatDate(application.dateSubmitted)}
                </p>
              </div>
              <div className="application-status">
                <span 
                  className="status-badge"
                  style={{ backgroundColor: getStatusColor(application.status) }}
                >
                  {getStatusIcon(application.status)}
                  {application.status}
                </span>
              </div>
            </div>
            
            <div className="application-content">
              <p className="application-experience">
                <FaBriefcase />
                {application.experience} years experience
              </p>
              <p className="application-motivation">
                {application.motivation.length > 100 
                  ? application.motivation.substring(0, 100) + '...' 
                  : application.motivation
                }
              </p>
            </div>
            
            <div className="application-actions">
              <button
                className="action-btn view"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedApplication(application);
                  setShowApplicationModal(true);
                }}
              >
                <FaEye />
                View Details
              </button>
              
              {application.status === 'pending' && (
                <>
                  <button
                    className="action-btn approve"
                    onClick={(e) => {
                      e.stopPropagation();
                      updateApplicationStatus(application.id, 'approved');
                    }}
                    disabled={processing === application.id}
                  >
                    {processing === application.id ? <FaSpinner className="spinning" /> : <FaCheck />}
                    Approve
                  </button>
                  
                  <button
                    className="action-btn reject"
                    onClick={(e) => {
                      e.stopPropagation();
                      updateApplicationStatus(application.id, 'rejected');
                    }}
                    disabled={processing === application.id}
                  >
                    {processing === application.id ? <FaSpinner className="spinning" /> : <FaTimes />}
                    Reject
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredApplications.length === 0 && (
        <div className="no-applications">
          <FaUserCheck className="no-applications-icon" />
          <h3>No applications found</h3>
          <p>Try adjusting your search or filter criteria</p>
        </div>
      )}

      {/* Application Detail Modal */}
      {selectedApplication && showApplicationModal && (
        <div className="application-modal-overlay" onClick={() => setShowApplicationModal(false)}>
          <div className="application-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Application Details</h3>
              <button 
                className="close-btn"
                onClick={() => setShowApplicationModal(false)}
              >
                <FaTimes />
              </button>
            </div>
            
            <div className="modal-content">
              <div className="application-detail-header">
                <div className="detail-info">
                  <h4>{selectedApplication.firstName} {selectedApplication.lastName}</h4>
                  <p className="detail-email">
                    <FaEnvelope />
                    {selectedApplication.email}
                  </p>
                  {selectedApplication.phone && (
                    <p className="detail-phone">
                      <FaPhone />
                      {selectedApplication.phone}
                    </p>
                  )}
                  <p className="detail-university">
                    <FaGraduationCap />
                    {selectedApplication.university} • {selectedApplication.degree} ({selectedApplication.graduationYear})
                  </p>
                  <p className="detail-date">
                    <FaCalendarAlt />
                    Applied: {formatDate(selectedApplication.dateSubmitted)}
                  </p>
                </div>
                <div className="detail-status">
                  <span 
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(selectedApplication.status) }}
                  >
                    {getStatusIcon(selectedApplication.status)}
                    {selectedApplication.status}
                  </span>
                </div>
              </div>
              
              <div className="application-detail-content">
                <div className="detail-section">
                  <h5>Experience</h5>
                  <p>{selectedApplication.experience} years of experience</p>
                </div>
                
                <div className="detail-section">
                  <h5>Motivation</h5>
                  <p>{selectedApplication.motivation}</p>
                </div>
                
                <div className="detail-section">
                  <h5>Availability</h5>
                  <p>{selectedApplication.availability}</p>
                </div>
              </div>
            </div>
            
            {selectedApplication.status === 'pending' && (
              <div className="modal-actions">
                <button
                  className="modal-btn approve"
                  onClick={() => updateApplicationStatus(selectedApplication.id, 'approved')}
                  disabled={processing === selectedApplication.id}
                >
                  {processing === selectedApplication.id ? <FaSpinner className="spinning" /> : <FaCheck />}
                  Approve Application
                </button>
                
                <button
                  className="modal-btn reject"
                  onClick={() => updateApplicationStatus(selectedApplication.id, 'rejected')}
                  disabled={processing === selectedApplication.id}
                >
                  {processing === selectedApplication.id ? <FaSpinner className="spinning" /> : <FaTimes />}
                  Reject Application
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
