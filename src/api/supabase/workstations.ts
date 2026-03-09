import { supabase } from '@/integrations/supabase/client';
import type { IWorkstationApi, WorkstationUpdate } from '../types';

export function createSupabaseWorkstationApi(): IWorkstationApi {
  return {
    async list(orderBy = 'created_at', ascending = true) {
      const { data, error } = await supabase
        .from('workstations')
        .select('*')
        .order(orderBy, { ascending });
      if (error) throw error;
      return data || [];
    },

    async create(insertData) {
      const { data, error } = await supabase
        .from('workstations')
        .insert(insertData)
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async update(id, updates: WorkstationUpdate) {
      const { data, error } = await supabase
        .from('workstations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async delete(id) {
      const { error } = await supabase.from('workstations').delete().eq('id', id);
      if (error) throw error;
    },
  };
}
