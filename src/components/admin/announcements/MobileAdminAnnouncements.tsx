import React, { useState, useEffect, useCallback } from 'react';
import { 
  FaBullhorn, 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaEye, 
  FaToggleOn,
  FaToggleOff,
  FaCalendarAlt,
  FaUsers,
  FaChartBar,
  FaSpinner,
  FaCheck,
  FaTimes,
  FaInfoCircle,
  FaExclamationTriangle,
  FaExclamationCircle,
  FaCheckCircle,
  FaGift,
  FaSearch,
  FaFilter,
  FaCopy,
  FaPlay,
  FaMousePointer,
  FaEye as FaViews,
  FaTimes as FaDismissals,
  FaRocket,
  FaChevronDown,
  FaChevronUp
} from 'react-icons/fa';
import { AnnouncementService, Announcement, AnnouncementAnalytics } from '../../../services/announcementService';
import { useAuth } from '../../../hooks/useAuth';
import '../../../styles/adminStyles/MobileAdminAnnouncements.css';

const MobileAdminAnnouncements: React.FC = () => {
  const { userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'announcements' | 'analytics' | 'preview'>('announcements');
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [analytics, setAnalytics] = useState<AnnouncementAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  
  // Filters and search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<Partial<Announcement>>({
    title: '',
    content: '',
    type: 'info',
    priority: 'normal',
    isActive: true,
    startDate: new Date(),
    targetAudience: 'all',
    displaySettings: {
      showOnHomepage: true,
      showOnPortal: true,
      showOnMobile: true,
      autoScroll: true,
      scrollSpeed: 'normal',
      fontSize: 'medium'
    },
    clickAction: {
      type: 'none'
    }
  });

  // Load data from Firebase
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [announcementsData, analyticsData] = await Promise.all([
        AnnouncementService.getAnnouncements(),
        AnnouncementService.getAnnouncementAnalytics()
      ]);

      setAnnouncements(announcementsData);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Error loading data:', error);
      showNotification('error', 'Failed to load announcements data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleCreateAnnouncement = async () => {
    if (!formData.title || !formData.content) {
      showNotification('error', 'Please fill in title and content');
      return;
    }

    try {
      setIsSaving(true);
      await AnnouncementService.createAnnouncement({
        title: formData.title!,
        content: formData.content!,
        type: formData.type!,
        priority: formData.priority!,
        isActive: formData.isActive!,
        startDate: formData.startDate!,
        endDate: formData.endDate,
        targetAudience: formData.targetAudience!,
        displaySettings: formData.displaySettings!,
        clickAction: formData.clickAction,
        createdBy: userProfile?.uid || ''
      });

      showNotification('success', 'Announcement created successfully!');
      setShowCreateModal(false);
      setFormData({
        title: '',
        content: '',
        type: 'info',
        priority: 'normal',
        isActive: true,
        startDate: new Date(),
        targetAudience: 'all',
        displaySettings: {
          showOnHomepage: true,
          showOnPortal: true,
          showOnMobile: true,
          autoScroll: true,
          scrollSpeed: 'normal',
          fontSize: 'medium'
        },
        clickAction: {
          type: 'none'
        }
      });
      await loadData();
    } catch (error) {
      console.error('Error creating announcement:', error);
      showNotification('error', 'Failed to create announcement');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateAnnouncement = async () => {
    if (!selectedAnnouncement || !formData.title || !formData.content) {
      showNotification('error', 'Please fill in title and content');
      return;
    }

    try {
      setIsSaving(true);
      await AnnouncementService.updateAnnouncement(selectedAnnouncement.id, {
        title: formData.title,
        content: formData.content,
        type: formData.type,
        priority: formData.priority,
        isActive: formData.isActive,
        startDate: formData.startDate,
        endDate: formData.endDate,
        targetAudience: formData.targetAudience,
        displaySettings: formData.displaySettings,
        clickAction: formData.clickAction
      });

      showNotification('success', 'Announcement updated successfully!');
      setShowEditModal(false);
      setSelectedAnnouncement(null);
      await loadData();
    } catch (error) {
      console.error('Error updating announcement:', error);
      showNotification('error', 'Failed to update announcement');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) {
      return;
    }

    try {
      await AnnouncementService.deleteAnnouncement(id);
      showNotification('success', 'Announcement deleted successfully!');
      await loadData();
    } catch (error) {
      console.error('Error deleting announcement:', error);
      showNotification('error', 'Failed to delete announcement');
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await AnnouncementService.toggleAnnouncementStatus(id, !currentStatus);
      showNotification('success', `Announcement ${!currentStatus ? 'activated' : 'deactivated'} successfully!`);
      await loadData();
    } catch (error) {
      console.error('Error toggling announcement status:', error);
      showNotification('error', 'Failed to toggle announcement status');
    }
  };

  const handleEditAnnouncement = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      type: announcement.type,
      priority: announcement.priority,
      isActive: announcement.isActive,
      startDate: announcement.startDate,
      endDate: announcement.endDate,
      targetAudience: announcement.targetAudience,
      displaySettings: announcement.displaySettings,
      clickAction: announcement.clickAction
    });
    setShowEditModal(true);
  };

  const handleDuplicateAnnouncement = (announcement: Announcement) => {
    setFormData({
      title: `${announcement.title} (Copy)`,
      content: announcement.content,
      type: announcement.type,
      priority: announcement.priority,
      isActive: false, // Start as inactive
      startDate: new Date(),
      targetAudience: announcement.targetAudience,
      displaySettings: announcement.displaySettings,
      clickAction: announcement.clickAction
    });
    setShowCreateModal(true);
  };

  const getTypeIcon = (type: Announcement['type']) => {
    switch (type) {
      case 'info': return <FaInfoCircle className="mae-type-icon info" />;
      case 'warning': return <FaExclamationTriangle className="mae-type-icon warning" />;
      case 'success': return <FaCheckCircle className="mae-type-icon success" />;
      case 'error': return <FaExclamationCircle className="mae-type-icon error" />;
      case 'promotion': return <FaGift className="mae-type-icon promotion" />;
      default: return <FaInfoCircle className="mae-type-icon info" />;
    }
  };

  const getPriorityColor = (priority: Announcement['priority']) => {
    switch (priority) {
      case 'urgent': return '#ef4444';
      case 'high': return '#f59e0b';
      case 'normal': return '#3b82f6';
      case 'low': return '#6b7280';
      default: return '#3b82f6';
    }
  };

  const filteredAnnouncements = announcements.filter(announcement => {
    const matchesSearch = announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         announcement.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || announcement.type === selectedType;
    const matchesPriority = selectedPriority === 'all' || announcement.priority === selectedPriority;
    const matchesStatus = selectedStatus === 'all' || 
                         (selectedStatus === 'active' && announcement.isActive) ||
                         (selectedStatus === 'inactive' && !announcement.isActive);
    
    return matchesSearch && matchesType && matchesPriority && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="mae-mobile-admin-announcements">
        <div className="mae-loading-container">
          <div className="mae-loading-spinner">
            <FaSpinner className="mae-spinner-icon" />
            <h2>Loading Announcements...</h2>
            <p>Setting up your announcement workspace</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mae-mobile-admin-announcements">
      {/* Notification */}
      {notification && (
        <div className={`mae-notification mae-notification-${notification.type}`}>
          <div className="mae-notification-content">
            {notification.type === 'success' && <FaCheck />}
            {notification.type === 'error' && <FaTimes />}
            {notification.type === 'info' && <FaInfoCircle />}
            <span>{notification.message}</span>
          </div>
          <button 
            className="mae-notification-close"
            onClick={() => setNotification(null)}
            title="Close notification"
          >
            <FaTimes />
          </button>
        </div>
      )}

      <div className="mae-header">
        <div className="mae-header-content">
          <h1>
            <FaRocket className="mae-title-icon" />
            Announcements
          </h1>
          <p>Manage announcement banners</p>
        </div>
        <div className="mae-header-actions">
          <button 
            className="mae-refresh-btn"
            onClick={loadData}
            disabled={isLoading}
            title="Refresh data"
          >
            <FaSpinner className={isLoading ? 'mae-spinning' : ''} />
          </button>
          <button 
            className="mae-create-btn"
            onClick={() => setShowCreateModal(true)}
            title="Create announcement"
          >
            <FaPlus />
          </button>
        </div>
      </div>

      <div className="mae-stats-grid">
        <div className="mae-stat-card">
          <div className="mae-stat-icon">
            <FaBullhorn />
          </div>
          <div className="mae-stat-content">
            <span className="mae-stat-number">{analytics?.totalAnnouncements || 0}</span>
            <span className="mae-stat-label">Total</span>
          </div>
        </div>
        <div className="mae-stat-card">
          <div className="mae-stat-icon">
            <FaPlay />
          </div>
          <div className="mae-stat-content">
            <span className="mae-stat-number">{analytics?.activeAnnouncements || 0}</span>
            <span className="mae-stat-label">Active</span>
          </div>
        </div>
        <div className="mae-stat-card">
          <div className="mae-stat-icon">
            <FaViews />
          </div>
          <div className="mae-stat-content">
            <span className="mae-stat-number">{analytics?.totalViews || 0}</span>
            <span className="mae-stat-label">Views</span>
          </div>
        </div>
        <div className="mae-stat-card">
          <div className="mae-stat-icon">
            <FaChartBar />
          </div>
          <div className="mae-stat-content">
            <span className="mae-stat-number">{analytics?.averageEngagement.toFixed(1) || 0}%</span>
            <span className="mae-stat-label">Engagement</span>
          </div>
        </div>
      </div>

      <div className="mae-tabs">
        <button 
          className={`mae-tab ${activeTab === 'announcements' ? 'active' : ''}`}
          onClick={() => setActiveTab('announcements')}
        >
          <FaBullhorn />
          <span>Announcements</span>
        </button>
        <button 
          className={`mae-tab ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <FaChartBar />
          <span>Analytics</span>
        </button>
        <button 
          className={`mae-tab ${activeTab === 'preview' ? 'active' : ''}`}
          onClick={() => setActiveTab('preview')}
        >
          <FaEye />
          <span>Preview</span>
        </button>
      </div>

      <div className="mae-content">
        {activeTab === 'announcements' && (
          <div className="mae-announcements-section">
            <div className="mae-search-filter-section">
              <div className="mae-search-container">
                <FaSearch className="mae-search-icon" />
                <input
                  type="text"
                  placeholder="Search announcements..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="mae-search-input"
                />
              </div>
              <button 
                className="mae-filter-toggle"
                onClick={() => setShowFilters(!showFilters)}
              >
                <FaFilter />
                Filters
                {showFilters ? <FaChevronUp /> : <FaChevronDown />}
              </button>
            </div>

            {showFilters && (
              <div className="mae-filters">
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="mae-filter-select"
                >
                  <option value="all">All Types</option>
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="success">Success</option>
                  <option value="error">Error</option>
                  <option value="promotion">Promotion</option>
                </select>
                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                  className="mae-filter-select"
                >
                  <option value="all">All Priorities</option>
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="normal">Normal</option>
                  <option value="low">Low</option>
                </select>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="mae-filter-select"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            )}

            <div className="mae-announcements-list">
              {filteredAnnouncements.length === 0 ? (
                <div className="mae-placeholder">
                  <FaBullhorn className="mae-placeholder-icon" />
                  <h3>No Announcements Found</h3>
                  <p>Create your first announcement to get started</p>
                  <button 
                    className="mae-create-first-btn"
                    onClick={() => setShowCreateModal(true)}
                  >
                    <FaPlus />
                    Create First Announcement
                  </button>
                </div>
              ) : (
                filteredAnnouncements.map(announcement => (
                  <div key={announcement.id} className="mae-announcement-card">
                    <div className="mae-announcement-header">
                      <div className="mae-announcement-title-section">
                        {getTypeIcon(announcement.type)}
                        <div className="mae-announcement-title">
                          <h3>{announcement.title}</h3>
                          <div className="mae-announcement-meta">
                            <span 
                              className="mae-priority-badge"
                              style={{ backgroundColor: getPriorityColor(announcement.priority) }}
                            >
                              {announcement.priority}
                            </span>
                            <span className="mae-target-audience">
                              <FaUsers />
                              {announcement.targetAudience}
                            </span>
                            <span className="mae-date">
                              <FaCalendarAlt />
                              {announcement.startDate.toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="mae-announcement-actions">
                        <button
                          className="mae-action-btn"
                          onClick={() => handleToggleStatus(announcement.id, announcement.isActive)}
                          title={announcement.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {announcement.isActive ? <FaToggleOn /> : <FaToggleOff />}
                        </button>
                        <button
                          className="mae-action-btn"
                          onClick={() => handleEditAnnouncement(announcement)}
                          title="Edit Announcement"
                        >
                          <FaEdit />
                        </button>
                        <button
                          className="mae-action-btn"
                          onClick={() => handleDuplicateAnnouncement(announcement)}
                          title="Duplicate Announcement"
                        >
                          <FaCopy />
                        </button>
                        <button
                          className="mae-action-btn mae-delete"
                          onClick={() => handleDeleteAnnouncement(announcement.id)}
                          title="Delete Announcement"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                    <div className="mae-announcement-content">
                      <p>{announcement.content}</p>
                    </div>
                    <div className="mae-announcement-footer">
                      <div className="mae-announcement-stats">
                        <span className="mae-stat">
                          <FaViews />
                          {announcement.analytics.views}
                        </span>
                        <span className="mae-stat">
                          <FaMousePointer />
                          {announcement.analytics.clicks}
                        </span>
                        <span className="mae-stat">
                          <FaDismissals />
                          {announcement.analytics.dismissals}
                        </span>
                      </div>
                      <div className="mae-announcement-status">
                        <span className={`mae-status-badge ${announcement.isActive ? 'active' : 'inactive'}`}>
                          {announcement.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="mae-analytics-section">
            <div className="mae-analytics-grid">
              <div className="mae-analytics-card">
                <div className="mae-analytics-icon">
                  <FaBullhorn />
                </div>
                <div className="mae-analytics-content">
                  <h4>Total Announcements</h4>
                  <span className="mae-analytics-number">{analytics?.totalAnnouncements || 0}</span>
                </div>
              </div>
              <div className="mae-analytics-card">
                <div className="mae-analytics-icon">
                  <FaPlay />
                </div>
                <div className="mae-analytics-content">
                  <h4>Active Announcements</h4>
                  <span className="mae-analytics-number">{analytics?.activeAnnouncements || 0}</span>
                </div>
              </div>
              <div className="mae-analytics-card">
                <div className="mae-analytics-icon">
                  <FaViews />
                </div>
                <div className="mae-analytics-content">
                  <h4>Total Views</h4>
                  <span className="mae-analytics-number">{analytics?.totalViews || 0}</span>
                </div>
              </div>
              <div className="mae-analytics-card">
                <div className="mae-analytics-icon">
                  <FaMousePointer />
                </div>
                <div className="mae-analytics-content">
                  <h4>Total Clicks</h4>
                  <span className="mae-analytics-number">{analytics?.totalClicks || 0}</span>
                </div>
              </div>
              <div className="mae-analytics-card">
                <div className="mae-analytics-icon">
                  <FaDismissals />
                </div>
                <div className="mae-analytics-content">
                  <h4>Total Dismissals</h4>
                  <span className="mae-analytics-number">{analytics?.totalDismissals || 0}</span>
                </div>
              </div>
              <div className="mae-analytics-card">
                <div className="mae-analytics-icon">
                  <FaChartBar />
                </div>
                <div className="mae-analytics-content">
                  <h4>Average Engagement</h4>
                  <span className="mae-analytics-number">{analytics?.averageEngagement.toFixed(1) || 0}%</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'preview' && (
          <div className="mae-preview-section">
            <div className="mae-preview-container">
              <div className="mae-banner-preview">
                <div className="mae-banner-content">
                  <FaBullhorn className="mae-banner-icon" />
                  <div className="mae-banner-text">
                    <span className="mae-banner-title">Welcome to our platform!</span>
                    <span className="mae-banner-message">This is how your announcements will appear to users.</span>
                  </div>
                </div>
                <button className="mae-banner-close" title="Close banner">
                  <FaTimes />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="mae-modal-overlay" onClick={() => {
          setShowCreateModal(false);
          setShowEditModal(false);
          setSelectedAnnouncement(null);
        }}>
          <div className="mae-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mae-modal-header">
              <h3>{showCreateModal ? 'Create Announcement' : 'Edit Announcement'}</h3>
              <button 
                className="mae-close-btn"
                onClick={() => {
                  setShowCreateModal(false);
                  setShowEditModal(false);
                  setSelectedAnnouncement(null);
                }}
              >
                ×
              </button>
            </div>
            
            <div className="mae-modal-content">
              <div className="mae-form-group">
                <label>Title *</label>
                <input
                  type="text"
                  value={formData.title || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter announcement title..."
                />
              </div>
              
              <div className="mae-form-group">
                <label>Content *</label>
                <textarea
                  value={formData.content || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Enter announcement content..."
                  rows={4}
                />
              </div>

              <div className="mae-form-row">
                <div className="mae-form-group">
                  <label>Type</label>
                  <select
                    value={formData.type || 'info'}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as Announcement['type'] }))}
                  >
                    <option value="info">Info</option>
                    <option value="warning">Warning</option>
                    <option value="success">Success</option>
                    <option value="error">Error</option>
                    <option value="promotion">Promotion</option>
                  </select>
                </div>
                
                <div className="mae-form-group">
                  <label>Priority</label>
                  <select
                    value={formData.priority || 'normal'}
                    onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as Announcement['priority'] }))}
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="mae-form-group">
                <label>Target Audience</label>
                <select
                  value={formData.targetAudience || 'all'}
                  onChange={(e) => setFormData(prev => ({ ...prev, targetAudience: e.target.value as Announcement['targetAudience'] }))}
                >
                  <option value="all">All Users</option>
                  <option value="users">Users Only</option>
                  <option value="mentors">Mentors Only</option>
                  <option value="admins">Admins Only</option>
                  <option value="guests">Guests Only</option>
                </select>
              </div>

              <div className="mae-form-group">
                <label className="mae-checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.isActive || false}
                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  />
                  Active (Show on website)
                </label>
              </div>
            </div>
            
            <div className="mae-modal-actions">
              <button
                className="mae-modal-btn mae-cancel"
                onClick={() => {
                  setShowCreateModal(false);
                  setShowEditModal(false);
                  setSelectedAnnouncement(null);
                }}
              >
                Cancel
              </button>
              <button
                className="mae-modal-btn mae-save"
                onClick={showCreateModal ? handleCreateAnnouncement : handleUpdateAnnouncement}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <FaSpinner className="mae-spinning" />
                    {showCreateModal ? 'Creating...' : 'Updating...'}
                  </>
                ) : (
                  showCreateModal ? 'Create Announcement' : 'Update Announcement'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileAdminAnnouncements;
