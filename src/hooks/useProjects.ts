import { useState, useEffect, useCallback } from 'react';
import { api } from '@/api';
import type { DbProject, ProjectInsert, ProjectUpdate } from '@/api/types';

export function useProjects() {
  const [projects, setProjects] = useState<DbProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.projects.list('created_at', false);
      setProjects(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const addProject = async (project: Omit<ProjectInsert, 'id' | 'created_at' | 'updated_at'>) => {
    const data = await api.projects.create(project);
    setProjects(prev => [data, ...prev]);
    return data;
  };

  const updateProject = async (id: string, updates: ProjectUpdate) => {
    const data = await api.projects.update(id, updates);
    setProjects(prev => prev.map(p => p.id === id ? data : p));
    return data;
  };

  const deleteProject = async (id: string) => {
    await api.projects.delete(id);
    setProjects(prev => prev.filter(p => p.id !== id));
  };

  return { projects, loading, error, fetchProjects, addProject, updateProject, deleteProject };
}
