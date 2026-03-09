import { supabase } from '@/integrations/supabase/client';
import type { IModuleApi, ModuleUpdate } from '../types';

export function createSupabaseModuleApi(): IModuleApi {
  return {
    async list(orderBy = 'created_at', ascending = true) {
      const { data, error } = await supabase
        .from('function_modules')
        .select('*')
        .order(orderBy, { ascending });
      if (error) throw error;
      return data || [];
    },

    async create(insertData) {
      const { data, error } = await supabase
        .from('function_modules')
        .insert(insertData)
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async update(id, updates) {
      const { data, error } = await supabase
        .from('function_modules')
        .update(updates as ModuleUpdate)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async delete(id) {
      const { error } = await supabase.from('function_modules').delete().eq('id', id);
      if (error) throw error;
    },
  };
}
