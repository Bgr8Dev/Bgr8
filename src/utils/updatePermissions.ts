/**
 * Utility function to update page permissions in Firebase
 * This can be called from the browser console or imported in components
 */

import { PagePermissionsService } from '../services/pagePermissionsService';

/**
 * Update page permissions with all default pages
 * Call this function from the browser console: updatePagePermissions()
 */
export const updatePagePermissions = async (): Promise<void> => {
  try {
    console.log('🔄 Updating page permissions...');
    await PagePermissionsService.forceUpdatePermissions();
    console.log('✅ Page permissions updated successfully!');
    console.log('🔄 Please refresh the page to see the new pages in the admin portal.');
  } catch (error) {
    console.error('❌ Error updating page permissions:', error);
    throw error;
  }
};

// Make it available globally for console access
if (typeof window !== 'undefined') {
  (window as unknown as { updatePagePermissions: typeof updatePagePermissions }).updatePagePermissions = updatePagePermissions;
  console.log('💡 To update page permissions, run: updatePagePermissions()');
}
