import React, { useState, useEffect, useCallback } from 'react';
import { 
  FaCheck, 
  FaTimes, 
  FaEye, 
  FaSearch, 
  FaFilter,
  FaSync
} from 'react-icons/fa';
import { VerificationService } from '../../../services/verificationService';
import { VerificationStatus, VerificationStep } from '../../../types/verification';
import { VerificationStatusBadge } from '../../verification';
import './MentorVerificationPanel.css';

interface MentorProfile {
  uid: string;
  firstName: string;
  lastName: string;
  email: string;
  profession: string;
  linkedin: string;
  verification: {
    status: VerificationStatus;
    currentStep: VerificationStep;
    submittedAt: Date;
    lastUpdated: Date;
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

export const MentorVerificationPanel: React.FC = () => {
  const [mentors, setMentors] = useState<MentorProfile[]>([]);
  const [filteredMentors, setFilteredMentors] = useState<MentorProfile[]>([]);
  const [stats, setStats] = useState<VerificationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<VerificationStatus | 'all'>('all');
  const [selectedMentor, setSelectedMentor] = useState<MentorProfile | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const filterMentors = useCallback(() => {
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
  }, [mentors, searchTerm, statusFilter]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterMentors();
  }, [filterMentors]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [mentorsData, statsData] = await Promise.all([
        VerificationService.getAllMentors(),
        VerificationService.getVerificationStats()
      ]);
      
      setMentors(mentorsData);
      setStats(statsData);
    } catch (err) {
      setError('Failed to load verification data');
      console.error('Error loading verification data:', err);
    } finally {
      setLoading(false);
    }
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
          await VerificationService.moveToUnderReview(mentorUid, currentUser, 'final_review', notes);
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

  if (loading) {
    return (
      <div className="mentor-verification-panel">
      <div className="mentor-verification-panel__loading">
        <FaSync className="spinning" />
        <span>Loading verification data...</span>
      </div>
      </div>
    );
  }

  return (
    <div className="mentor-verification-panel">
      <div className="mentor-verification-panel__header">
        <h2>Mentor Verification Management</h2>
        <button 
          className="mentor-verification-panel__refresh-btn"
          onClick={loadData}
          disabled={loading}
        >
          <FaSync className={loading ? 'spinning' : ''} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="mentor-verification-panel__error">
          {error}
        </div>
      )}

