import { useState, useEffect, useCallback } from 'react';
import { api } from '@/api';
import type { DbModule, ModuleInsert, ModuleUpdate } from '@/api/types';

export function useModules(workstationId?: string) {
  const [modules, setModules] = useState<DbModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchModules = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.modules.list('created_at', true);
      setModules(workstationId ? data.filter(m => m.workstation_id === workstationId) : data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [workstationId]);

  useEffect(() => { fetchModules(); }, [fetchModules]);

  const addModule = async (module: Omit<ModuleInsert, 'id' | 'created_at' | 'updated_at'>) => {
    const data = await api.modules.create(module);
    setModules(prev => [...prev, data]);
    return data;
  };

  const updateModule = async (id: string, updates: ModuleUpdate & { description?: string | null; measurement_config?: any; schematic_image_url?: string | null }) => {
    const data = await api.modules.update(id, updates);
    setModules(prev => prev.map(m => m.id === id ? data : m));
    return data;
  };

  const deleteModule = async (id: string) => {
    await api.modules.delete(id);
    setModules(prev => prev.filter(m => m.id !== id));
  };

  const duplicateModule = async (id: string) => {
    const original = modules.find(m => m.id === id);
    if (!original) throw new Error('Module not found');
    const { id: _, created_at, updated_at, ...rest } = original;
    return addModule({ ...rest, name: `${original.name} (副本)` });
  };

  return { modules, loading, error, fetchModules, addModule, updateModule, deleteModule, duplicateModule };
}
