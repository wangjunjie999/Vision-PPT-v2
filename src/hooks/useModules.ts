import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Module = Database['public']['Tables']['function_modules']['Row'];
type ModuleInsert = Database['public']['Tables']['function_modules']['Insert'];
type ModuleUpdate = Database['public']['Tables']['function_modules']['Update'];

export function useModules(workstationId?: string) {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchModules = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('function_modules')
        .select('*')
        .order('created_at', { ascending: true });

      if (workstationId) {
        query = query.eq('workstation_id', workstationId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setModules(data || []);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [workstationId]);

  useEffect(() => {
    fetchModules();
  }, [fetchModules]);

  const addModule = async (module: Omit<ModuleInsert, 'id' | 'created_at' | 'updated_at'>) => {
    const { data, error } = await supabase
      .from('function_modules')
      .insert(module)
      .select()
      .single();

    if (error) throw error;
    setModules(prev => [...prev, data]);
    return data;
  };

  const updateModule = async (id: string, updates: ModuleUpdate & { description?: string | null; measurement_config?: any; schematic_image_url?: string | null }) => {
    const { data, error } = await supabase
      .from('function_modules')
      .update(updates as ModuleUpdate)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    setModules(prev => prev.map(m => m.id === id ? data : m));
    return data;
  };

  const deleteModule = async (id: string) => {
    const { error } = await supabase
      .from('function_modules')
      .delete()
      .eq('id', id);

    if (error) throw error;
    setModules(prev => prev.filter(m => m.id !== id));
  };

  const duplicateModule = async (id: string) => {
    const original = modules.find(m => m.id === id);
    if (!original) throw new Error('Module not found');

    const { id: _, created_at, updated_at, ...rest } = original;
    const newModule = {
      ...rest,
      name: `${original.name} (副本)`,
    };

    return addModule(newModule);
  };

  return {
    modules,
    loading,
    error,
    fetchModules,
    addModule,
    updateModule,
    deleteModule,
    duplicateModule,
  };
}
