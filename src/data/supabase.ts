import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://njhwmrznkcdrsotfkwbx.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_SeLt_DsMrK0qu2p0d6l5IQ_vpviQ_oL';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});

export interface AccountProfile {
  id: string;
  display_name: string | null;
  is_vip: boolean;
}

export interface CurrencyReview {
  id: string;
  user_id: string;
  symbol: string;
  rating: number;
  body: string;
  created_at: string;
  author?: string;
}

export interface CommunityReport {
  id: string;
  user_id: string;
  symbol: string | null;
  title: string;
  body: string;
  created_at: string;
  author?: string;
}

export async function fetchProfile(userId: string): Promise<AccountProfile | null> {
  const { data, error } = await supabase.from('profiles').select('id, display_name, is_vip').eq('id', userId).maybeSingle();
  if (error || !data) return null;
  return data as AccountProfile;
}

export async function upsertProfile(userId: string, displayName: string) {
  return supabase.from('profiles').upsert({ id: userId, display_name: displayName }, { onConflict: 'id' });
}

export async function fetchFavorites(userId: string): Promise<string[]> {
  const { data, error } = await supabase.from('favorites').select('symbol').eq('user_id', userId).order('created_at', { ascending: true });
  if (error || !data) return [];
  return data.map((row) => String((row as { symbol: string }).symbol));
}

export async function addFavorite(userId: string, symbol: string) {
  return supabase.from('favorites').upsert({ user_id: userId, symbol }, { onConflict: 'user_id,symbol' });
}

export async function removeFavorite(userId: string, symbol: string) {
  return supabase.from('favorites').delete().eq('user_id', userId).eq('symbol', symbol);
}

export async function fetchReviews(): Promise<CurrencyReview[]> {
  const { data, error } = await supabase.from('reviews').select('id, user_id, symbol, rating, body, created_at, profiles(display_name)').order('created_at', { ascending: false }).limit(60);
  if (error || !data) return [];
  return (data as (CurrencyReview & { profiles?: { display_name?: string } | null })[]).map((row) => ({ ...row, author: row.profiles?.display_name ?? 'Miembro Tribuno' }));
}

export async function publishReview(userId: string, symbol: string, rating: number, body: string) {
  return supabase.from('reviews').insert({ user_id: userId, symbol, rating, body });
}

export async function fetchReports(): Promise<CommunityReport[]> {
  const { data, error } = await supabase.from('reports').select('id, user_id, symbol, title, body, created_at, profiles(display_name)').order('created_at', { ascending: false }).limit(50);
  if (error || !data) return [];
  return (data as (CommunityReport & { profiles?: { display_name?: string } | null })[]).map((row) => ({ ...row, author: row.profiles?.display_name ?? 'Miembro Tribuno' }));
}

export async function publishReport(userId: string, symbol: string | null, title: string, body: string) {
  return supabase.from('reports').insert({ user_id: userId, symbol, title, body });
}

export function friendlyAuthError(message: string): string {
  const value = message.toLowerCase();
  if (value.includes('invalid login')) return 'auth.errInvalid';
  if (value.includes('already registered') || value.includes('already exists')) return 'auth.errAlready';
  if (value.includes('password should be')) return 'auth.errPassword';
  if (value.includes('email')) return 'auth.errEmail';
  return 'auth.errGeneric';
}
