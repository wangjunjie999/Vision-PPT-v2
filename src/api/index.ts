/**
 * API Adapter Entry Point
 * 
 * Switch between Supabase (default) and custom backend by setting:
 *   VITE_BACKEND=custom
 *   VITE_API_BASE_URL=https://your-server.com/api
 */

import type { ApiAdapter } from './types';
import { createSupabaseAdapter } from './supabase';
import { createCustomAdapter } from './custom';

const BACKEND = import.meta.env.VITE_BACKEND || 'supabase';

export const api: ApiAdapter = BACKEND === 'custom'
  ? createCustomAdapter(import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api')
  : createSupabaseAdapter();

// Re-export types for convenience
export type * from './types';
