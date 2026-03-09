import { supabase } from '@/integrations/supabase/client';
import type { IAssetApi, DbAssetRegistry } from '../types';
import type { Database, Json } from '@/integrations/supabase/types';

export function createSupabaseAssetApi(): IAssetApi {
  return {
    async list(filters) {
      let query = supabase.from('asset_registry').select('*');
      if (filters.relatedType) query = query.eq('related_type', filters.relatedType);
      if (filters.relatedId) query = query.eq('related_id', filters.relatedId);
      if (filters.assetType) query = query.eq('asset_type', filters.assetType as Database['public']['Enums']['asset_type']);
      if (filters.isCurrent !== undefined) query = query.eq('is_current', filters.isCurrent);
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as DbAssetRegistry[];
    },

    async create(insertData) {
      const { data, error } = await supabase
        .from('asset_registry')
        .insert({
          ...insertData,
          asset_type: insertData.asset_type as Database['public']['Enums']['asset_type'],
          metadata: (insertData.metadata || {}) as Json,
        })
        .select()
        .single();
      if (error) throw error;
      return data as DbAssetRegistry;
    },

    async update(id, updates) {
      const { error } = await supabase
        .from('asset_registry')
        .update(updates as Database['public']['Tables']['asset_registry']['Update'])
        .eq('id', id);
      if (error) throw error;
    },

    async updateByFilter(filters, updates) {
      let query = supabase.from('asset_registry').update(updates as Database['public']['Tables']['asset_registry']['Update']);
      if (filters.userId) query = query.eq('user_id', filters.userId);
      if (filters.assetType) query = query.eq('asset_type', filters.assetType as Database['public']['Enums']['asset_type']);
      if (filters.relatedId) query = query.eq('related_id', filters.relatedId);
      const { error } = await query;
      if (error) throw error;
    },

    async delete(id) {
      const { error } = await supabase.from('asset_registry').delete().eq('id', id);
      if (error) throw error;
    },

    async getVersions(relatedId, assetType) {
      const { data, error } = await supabase
        .from('asset_registry')
        .select('*')
        .eq('related_id', relatedId)
        .eq('asset_type', assetType as Database['public']['Enums']['asset_type'])
        .order('version', { ascending: false });
      if (error) throw error;
      return (data || []) as DbAssetRegistry[];
    },
  };
}
