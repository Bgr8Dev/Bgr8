/**
 * Page Permissions Service
 * 
 * This service manages role-based access to admin portal pages.
 * It allows admins to dynamically configure which roles can access which pages.
 */

import {
  doc,
  getDoc, 
  setDoc, 
  updateDoc
} from 'firebase/firestore';
import { firestore } from '../firebase/firebase';

export interface PagePermission {
  pageId: string;
  pageName: string;
  description: string;
  icon: string;
  allowedRoles: string[];
  isEnabled: boolean;
}

export interface PagePermissionsConfig {
  id: string;
  permissions: PagePermission[];
  lastUpdated: Date;
  updatedBy: string;
}

export class PagePermissionsService {
  private static readonly CONFIG_DOC_ID = 'page-permissions-config';
  private static readonly CONFIG_COLLECTION = 'admin-config';

  /**
   * Default page permissions configuration
   */
  private static readonly DEFAULT_PERMISSIONS: PagePermission[] = [
    {
      pageId: 'users',
      pageName: 'Users',
      description: 'Manage user roles and permissions',
      icon: 'FaUsers',
      allowedRoles: ['admin'],
      isEnabled: true
    },
    {
      pageId: 'analytics',
      pageName: 'Analytics',
      description: 'View platform analytics and statistics',
      icon: 'FaChartBar',
      allowedRoles: ['admin', 'committee'],
      isEnabled: true
    },
    {
      pageId: 'enquiries',
      pageName: 'Enquiries',
      description: 'Manage user enquiries and support requests',
      icon: 'FaEnvelope',
      allowedRoles: ['admin', 'committee', 'marketing'],
      isEnabled: true
    },
    {
      pageId: 'mentors',
      pageName: 'Mentors',
      description: 'Manage mentor profiles and information',
      icon: 'FaChalkboardTeacher',
      allowedRoles: ['admin', 'committee', 'vetting-officer'],
      isEnabled: true
    },
    {
      pageId: 'verification',
      pageName: 'Verification',
      description: 'Review and manage mentor verification process',
      icon: 'FaUserCheck',
      allowedRoles: ['admin', 'vetting-officer'],
      isEnabled: true
    },
    {
      pageId: 'feedback',
      pageName: 'Feedback',
      description: 'View and analyze user feedback',
      icon: 'FaComments',
      allowedRoles: ['admin', 'committee', 'marketing'],
      isEnabled: true
    },
    {
      pageId: 'testing-feedback',
      pageName: 'Testing Feedback',
      description: 'Manage testing feedback tickets and bug reports',
      icon: 'FaBug',
      allowedRoles: ['admin', 'tester', 'developer'],
      isEnabled: true
    },
    {
      pageId: 'sessions',
      pageName: 'Sessions',
      description: 'Manage mentoring sessions and scheduling',
      icon: 'FaCalendarAlt',
      allowedRoles: ['admin', 'committee', 'events'],
      isEnabled: true
    },
    {
      pageId: 'settings',
      pageName: 'Settings',
      description: 'Configure system settings and permissions',
      icon: 'FaCog',
      allowedRoles: ['admin'],
      isEnabled: true
    }
  ];

  /**
   * Merge existing permissions with default permissions to ensure all pages are present
   */
  private static mergePermissions(existing: PagePermission[], defaults: PagePermission[]): PagePermission[] {
    const merged: PagePermission[] = [];
    
    // Add all default permissions
    defaults.forEach(defaultPage => {
      const existingPage = existing.find(p => p.pageId === defaultPage.pageId);
      if (existingPage) {
        // Use existing page with default values as fallback
        merged.push({
          ...defaultPage,
          ...existingPage
        });
      } else {
        // Add new page from defaults
        merged.push(defaultPage);
      }
    });
    
    // Add any custom pages that exist in Firestore but not in defaults
    existing.forEach(existingPage => {
      if (!defaults.some(p => p.pageId === existingPage.pageId)) {
        merged.push(existingPage);
      }
    });
    
    return merged;
  }

