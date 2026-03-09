import { supabase } from '@/integrations/supabase/client';
import type { ILayoutApi, LayoutUpdate } from '../types';

export function createSupabaseLayoutApi(): ILayoutApi {
  return {
    async list() {
      const { data, error } = await supabase
        .from('mechanical_layouts')
        .select('*');
      if (error) throw error;
      return data || [];
    },

    async create(insertData) {
      const { data, error } = await supabase
        .from('mechanical_layouts')
        .insert(insertData)
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async update(id, updates: LayoutUpdate) {
      const { data, error } = await supabase
        .from('mechanical_layouts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
  };
}