      {/* Stats Overview */}
      {stats && (
        <div className="mentor-verification-panel__stats">
          <div className="mentor-verification-panel__stat">
            <div className="mentor-verification-panel__stat-number">{stats.total}</div>
            <div className="mentor-verification-panel__stat-label">Total Mentors</div>
          </div>
          <div className="mentor-verification-panel__stat">
            <div className="mentor-verification-panel__stat-number">{stats.pending}</div>
            <div className="mentor-verification-panel__stat-label">Pending</div>
          </div>
          <div className="mentor-verification-panel__stat">
            <div className="mentor-verification-panel__stat-number">{stats.underReview}</div>
            <div className="mentor-verification-panel__stat-label">Under Review</div>
          </div>
          <div className="mentor-verification-panel__stat">
            <div className="mentor-verification-panel__stat-number">{stats.approved}</div>
            <div className="mentor-verification-panel__stat-label">Approved</div>
          </div>
          <div className="mentor-verification-panel__stat">
            <div className="mentor-verification-panel__stat-number">{stats.rejected}</div>
            <div className="mentor-verification-panel__stat-label">Rejected</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mentor-verification-panel__filters">
        <div className="mentor-verification-panel__search">
          <FaSearch className="mentor-verification-panel__search-icon" />
          <input
            type="text"
            placeholder="Search mentors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mentor-verification-panel__search-input"
          />
        </div>
        
        <div className="mentor-verification-panel__status-filter">
          <FaFilter className="mentor-verification-panel__filter-icon" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as VerificationStatus | 'all')}
            className="mentor-verification-panel__status-select"
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
      <div className="mentor-verification-panel__list">
        {filteredMentors.length === 0 ? (
          <div className="mentor-verification-panel__empty">
            No mentors found matching your criteria.
          </div>
        ) : (
          filteredMentors.map((mentor) => (
            <div key={mentor.uid} className="mentor-verification-panel__mentor-card">
              <div className="mentor-verification-panel__mentor-info">
                <div className="mentor-verification-panel__mentor-name">
                  {mentor.firstName} {mentor.lastName}
                </div>
                <div className="mentor-verification-panel__mentor-details">
                  <span className="mentor-verification-panel__mentor-email">{mentor.email}</span>
                  <span className="mentor-verification-panel__mentor-profession">{mentor.profession}</span>
                </div>
                <div className="mentor-verification-panel__mentor-dates">
                  <span>Submitted: {mentor.verification.submittedAt.toLocaleDateString()}</span>
                  <span>Updated: {mentor.verification.lastUpdated.toLocaleDateString()}</span>
                </div>
              </div>
              
              <div className="mentor-verification-panel__mentor-actions">
                <VerificationStatusBadge 
                  status={mentor.verification.status} 
                  size="small" 
                />
                
                <div className="mentor-verification-panel__action-buttons">
                  <button
                    className="mentor-verification-panel__action-btn mentor-verification-panel__action-btn--view"
                    onClick={() => setSelectedMentor(mentor)}
                    title="View Details"
                  >
                    <FaEye />
                  </button>
                  
                  {mentor.verification.status === 'pending' && (
                    <button
                      className="mentor-verification-panel__action-btn mentor-verification-panel__action-btn--review"
                      onClick={() => handleVerificationAction(mentor.uid, 'move_to_review')}
                      disabled={actionLoading === mentor.uid}
                      title="Move to Review"
                    >
                      <FaEye />
                    </button>
                  )}
                  
                  {mentor.verification.status === 'under_review' && (
                    <>
                      <button
                        className="mentor-verification-panel__action-btn mentor-verification-panel__action-btn--approve"
                        onClick={() => handleVerificationAction(mentor.uid, 'approve')}
                        disabled={actionLoading === mentor.uid}
                        title="Approve"
                      >
                        <FaCheck />
                      </button>
                      <button
                        className="mentor-verification-panel__action-btn mentor-verification-panel__action-btn--reject"
                        onClick={() => handleVerificationAction(mentor.uid, 'reject', undefined, 'Insufficient qualifications')}
                        disabled={actionLoading === mentor.uid}
                        title="Reject"
                      >
                        <FaTimes />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Mentor Details Modal */}
      {selectedMentor && (
        <div className="mentor-verification-panel__modal">
          <div className="mentor-verification-panel__modal-content">
            <div className="mentor-verification-panel__modal-header">
              <h3>{selectedMentor.firstName} {selectedMentor.lastName}</h3>
              <button 
                className="mentor-verification-panel__modal-close"
                onClick={() => setSelectedMentor(null)}
              >
                ×
              </button>
            </div>
            
            <div className="mentor-verification-panel__modal-body">
              <div className="mentor-verification-panel__modal-section">
                <h4>Contact Information</h4>
                <p><strong>Email:</strong> {selectedMentor.email}</p>
                <p><strong>LinkedIn:</strong> {selectedMentor.linkedin}</p>
              </div>
              
              <div className="mentor-verification-panel__modal-section">
                <h4>Verification Status</h4>
                <VerificationStatusBadge status={selectedMentor.verification.status} />
                <p><strong>Current Step:</strong> {selectedMentor.verification.currentStep}</p>
                <p><strong>Submitted:</strong> {selectedMentor.verification.submittedAt.toLocaleString()}</p>
                <p><strong>Last Updated:</strong> {selectedMentor.verification.lastUpdated.toLocaleString()}</p>
              </div>
              
              <div className="mentor-verification-panel__modal-actions">
                {selectedMentor.verification.status === 'pending' && (
                  <button
                    className="mentor-verification-panel__modal-btn mentor-verification-panel__modal-btn--primary"
                    onClick={() => handleVerificationAction(selectedMentor.uid, 'move_to_review')}
                    disabled={actionLoading === selectedMentor.uid}
                  >
                    Move to Review
                  </button>
                )}
                
                {selectedMentor.verification.status === 'under_review' && (
                  <>
                    <button
                      className="mentor-verification-panel__modal-btn mentor-verification-panel__modal-btn--success"
                      onClick={() => handleVerificationAction(selectedMentor.uid, 'approve')}
                      disabled={actionLoading === selectedMentor.uid}
                    >
                      Approve
                    </button>
                    <button
                      className="mentor-verification-panel__modal-btn mentor-verification-panel__modal-btn--danger"
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

export default MentorVerificationPanel;
