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
  FaRocket
} from 'react-icons/fa';
import { AnnouncementService, Announcement, AnnouncementAnalytics } from '../../services/announcementService';
import { useAuth } from '../../hooks/useAuth';
import BannerWrapper from '../../components/ui/BannerWrapper';
import AnnouncementModal from '../../components/announcements/AnnouncementModal';
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
          fontSize: 'medium',
          clickEffect: 'bounce',
          showIcon: true,
          iconPosition: 'left',
          showCloseButton: true
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
          fontSize: 'medium',
          clickEffect: 'bounce',
          showIcon: true,
          iconPosition: 'left',
          showCloseButton: true
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
      <BannerWrapper sectionId="announcements" className="announcement-admin-announcements">
        <div className="announcement-loading-container">
          <div className="announcement-loading-spinner">
            <FaSpinner className="announcement-spinner-icon" />
            <h2>Loading Announcements...</h2>
            <p>Setting up your announcement management workspace</p>
          </div>
        </div>
      </BannerWrapper>
    );
  }

  return (
    <BannerWrapper sectionId="announcements" className="announcement-admin-announcements">
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
      <AnnouncementModal
        isOpen={showCreateModal || showEditModal}
        isCreateMode={showCreateModal}
        isSaving={isSaving}
        formData={formData}
        onClose={() => {
          setShowCreateModal(false);
          setShowEditModal(false);
          setSelectedAnnouncement(null);
        }}
        onSave={showCreateModal ? handleCreateAnnouncement : handleUpdateAnnouncement}
        onFormDataChange={setFormData}
      />
    </BannerWrapper>
  );
};

export default AdminAnnouncements;