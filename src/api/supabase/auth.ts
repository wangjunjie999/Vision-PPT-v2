import { supabase } from '@/integrations/supabase/client';
import type { IAuthApi, AuthChangeCallback } from '../types';

export function createSupabaseAuthApi(): IAuthApi {
  return {
    async signUp(email, password, options) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: options ? { data: options.data } : undefined,
      });
      return { error: error as Error | null };
    },

    async signIn(email, password) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error: error as Error | null };
    },

    async signOut() {
      await supabase.auth.signOut();
    },

    async getSession() {
      const { data } = await supabase.auth.getSession();
      if (!data.session) return { session: null };
      return {
        session: {
          user: {
            id: data.session.user.id,
            email: data.session.user.email,
            user_metadata: data.session.user.user_metadata as Record<string, unknown>,
          },
          access_token: data.session.access_token,
        },
      };
    },

    async getUser() {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return { user: null };
      return {
        user: {
          id: data.user.id,
          email: data.user.email,
          user_metadata: data.user.user_metadata as Record<string, unknown>,
        },
      };
    },

    onAuthStateChange(callback: AuthChangeCallback) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        callback(event, session ? {
          user: {
            id: session.user.id,
            email: session.user.email,
            user_metadata: session.user.user_metadata as Record<string, unknown>,
          },
          access_token: session.access_token,
        } : null);
      });
      return { unsubscribe: () => subscription.unsubscribe() };
    },
  };
}
