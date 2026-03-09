import { supabase } from '@/integrations/supabase/client';
import type { IProjectApi, ProjectUpdate } from '../types';

export function createSupabaseProjectApi(): IProjectApi {
  return {
    async list(orderBy = 'created_at', ascending = false) {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order(orderBy, { ascending });
      if (error) throw error;
      return data || [];
    },

    async create(insertData) {
      const { data, error } = await supabase
        .from('projects')
        .insert(insertData)
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async update(id, updates: ProjectUpdate) {
      const { data, error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async delete(id) {
      const { error } = await supabase.from('projects').delete().eq('id', id);
      if (error) throw error;
    },

    async claimOrphans(userId) {
      await supabase
        .from('projects')
        .update({ user_id: userId })
        .is('user_id', null);
    },
  };
}