  /**
   * Get the current page permissions configuration
   */
  static async getPagePermissions(): Promise<PagePermissionsConfig> {
    try {
      const configRef = doc(firestore, this.CONFIG_COLLECTION, this.CONFIG_DOC_ID);
      const configDoc = await getDoc(configRef);
      
      if (configDoc.exists()) {
        const data = configDoc.data();
        const existingPermissions = data.permissions || [];
        
        // Merge with default permissions to ensure all pages are present and new ones are added
        const mergedPermissions = this.mergePermissions(existingPermissions, this.DEFAULT_PERMISSIONS);
        
        // If there are new permissions, update the database
        if (mergedPermissions.length !== existingPermissions.length) {
          console.log('New pages detected, updating permissions in Firebase...');
          await this.updatePagePermissions(mergedPermissions, 'system');
        }
        
        return {
          id: configDoc.id,
          permissions: mergedPermissions,
          lastUpdated: data.lastUpdated?.toDate() || new Date(),
          updatedBy: data.updatedBy || 'system'
        };
      } else {
        // Create default configuration if it doesn't exist
        return await this.createDefaultConfiguration();
      }
    } catch (error) {
      console.error('Error getting page permissions:', error);
      throw new Error('Failed to load page permissions');
    }
  }

  /**
   * Create default page permissions configuration
   */
  private static async createDefaultConfiguration(): Promise<PagePermissionsConfig> {
    try {
      const configRef = doc(firestore, this.CONFIG_COLLECTION, this.CONFIG_DOC_ID);
      const config: PagePermissionsConfig = {
        id: this.CONFIG_DOC_ID,
        permissions: this.DEFAULT_PERMISSIONS,
        lastUpdated: new Date(),
        updatedBy: 'system'
      };

      await setDoc(configRef, {
        ...config,
        lastUpdated: new Date()
      });

      return config;
    } catch (error) {
      console.error('Error creating default configuration:', error);
      throw new Error('Failed to create default page permissions');
    }
  }

  /**
   * Update page permissions configuration
   */
  static async updatePagePermissions(
    permissions: PagePermission[],
    updatedBy: string
  ): Promise<void> {
    try {
      const configRef = doc(firestore, this.CONFIG_COLLECTION, this.CONFIG_DOC_ID);
      
      await updateDoc(configRef, {
        permissions,
        lastUpdated: new Date(),
        updatedBy
      });
    } catch (error) {
      console.error('Error updating page permissions:', error);
      throw new Error('Failed to update page permissions');
    }
  }

  /**
   * Check if a user with specific roles can access a page
   */
  static canAccessPage(
    userRoles: string[],
    pageId: string,
    permissions: PagePermission[]
  ): boolean {
    const pagePermission = permissions.find(p => p.pageId === pageId);
    
    if (!pagePermission || !pagePermission.isEnabled) {
      return false;
    }

    // Check if user has any of the allowed roles
    return pagePermission.allowedRoles.some(role => userRoles.includes(role));
  }

  /**
   * Get accessible pages for a user based on their roles
   */
  static getAccessiblePages(
    userRoles: string[],
    permissions: PagePermission[]
  ): PagePermission[] {
    return permissions.filter(permission => 
      permission.isEnabled && this.canAccessPage(userRoles, permission.pageId, permissions)
    );
  }

  /**
   * Get all available roles
   */
  static getAllRoles(): string[] {
    return [
      'admin',
      'developer',
      'committee',
      'audit',
      'marketing',
      'vetting-officer',
      'social-media',
      'outreach',
      'events',
      'tester'
    ];
  }

  /**
   * Force update page permissions with all default pages
   * This can be called manually to ensure all pages are added to Firebase
   */
  static async forceUpdatePermissions(): Promise<void> {
    try {
      console.log('Force updating page permissions with all default pages...');
      await this.updatePagePermissions(this.DEFAULT_PERMISSIONS, 'admin');
      console.log('Page permissions updated successfully!');
    } catch (error) {
      console.error('Error force updating page permissions:', error);
      throw new Error('Failed to force update page permissions');
    }
  }
}
