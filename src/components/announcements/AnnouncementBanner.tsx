import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FaBullhorn, FaTimes, FaInfoCircle, FaExclamationTriangle, FaCheckCircle, FaExclamationCircle, FaGift, FaChevronLeft, FaChevronRight, FaPause, FaPlay } from 'react-icons/fa';
import { AnnouncementService, Announcement } from '../../services/announcementService';
import { useAuth } from '../../hooks/useAuth';
import '../../styles/components/AnnouncementBanner.css';

interface AnnouncementBannerProps {
  className?: string;
  showOnHomepage?: boolean;
  showOnPortal?: boolean;
  showOnMobile?: boolean;
}

const AnnouncementBanner: React.FC<AnnouncementBannerProps> = ({
  className = '',
  showOnHomepage = true,
  showOnPortal = true,
  showOnMobile = true
}) => {
  const { userProfile } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [dismissedAnnouncements, setDismissedAnnouncements] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load announcements from Firebase
  const loadAnnouncements = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const activeAnnouncements = await AnnouncementService.getActiveAnnouncements();
      
      // Filter announcements based on user role and display settings
      const filteredAnnouncements = activeAnnouncements.filter(announcement => {
        // Check if announcement should be shown based on display settings
        if (!announcement.displaySettings.showOnHomepage && showOnHomepage) return false;
        if (!announcement.displaySettings.showOnPortal && showOnPortal) return false;
        if (!announcement.displaySettings.showOnMobile && showOnMobile) return false;
        
        // Check target audience
        if (announcement.targetAudience === 'all') return true;
        if (!userProfile) return announcement.targetAudience === 'guests';
        
        switch (announcement.targetAudience) {
          case 'users':
            return userProfile.roles?.admin || userProfile.roles?.committee || userProfile.roles?.ambassador;
          case 'mentors':
            return userProfile.roles?.admin || userProfile.roles?.committee;
          case 'admins':
            return userProfile.roles?.admin;
          case 'guests':
            return !userProfile;
          default:
            return true;
        }
      });

      // Remove dismissed announcements
      const visibleAnnouncements = filteredAnnouncements.filter(
        announcement => !dismissedAnnouncements.has(announcement.id)
      );

      setAnnouncements(visibleAnnouncements);
      
      // Reset current index if it's out of bounds
      if (currentIndex >= visibleAnnouncements.length) {
        setCurrentIndex(0);
      }
    } catch (error) {
      console.error('Error loading announcements:', error);
      setError('Failed to load announcements');
    } finally {
      setIsLoading(false);
    }
  }, [userProfile, showOnHomepage, showOnPortal, showOnMobile, dismissedAnnouncements, currentIndex]);

  useEffect(() => {
    loadAnnouncements();
  }, [loadAnnouncements]);

  // Auto-advance announcements
  useEffect(() => {
    if (announcements.length <= 1 || isPaused) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % announcements.length);
    }, 5000); // Change every 5 seconds

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [announcements.length, isPaused]);

  // Record view when announcement is displayed
  useEffect(() => {
    if (announcements.length > 0 && currentIndex < announcements.length) {
      const currentAnnouncement = announcements[currentIndex];
      // Debounce view recording to avoid multiple calls
      const timeoutId = setTimeout(() => {
        AnnouncementService.recordView(currentAnnouncement.id);
      }, 1000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [announcements, currentIndex]);

  const getTypeIcon = (type: Announcement['type']) => {
    switch (type) {
      case 'info': return <FaInfoCircle className="announcement-banner-icon info" />;
      case 'warning': return <FaExclamationTriangle className="announcement-banner-icon warning" />;
      case 'success': return <FaCheckCircle className="announcement-banner-icon success" />;
      case 'error': return <FaExclamationCircle className="announcement-banner-icon error" />;
      case 'promotion': return <FaGift className="announcement-banner-icon promotion" />;
      default: return <FaBullhorn className="announcement-banner-icon info" />;
    }
  };

  const getTypeColor = (type: Announcement['type']) => {
    switch (type) {
      case 'info': return '#3b82f6';
      case 'warning': return '#f59e0b';
      case 'success': return '#10b981';
      case 'error': return '#ef4444';
      case 'promotion': return '#8b5cf6';
      default: return '#3b82f6';
    }
  };

  const handleDismiss = useCallback(async (announcementId: string) => {
    try {
      await AnnouncementService.recordDismissal(announcementId);
      setDismissedAnnouncements(prev => new Set(Array.from(prev).concat(announcementId)));
      
      // Remove from current announcements
      setAnnouncements(prev => {
        const filtered = prev.filter(a => a.id !== announcementId);
        return filtered;
      });
      
      // Adjust current index
      setCurrentIndex(prev => {
        const newLength = announcements.length - 1;
        if (newLength <= 0) return 0;
        if (prev >= newLength) {
          return Math.max(0, newLength - 1);
        }
        return prev;
      });
    } catch (error) {
      console.error('Error dismissing announcement:', error);
    }
  }, [announcements.length]);

  const handleClick = useCallback(async (announcement: Announcement) => {
    try {
      await AnnouncementService.recordClick(announcement.id);
      
      if (announcement.clickAction) {
        switch (announcement.clickAction.type) {
          case 'link':
            if (announcement.clickAction.url) {
              window.open(announcement.clickAction.url, '_blank', 'noopener,noreferrer');
            }
            break;
          case 'page':
            if (announcement.clickAction.pageRoute) {
              window.location.href = announcement.clickAction.pageRoute;
            }
            break;
          case 'modal':
            // Handle modal display - could be implemented with a modal component
            console.log('Modal content:', announcement.clickAction.modalContent);
            break;
          default:
            break;
        }
      }
    } catch (error) {
      console.error('Error handling announcement click:', error);
    }
  }, []);

  const handlePrevious = () => {
    setCurrentIndex(prev => (prev - 1 + announcements.length) % announcements.length);
  };

  const handleNext = () => {
    setCurrentIndex(prev => (prev + 1) % announcements.length);
  };

  const togglePause = () => {
    setIsPaused(prev => !prev);
  };

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Don't render if no announcements or loading
  if (isLoading || announcements.length === 0) {
    return null;
  }

  // Don't render if there's an error
  if (error) {
    console.warn('AnnouncementBanner error:', error);
    return null;
  }

  const currentAnnouncement = announcements[currentIndex];
  if (!currentAnnouncement) return null;

  const typeColor = getTypeColor(currentAnnouncement.type);
  const scrollSpeed = currentAnnouncement.displaySettings.scrollSpeed || 'normal';
  const autoScroll = currentAnnouncement.displaySettings.autoScroll !== false;

  return (
    <div className={`announcement-banner-container ${className}`}>
      <div 
        className="announcement-banner"
        style={{
          backgroundColor: currentAnnouncement.displaySettings.backgroundColor || typeColor,
          color: currentAnnouncement.displaySettings.textColor || '#ffffff'
        }}
        onClick={() => handleClick(currentAnnouncement)}
      >
      <div className="announcement-banner-content">
        <button
          className="announcement-banner-close"
          onClick={(e) => {
            e.stopPropagation();
            handleDismiss(currentAnnouncement.id);
          }}
          title="Dismiss announcement"
        >
          <FaTimes />
        </button>

        <div className="announcement-banner-icon-container">
          {getTypeIcon(currentAnnouncement.type)}
        </div>
        
        <div className="announcement-banner-text-container">
          <div 
            className={`announcement-banner-text ${autoScroll ? `announcement-scroll-${scrollSpeed}` : ''}`}
            style={{
              fontSize: currentAnnouncement.displaySettings.fontSize === 'small' ? '0.875rem' :
                       currentAnnouncement.displaySettings.fontSize === 'large' ? '1.125rem' : '1rem'
            }}
          >
            <span className="announcement-banner-title">{currentAnnouncement.title}</span>
            <span className="announcement-banner-message">{currentAnnouncement.content}</span>
          </div>
        </div>

        <div className="announcement-banner-controls">
          {announcements.length > 1 && (
            <>
              <button
                className="announcement-banner-control-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrevious();
                }}
                title="Previous announcement"
              >
                <FaChevronLeft />
              </button>
              
              <button
                className="announcement-banner-control-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  togglePause();
                }}
                title={isPaused ? 'Resume auto-scroll' : 'Pause auto-scroll'}
              >
                {isPaused ? <FaPlay /> : <FaPause />}
              </button>
              
              <button
                className="announcement-banner-control-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
                title="Next announcement"
              >
                <FaChevronRight />
              </button>
            </>
          )}
        </div>
      </div>

        {announcements.length > 1 && (
          <div className="announcement-banner-indicators">
            {announcements.map((_, index) => (
              <button
                key={index}
                className={`announcement-banner-indicator ${index === currentIndex ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(index);
                }}
                title={`Go to announcement ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnnouncementBanner;
