import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { fetchProfile, supabase, upsertProfile, type AccountProfile } from './supabase';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: AccountProfile | null;
  isVip: boolean;
  loading: boolean;
  signUp: (email: string, password: string, displayName: string) => Promise<{ error: string | null; needsConfirmation: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  profile: null,
  isVip: false,
  loading: true,
  signUp: async () => ({ error: 'no disponible', needsConfirmation: false }),
  signIn: async () => ({ error: 'no disponible' }),
  signOut: async () => undefined,
  refreshProfile: async () => undefined,
});

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (userId: string, email?: string) => {
    let next = await fetchProfile(userId);
    if (!next) {
      await upsertProfile(userId, email?.split('@')[0] || 'Miembro');
      next = await fetchProfile(userId);
    }
    setProfile(next);
  }, []);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      if (data.session?.user) void loadProfile(data.session.user.id, data.session.user.email ?? undefined);
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (nextSession?.user) void loadProfile(nextSession.user.id, nextSession.user.email ?? undefined);
      else setProfile(null);
    });
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, [loadProfile]);

  const signUp = useCallback(async (email: string, password: string, displayName: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { display_name: displayName } } });
    if (error) return { error: error.message, needsConfirmation: false };
    if (data.user && data.session) await upsertProfile(data.user.id, displayName);
    const needsConfirmation = !data.session;
    return { error: null, needsConfirmation };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ? error.message : null };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (session?.user) await loadProfile(session.user.id);
  }, [session, loadProfile]);

  const value = useMemo<AuthContextValue>(() => ({
    user: session?.user ?? null,
    session,
    profile,
    isVip: Boolean(profile?.is_vip),
    loading,
    signUp,
    signIn,
    signOut,
    refreshProfile,
  }), [session, profile, loading, signUp, signIn, signOut, refreshProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
