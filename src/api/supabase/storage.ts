import { supabase } from '@/integrations/supabase/client';
import type { IStorageApi, IStorageListApi } from '../types';

export function createSupabaseStorageApi(): IStorageApi & IStorageListApi {
  return {
    async upload(bucket, path, file, options) {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          upsert: options?.upsert ?? false,
          cacheControl: options?.cacheControl ?? '3600',
        });
      if (error) throw error;
      return { path: data.path };
    },

    getPublicUrl(bucket, path) {
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      return data.publicUrl;
    },

    async remove(bucket, paths) {
      const { error } = await supabase.storage.from(bucket).remove(paths);
      if (error) throw error;
    },

    async listFiles(bucket, path = '', options) {
      const { data, error } = await supabase.storage.from(bucket).list(path, {
        limit: options?.limit ?? 1000,
        sortBy: options?.sortBy ? { column: options.sortBy.column, order: options.sortBy.order as 'asc' | 'desc' } : undefined,
      });
      if (error) throw error;
      return (data || []).map(item => ({
        name: item.name,
        id: item.id,
        created_at: item.created_at,
        metadata: item.metadata as Record<string, unknown> | undefined,
      }));
    },
  };
}
