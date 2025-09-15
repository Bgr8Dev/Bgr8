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
  FaCopy,
  FaPlay,
  FaMousePointer,
  FaEye as FaViews,
  FaTimes as FaDismissals,
  FaRocket,
  FaPalette,
  FaCog
} from 'react-icons/fa';
import { AnnouncementService, Announcement, AnnouncementAnalytics } from '../../services/announcementService';
import { useAuth } from '../../hooks/useAuth';
import '../../styles/adminStyles/AdminAnnouncements.css';

const AdminAnnouncements: React.FC = () => {
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
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
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
      case 'info': return <FaInfoCircle className="announcement-type-icon info" />;
      case 'warning': return <FaExclamationTriangle className="announcement-type-icon warning" />;
      case 'success': return <FaCheckCircle className="announcement-type-icon success" />;
      case 'error': return <FaExclamationCircle className="announcement-type-icon error" />;
      case 'promotion': return <FaGift className="announcement-type-icon promotion" />;
      default: return <FaInfoCircle className="announcement-type-icon info" />;
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
      <div className="announcement-admin-announcements">
        <div className="announcement-loading-container">
          <div className="announcement-loading-spinner">
            <FaSpinner className="announcement-spinner-icon" />
            <h2>Loading Announcements...</h2>
            <p>Setting up your announcement management workspace</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="announcement-admin-announcements">
      {/* Notification */}
      {notification && (
        <div className={`announcement-notification announcement-notification-${notification.type}`}>
          <div className="announcement-notification-content">
            {notification.type === 'success' && <FaCheck />}
            {notification.type === 'error' && <FaTimes />}
            {notification.type === 'info' && <FaInfoCircle />}
            <span>{notification.message}</span>
          </div>
          <button 
            className="announcement-notification-close"
            onClick={() => setNotification(null)}
            title="Close notification"
          >
            <FaTimes />
          </button>
        </div>
      )}

      <div className="announcement-announcements-header">
        <div className="announcement-announcements-header-content">
          <div className="announcement-header-title">
            <h1>
              <FaRocket className="announcement-title-icon" />
              Announcement Management
            </h1>
            <p>Create and manage announcement banners for your website</p>
          </div>
          <div className="announcement-header-actions">
            <button 
              className="announcement-refresh-btn"
              onClick={loadData}
              disabled={isLoading}
            >
              <FaSpinner className={isLoading ? 'announcement-spinning' : ''} />
              Refresh
            </button>
            <button 
              className="announcement-create-btn"
              onClick={() => setShowCreateModal(true)}
            >
              <FaPlus />
              Create Announcement
            </button>
          </div>
        </div>
        <div className="announcement-announcements-header-stats">
          <div className="announcement-stat-item announcement-stat-total">
            <div className="announcement-stat-icon">
              <FaBullhorn />
            </div>
            <div className="announcement-stat-content">
              <span className="announcement-stat-number">{analytics?.totalAnnouncements || 0}</span>
              <span className="announcement-stat-label">Total</span>
            </div>
          </div>
          <div className="announcement-stat-item announcement-stat-active">
            <div className="announcement-stat-icon">
              <FaPlay />
            </div>
            <div className="announcement-stat-content">
              <span className="announcement-stat-number">{analytics?.activeAnnouncements || 0}</span>
              <span className="announcement-stat-label">Active</span>
            </div>
          </div>
          <div className="announcement-stat-item announcement-stat-views">
            <div className="announcement-stat-icon">
              <FaViews />
            </div>
            <div className="announcement-stat-content">
              <span className="announcement-stat-number">{analytics?.totalViews || 0}</span>
              <span className="announcement-stat-label">Views</span>
            </div>
          </div>
          <div className="announcement-stat-item announcement-stat-engagement">
            <div className="announcement-stat-icon">
              <FaChartBar />
            </div>
            <div className="announcement-stat-content">
              <span className="announcement-stat-number">{analytics?.averageEngagement.toFixed(1) || 0}%</span>
              <span className="announcement-stat-label">Engagement</span>
            </div>
          </div>
        </div>
      </div>

      <div className="announcement-announcements-tabs">
        <button 
          className={`announcement-announcements-tab ${activeTab === 'announcements' ? 'active' : ''}`}
          onClick={() => setActiveTab('announcements')}
        >
          <FaBullhorn />
          <span>Announcements</span>
          <div className="announcement-tab-badge">{announcements.length}</div>
          <div className="announcement-tab-indicator"></div>
        </button>
        <button 
          className={`announcement-announcements-tab ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <FaChartBar />
          <span>Analytics</span>
          <div className="announcement-tab-indicator"></div>
        </button>
        <button 
          className={`announcement-announcements-tab ${activeTab === 'preview' ? 'active' : ''}`}
          onClick={() => setActiveTab('preview')}
        >
          <FaEye />
          <span>Preview</span>
          <div className="announcement-tab-indicator"></div>
        </button>
      </div>

      <div className="announcement-announcements-content">
        {activeTab === 'announcements' && (
          <div className="announcement-announcements-section">
            <div className="announcement-announcements-header">
              <div className="announcement-announcements-controls">
                <div className="announcement-search-box">
                  <FaSearch />
                  <input
                    type="text"
                    placeholder="Search announcements..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="announcement-type-filter"
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
                  className="announcement-priority-filter"
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
                  className="announcement-status-filter"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="announcement-announcements-grid">
              {filteredAnnouncements.length === 0 ? (
                <div className="announcement-announcements-placeholder">
                  <FaBullhorn className="announcement-placeholder-icon" />
                  <h3>No Announcements Found</h3>
                  <p>Create your first announcement to get started</p>
                  <button 
                    className="announcement-create-first-btn"
                    onClick={() => setShowCreateModal(true)}
                  >
                    <FaPlus />
                    Create First Announcement
                  </button>
                </div>
              ) : (
                filteredAnnouncements.map(announcement => (
                  <div key={announcement.id} className="announcement-announcement-card">
                    <div className="announcement-announcement-header">
                      <div className="announcement-announcement-title-section">
                        {getTypeIcon(announcement.type)}
                        <div className="announcement-announcement-title">
                          <h3>{announcement.title}</h3>
                          <div className="announcement-announcement-meta">
                            <span 
                              className="announcement-priority-badge"
                              style={{ backgroundColor: getPriorityColor(announcement.priority) }}
                            >
                              {announcement.priority}
                            </span>
                            <span className="announcement-target-audience">
                              <FaUsers />
                              {announcement.targetAudience}
                            </span>
                            <span className="announcement-date">
                              <FaCalendarAlt />
                              {announcement.startDate.toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="announcement-announcement-actions">
                        <button
                          className="announcement-announcement-action-btn"
                          onClick={() => handleToggleStatus(announcement.id, announcement.isActive)}
                          title={announcement.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {announcement.isActive ? <FaToggleOn /> : <FaToggleOff />}
                        </button>
                        <button
                          className="announcement-announcement-action-btn"
                          onClick={() => handleEditAnnouncement(announcement)}
                          title="Edit Announcement"
                        >
                          <FaEdit />
                        </button>
                        <button
                          className="announcement-announcement-action-btn"
                          onClick={() => handleDuplicateAnnouncement(announcement)}
                          title="Duplicate Announcement"
                        >
                          <FaCopy />
                        </button>
                        <button
                          className="announcement-announcement-action-btn announcement-delete"
                          onClick={() => handleDeleteAnnouncement(announcement.id)}
                          title="Delete Announcement"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                    <div className="announcement-announcement-content">
                      <p>{announcement.content}</p>
                    </div>
                    <div className="announcement-announcement-footer">
                      <div className="announcement-announcement-stats">
                        <span className="announcement-stat">
                          <FaViews />
                          {announcement.analytics.views}
                        </span>
                        <span className="announcement-stat">
                          <FaMousePointer />
                          {announcement.analytics.clicks}
                        </span>
                        <span className="announcement-stat">
                          <FaDismissals />
                          {announcement.analytics.dismissals}
                        </span>
                      </div>
                      <div className="announcement-announcement-status">
                        <span className={`announcement-status-badge ${announcement.isActive ? 'active' : 'inactive'}`}>
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
          <div className="announcement-analytics-section">
            <div className="announcement-analytics-header">
              <h3>Announcement Analytics</h3>
              <p>Track performance and engagement of your announcements</p>
            </div>
            <div className="announcement-analytics-grid">
              <div className="announcement-analytics-card announcement-analytics-total">
                <div className="announcement-analytics-icon">
                  <FaBullhorn />
                </div>
                <div className="announcement-analytics-content">
                  <h4>Total Announcements</h4>
                  <span className="announcement-analytics-number">{analytics?.totalAnnouncements || 0}</span>
                </div>
              </div>
              <div className="announcement-analytics-card announcement-analytics-active">
                <div className="announcement-analytics-icon">
                  <FaPlay />
                </div>
                <div className="announcement-analytics-content">
                  <h4>Active Announcements</h4>
                  <span className="announcement-analytics-number">{analytics?.activeAnnouncements || 0}</span>
                </div>
              </div>
              <div className="announcement-analytics-card announcement-analytics-views">
                <div className="announcement-analytics-icon">
                  <FaViews />
                </div>
                <div className="announcement-analytics-content">
                  <h4>Total Views</h4>
                  <span className="announcement-analytics-number">{analytics?.totalViews || 0}</span>
                </div>
              </div>
              <div className="announcement-analytics-card announcement-analytics-clicks">
                <div className="announcement-analytics-icon">
                  <FaMousePointer />
                </div>
                <div className="announcement-analytics-content">
                  <h4>Total Clicks</h4>
                  <span className="announcement-analytics-number">{analytics?.totalClicks || 0}</span>
                </div>
              </div>
              <div className="announcement-analytics-card announcement-analytics-dismissals">
                <div className="announcement-analytics-icon">
                  <FaDismissals />
                </div>
                <div className="announcement-analytics-content">
                  <h4>Total Dismissals</h4>
                  <span className="announcement-analytics-number">{analytics?.totalDismissals || 0}</span>
                </div>
              </div>
              <div className="announcement-analytics-card announcement-analytics-engagement">
                <div className="announcement-analytics-icon">
                  <FaChartBar />
                </div>
                <div className="announcement-analytics-content">
                  <h4>Average Engagement</h4>
                  <span className="announcement-analytics-number">{analytics?.averageEngagement.toFixed(1) || 0}%</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'preview' && (
          <div className="announcement-preview-section">
            <div className="announcement-preview-header">
              <h3>Announcement Preview</h3>
              <p>Preview how your announcements will appear on the website</p>
            </div>
            <div className="announcement-preview-container">
              <div className="announcement-banner-preview">
                <div className="announcement-banner-content">
                  <FaBullhorn className="announcement-banner-icon" />
                  <div className="announcement-banner-text">
                    <span className="announcement-banner-title">Welcome to our platform!</span>
                    <span className="announcement-banner-message">This is how your announcements will appear to users.</span>
                  </div>
                </div>
                <button className="announcement-banner-close" title="Close banner">
                  <FaTimes />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="announcement-modal-overlay" onClick={() => {
          setShowCreateModal(false);
          setShowEditModal(false);
          setSelectedAnnouncement(null);
        }}>
          <div className="announcement-modal" onClick={(e) => e.stopPropagation()}>
            <div className="announcement-modal-header">
              <h3>{showCreateModal ? 'Create Announcement' : 'Edit Announcement'}</h3>
              <button 
                className="announcement-close-btn"
                onClick={() => {
                  setShowCreateModal(false);
                  setShowEditModal(false);
                  setSelectedAnnouncement(null);
                }}
              >
                ×
              </button>
            </div>
            
            <div className="announcement-modal-content">
              {/* Basic Information Section */}
              <div className="announcement-form-section">
                <h3 className="announcement-form-section-title">
                  <FaInfoCircle />
                  Basic Information
                </h3>
                
                <div className="announcement-form-group">
                  <label>Title *</label>
                  <input
                    type="text"
                    value={formData.title || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter announcement title..."
                  />
                </div>
                
                <div className="announcement-form-group">
                  <label>Content *</label>
                  <textarea
                    value={formData.content || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Enter announcement content..."
                    rows={4}
                  />
                </div>

                <div className="announcement-form-row">
                  <div className="announcement-form-group">
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
                  
                  <div className="announcement-form-group">
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

                <div className="announcement-form-row">
                  <div className="announcement-form-group">
                    <label>Start Date</label>
                    <input
                      type="datetime-local"
                      value={formData.startDate ? new Date(formData.startDate.getTime() - formData.startDate.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, startDate: new Date(e.target.value) }))}
                    />
                  </div>
                  
                  <div className="announcement-form-group">
                    <label>End Date (Optional)</label>
                    <input
                      type="datetime-local"
                      value={formData.endDate ? new Date(formData.endDate.getTime() - formData.endDate.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value ? new Date(e.target.value) : undefined }))}
                    />
                  </div>
                </div>

                <div className="announcement-form-group">
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

                <div className="announcement-form-group">
                  <label className="announcement-checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.isActive || false}
                      onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                    />
                    Active (Show on website)
                  </label>
                </div>
              </div>

              {/* Display Settings Section */}
              <div className="announcement-form-section">
                <h3 className="announcement-form-section-title">
                  <FaEye />
                  Display Settings
                </h3>

                <div className="announcement-form-row">
                  <div className="announcement-form-group">
                    <label>Display Mode</label>
                    <select
                      value={formData.displaySettings?.displayMode || 'title-and-content'}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        displaySettings: { 
                          ...prev.displaySettings, 
                          displayMode: e.target.value as Announcement['displaySettings']['displayMode']
                        }
                      }))}
                    >
                      <option value="title-only">Title Only</option>
                      <option value="content-only">Content Only</option>
                      <option value="title-and-content">Title + Content</option>
                      <option value="custom">Custom Text</option>
                    </select>
                  </div>
                  
                  <div className="announcement-form-group">
                    <label>Text Alignment</label>
                    <select
                      value={formData.displaySettings?.textAlign || 'left'}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        displaySettings: { 
                          ...prev.displaySettings, 
                          textAlign: e.target.value as Announcement['displaySettings']['textAlign']
                        }
                      }))}
                    >
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                      <option value="right">Right</option>
                    </select>
                  </div>
                </div>

                {formData.displaySettings?.displayMode === 'custom' && (
                  <div className="announcement-form-group">
                    <label>Custom Display Text</label>
                    <input
                      type="text"
                      value={formData.displaySettings?.customDisplayText || ''}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        displaySettings: { 
                          ...prev.displaySettings, 
                          customDisplayText: e.target.value
                        }
                      }))}
                      placeholder="Enter custom text to display..."
                    />
                  </div>
                )}

                <div className="announcement-form-row">
                  <div className="announcement-form-group">
                    <label>Font Size</label>
                    <select
                      value={formData.displaySettings?.fontSize || 'medium'}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        displaySettings: { 
                          ...prev.displaySettings, 
                          fontSize: e.target.value as Announcement['displaySettings']['fontSize']
                        }
                      }))}
                    >
                      <option value="small">Small</option>
                      <option value="medium">Medium</option>
                      <option value="large">Large</option>
                      <option value="extra-large">Extra Large</option>
                    </select>
                  </div>
                  
                  <div className="announcement-form-group">
                    <label>Font Weight</label>
                    <select
                      value={formData.displaySettings?.fontWeight || 'medium'}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        displaySettings: { 
                          ...prev.displaySettings, 
                          fontWeight: e.target.value as Announcement['displaySettings']['fontWeight']
                        }
                      }))}
                    >
                      <option value="normal">Normal</option>
                      <option value="medium">Medium</option>
                      <option value="semibold">Semi Bold</option>
                      <option value="bold">Bold</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Colors & Styling Section */}
              <div className="announcement-form-section">
                <h3 className="announcement-form-section-title">
                  <FaPalette />
                  Colors & Styling
                </h3>

                <div className="announcement-form-row">
                  <div className="announcement-form-group">
                    <label>Background Color</label>
                    <div className="announcement-color-input">
                      <input
                        type="color"
                        value={formData.displaySettings?.backgroundColor || '#3b82f6'}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          displaySettings: { 
                            ...prev.displaySettings, 
                            backgroundColor: e.target.value
                          }
                        }))}
                      />
                      <input
                        type="text"
                        value={formData.displaySettings?.backgroundColor || '#3b82f6'}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          displaySettings: { 
                            ...prev.displaySettings, 
                            backgroundColor: e.target.value
                          }
                        }))}
                        placeholder="#3b82f6"
                      />
                    </div>
                  </div>
                  
                  <div className="announcement-form-group">
                    <label>Text Color</label>
                    <div className="announcement-color-input">
                      <input
                        type="color"
                        value={formData.displaySettings?.textColor || '#ffffff'}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          displaySettings: { 
                            ...prev.displaySettings, 
                            textColor: e.target.value
                          }
                        }))}
                      />
                      <input
                        type="text"
                        value={formData.displaySettings?.textColor || '#ffffff'}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          displaySettings: { 
                            ...prev.displaySettings, 
                            textColor: e.target.value
                          }
                        }))}
                        placeholder="#ffffff"
                      />
                    </div>
                  </div>
                </div>

                <div className="announcement-form-row">
                  <div className="announcement-form-group">
                    <label>Accent Color (Optional)</label>
                    <div className="announcement-color-input">
                      <input
                        type="color"
                        value={formData.displaySettings?.accentColor || '#60a5fa'}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          displaySettings: { 
                            ...prev.displaySettings, 
                            accentColor: e.target.value
                          }
                        }))}
                      />
                      <input
                        type="text"
                        value={formData.displaySettings?.accentColor || '#60a5fa'}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          displaySettings: { 
                            ...prev.displaySettings, 
                            accentColor: e.target.value
                          }
                        }))}
                        placeholder="#60a5fa"
                      />
                    </div>
                  </div>
                  
                  <div className="announcement-form-group">
                    <label>Border Color (Optional)</label>
                    <div className="announcement-color-input">
                      <input
                        type="color"
                        value={formData.displaySettings?.borderColor || ''}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          displaySettings: { 
                            ...prev.displaySettings, 
                            borderColor: e.target.value
                          }
                        }))}
                      />
                      <input
                        type="text"
                        value={formData.displaySettings?.borderColor || ''}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          displaySettings: { 
                            ...prev.displaySettings, 
                            borderColor: e.target.value
                          }
                        }))}
                        placeholder="Leave empty for no border"
                      />
                    </div>
                  </div>
                </div>

                <div className="announcement-form-row">
                  <div className="announcement-form-group">
                    <label>Border Radius</label>
                    <select
                      value={formData.displaySettings?.borderRadius || 'medium'}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        displaySettings: { 
                          ...prev.displaySettings, 
                          borderRadius: e.target.value as Announcement['displaySettings']['borderRadius']
                        }
                      }))}
                    >
                      <option value="none">None</option>
                      <option value="small">Small</option>
                      <option value="medium">Medium</option>
                      <option value="large">Large</option>
                      <option value="full">Fully Rounded</option>
                    </select>
                  </div>
                  
                  <div className="announcement-form-group">
                    <label>Shadow</label>
                    <select
                      value={formData.displaySettings?.shadow || 'medium'}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        displaySettings: { 
                          ...prev.displaySettings, 
                          shadow: e.target.value as Announcement['displaySettings']['shadow']
                        }
                      }))}
                    >
                      <option value="none">None</option>
                      <option value="small">Small</option>
                      <option value="medium">Medium</option>
                      <option value="large">Large</option>
                      <option value="glow">Glow</option>
                    </select>
                  </div>
                </div>

                <div className="announcement-form-row">
                  <div className="announcement-form-group">
                    <label>Padding</label>
                    <select
                      value={formData.displaySettings?.padding || 'medium'}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        displaySettings: { 
                          ...prev.displaySettings, 
                          padding: e.target.value as Announcement['displaySettings']['padding']
                        }
                      }))}
                    >
                      <option value="small">Small</option>
                      <option value="medium">Medium</option>
                      <option value="large">Large</option>
                      <option value="extra-large">Extra Large</option>
                    </select>
                  </div>
                  
                  <div className="announcement-form-group">
                    <label>Opacity</label>
                    <input
                      type="range"
                      min="0.1"
                      max="1"
                      step="0.1"
                      value={formData.displaySettings?.opacity || 1}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        displaySettings: { 
                          ...prev.displaySettings, 
                          opacity: parseFloat(e.target.value)
                        }
                      }))}
                    />
                    <span className="announcement-range-value">{(formData.displaySettings?.opacity || 1) * 100}%</span>
                  </div>
                </div>
              </div>

              {/* Animation & Effects Section */}
              <div className="announcement-form-section">
                <h3 className="announcement-form-section-title">
                  <FaRocket />
                  Animation & Effects
                </h3>

                <div className="announcement-form-row">
                  <div className="announcement-form-group">
                    <label>Entry Animation</label>
                    <select
                      value={formData.displaySettings?.animation || 'shimmer'}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        displaySettings: { 
                          ...prev.displaySettings, 
                          animation: e.target.value as Announcement['displaySettings']['animation']
                        }
                      }))}
                    >
                      <option value="none">None</option>
                      <option value="fade">Fade In</option>
                      <option value="slide">Slide Down</option>
                      <option value="bounce">Bounce In</option>
                      <option value="pulse">Pulse</option>
                      <option value="glow">Glow</option>
                      <option value="shimmer">Shimmer</option>
                    </select>
                  </div>
                  
                  <div className="announcement-form-group">
                    <label>Animation Speed</label>
                    <select
                      value={formData.displaySettings?.animationSpeed || 'normal'}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        displaySettings: { 
                          ...prev.displaySettings, 
                          animationSpeed: e.target.value as Announcement['displaySettings']['animationSpeed']
                        }
                      }))}
                    >
                      <option value="slow">Slow</option>
                      <option value="normal">Normal</option>
                      <option value="fast">Fast</option>
                    </select>
                  </div>
                </div>

                <div className="announcement-form-row">
                  <div className="announcement-form-group">
                    <label>Hover Effect</label>
                    <select
                      value={formData.displaySettings?.hoverEffect || 'glow'}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        displaySettings: { 
                          ...prev.displaySettings, 
                          hoverEffect: e.target.value as Announcement['displaySettings']['hoverEffect']
                        }
                      }))}
                    >
                      <option value="none">None</option>
                      <option value="lift">Lift</option>
                      <option value="glow">Glow</option>
                      <option value="scale">Scale</option>
                      <option value="fade">Fade</option>
                    </select>
                  </div>
                  
                  <div className="announcement-form-group">
                    <label>Click Effect</label>
                    <select
                      value={formData.displaySettings?.clickEffect || 'ripple'}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        displaySettings: { 
                          ...prev.displaySettings, 
                          clickEffect: e.target.value as Announcement['displaySettings']['clickEffect']
                        }
                      }))}
                    >
                      <option value="none">None</option>
                      <option value="ripple">Ripple</option>
                      <option value="bounce">Bounce</option>
                      <option value="shake">Shake</option>
                      <option value="glow">Glow</option>
                    </select>
                  </div>
                </div>

                <div className="announcement-form-row">
                  <div className="announcement-form-group">
                    <label>Background Pattern</label>
                    <select
                      value={formData.displaySettings?.pattern || 'none'}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        displaySettings: { 
                          ...prev.displaySettings, 
                          pattern: e.target.value as Announcement['displaySettings']['pattern']
                        }
                      }))}
                    >
                      <option value="none">None</option>
                      <option value="dots">Dots</option>
                      <option value="lines">Lines</option>
                      <option value="grid">Grid</option>
                      <option value="waves">Waves</option>
                      <option value="stars">Stars</option>
                    </select>
                  </div>
                  
                  <div className="announcement-form-group">
                    <label>Blur Effect</label>
                    <select
                      value={formData.displaySettings?.blur || 'none'}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        displaySettings: { 
                          ...prev.displaySettings, 
                          blur: e.target.value as Announcement['displaySettings']['blur']
                        }
                      }))}
                    >
                      <option value="none">None</option>
                      <option value="light">Light</option>
                      <option value="medium">Medium</option>
                      <option value="heavy">Heavy</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Scroll & Behavior Section */}
              <div className="announcement-form-section">
                <h3 className="announcement-form-section-title">
                  <FaMousePointer />
                  Scroll & Behavior
                </h3>

                <div className="announcement-form-row">
                  <div className="announcement-form-group">
                    <label>Auto Scroll</label>
                    <label className="announcement-checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.displaySettings?.autoScroll || true}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          displaySettings: { 
                            ...prev.displaySettings, 
                            autoScroll: e.target.checked
                          }
                        }))}
                      />
                      Enable auto-scrolling text
                    </label>
                  </div>
                  
                  <div className="announcement-form-group">
                    <label>Scroll Speed</label>
                    <select
                      value={formData.displaySettings?.scrollSpeed || 'normal'}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        displaySettings: { 
                          ...prev.displaySettings, 
                          scrollSpeed: e.target.value as Announcement['displaySettings']['scrollSpeed']
                        }
                      }))}
                    >
                      <option value="very-slow">Very Slow</option>
                      <option value="slow">Slow</option>
                      <option value="normal">Normal</option>
                      <option value="fast">Fast</option>
                      <option value="very-fast">Very Fast</option>
                    </select>
                  </div>
                </div>

                <div className="announcement-form-group">
                  <label>Scroll Direction</label>
                  <select
                    value={formData.displaySettings?.scrollDirection || 'left-to-right'}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      displaySettings: { 
                        ...prev.displaySettings, 
                        scrollDirection: e.target.value as Announcement['displaySettings']['scrollDirection']
                      }
                    }))}
                  >
                    <option value="left-to-right">Left to Right</option>
                    <option value="right-to-left">Right to Left</option>
                    <option value="bounce">Bounce</option>
                    <option value="alternate">Alternate</option>
                  </select>
                </div>
              </div>

              {/* Visibility & Controls Section */}
              <div className="announcement-form-section">
                <h3 className="announcement-form-section-title">
                  <FaCog />
                  Visibility & Controls
                </h3>

                <div className="announcement-form-row">
                  <div className="announcement-form-group">
                    <label>Show Icon</label>
                    <label className="announcement-checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.displaySettings?.showIcon !== false}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          displaySettings: { 
                            ...prev.displaySettings, 
                            showIcon: e.target.checked
                          }
                        }))}
                      />
                      Display announcement icon
                    </label>
                  </div>
                  
                  <div className="announcement-form-group">
                    <label>Icon Position</label>
                    <select
                      value={formData.displaySettings?.iconPosition || 'left'}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        displaySettings: { 
                          ...prev.displaySettings, 
                          iconPosition: e.target.value as Announcement['displaySettings']['iconPosition']
                        }
                      }))}
                    >
                      <option value="left">Left</option>
                      <option value="right">Right</option>
                      <option value="center">Center</option>
                      <option value="hidden">Hidden</option>
                    </select>
                  </div>
                </div>

                <div className="announcement-form-row">
                  <div className="announcement-form-group">
                    <label>Show Controls</label>
                    <label className="announcement-checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.displaySettings?.showControls !== false}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          displaySettings: { 
                            ...prev.displaySettings, 
                            showControls: e.target.checked
                          }
                        }))}
                      />
                      Show navigation controls
                    </label>
                  </div>
                  
                  <div className="announcement-form-group">
                    <label>Show Indicators</label>
                    <label className="announcement-checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.displaySettings?.showIndicators !== false}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          displaySettings: { 
                            ...prev.displaySettings, 
                            showIndicators: e.target.checked
                          }
                        }))}
                      />
                      Show dot indicators
                    </label>
                  </div>
                </div>

                <div className="announcement-form-row">
                  <div className="announcement-form-group">
                    <label>Show Close Button</label>
                    <label className="announcement-checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.displaySettings?.showCloseButton !== false}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          displaySettings: { 
                            ...prev.displaySettings, 
                            showCloseButton: e.target.checked
                          }
                        }))}
                      />
                      Allow users to dismiss
                    </label>
                  </div>
                  
                  <div className="announcement-form-group">
                    <label>Close Button Style</label>
                    <select
                      value={formData.displaySettings?.closeButtonStyle || 'default'}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        displaySettings: { 
                          ...prev.displaySettings, 
                          closeButtonStyle: e.target.value as Announcement['displaySettings']['closeButtonStyle']
                        }
                      }))}
                    >
                      <option value="default">Default</option>
                      <option value="minimal">Minimal</option>
                      <option value="prominent">Prominent</option>
                      <option value="hidden">Hidden</option>
                    </select>
                  </div>
                </div>

                <div className="announcement-form-row">
                  <div className="announcement-form-group">
                    <label>Show on Homepage</label>
                    <label className="announcement-checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.displaySettings?.showOnHomepage !== false}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          displaySettings: { 
                            ...prev.displaySettings, 
                            showOnHomepage: e.target.checked
                          }
                        }))}
                      />
                      Display on homepage
                    </label>
                  </div>
                  
                  <div className="announcement-form-group">
                    <label>Show on Admin Portal</label>
                    <label className="announcement-checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.displaySettings?.showOnPortal !== false}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          displaySettings: { 
                            ...prev.displaySettings, 
                            showOnPortal: e.target.checked
                          }
                        }))}
                      />
                      Display on admin portal
                    </label>
                  </div>
                </div>

                <div className="announcement-form-group">
                  <label>Show on Mobile</label>
                  <label className="announcement-checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.displaySettings?.showOnMobile !== false}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        displaySettings: { 
                          ...prev.displaySettings, 
                          showOnMobile: e.target.checked
                        }
                      }))}
                    />
                    Display on mobile devices
                  </label>
                </div>
              </div>
            </div>
            
            <div className="announcement-modal-actions">
              <button
                className="announcement-modal-btn announcement-cancel"
                onClick={() => {
                  setShowCreateModal(false);
                  setShowEditModal(false);
                  setSelectedAnnouncement(null);
                }}
              >
                Cancel
              </button>
              <button
                className="announcement-modal-btn announcement-save"
                onClick={showCreateModal ? handleCreateAnnouncement : handleUpdateAnnouncement}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <FaSpinner className="announcement-spinning" />
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

export default AdminAnnouncements;
