import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  where,
  serverTimestamp 
} from 'firebase/firestore';
import { firestore } from '../firebase/firebase';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'success' | 'error' | 'promotion';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  isActive: boolean;
  startDate: Date;
  endDate?: Date;
  targetAudience: 'all' | 'users' | 'mentors' | 'admins' | 'guests';
  displaySettings: {
    showOnHomepage: boolean;
    showOnPortal: boolean;
    showOnMobile: boolean;
    autoScroll: boolean;
    scrollSpeed: 'slow' | 'normal' | 'fast' | 'very-slow' | 'very-fast';
    scrollDirection: 'left-to-right' | 'right-to-left' | 'bounce' | 'alternate';
    displayMode: 'title-only' | 'content-only' | 'title-and-content' | 'custom';
    customDisplayText?: string;
    fontSize: 'small' | 'medium' | 'large' | 'extra-large';
    fontWeight: 'normal' | 'medium' | 'semibold' | 'bold';
    textAlign: 'left' | 'center' | 'right';
    backgroundColor: string;
    textColor: string;
    accentColor?: string;
    borderColor?: string;
    borderRadius: 'none' | 'small' | 'medium' | 'large' | 'full';
    padding: 'small' | 'medium' | 'large' | 'extra-large';
    margin: 'none' | 'small' | 'medium' | 'large';
    shadow: 'none' | 'small' | 'medium' | 'large' | 'glow';
    animation: 'none' | 'fade' | 'slide' | 'bounce' | 'pulse' | 'glow' | 'shimmer';
    animationSpeed: 'slow' | 'normal' | 'fast';
    showIcon: boolean;
    iconPosition: 'left' | 'right' | 'center' | 'hidden';
    showControls: boolean;
    showIndicators: boolean;
    showCloseButton: boolean;
    closeButtonPosition: 'left' | 'right';
    closeButtonStyle: 'default' | 'minimal' | 'prominent' | 'hidden';
    opacity: number; // 0-1
    blur: 'none' | 'light' | 'medium' | 'heavy';
    gradient: boolean;
    gradientColors?: string[];
    gradientDirection: 'horizontal' | 'vertical' | 'diagonal' | 'radial';
    pattern: 'none' | 'dots' | 'lines' | 'grid' | 'waves' | 'stars';
    patternOpacity: number; // 0-1
    hoverEffect: 'none' | 'lift' | 'glow' | 'scale' | 'fade';
    clickEffect: 'none' | 'ripple' | 'bounce' | 'shake' | 'glow';
  };
  clickAction?: {
    type: 'none' | 'link' | 'modal' | 'page';
    url?: string;
    modalContent?: string;
    pageRoute?: string;
  };
  analytics: {
    views: number;
    clicks: number;
    dismissals: number;
  };
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AnnouncementAnalytics {
  totalAnnouncements: number;
  activeAnnouncements: number;
  totalViews: number;
  totalClicks: number;
  totalDismissals: number;
  averageEngagement: number;
  topPerformingAnnouncement?: string;
  recentActivity: Array<{
    id: string;
    action: 'created' | 'updated' | 'activated' | 'deactivated' | 'deleted';
    timestamp: Date;
    user: string;
  }>;
}

export class AnnouncementService {
  private static readonly COLLECTION_NAME = 'announcements';

