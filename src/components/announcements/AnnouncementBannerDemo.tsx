import React, { useState, useEffect } from 'react';
import { FaBullhorn, FaPlus, FaToggleOn, FaToggleOff } from 'react-icons/fa';
import { AnnouncementService, Announcement } from '../../services/announcementService';
import AnnouncementBanner from './AnnouncementBanner';
import './AnnouncementBannerDemo.css';

const AnnouncementBannerDemo: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showBanner, setShowBanner] = useState(true);

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      setIsLoading(true);
      const data = await AnnouncementService.getAnnouncements();
      setAnnouncements(data);
    } catch (error) {
      console.error('Error loading announcements:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createSampleAnnouncement = async () => {
    try {
      const sampleAnnouncement = {
        title: 'Welcome to Our Platform!',
        content: 'This is a sample announcement banner that slides across the top of the website.',
        type: 'info' as const,
        priority: 'normal' as const,
        isActive: true,
        startDate: new Date(),
        targetAudience: 'all' as const,
        displaySettings: {
          showOnHomepage: true,
          showOnPortal: true,
          showOnMobile: true,
          autoScroll: true,
          scrollSpeed: 'normal' as const,
          fontSize: 'medium' as const
        },
        clickAction: {
          type: 'none' as const
        },
        createdBy: 'demo-user'
      };

      await AnnouncementService.createAnnouncement(sampleAnnouncement);
      await loadAnnouncements();
    } catch (error) {
      console.error('Error creating sample announcement:', error);
    }
  };

  const toggleAnnouncementStatus = async (id: string, currentStatus: boolean) => {
    try {
      await AnnouncementService.toggleAnnouncementStatus(id, !currentStatus);
      await loadAnnouncements();
    } catch (error) {
      console.error('Error toggling announcement status:', error);
    }
  };

  return (
    <div className="announcement-banner-demo">
      <div className="demo-header">
        <h2>
          <FaBullhorn />
          Announcement Banner Demo
        </h2>
        <p>This demo shows how the announcement banner works across your website.</p>
      </div>

      <div className="demo-controls">
        <button 
          className="demo-btn demo-toggle"
          onClick={() => setShowBanner(!showBanner)}
        >
          {showBanner ? <FaToggleOn /> : <FaToggleOff />}
          {showBanner ? 'Hide Banner' : 'Show Banner'}
        </button>
        
        <button 
          className="demo-btn demo-create"
          onClick={createSampleAnnouncement}
          disabled={isLoading}
        >
          <FaPlus />
          Create Sample Announcement
        </button>
      </div>

      <div className="demo-announcements">
        <h3>Current Announcements</h3>
        {isLoading ? (
          <p>Loading announcements...</p>
        ) : announcements.length === 0 ? (
          <p>No announcements found. Create a sample announcement to see the banner in action!</p>
        ) : (
          <div className="announcements-list">
            {announcements.map(announcement => (
              <div key={announcement.id} className="announcement-item">
                <div className="announcement-info">
                  <h4>{announcement.title}</h4>
                  <p>{announcement.content}</p>
                  <div className="announcement-meta">
                    <span className={`status ${announcement.isActive ? 'active' : 'inactive'}`}>
                      {announcement.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <span className="type">{announcement.type}</span>
                    <span className="priority">{announcement.priority}</span>
                  </div>
                </div>
                <div className="announcement-actions">
                  <button
                    className="action-btn"
                    onClick={() => toggleAnnouncementStatus(announcement.id, announcement.isActive)}
                    title={announcement.isActive ? 'Deactivate' : 'Activate'}
                  >
                    {announcement.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="demo-instructions">
        <h3>How to Use</h3>
        <ol>
          <li>Create a sample announcement using the button above</li>
          <li>The banner will automatically appear at the top of the page</li>
          <li>Toggle announcements on/off to control visibility</li>
          <li>Users can dismiss announcements by clicking the X button</li>
          <li>Announcements can have different types, priorities, and target audiences</li>
          <li>All interactions are saved to Firebase automatically</li>
        </ol>
      </div>

      {/* Show the banner if enabled */}
      {showBanner && (
        <AnnouncementBanner 
          showOnHomepage={true}
          showOnPortal={true}
          showOnMobile={true}
          className="demo-banner"
        />
      )}
    </div>
  );
};

export default AnnouncementBannerDemo;
