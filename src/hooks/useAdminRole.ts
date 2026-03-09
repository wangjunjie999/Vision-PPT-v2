/**
 * Hook for checking admin role using server-side verification
 * Uses the user_roles table through the API adapter
 */

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/api';
import { useAuth } from '@/contexts/AuthContext';

export function useAdminRole() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkAdminRole = useCallback(async () => {
    if (!user) {
      setIsAdmin(false);
      setIsLoading(false);
      return false;
    }

    try {
      setIsLoading(true);
      const data = await api.userRoles.getUserRole(user.id, 'admin');
      const hasAdminRole = !!data;
      setIsAdmin(hasAdminRole);
      return hasAdminRole;
    } catch (error) {
      console.error('Error checking admin role:', error);
      setIsAdmin(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    checkAdminRole();
  }, [checkAdminRole]);

  return {
    isAdmin,
    isLoading,
    checkAdminRole,
  };
}
