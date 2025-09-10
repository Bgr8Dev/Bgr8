import React, { useState, useEffect } from 'react';
import { 
  FaCheck, 
  FaTimes, 
  FaPause, 
  FaEye, 
  FaSearch, 
  FaFilter,
  FaDownload,
  FaRefresh,
  FaClock,
  FaUserCheck,
  FaExclamationTriangle,
  FaChartBar
} from 'react-icons/fa';
import { 
  VerificationService,
  getVerificationStats,
  getPendingMentors,
  getOverdueReviews
} from '../../services/verificationService';
import { VerificationStatus, VerificationStep } from '../../types/verification';
import { VerificationStatusBadge, VerificationProgress } from '../../components/verification';
import '../../styles/adminStyles/AdminMentorVerification.css';

interface MentorProfile {
  uid: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  profession: string;
  linkedin: string;
  calCom: string;
  skills: string[];
  industries: string[];
  verification: {
    status: VerificationStatus;
    currentStep: VerificationStep;
    submittedAt: Date;
    lastUpdated: Date;
    history: Array<{
      id: string;
      status: VerificationStatus;
      step: VerificationStep;
      timestamp: Date;
      reviewedBy?: string;
      notes?: string;
      reason?: string;
    }>;
  };
}

interface VerificationStats {
  total: number;
  pending: number;
  underReview: number;
  approved: number;
  rejected: number;
  suspended: number;
}

