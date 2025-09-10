import { useState, useEffect } from 'react';
import { PagePermissionsService, PagePermission } from '../services/pagePermissionsService';
import { useAuth } from './useAuth';

export const usePagePermissions = () => {
  const { userProfile } = useAuth();
  const [permissions, setPermissions] = useState<PagePermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const config = await PagePermissionsService.getPagePermissions();
      setPermissions(config.permissions);
    } catch (err) {
      setError('Failed to load page permissions');
      console.error('Error loading permissions:', err);
    } finally {
      setLoading(false);
    }
  };

  const getUserRoles = (): string[] => {
    if (!userProfile?.roles) return [];
    
    return Object.keys(userProfile.roles).filter(role => userProfile.roles[role] === true);
  };

  const canAccessPage = (pageId: string): boolean => {
    if (!permissions.length) return false;
    
    const userRoles = getUserRoles();
    return PagePermissionsService.canAccessPage(userRoles, pageId, permissions);
  };

  const getAccessiblePages = (): PagePermission[] => {
    if (!permissions.length) return [];
    
    const userRoles = getUserRoles();
    return PagePermissionsService.getAccessiblePages(userRoles, permissions);
  };

  const refreshPermissions = () => {
    loadPermissions();
  };

  return {
    permissions,
    loading,
    error,
    canAccessPage,
    getAccessiblePages,
    refreshPermissions
  };
};
