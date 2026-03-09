import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Layout = Database['public']['Tables']['mechanical_layouts']['Row'];
type LayoutInsert = Database['public']['Tables']['mechanical_layouts']['Insert'];
type LayoutUpdate = Database['public']['Tables']['mechanical_layouts']['Update'];

export function useLayouts(workstationId?: string) {
  const [layouts, setLayouts] = useState<Layout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchLayouts = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('mechanical_layouts')
        .select('*');

      if (workstationId) {
        query = query.eq('workstation_id', workstationId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setLayouts(data || []);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [workstationId]);

  useEffect(() => {
    fetchLayouts();
  }, [fetchLayouts]);

  const getLayoutByWorkstation = useCallback((wsId: string) => {
    return layouts.find(l => l.workstation_id === wsId);
  }, [layouts]);

  const addLayout = async (layout: Omit<LayoutInsert, 'id' | 'created_at' | 'updated_at'>) => {
    const { data, error } = await supabase
      .from('mechanical_layouts')
      .insert(layout)
      .select()
      .single();

    if (error) throw error;
    setLayouts(prev => [...prev, data]);
    return data;
  };

  const updateLayout = async (id: string, updates: LayoutUpdate) => {
    const { data, error } = await supabase
      .from('mechanical_layouts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    setLayouts(prev => prev.map(l => l.id === id ? data : l));
    return data;
  };

  const upsertLayout = async (workstationId: string, layoutData: Omit<LayoutInsert, 'id' | 'created_at' | 'updated_at' | 'workstation_id'>) => {
    const existing = layouts.find(l => l.workstation_id === workstationId);
    
    if (existing) {
      return updateLayout(existing.id, layoutData);
    } else {
      return addLayout({ ...layoutData, workstation_id: workstationId });
    }
  };

  const deleteLayout = async (id: string) => {
    const { error } = await supabase
      .from('mechanical_layouts')
      .delete()
      .eq('id', id);

    if (error) throw error;
    setLayouts(prev => prev.filter(l => l.id !== id));
  };

  return {
    layouts,
    loading,
    error,
    fetchLayouts,
    getLayoutByWorkstation,
    addLayout,
    updateLayout,
    upsertLayout,
    deleteLayout,
  };
}
