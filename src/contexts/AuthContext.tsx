import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { api } from '@/api';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (username: string, password: string, displayName?: string) => Promise<{ error: Error | null }>;
  signIn: (username: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { unsubscribe } = api.auth.onAuthStateChange(
      (_event, apiSession) => {
        if (apiSession) {
          // Map ApiSession to Supabase-compatible types for downstream consumers
          setSession({ user: apiSession.user, access_token: apiSession.access_token } as unknown as Session);
          setUser(apiSession.user as unknown as User);
        } else {
          setSession(null);
          setUser(null);
        }
        setLoading(false);
      }
    );

    // THEN check for existing session
    api.auth.getSession().then(({ session: apiSession }) => {
      if (apiSession) {
        setSession({ user: apiSession.user, access_token: apiSession.access_token } as unknown as Session);
        setUser(apiSession.user as unknown as User);
      } else {
        setSession(null);
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const toInternalEmail = (username: string) => {
    const trimmed = username.trim().toLowerCase();
    if (trimmed.includes('@')) return trimmed;
    return `${trimmed}@internal.local`;
  };

  const signUp = async (username: string, password: string, displayName?: string) => {
    return api.auth.signUp(toInternalEmail(username), password, {
      data: { display_name: displayName || username },
    });
  };

  const signIn = async (username: string, password: string) => {
    return api.auth.signIn(toInternalEmail(username), password);
  };

  const signOut = async () => {
    await api.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
