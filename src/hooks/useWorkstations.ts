import { useState, useEffect, useCallback } from 'react';
import { api } from '@/api';
import type { DbWorkstation, WorkstationInsert, WorkstationUpdate } from '@/api/types';

export function useWorkstations(projectId?: string) {
  const [workstations, setWorkstations] = useState<DbWorkstation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchWorkstations = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.workstations.list('created_at', true);
      setWorkstations(projectId ? data.filter(w => w.project_id === projectId) : data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { fetchWorkstations(); }, [fetchWorkstations]);

  const addWorkstation = async (workstation: Omit<WorkstationInsert, 'id' | 'created_at' | 'updated_at'>) => {
    const data = await api.workstations.create(workstation);
    setWorkstations(prev => [...prev, data]);
    return data;
  };

  const updateWorkstation = async (id: string, updates: WorkstationUpdate) => {
    const data = await api.workstations.update(id, updates);
    setWorkstations(prev => prev.map(w => w.id === id ? data : w));
    return data;
  };

  const deleteWorkstation = async (id: string) => {
    await api.workstations.delete(id);
    setWorkstations(prev => prev.filter(w => w.id !== id));
  };

  const duplicateWorkstation = async (id: string) => {
    const original = workstations.find(w => w.id === id);
    if (!original) throw new Error('Workstation not found');
    const { id: _, created_at, updated_at, ...rest } = original;
    return addWorkstation({ ...rest, code: `${original.code}-copy`, name: `${original.name} (副本)` });
  };

  return { workstations, loading, error, fetchWorkstations, addWorkstation, updateWorkstation, deleteWorkstation, duplicateWorkstation };
}
