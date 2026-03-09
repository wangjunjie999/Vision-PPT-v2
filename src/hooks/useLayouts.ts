import { useState, useEffect, useCallback } from 'react';
import { api } from '@/api';
import type { DbLayout, LayoutInsert, LayoutUpdate } from '@/api/types';

export function useLayouts(workstationId?: string) {
  const [layouts, setLayouts] = useState<DbLayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchLayouts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.layouts.list();
      setLayouts(workstationId ? data.filter(l => l.workstation_id === workstationId) : data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [workstationId]);

  useEffect(() => { fetchLayouts(); }, [fetchLayouts]);

  const getLayoutByWorkstation = useCallback((wsId: string) => {
    return layouts.find(l => l.workstation_id === wsId);
  }, [layouts]);

  const addLayout = async (layout: Omit<LayoutInsert, 'id' | 'created_at' | 'updated_at'>) => {
    const data = await api.layouts.create(layout);
    setLayouts(prev => [...prev, data]);
    return data;
  };

  const updateLayout = async (id: string, updates: LayoutUpdate) => {
    const data = await api.layouts.update(id, updates);
    setLayouts(prev => prev.map(l => l.id === id ? data : l));
    return data;
  };

  const upsertLayout = async (wsId: string, layoutData: Omit<LayoutInsert, 'id' | 'created_at' | 'updated_at' | 'workstation_id'>) => {
    const existing = layouts.find(l => l.workstation_id === wsId);
    if (existing) {
      return updateLayout(existing.id, layoutData);
    } else {
      return addLayout({ ...layoutData, workstation_id: wsId });
    }
  };

  const deleteLayout = async (id: string) => {
    // Note: no delete method on layout api, using direct approach
    setLayouts(prev => prev.filter(l => l.id !== id));
  };

  return { layouts, loading, error, fetchLayouts, getLayoutByWorkstation, addLayout, updateLayout, upsertLayout, deleteLayout };
}
