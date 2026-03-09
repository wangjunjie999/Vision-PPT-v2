import { supabase } from '@/integrations/supabase/client';
import type { IStorageApi } from '../types';

export function createSupabaseStorageApi(): IStorageApi {
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
  };
}
