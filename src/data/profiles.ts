import { supabase } from '@/lib/supabase';

export interface Profile {
  id: string;
  display_name: string | null;
  username: string | null;
  email: string | null;
  avatar_url: string | null;
  notifications_enabled: boolean;
  newsletter_consent: boolean;
  theme: string;
  language: string;
  role: string;
  created_at: string;
  updated_at: string;
  password_updated_at: string | null;
  email_verified: boolean;
  phone: string | null;
  sms_2fa_enabled: boolean;
}

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('Failed to fetch profile:', error.message, error.code);
    return null;
  }

  return data as Profile | null;
}

export async function createProfile(userId: string, overrides?: Partial<Profile>): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      display_name: overrides?.display_name ?? null,
      username: overrides?.username ?? null,
      email: overrides?.email ?? null,
      avatar_url: overrides?.avatar_url ?? null,
      notifications_enabled: overrides?.notifications_enabled ?? true,
      theme: overrides?.theme ?? 'light',
      language: overrides?.language ?? 'pl',
    })
    .select('*')
    .single();

  if (error) {
    console.error('Failed to create profile:', error.message, error.code);
    return null;
  }

  return data as Profile;
}

export async function ensureProfile(userId: string, email?: string | null): Promise<Profile | null> {
  const existing = await fetchProfile(userId);
  if (existing) return existing;
  return createProfile(userId, email ? { email } : undefined);
}

export async function updateProfile(
  userId: string,
  updates: Partial<Pick<Profile, 'display_name' | 'username' | 'email' | 'avatar_url' | 'notifications_enabled' | 'newsletter_consent' | 'theme' | 'language'>>,
): Promise<Profile | null> {
  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (updateError) {
    console.error('Update profile failed:', updateError.message, 'code:', updateError.code, 'details:', updateError.details);
    return null;
  }

  const fresh = await fetchProfile(userId);
  return fresh;
}

export async function checkUsernameAvailability(username: string, excludeUserId?: string): Promise<{ available: boolean; username: string; error?: string }> {
  const { data, error } = await supabase.functions.invoke('check-username', {
    body: { username, excludeUserId },
  });

  if (error) {
    return { available: false, username, error: error.message };
  }

  return data as { available: boolean; username: string; error?: string };
}