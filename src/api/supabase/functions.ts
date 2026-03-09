import { supabase } from '@/integrations/supabase/client';
import type { IEdgeFunctionApi } from '../types';

export function createSupabaseEdgeFunctionApi(): IEdgeFunctionApi {
  return {
    async invoke(functionName, options) {
      const { data, error } = await supabase.functions.invoke(functionName, {
        method: options?.method as any,
        body: options?.body,
      });
      return { data, error: error as Error | null };
    },
  };
}