  /**
   * Get all announcements
   */
  static async getAnnouncements(): Promise<Announcement[]> {
    try {
      const q = query(
        collection(firestore, this.COLLECTION_NAME),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        startDate: doc.data().startDate?.toDate() || new Date(),
        endDate: doc.data().endDate?.toDate(),
      })) as Announcement[];
    } catch (error) {
      console.error('Error fetching announcements:', error);
      throw new Error('Failed to fetch announcements');
    }
  }

  /**
   * Get active announcements for display
   */
  static async getActiveAnnouncements(): Promise<Announcement[]> {
    try {
      const now = new Date();
      // Simplified query to avoid index issues - we'll filter and sort in memory
      const q = query(
        collection(firestore, this.COLLECTION_NAME),
        where('isActive', '==', true)
      );
      const querySnapshot = await getDocs(q);
      
      const announcements = querySnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
          startDate: doc.data().startDate?.toDate() || new Date(),
          endDate: doc.data().endDate?.toDate(),
        }))
        .filter(announcement => {
          // Filter by date range in memory
          const isWithinDateRange = announcement.startDate <= now && 
            (!announcement.endDate || announcement.endDate > now);
          return isWithinDateRange;
        })
        .sort((a, b) => {
          // Sort by priority first, then by creation date
          const priorityOrder = { urgent: 4, high: 3, normal: 2, low: 1 };
          const aPriority = priorityOrder[a.priority] || 2;
          const bPriority = priorityOrder[b.priority] || 2;
          
          if (aPriority !== bPriority) {
            return bPriority - aPriority; // Higher priority first
          }
          
          return b.createdAt.getTime() - a.createdAt.getTime(); // Newer first
        }) as Announcement[];

      // If no announcements found, return a demo announcement for development
      if (announcements.length === 0) {
        console.log('No active announcements found. Creating demo announcement for development.');
        return [{
          id: 'demo-announcement',
          title: 'Welcome to B8 Network!',
          content: 'This is a demo announcement banner. Create announcements in the admin panel to customize this message.',
          type: 'info' as const,
          priority: 'normal' as const,
          isActive: true,
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          displaySettings: {
            showOnHomepage: true,
            showOnPortal: true,
            showOnMobile: true,
            autoScroll: true,
            scrollSpeed: 'normal' as const,
            scrollDirection: 'left-to-right' as const,
            displayMode: 'title-and-content' as const,
            fontSize: 'medium' as const,
            fontWeight: 'medium' as const,
            textAlign: 'left' as const,
            backgroundColor: '#3b82f6',
            textColor: '#ffffff',
            accentColor: '#60a5fa',
            borderRadius: 'medium' as const,
            padding: 'medium' as const,
            margin: 'none' as const,
            shadow: 'medium' as const,
            animation: 'shimmer' as const,
            animationSpeed: 'normal' as const,
            showIcon: true,
            iconPosition: 'left' as const,
            showControls: true,
            showIndicators: true,
            showCloseButton: true,
            closeButtonPosition: 'left' as const,
            closeButtonStyle: 'default' as const,
            opacity: 1,
            blur: 'none' as const,
            gradient: false,
            gradientDirection: 'horizontal' as const,
            pattern: 'none' as const,
            patternOpacity: 0.1,
            hoverEffect: 'glow' as const,
            clickEffect: 'ripple' as const
          },
          targetAudience: 'all' as const,
          createdBy: 'system',
          createdAt: new Date(),
          updatedAt: new Date(),
          analytics: {
            views: 0,
            clicks: 0,
            dismissals: 0
          }
        }];
      }

      return announcements;
    } catch (error) {
      console.error('Error fetching active announcements:', error);
      // Return demo announcement instead of throwing error
      console.log('Firebase error occurred. Using demo announcement for development.');
      return [{
        id: 'demo-announcement',
        title: 'Welcome to B8 Network!',
        content: 'This is a demo announcement banner. Create announcements in the admin panel to customize this message.',
        type: 'info' as const,
        priority: 'normal' as const,
        isActive: true,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        displaySettings: {
          showOnHomepage: true,
          showOnPortal: true,
          showOnMobile: true,
          autoScroll: true,
          scrollSpeed: 'normal' as const,
          scrollDirection: 'left-to-right' as const,
          displayMode: 'title-and-content' as const,
          fontSize: 'medium' as const,
          fontWeight: 'medium' as const,
          textAlign: 'left' as const,
          backgroundColor: '#3b82f6',
          textColor: '#ffffff',
          accentColor: '#60a5fa',
          borderRadius: 'medium' as const,
          padding: 'medium' as const,
          margin: 'none' as const,
          shadow: 'medium' as const,
          animation: 'shimmer' as const,
          animationSpeed: 'normal' as const,
          showIcon: true,
          iconPosition: 'left' as const,
          showControls: true,
          showIndicators: true,
          showCloseButton: true,
          closeButtonPosition: 'left' as const,
          closeButtonStyle: 'default' as const,
          opacity: 1,
          blur: 'none' as const,
          gradient: false,
          gradientDirection: 'horizontal' as const,
          pattern: 'none' as const,
          patternOpacity: 0.1,
          hoverEffect: 'glow' as const,
          clickEffect: 'ripple' as const
        },
        targetAudience: 'all' as const,
        createdBy: 'system',
        createdAt: new Date(),
        updatedAt: new Date(),
        analytics: {
          views: 0,
          clicks: 0,
          dismissals: 0
        }
      }];
    }
  }

  /**
   * Get announcement by ID
   */
  static async getAnnouncement(id: string): Promise<Announcement | null> {
    try {
      const docRef = doc(firestore, this.COLLECTION_NAME, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          startDate: data.startDate?.toDate() || new Date(),
          endDate: data.endDate?.toDate(),
        } as Announcement;
      }
      return null;
    } catch (error) {
      console.error('Error fetching announcement:', error);
      throw new Error('Failed to fetch announcement');
    }
  }

  /**
   * Create new announcement
   */
  static async createAnnouncement(announcement: Omit<Announcement, 'id' | 'createdAt' | 'updatedAt' | 'analytics'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(firestore, this.COLLECTION_NAME), {
        ...announcement,
        analytics: {
          views: 0,
          clicks: 0,
          dismissals: 0
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating announcement:', error);
      throw new Error('Failed to create announcement');
    }
  }

  /**
   * Update announcement
   */
  static async updateAnnouncement(id: string, updates: Partial<Announcement>): Promise<void> {
    try {
      const docRef = doc(firestore, this.COLLECTION_NAME, id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating announcement:', error);
      throw new Error('Failed to update announcement');
    }
  }

  /**
   * Delete announcement
   */
  static async deleteAnnouncement(id: string): Promise<void> {
    try {
      const docRef = doc(firestore, this.COLLECTION_NAME, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting announcement:', error);
      throw new Error('Failed to delete announcement');
    }
  }

  /**
   * Toggle announcement active status
   */
  static async toggleAnnouncementStatus(id: string, isActive: boolean): Promise<void> {
    try {
      await this.updateAnnouncement(id, { isActive });
    } catch (error) {
      console.error('Error toggling announcement status:', error);
      throw new Error('Failed to toggle announcement status');
    }
  }

  /**
   * Record announcement view
   */
  static async recordView(id: string): Promise<void> {
    try {
      const announcement = await this.getAnnouncement(id);
      if (announcement) {
        await this.updateAnnouncement(id, {
          analytics: {
            ...announcement.analytics,
            views: announcement.analytics.views + 1
          }
        });
      }
    } catch (error) {
      console.error('Error recording view:', error);
      // Don't throw error for analytics failures
    }
  }

  /**
   * Record announcement click
   */
  static async recordClick(id: string): Promise<void> {
    try {
      const announcement = await this.getAnnouncement(id);
      if (announcement) {
        await this.updateAnnouncement(id, {
          analytics: {
            ...announcement.analytics,
            clicks: announcement.analytics.clicks + 1
          }
        });
      }
    } catch (error) {
      console.error('Error recording click:', error);
      // Don't throw error for analytics failures
    }
  }

  /**
   * Record announcement dismissal
   */
  static async recordDismissal(id: string): Promise<void> {
    try {
      const announcement = await this.getAnnouncement(id);
      if (announcement) {
        await this.updateAnnouncement(id, {
          analytics: {
            ...announcement.analytics,
            dismissals: announcement.analytics.dismissals + 1
          }
        });
      }
    } catch (error) {
      console.error('Error recording dismissal:', error);
      // Don't throw error for analytics failures
    }
  }

  /**
   * Get announcement analytics
   */
  static async getAnnouncementAnalytics(): Promise<AnnouncementAnalytics> {
    try {
      const announcements = await this.getAnnouncements();
      
      const totalAnnouncements = announcements.length;
      const activeAnnouncements = announcements.filter(a => a.isActive).length;
      const totalViews = announcements.reduce((sum, a) => sum + a.analytics.views, 0);
      const totalClicks = announcements.reduce((sum, a) => sum + a.analytics.clicks, 0);
      const totalDismissals = announcements.reduce((sum, a) => sum + a.analytics.dismissals, 0);
      
      const averageEngagement = totalViews > 0 ? ((totalClicks + totalDismissals) / totalViews) * 100 : 0;
      
      const topPerformingAnnouncement = announcements
        .sort((a, b) => (b.analytics.views + b.analytics.clicks) - (a.analytics.views + a.analytics.clicks))[0]?.id;

      // Mock recent activity - in a real app, this would be stored separately
      const recentActivity = announcements
        .slice(0, 5)
        .map(a => ({
          id: a.id,
          action: (a.isActive ? 'activated' : 'deactivated') as 'activated' | 'deactivated',
          timestamp: a.updatedAt,
          user: a.createdBy
        }));

      return {
        totalAnnouncements,
        activeAnnouncements,
        totalViews,
        totalClicks,
        totalDismissals,
        averageEngagement,
        topPerformingAnnouncement,
        recentActivity
      };
    } catch (error) {
      console.error('Error fetching announcement analytics:', error);
      throw new Error('Failed to fetch announcement analytics');
    }
  }

  /**
   * Get announcements by type
   */
  static async getAnnouncementsByType(type: Announcement['type']): Promise<Announcement[]> {
    try {
      const q = query(
        collection(firestore, this.COLLECTION_NAME),
        where('type', '==', type),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        startDate: doc.data().startDate?.toDate() || new Date(),
        endDate: doc.data().endDate?.toDate(),
      })) as Announcement[];
    } catch (error) {
      console.error('Error fetching announcements by type:', error);
      throw new Error('Failed to fetch announcements by type');
    }
  }

  /**
   * Get announcements by priority
   */
  static async getAnnouncementsByPriority(priority: Announcement['priority']): Promise<Announcement[]> {
    try {
      const q = query(
        collection(firestore, this.COLLECTION_NAME),
        where('priority', '==', priority),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        startDate: doc.data().startDate?.toDate() || new Date(),
        endDate: doc.data().endDate?.toDate(),
      })) as Announcement[];
    } catch (error) {
      console.error('Error fetching announcements by priority:', error);
      throw new Error('Failed to fetch announcements by priority');
    }
  }
}
