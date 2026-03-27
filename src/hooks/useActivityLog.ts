import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type ActionType = 'create' | 'update' | 'delete' | 'generate' | 'duplicate';
export type EntityType = 'project' | 'workstation' | 'module' | 'layout' | 'document';

interface LogActivityParams {
  projectId: string;
  actionType: ActionType;
  entityType: EntityType;
  entityId?: string;
  entityName?: string;
  description: string;
  metadata?: Record<string, any>;
}

export function useActivityLog() {
  const { user } = useAuth();

  const logActivity = useCallback(async (params: LogActivityParams) => {
    if (!user) return;
    try {
      await supabase.from('activity_logs' as any).insert({
        user_id: user.id,
        project_id: params.projectId,
        action_type: params.actionType,
        entity_type: params.entityType,
        entity_id: params.entityId || null,
        entity_name: params.entityName || null,
        description: params.description,
        metadata: params.metadata || {},
      });
    } catch (e) {
      // Silent fail - activity logging should not block main operations
      console.warn('Activity log failed:', e);
    }
  }, [user]);

  return { logActivity };
}