export const AdminMentorVerification: React.FC = () => {
  const [mentors, setMentors] = useState<MentorProfile[]>([]);
  const [filteredMentors, setFilteredMentors] = useState<MentorProfile[]>([]);
  const [stats, setStats] = useState<VerificationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<VerificationStatus | 'all'>('all');
  const [selectedMentor, setSelectedMentor] = useState<MentorProfile | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showOverdue, setShowOverdue] = useState(false);
  const [overdueMentors, setOverdueMentors] = useState<MentorProfile[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterMentors();
  }, [mentors, searchTerm, statusFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [mentorsData, statsData, overdueData] = await Promise.all([
        getPendingMentors(),
        getVerificationStats(),
        getOverdueReviews(7) // 7 days overdue
      ]);
      
      setMentors(mentorsData);
      setStats(statsData);
      setOverdueMentors(overdueData);
    } catch (err) {
      setError('Failed to load verification data');
      console.error('Error loading verification data:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterMentors = () => {
    let filtered = mentors;

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(mentor => 
        mentor.firstName.toLowerCase().includes(term) ||
        mentor.lastName.toLowerCase().includes(term) ||
        mentor.email.toLowerCase().includes(term) ||
        mentor.profession.toLowerCase().includes(term)
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(mentor => mentor.verification.status === statusFilter);
    }

    setFilteredMentors(filtered);
  };

  const handleVerificationAction = async (
    mentorUid: string, 
    action: 'approve' | 'reject' | 'suspend' | 'move_to_review',
    notes?: string,
    reason?: string
  ) => {
    try {
      setActionLoading(mentorUid);
      
      const currentUser = 'admin'; // In real app, get from auth context
      
      switch (action) {
        case 'approve':
          await VerificationService.approveMentor(mentorUid, currentUser, notes);
          break;
        case 'reject':
          if (!reason) throw new Error('Rejection reason is required');
          await VerificationService.rejectMentor(mentorUid, currentUser, reason, notes);
          break;
        case 'suspend':
          if (!reason) throw new Error('Suspension reason is required');
          await VerificationService.suspendMentor(mentorUid, currentUser, reason, notes);
          break;
        case 'move_to_review':
          await VerificationService.moveToUnderReview(mentorUid, currentUser, 'document_review', notes);
          break;
      }
      
      // Reload data
      await loadData();
      setSelectedMentor(null);
    } catch (err) {
      setError(`Failed to ${action} mentor: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusCount = (status: VerificationStatus): number => {
    if (!stats) return 0;
    switch (status) {
      case 'pending': return stats.pending;
      case 'under_review': return stats.underReview;
      case 'approved': return stats.approved;
      case 'rejected': return stats.rejected;
      case 'suspended': return stats.suspended;
      default: return 0;
    }
  };

  const exportData = () => {
    const csvData = filteredMentors.map(mentor => ({
      Name: `${mentor.firstName} ${mentor.lastName}`,
      Email: mentor.email,
      Profession: mentor.profession,
      Status: mentor.verification.status,
      'Submitted Date': mentor.verification.submittedAt.toLocaleDateString(),
      'Last Updated': mentor.verification.lastUpdated.toLocaleDateString()
    }));

    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mentor-verification-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="admin-mentor-verification">
        <div className="admin-mentor-verification__loading">
          <FaRefresh className="spinning" />
          <span>Loading verification data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-mentor-verification">
      <div className="admin-mentor-verification__header">
        <div className="admin-mentor-verification__title">
          <h2>Mentor Verification Management</h2>
          <p>Manage mentor applications and verification process</p>
        </div>
        <div className="admin-mentor-verification__actions">
          <button 
            className="admin-mentor-verification__action-btn admin-mentor-verification__action-btn--export"
            onClick={exportData}
            disabled={filteredMentors.length === 0}
          >
            <FaDownload /> Export CSV
          </button>
          <button 
            className="admin-mentor-verification__action-btn admin-mentor-verification__action-btn--refresh"
            onClick={loadData}
            disabled={loading}
          >
            <FaRefresh className={loading ? 'spinning' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="admin-mentor-verification__error">
          <FaExclamationTriangle />
          {error}
        </div>
      )}

      {/* Stats Overview */}
      {stats && (
        <div className="admin-mentor-verification__stats">
          <div className="admin-mentor-verification__stat">
            <div className="admin-mentor-verification__stat-icon">
              <FaUserCheck />
            </div>
            <div className="admin-mentor-verification__stat-content">
              <div className="admin-mentor-verification__stat-number">{stats.total}</div>
              <div className="admin-mentor-verification__stat-label">Total Mentors</div>
            </div>
          </div>
          <div className="admin-mentor-verification__stat">
            <div className="admin-mentor-verification__stat-icon">
              <FaClock />
            </div>
            <div className="admin-mentor-verification__stat-content">
              <div className="admin-mentor-verification__stat-number">{stats.pending}</div>
              <div className="admin-mentor-verification__stat-label">Pending Review</div>
            </div>
          </div>
          <div className="admin-mentor-verification__stat">
            <div className="admin-mentor-verification__stat-icon">
              <FaEye />
            </div>
            <div className="admin-mentor-verification__stat-content">
              <div className="admin-mentor-verification__stat-number">{stats.underReview}</div>
              <div className="admin-mentor-verification__stat-label">Under Review</div>
            </div>
          </div>
          <div className="admin-mentor-verification__stat">
            <div className="admin-mentor-verification__stat-icon">
              <FaCheck />
            </div>
            <div className="admin-mentor-verification__stat-content">
              <div className="admin-mentor-verification__stat-number">{stats.approved}</div>
              <div className="admin-mentor-verification__stat-label">Approved</div>
            </div>
          </div>
          <div className="admin-mentor-verification__stat">
            <div className="admin-mentor-verification__stat-icon">
              <FaTimes />
            </div>
            <div className="admin-mentor-verification__stat-content">
              <div className="admin-mentor-verification__stat-number">{stats.rejected}</div>
              <div className="admin-mentor-verification__stat-label">Rejected</div>
            </div>
          </div>
        </div>
      )}

      {/* Overdue Alerts */}
      {overdueMentors.length > 0 && (
        <div className="admin-mentor-verification__overdue-alert">
          <FaExclamationTriangle />
          <span>
            {overdueMentors.length} mentor{overdueMentors.length > 1 ? 's' : ''} have been pending for over 7 days
          </span>
          <button 
            className="admin-mentor-verification__overdue-btn"
            onClick={() => setShowOverdue(!showOverdue)}
          >
            {showOverdue ? 'Hide' : 'Show'} Details
          </button>
        </div>
      )}

      {/* Overdue Mentors List */}
      {showOverdue && overdueMentors.length > 0 && (
        <div className="admin-mentor-verification__overdue-list">
          <h3>Overdue Reviews</h3>
          {overdueMentors.map((mentor) => (
            <div key={mentor.uid} className="admin-mentor-verification__overdue-item">
              <div className="admin-mentor-verification__overdue-info">
                <span className="admin-mentor-verification__overdue-name">
                  {mentor.firstName} {mentor.lastName}
                </span>
                <span className="admin-mentor-verification__overdue-email">{mentor.email}</span>
                <span className="admin-mentor-verification__overdue-date">
                  Submitted: {mentor.verification.submittedAt.toLocaleDateString()}
                </span>
              </div>
              <div className="admin-mentor-verification__overdue-actions">
                <VerificationStatusBadge status={mentor.verification.status} size="small" />
                <button
                  className="admin-mentor-verification__overdue-action-btn"
                  onClick={() => setSelectedMentor(mentor)}
                >
                  <FaEye />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="admin-mentor-verification__filters">
        <div className="admin-mentor-verification__search">
          <FaSearch className="admin-mentor-verification__search-icon" />
          <input
            type="text"
            placeholder="Search mentors by name, email, or profession..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="admin-mentor-verification__search-input"
          />
        </div>
        
        <div className="admin-mentor-verification__status-filter">
          <FaFilter className="admin-mentor-verification__filter-icon" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as VerificationStatus | 'all')}
            className="admin-mentor-verification__status-select"
          >
            <option value="all">All Statuses ({mentors.length})</option>
            <option value="pending">Pending ({getStatusCount('pending')})</option>
            <option value="under_review">Under Review ({getStatusCount('under_review')})</option>
            <option value="approved">Approved ({getStatusCount('approved')})</option>
            <option value="rejected">Rejected ({getStatusCount('rejected')})</option>
            <option value="suspended">Suspended ({getStatusCount('suspended')})</option>
          </select>
        </div>
      </div>

      {/* Mentors List */}
      <div className="admin-mentor-verification__list">
        {filteredMentors.length === 0 ? (
          <div className="admin-mentor-verification__empty">
            <FaChartBar />
            <h3>No mentors found</h3>
            <p>No mentors match your current search criteria.</p>
          </div>
        ) : (
          filteredMentors.map((mentor) => (
            <div key={mentor.uid} className="admin-mentor-verification__mentor-card">
              <div className="admin-mentor-verification__mentor-info">
                <div className="admin-mentor-verification__mentor-header">
                  <h3 className="admin-mentor-verification__mentor-name">
                    {mentor.firstName} {mentor.lastName}
                  </h3>
                  <VerificationStatusBadge 
                    status={mentor.verification.status} 
                    size="small" 
                  />
                </div>
                
                <div className="admin-mentor-verification__mentor-details">
                  <div className="admin-mentor-verification__mentor-detail">
                    <strong>Email:</strong> {mentor.email}
                  </div>
                  <div className="admin-mentor-verification__mentor-detail">
                    <strong>Profession:</strong> {mentor.profession}
                  </div>
                  <div className="admin-mentor-verification__mentor-detail">
                    <strong>Skills:</strong> {mentor.skills.slice(0, 3).join(', ')}
                    {mentor.skills.length > 3 && ` +${mentor.skills.length - 3} more`}
                  </div>
                  <div className="admin-mentor-verification__mentor-detail">
                    <strong>Industries:</strong> {mentor.industries.slice(0, 2).join(', ')}
                    {mentor.industries.length > 2 && ` +${mentor.industries.length - 2} more`}
                  </div>
                </div>
                
                <div className="admin-mentor-verification__mentor-dates">
                  <span>Submitted: {mentor.verification.submittedAt.toLocaleDateString()}</span>
                  <span>Updated: {mentor.verification.lastUpdated.toLocaleDateString()}</span>
                </div>
              </div>
              
              <div className="admin-mentor-verification__mentor-actions">
                <button
                  className="admin-mentor-verification__action-btn admin-mentor-verification__action-btn--view"
                  onClick={() => setSelectedMentor(mentor)}
                  title="View Details"
                  aria-label="View mentor details"
                >
                  <FaEye />
                </button>
                
                {mentor.verification.status === 'pending' && (
                  <button
                    className="admin-mentor-verification__action-btn admin-mentor-verification__action-btn--review"
                    onClick={() => handleVerificationAction(mentor.uid, 'move_to_review')}
                    disabled={actionLoading === mentor.uid}
                    title="Move to Review"
                    aria-label="Move mentor to review status"
                  >
                    <FaEye />
                  </button>
                )}
                
                {mentor.verification.status === 'under_review' && (
                  <>
                    <button
                      className="admin-mentor-verification__action-btn admin-mentor-verification__action-btn--approve"
                      onClick={() => handleVerificationAction(mentor.uid, 'approve')}
                      disabled={actionLoading === mentor.uid}
                      title="Approve"
                      aria-label="Approve mentor verification"
                    >
                      <FaCheck />
                    </button>
                    <button
                      className="admin-mentor-verification__action-btn admin-mentor-verification__action-btn--reject"
                      onClick={() => handleVerificationAction(mentor.uid, 'reject', undefined, 'Insufficient qualifications')}
                      disabled={actionLoading === mentor.uid}
                      title="Reject"
                      aria-label="Reject mentor verification"
                    >
                      <FaTimes />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Mentor Details Modal */}
      {selectedMentor && (
        <div className="admin-mentor-verification__modal">
          <div className="admin-mentor-verification__modal-content">
            <div className="admin-mentor-verification__modal-header">
              <h3>{selectedMentor.firstName} {selectedMentor.lastName}</h3>
              <button 
                className="admin-mentor-verification__modal-close"
                onClick={() => setSelectedMentor(null)}
              >
                ×
              </button>
            </div>
            
            <div className="admin-mentor-verification__modal-body">
              <div className="admin-mentor-verification__modal-section">
                <h4>Contact Information</h4>
                <div className="admin-mentor-verification__modal-details">
                  <div><strong>Email:</strong> {selectedMentor.email}</div>
                  <div><strong>Phone:</strong> {selectedMentor.phone}</div>
                  <div><strong>LinkedIn:</strong> 
                    <a href={selectedMentor.linkedin} target="_blank" rel="noopener noreferrer">
                      {selectedMentor.linkedin}
                    </a>
                  </div>
                  {selectedMentor.calCom && (
                    <div><strong>Cal.com:</strong> 
                      <a href={selectedMentor.calCom} target="_blank" rel="noopener noreferrer">
                        {selectedMentor.calCom}
                      </a>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="admin-mentor-verification__modal-section">
                <h4>Professional Information</h4>
                <div className="admin-mentor-verification__modal-details">
                  <div><strong>Profession:</strong> {selectedMentor.profession}</div>
                  <div><strong>Skills:</strong> {selectedMentor.skills.join(', ')}</div>
                  <div><strong>Industries:</strong> {selectedMentor.industries.join(', ')}</div>
                </div>
              </div>
              
              <div className="admin-mentor-verification__modal-section">
                <h4>Verification Status</h4>
                <VerificationProgress verificationData={selectedMentor.verification} />
              </div>
              
              <div className="admin-mentor-verification__modal-actions">
                {selectedMentor.verification.status === 'pending' && (
                  <button
                    className="admin-mentor-verification__modal-btn admin-mentor-verification__modal-btn--primary"
                    onClick={() => handleVerificationAction(selectedMentor.uid, 'move_to_review')}
                    disabled={actionLoading === selectedMentor.uid}
                  >
                    Move to Review
                  </button>
                )}
                
                {selectedMentor.verification.status === 'under_review' && (
                  <>
                    <button
                      className="admin-mentor-verification__modal-btn admin-mentor-verification__modal-btn--success"
                      onClick={() => handleVerificationAction(selectedMentor.uid, 'approve')}
                      disabled={actionLoading === selectedMentor.uid}
                    >
                      Approve
                    </button>
                    <button
                      className="admin-mentor-verification__modal-btn admin-mentor-verification__modal-btn--danger"
                      onClick={() => handleVerificationAction(selectedMentor.uid, 'reject', undefined, 'Insufficient qualifications')}
                      disabled={actionLoading === selectedMentor.uid}
                    >
                      Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMentorVerification;
