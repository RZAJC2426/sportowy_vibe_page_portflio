import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase, supabaseUrl, supabaseAnonKey } from '@/lib/supabase';
import { ensureProfile, updateProfile, checkUsernameAvailability, type Profile } from '@/data/profiles';
import i18n from '@/i18n';

// ─── Session expiry constants ───
const SESSION_CHECK_INTERVAL_MS = 30_000; // check every 30s
const WARNING_BEFORE_EXPIRY_MS = 5 * 60_000; // warn 5 min before expiry
const AUTO_REFRESH_BEFORE_MS = 2 * 60_000; // auto-refresh 2 min before expiry

// ─── WebAuthn helpers (client-side) ───
function bufferToBase64url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64urlToBuffer(base64url: string): ArrayBuffer {
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) base64 += '=';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

function isWebAuthnAvailable(): boolean {
  return typeof window !== 'undefined'
    && !!window.PublicKeyCredential
    && typeof (window.PublicKeyCredential as any).isUserVerifyingPlatformAuthenticatorAvailable === 'function';
}

// ─── Session backup (IndexedDB-free fallback for WebAuthn) ───
const SESSION_BACKUP_KEY = 'sportowy-vibe-session-bk';

function storeSessionBackup(session: { access_token: string; refresh_token: string; expires_at?: number; userId: string }) {
  try {
    const payload = JSON.stringify(session);
    const encoded = btoa(payload);
    localStorage.setItem(SESSION_BACKUP_KEY, encoded);
  } catch { /* noop */ }
}

function getSessionBackup(): { access_token: string; refresh_token: string; expires_at?: number; userId: string } | null {
  try {
    const raw = localStorage.getItem(SESSION_BACKUP_KEY);
    if (!raw) return null;
    const decoded = atob(raw);
    return JSON.parse(decoded);
  } catch { return null; }
}

function clearSessionBackup() {
  try { localStorage.removeItem(SESSION_BACKUP_KEY); } catch { /* noop */ }
}

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  isModerator: boolean;
  /** Session will expire at this timestamp (ms). null if no session. */
  sessionExpiresAt: number | null;
  /** True when session is within the warning window (5 min before expiry) */
  sessionWarning: boolean;
  /** True when session has already expired */
  sessionExpired: boolean;
  /** Manually refresh the session */
  refreshSession: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<{ error?: string }>;
  signInWithLogin: (login: string, password: string, turnstileToken?: string) => Promise<{ error?: string }>;
  signUpWithEmail: (email: string, password: string, newsletterConsent?: boolean, turnstileToken?: string) => Promise<{ error?: string; email_sent?: boolean; email_error?: string }>;
  signInWithGoogle: () => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  hardSignOut: () => Promise<void>;
  updateUserProfile: (updates: Partial<Pick<Profile, 'display_name' | 'username' | 'avatar_url' | 'notifications_enabled' | 'theme' | 'language'>>) => Promise<void>;
  changePassword: (newPassword: string) => Promise<{ error?: string }>;
  changeUsername: (newUsername: string) => Promise<{ error?: string }>;
  deleteAccount: () => Promise<{ error?: string }>;
  resetPassword: (email: string) => Promise<{ error?: string }>;
  hasWebAuthn: boolean;
  registerWebAuthn: () => Promise<{ error?: string }>;
  signInWithWebAuthn: (loginOrEmail: string) => Promise<{ error?: string }>;
  removeWebAuthn: () => Promise<{ error?: string }>;
  /** Email verification */
  sendVerificationCode: () => Promise<{ error?: string }>;
  verifyCode: (code: string) => Promise<{ error?: string }>;
  verifyCodeAndChangePassword: (code: string, newPassword: string) => Promise<{ error?: string }>;
  /** TOTP 2FA */
  totpEnabled: boolean;
  setupTOTP: () => Promise<{ secret?: string; otpauthUrl?: string; error?: string }>;
  verifyTOTPSetup: (code: string) => Promise<{ error?: string }>;
  disableTOTP: () => Promise<{ error?: string }>;
  verifyTOTPLogin: (code: string) => Promise<{ error?: string }>;
  /** SMS 2FA */
  sms2faEnabled: boolean;
  phone: string | null;
  twilioConfigured: boolean;
  setupSms2fa: (phone: string) => Promise<{ error?: string; phone_masked?: string }>;
  verifySms2faSetup: (code: string) => Promise<{ error?: string }>;
  disableSms2fa: () => Promise<{ error?: string }>;
  sendSmsLoginCode: () => Promise<{ error?: string; phone_masked?: string }>;
  verifySmsLoginCode: (code: string) => Promise<{ error?: string }>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasWebAuthn, setHasWebAuthn] = useState(false);
  const [totpEnabled, setTotpEnabled] = useState(false);
  const [sms2faEnabled, setSms2faEnabled] = useState(false);
  const [phone, setPhone] = useState<string | null>(null);
  const [twilioConfigured, setTwilioConfigured] = useState(false);
  const [sessionExpiresAt, setSessionExpiresAt] = useState<number | null>(null);
  const [sessionWarning, setSessionWarning] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const expiryTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadProfile = useCallback(async (userId: string, userEmail?: string | null) => {
    const p = await ensureProfile(userId, userEmail);
    let merged = p;
    if (p) {
      try {
        const localAvatar = localStorage.getItem('sportowy-vibe-avatar-' + userId);
        if (localAvatar && !p.avatar_url) {
          merged = { ...p, avatar_url: localAvatar };
        }
      } catch { /* noop */ }
      // Backfill email from auth user into profile if missing
      if (!merged?.email && userEmail) {
        try {
          await updateProfile(userId, { email: userEmail });
          merged = { ...merged, email: userEmail };
        } catch { /* ignore */ }
      }
    }
    setProfile(merged);
    if (merged) {
      try {
        localStorage.setItem('sportowy-vibe-theme', merged.theme || 'light');
        if (merged.theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      } catch { /* noop */ }
      try {
        localStorage.setItem('sportowy-vibe-language', merged.language || 'pl');
        if (merged.language && merged.language !== i18n.language) {
          i18n.changeLanguage(merged.language);
        }
      } catch { /* noop */ }
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        loadProfile(s.user.id, s.user.email);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      updateSessionExpiry(s);
      if (s?.user) {
        loadProfile(s.user.id, s.user.email).then(() => {});
        // Auto-mark email as verified for OAuth users (Google already verified it)
        if (s.user.app_metadata?.provider === 'google' || s.user.user_metadata?.provider === 'google') {
          supabase
            .from('profiles')
            .update({ email_verified: true, updated_at: new Date().toISOString() })
            .eq('id', s.user.id)
            .then(() => { console.log('[Auth] OAuth user email auto-verified'); })
            .catch(() => {});
        }
        // After OAuth sign-in, silently create email identity
        // NOTE: We intentionally do NOT auto-generate a password after Google login.
        // Doing so previously OVERWROTE any password the user set themselves.
        // The user sets their own password explicitly via changePassword().
        // Auto-refresh: store session backup for WebAuthn fallback
        if (_event === 'SIGNED_IN' || _event === 'TOKEN_REFRESHED') {
          storeSessionBackup({
            access_token: s.access_token,
            refresh_token: s.refresh_token,
            expires_at: s.expires_at,
            userId: s.user.id,
          });
        }
        // Check if user has WebAuthn registered
        checkWebAuthnStatus(s.user.id);
      } else {
        setProfile(null);
        setHasWebAuthn(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadProfile]);

  useEffect(() => {
    if (user && profile !== null) setLoading(false);
    if (!user) setLoading(false);
  }, [user, profile]);

  // --- Turnstile Captcha Verification ---
  const verifyTurnstile = useCallback(async (token: string): Promise<{ error?: string }> => {
    try {
      const { data, error } = await supabase.functions.invoke('verify-turnstile', {
        body: { token },
      });
      if (error) return { error: error.message || 'Błąd weryfikacji captcha' };
      if (!data?.success) return { error: data?.error || 'Weryfikacja captcha nie powiodła się' };
      return {};
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Błąd weryfikacji captcha' };
    }
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return {};
  }, []);

  const signInWithLogin = useCallback(async (login: string, password: string, turnstileToken?: string): Promise<{ error?: string }> => {
    // Verify Turnstile if token provided
    if (turnstileToken) {
      const turnstileResult = await verifyTurnstile(turnstileToken);
      if (turnstileResult.error) return turnstileResult;
    }

    const normalizedLogin = login.trim().toLowerCase();
    const isEmail = normalizedLogin.includes('@');

    // Helper: fire-and-forget brute-force tracking via edge function
    const trackAttempt = (identifier: string, success: boolean) => {
      supabase.functions.invoke('auth-login', {
        body: { login: identifier, password: '', track_only: true, success },
      }).catch(() => { /* fire-and-forget */ });
    };

    // ── PATH 1: Email login ──
    if (isEmail) {
      const { error } = await supabase.auth.signInWithPassword({
        email: normalizedLogin,
        password,
      });

      if (!error) {
        trackAttempt(normalizedLogin, true);
        return {};
      }

      trackAttempt(normalizedLogin, false);

      // Fallback: try edge function (handles edge cases like OAuth users without password identity)
      const { data } = await supabase.functions.invoke('auth-login', {
        body: { login: normalizedLogin, password },
      });
      if (data?.session) {
        const { error: setError } = await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });
        if (setError) return { error: setError.message };
        return {};
      }
      return { error: data?.error || error.message };
    }

    // ── PATH 2: Username login ──
    // Resolve email from profiles table
    const { data: profileRow } = await supabase
      .from('profiles')
      .select('email')
      .eq('username', normalizedLogin)
      .maybeSingle();

    const profileEmail = profileRow?.email;

    if (!profileEmail) {
      // No profile with this username — try edge function as last resort (may be a legacy account)
      const { data } = await supabase.functions.invoke('auth-login', {
        body: { login: normalizedLogin, password },
      });
      if (data?.session) {
        const { error: setError } = await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });
        if (setError) return { error: setError.message };
        return {};
      }
      return { error: data?.error || 'Nieprawidłowy login lub hasło' };
    }

    // Direct login with resolved email
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: profileEmail,
      password,
    });

    if (!authError) {
      trackAttempt(profileEmail, true);
      return {};
    }

    trackAttempt(profileEmail, false);

    // Fallback to edge function
    const { data: fallbackData } = await supabase.functions.invoke('auth-login', {
      body: { login: profileEmail, password },
    });
    if (fallbackData?.session) {
      const { error: setError } = await supabase.auth.setSession({
        access_token: fallbackData.session.access_token,
        refresh_token: fallbackData.session.refresh_token,
      });
      if (setError) return { error: setError.message };
      return {};
    }

    return { error: authError.message };
  }, [verifyTurnstile]);

  const signUpWithEmail = useCallback(async (email: string, password: string, newsletterConsent?: boolean, turnstileToken?: string): Promise<{ error?: string; email_sent?: boolean; email_error?: string }> => {
    // Note: do NOT pre-verify Turnstile here. The register-user edge function
    // already does its own Cloudflare verification. Double-checking would
    // consume the one-time token and cause the second check to always fail.
    //
    // ROOT FIX for the published-site "Method POST is not allowed" error:
    // We call the edge function with a DIRECT fetch to the function URL using
    // explicit anon-key headers, instead of relying on supabase.functions.invoke().
    // invoke() can behave inconsistently on the published build (stale client /
    // transport quirks) and swallows the real gateway response, which is exactly
    // why we kept guessing. A plain fetch gives us the true HTTP status + body.
    const requestBody = JSON.stringify({
      email: email.trim().toLowerCase(),
      password,
      newsletterConsent: newsletterConsent || false,
      turnstileToken,
    });

    const fnUrl = `${supabaseUrl}/functions/v1/register-user`;

    try {
      const response = await fetch(fnUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'apikey': supabaseAnonKey,
        },
        body: requestBody,
      });

      const responseText = await response.text();
      let parsed: Record<string, unknown> | null = null;
      try { parsed = responseText ? JSON.parse(responseText) : null; } catch { /* non-JSON gateway error */ }

      console.log('[register] direct fetch status:', response.status, 'body:', responseText.slice(0, 300));

      // Gateway-level rejection (verify_jwt, method, routing) — surface the REAL message + status
      if (!response.ok && !parsed) {
        return {
          error: `Serwer rejestracji odrzucił żądanie (HTTP ${response.status}): ${responseText.slice(0, 160) || 'brak treści odpowiedzi'}. Odśwież stronę (Ctrl+Shift+R) i spróbuj ponownie.`,
        };
      }

      const data = (parsed || {}) as { success?: boolean; error?: string; email_sent?: boolean; email_error?: string };

      if (data.success === false || data.error) {
        return { error: data.error || `Błąd rejestracji (HTTP ${response.status})` };
      }

      return { email_sent: data.email_sent, email_error: data.email_error || undefined };
    } catch (err) {
      // True network failure — try invoke() as a secondary transport before giving up
      console.warn('[register] direct fetch failed, falling back to invoke():', err);
      try {
        const { data, error } = await supabase.functions.invoke('register-user', {
          body: {
            email: email.trim().toLowerCase(),
            password,
            newsletterConsent: newsletterConsent || false,
            turnstileToken,
          },
        });
        if (error) {
          return { error: 'Błąd połączenia z serwerem rejestracji. Sprawdź internet i spróbuj ponownie za chwilę.' };
        }
        if (data?.success === false || data?.error) {
          return { error: data.error || 'Błąd rejestracji' };
        }
        return { email_sent: data?.email_sent, email_error: data?.email_error || undefined };
      } catch (err2) {
        console.error('[register] both transports failed:', err2);
        return { error: 'Błąd połączenia z serwerem rejestracji. Spróbuj ponownie za chwilę.' };
      }
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error) return { error: error.message };
    return {};
  }, []);

  const signOut = useCallback(async () => {
    // SOFT sign-out: clear local state only — do NOT invalidate tokens server-side.
    // Use hardSignOut() for full invalidation (e.g. "Sign out everywhere").
    setUser(null);
    setSession(null);
    setProfile(null);
    setLoading(false);
    try {
      const uid = user?.id;
      if (uid) localStorage.removeItem('sportowy-vibe-avatar-' + uid);
      localStorage.removeItem('sportowy-vibe-theme');
      localStorage.removeItem('sportowy-vibe-language');
    } catch { /* noop */ }
    setHasWebAuthn(false);
  }, [user?.id]);

  const clearAllState = useCallback(() => {
    // 1. Clear custom encrypted session
    clearSessionBackup();

    // 2. Nuke ALL Supabase auth tokens from localStorage (belt-and-suspenders)
    try {
      const keysToNuke: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('sb-') || key.startsWith('sportowy-vibe-avatar-'))) {
          keysToNuke.push(key);
        }
      }
      keysToNuke.forEach(k => localStorage.removeItem(k));
    } catch { /* noop */ }

    // 3. Wipe React state
    setUser(null);
    setSession(null);
    setProfile(null);
    setLoading(false);
    setHasWebAuthn(false);
  }, []);

  const hardSignOut = useCallback(async () => {
    // FULL sign-out: invalidate server-side session AND nuke everything locally.
    // We clear local state FIRST (before the async call) so the UI updates instantly.
    // Then we try the server-side signOut — if it fails, tokens are already nuked.
    clearAllState();
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error('[Auth] hardSignOut API error:', e);
    }
  }, [clearAllState]);

  const changePassword = useCallback(async (newPassword: string): Promise<{ error?: string }> => {
    if (newPassword.length < 6) {
      return { error: 'Hasło musi mieć minimum 6 znaków' };
    }

    // STEP 1: Make sure we have a live session token.
    let token: string | null = null;
    try {
      let { data: sessionData } = await supabase.auth.getSession();
      let currentSession = sessionData?.session ?? null;

      if (!currentSession) {
        const backup = getSessionBackup();
        if (backup) {
          const { data: setData } = await supabase.auth.setSession({
            access_token: backup.access_token,
            refresh_token: backup.refresh_token,
          });
          currentSession = setData?.session ?? null;
        }
      }

      if (currentSession?.refresh_token) {
        const { data: refreshed } = await supabase.auth.refreshSession({
          refresh_token: currentSession.refresh_token,
        });
        if (refreshed?.session) currentSession = refreshed.session;
      }

      token = currentSession?.access_token ?? null;
    } catch { /* handled below */ }

    if (!token) {
      return { error: 'Sesja wygasła. Odśwież stronę lub zaloguj się ponownie, a potem ustaw hasło.' };
    }

    // STEP 2: PRIMARY — edge function ensure-password-identity (admin API).
    // The admin API (updateUserById) directly sets the encrypted_password in
    // auth.users without relying on client session quirks. This is the most
    // reliable method for password changes across all user types (email, OAuth).
    let edgeSucceeded = false;
    try {
      const { data, error } = await supabase.functions.invoke('ensure-password-identity', {
        body: { password: newPassword },
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!error && !data?.error && (data?.success || data?.already_exists)) {
        edgeSucceeded = true;
      } else if (data?.error) {
        console.warn('[changePassword] edge function error:', data.error);
      }
    } catch (e) {
      console.warn('[changePassword] edge function threw:', e);
    }

    // STEP 3: FALLBACK — native supabase.auth.updateUser().
    // Used when the edge function fails or the user already had a password
    // (already_exists). updateUser also correctly updates identity metadata.
    if (!edgeSucceeded) {
      try {
        const { error: updErr } = await supabase.auth.updateUser({ password: newPassword });
        if (updErr) {
          const msg = updErr.message?.toLowerCase() || '';
          if (!msg.includes('session') && !msg.includes('missing')) {
            return { error: updErr.message };
          }
          // If it's a session error, we already tried the edge function and it
          // also failed - surface a clear message
          return { error: 'Nie udało się zmienić hasła. Odśwież stronę i spróbuj ponownie.' };
        }
      } catch (e) {
        console.warn('[changePassword] native updateUser threw:', e);
        return { error: 'Błąd zmiany hasła. Spróbuj ponownie.' };
      }
    }

    // STEP 4: Refresh session backup so WebAuthn works immediately after.
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const s = sessionData?.session;
      if (s) {
        storeSessionBackup({
          access_token: s.access_token,
          refresh_token: s.refresh_token,
          expires_at: s.expires_at,
          userId: s.user.id,
        });
      }
    } catch { /* noop */ }

    // STEP 5: Update password_updated_at in the local profile so the UI shows it immediately
    if (user) {
      setProfile((prev) => prev ? { ...prev, password_updated_at: new Date().toISOString() } : prev);
    }

    return {};
  }, [user]);

  const changeUsername = useCallback(async (newUsername: string): Promise<{ error?: string }> => {
    if (!user) return { error: 'Not authenticated' };

    const trimmed = newUsername.trim().toLowerCase();

    if (!/^[a-z0-9_-]{3,30}$/.test(trimmed)) {
      return { error: 'Nazwa użytkownika: 3-30 znaków (litery, cyfry, podkreślenia, myślniki)' };
    }

    // Check availability
    const result = await checkUsernameAvailability(trimmed, user.id);
    if (!result.available) {
      return { error: result.error || 'Ta nazwa użytkownika jest już zajęta' };
    }

    // Update profile
    const updated = await updateProfile(user.id, { username: trimmed });
    if (!updated) {
      return { error: 'Nie udało się zapisać nazwy użytkownika' };
    }

    setProfile(updated);
    return {};
  }, [user]);

  const deleteAccount = useCallback(async () => {
    if (!user) return { error: 'Not authenticated' };
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) return { error: 'No session token' };

      const { data, error } = await supabase.functions.invoke('delete-user-account', {
        body: { userId: user.id },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (error || data?.error) {
        // Edge function failed — check if user was already deleted by a previous attempt
        try {
          const { data: userCheck } = await supabase.auth.getUser();
          if (!userCheck?.user) {
            // User already gone — just cleanup
            clearAllState();
            try { await supabase.auth.signOut(); } catch { /* ignore */ }
            return {};
          }
        } catch {
          // getUser failed too — likely user is gone
          clearAllState();
          try { await supabase.auth.signOut(); } catch { /* ignore */ }
          return {};
        }
        return { error: error?.message || data?.error || 'Błąd usuwania konta' };
      }

      // Success — full cleanup
      clearAllState();
      try { await supabase.auth.signOut(); } catch { /* ignore */ }

      return {};
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      return { error: msg };
    }
  }, [user, clearAllState]);

  const updateUserProfile = useCallback(async (updates: Partial<Pick<Profile, 'display_name' | 'username' | 'email' | 'avatar_url' | 'notifications_enabled' | 'theme' | 'language'>>) => {
    if (!user) throw new Error('Not authenticated');
    console.log('[AuthContext] updateUserProfile start, userId:', user.id, 'updates keys:', Object.keys(updates));
    const updated = await updateProfile(user.id, updates);
    if (!updated) {
      if (updates.avatar_url) {
        try {
          localStorage.setItem('sportowy-vibe-avatar-' + user.id, updates.avatar_url);
          console.log('[AuthContext] avatar saved to localStorage fallback');
        } catch (e) {
          console.error('[AuthContext] localStorage save failed:', e);
        }
      }
      throw new Error('Profile update failed — returned null');
    }
    console.log('[AuthContext] updateUserProfile success, new avatar_url length:', updated.avatar_url?.length ?? 0);
    setProfile(updated);
  }, [user]);

  const checkWebAuthnStatus = useCallback(async (userId: string) => {
    try {
      const { data } = await supabase.functions.invoke('webauthn-auth', {
        body: { action: 'check', userId },
      });
      setHasWebAuthn(!!data?.hasWebAuthn);
    } catch {
      setHasWebAuthn(false);
    }
  }, []);

  // --- Session backup restore (used by WebAuthn fallback) ---
  const restoreSessionFromBackup = useCallback(async (): Promise<{ error?: string }> => {
    const backup = getSessionBackup();
    if (!backup) {
      return { error: 'Brak zapisanej sesji. Zaloguj się hasłem.' };
    }

    const { data: setData, error: setError } = await supabase.auth.setSession({
      access_token: backup.access_token,
      refresh_token: backup.refresh_token,
    });

    if (setError || !setData?.session) {
      clearSessionBackup();
      return { error: 'Sesja wygasła. Zaloguj się ponownie hasłem.' };
    }

    // Refresh the backup with new tokens
    storeSessionBackup({
      access_token: setData.session.access_token,
      refresh_token: setData.session.refresh_token,
      expires_at: setData.session.expires_at,
      userId: backup.userId,
    });

    return {};
  }, []);

  const resetPassword = useCallback(async (email: string): Promise<{ error?: string }> => {
    if (!email || !email.includes('@')) {
      return { error: 'Podaj prawidłowy adres e-mail' };
    }

    try {
      const { data, error } = await supabase.functions.invoke('send-password-reset', {
        body: { email: email.trim().toLowerCase() },
      });

      if (error) {
        return { error: error.message || 'Nie udało się wysłać linku resetującego.' };
      }

      if (data?.success === false) {
        return { error: data.error || 'Nie udało się wysłać linku resetującego.' };
      }

      return {};
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Błąd połączenia z serwerem.' };
    }
  }, []);

  // --- WebAuthn (biometria / odcisk palca) ---

  const registerWebAuthn = useCallback(async (): Promise<{ error?: string }> => {
    if (!user) return { error: 'Musisz być zalogowany, aby zarejestrować biometrię.' };
    if (!isWebAuthnAvailable()) return { error: 'Biometria nie jest dostępna na tym urządzeniu.' };

    try {
      // Check platform authenticator availability
      const available = await (window.PublicKeyCredential as any).isUserVerifyingPlatformAuthenticatorAvailable();
      if (!available) return { error: 'To urządzenie nie obsługuje biometrii (odcisk palca / Face ID / Windows Hello).' };

      const origin = window.location.origin;
      const userName = profile?.username || user.email || 'user';
      const displayName = profile?.display_name || userName;

      // Step 1: Get registration challenge from server
      const { data: challengeData, error: challengeError } = await supabase.functions.invoke('webauthn-auth', {
        body: { action: 'register-challenge', userId: user.id, userName, userDisplayName: displayName, origin },
      });
      if (challengeError || challengeData?.error) {
        return { error: challengeData?.error || challengeError?.message || 'Błąd serwera' };
      }

      // Step 2: Call navigator.credentials.create()
      const options = challengeData.options;
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: base64urlToBuffer(options.challenge),
          rp: options.rp,
          user: {
            ...options.user,
            id: base64urlToBuffer(options.user.id),
          },
          pubKeyCredParams: options.pubKeyCredParams,
          timeout: options.timeout,
          attestation: options.attestation,
          excludeCredentials: options.excludeCredentials?.map((cred: any) => ({
            ...cred,
            id: base64urlToBuffer(cred.id),
          })),
          authenticatorSelection: options.authenticatorSelection,
        },
      }) as PublicKeyCredential | null;

      if (!credential) return { error: 'Rejestracja biometrii anulowana lub nieudana.' };

      // Step 3: Prepare response for server
      const response = (credential as any).response;
      const registrationResponse = {
        id: credential.id,
        rawId: bufferToBase64url(credential.rawId),
        response: {
          attestationObject: bufferToBase64url(response.attestationObject),
          clientDataJSON: bufferToBase64url(response.clientDataJSON),
        },
        type: credential.type,
      };

      // Step 4: Verify and store on server
      const { data: verifyData, error: verifyError } = await supabase.functions.invoke('webauthn-auth', {
        body: { action: 'register-verify', userId: user.id, credential: registrationResponse, origin },
      });
      if (verifyError || verifyData?.error) {
        return { error: verifyData?.error || verifyError?.message || 'Weryfikacja nie powiodła się' };
      }

      setHasWebAuthn(true);
      return {};
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Nieznany błąd';
      if (msg.includes('The operation either timed out') || msg.includes('AbortError')) {
        return { error: 'Rejestracja anulowana lub przekroczono czas.' };
      }
      if (msg.includes('InvalidStateError') || msg.includes('exclude') || msg.includes('already') || msg.includes('exclusion')) {
        return { error: 'Windows Hello ma już zapisane dane biometryczne dla tego konta na tym urządzeniu. Usuń je w ustawieniach Windows Hello (Konta > Opcje logowania > Windows Hello) i spróbuj ponownie.' };
      }
      return { error: `Błąd biometrii: ${msg}` };
    }
  }, [user, profile]);

  const signInWithWebAuthn = useCallback(async (loginOrEmail: string): Promise<{ error?: string }> => {
    if (!loginOrEmail || !loginOrEmail.trim()) {
      return { error: 'Wpisz login lub e-mail przed użyciem biometrii.' };
    }
    if (!isWebAuthnAvailable()) return { error: 'Biometria nie jest dostępna na tym urządzeniu.' };

    try {
      const origin = window.location.origin;
      const trimmed = loginOrEmail.trim().toLowerCase();

      // Step 1: Resolve userId via edge function (has access to auth.users for email lookups)
      const { data: resolved, error: resolveError } = await supabase.functions.invoke('webauthn-auth', {
        body: { action: 'resolve-user', identifier: trimmed },
      });

      if (resolveError) {
        return { error: resolveError.message || 'Błąd wyszukiwania konta.' };
      }

      if (!resolved?.userId) {
        return { error: 'Nie znaleziono konta. Najpierw zaloguj się hasłem.' };
      }

      const targetUserId = resolved.userId;

      // If user doesn't have WebAuthn registered yet, tell them
      if (!resolved?.hasWebAuthn) {
        return { error: 'Biometria nie jest zarejestrowana dla tego konta. Zaloguj się hasłem, przejdź do Ustawień konta i kliknij "Zarejestruj biometrię".' };
      }

      // Step 2: Get authentication challenge (always with userId so browser shows only 1 passkey)
      const { data: challengeData, error: challengeError } = await supabase.functions.invoke('webauthn-auth', {
        body: { action: 'auth-challenge', origin, userId: targetUserId },
      });
      if (challengeError || challengeData?.error) {
        return { error: challengeData?.error || challengeError?.message || 'Błąd serwera' };
      }

      // Step 3: Call navigator.credentials.get()
      const options = challengeData.options;
      const assertion = await navigator.credentials.get({
        publicKey: {
          ...options,
          challenge: base64urlToBuffer(options.challenge),
          allowCredentials: options.allowCredentials?.map((cred: any) => ({
            ...cred,
            id: base64urlToBuffer(cred.id),
          })),
        },
      }) as PublicKeyCredential | null;

      if (!assertion) return { error: 'Logowanie biometryczne anulowane lub nieudane.' };

      // Step 4: Prepare assertion for server
      const response = (assertion as any).response;
      const authResponse = {
        id: assertion.id,
        rawId: bufferToBase64url(assertion.rawId),
        response: {
          authenticatorData: bufferToBase64url(response.authenticatorData),
          clientDataJSON: bufferToBase64url(response.clientDataJSON),
          signature: bufferToBase64url(response.signature),
          userHandle: response.userHandle ? bufferToBase64url(response.userHandle) : null,
        },
        type: assertion.type,
      };

      // Step 5: Verify on server
      const { data: verifyData, error: verifyError } = await supabase.functions.invoke('webauthn-auth', {
        body: { action: 'auth-verify', credential: authResponse, challengeKey: challengeData.challengeKey, origin },
      });
      if (verifyError || verifyData?.error) {
        return { error: verifyData?.error || verifyError?.message || 'Weryfikacja biometryczna nie powiodła się' };
      }

      // Step 6: Use session returned by edge function (the REAL fix — no more localStorage guessing)
      if (verifyData?.session) {
        const { error: setError } = await supabase.auth.setSession({
          access_token: verifyData.session.access_token,
          refresh_token: verifyData.session.refresh_token,
        });

        if (setError) {
          return { error: 'Weryfikacja biometryczna OK, ale nie udało się utworzyć sesji. Spróbuj ponownie.' };
        }

        // Store backup for future WebAuthn logins
        storeSessionBackup({
          access_token: verifyData.session.access_token,
          refresh_token: verifyData.session.refresh_token,
          expires_at: verifyData.session.expires_at,
          userId: targetUserId,
        });

        return {};
      }

      // Step 7: Fallback — restore session from localStorage backup (for older edge function versions)
      const backupResult = await restoreSessionFromBackup();
      if (backupResult.error) {
        return { error: backupResult.error };
      }

      return {};
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Nieznany błąd';
      if (msg.includes('The operation either timed out') || msg.includes('AbortError')) {
        return { error: 'Logowanie anulowane lub przekroczono czas.' };
      }
      return { error: `Błąd biometrii: ${msg}` };
    }
  }, [restoreSessionFromBackup]);

  const removeWebAuthn = useCallback(async (): Promise<{ error?: string }> => {
    if (!user) return { error: 'Musisz być zalogowany.' };

    try {
      const { data, error } = await supabase.functions.invoke('webauthn-auth', {
        body: { action: 'remove', userId: user.id },
      });
      if (error || data?.error) {
        return { error: data?.error || error?.message || 'Nie udało się usunąć biometrii' };
      }

      setHasWebAuthn(false);
      return {};
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Nieznany błąd' };
    }
  }, [user]);

  // ─── Session expiry tracking ───
  const updateSessionExpiry = useCallback((s: Session | null) => {
    if (s?.expires_at) {
      const expiryMs = s.expires_at * 1000; // Supabase gives seconds
      setSessionExpiresAt(expiryMs);
    } else {
      setSessionExpiresAt(null);
    }
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error || !data?.session) {
        setSessionExpired(true);
        console.warn('[Auth] Session refresh failed:', error?.message);
        return;
      }
      const s = data.session;
      setSession(s);
      setUser(s.user ?? null);
      updateSessionExpiry(s);
      setSessionExpired(false);
      setSessionWarning(false);
      // Store backup
      storeSessionBackup({
        access_token: s.access_token,
        refresh_token: s.refresh_token,
        expires_at: s.expires_at,
        userId: s.user.id,
      });
      console.log('[Auth] Session refreshed, new expiry:', new Date(s.expires_at! * 1000).toLocaleTimeString());
    } catch (err) {
      console.error('[Auth] Session refresh threw:', err);
    }
  }, [updateSessionExpiry]);

  // Periodic expiry check + auto-refresh
  useEffect(() => {
    if (!session || !session.expires_at) return;

    const checkExpiry = () => {
      const now = Date.now();
      const expiryMs = session.expires_at! * 1000;
      const remainingMs = expiryMs - now;

      if (remainingMs <= 0) {
        setSessionExpired(true);
        setSessionWarning(false);
        return;
      }

      if (remainingMs <= AUTO_REFRESH_BEFORE_MS) {
        // Auto-refresh silently
        refreshSession();
        return;
      }

      if (remainingMs <= WARNING_BEFORE_EXPIRY_MS) {
        setSessionWarning(true);
      } else {
        setSessionWarning(false);
      }
    };

    checkExpiry(); // immediate
    expiryTimerRef.current = setInterval(checkExpiry, SESSION_CHECK_INTERVAL_MS);

    return () => {
      if (expiryTimerRef.current) {
        clearInterval(expiryTimerRef.current);
        expiryTimerRef.current = null;
      }
    };
  }, [session, refreshSession]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (expiryTimerRef.current) {
        clearInterval(expiryTimerRef.current);
      }
    };
  }, []);

  // ─── Email verification ───

  const sendVerificationCode = useCallback(async (): Promise<{ error?: string }> => {
    if (!user) return { error: 'Not authenticated' };
    try {
      const { data, error } = await supabase.functions.invoke('send-verification-code', {
        body: { action: 'send' },
      });
      if (error || data?.error) {
        return { error: data?.error || error?.message || 'Nie udało się wysłać kodu' };
      }
      return {};
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Błąd wysyłania kodu' };
    }
  }, [user]);

  const verifyCode = useCallback(async (code: string): Promise<{ error?: string }> => {
    if (!user) return { error: 'Not authenticated' };
    try {
      const { data, error } = await supabase.functions.invoke('send-verification-code', {
        body: { action: 'verify', code },
      });
      if (error || data?.error) {
        return { error: data?.error || error?.message || 'Nieprawidłowy kod' };
      }
      return {};
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Błąd weryfikacji' };
    }
  }, [user]);

  const verifyCodeAndChangePassword = useCallback(async (code: string, newPassword: string): Promise<{ error?: string }> => {
    if (!user) return { error: 'Not authenticated' };

    // First verify the code
    const verifyResult = await verifyCode(code);
    if (verifyResult.error) return verifyResult;

    // Then change password
    const result = await changePassword(newPassword);
    return result;
  }, [user, verifyCode, changePassword]);

  // ─── TOTP 2FA ───

  const setupTOTP = useCallback(async (): Promise<{ secret?: string; otpauthUrl?: string; error?: string }> => {
    if (!user) return { error: 'Not authenticated' };
    try {
      const { data, error } = await supabase.functions.invoke('totp-verify', {
        body: { action: 'setup-generate' },
      });
      if (error || data?.error) {
        return { error: data?.error || error?.message || 'Błąd konfiguracji 2FA' };
      }
      return { secret: data.secret, otpauthUrl: data.otpauthUrl };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Błąd konfiguracji 2FA' };
    }
  }, [user]);

  const verifyTOTPSetup = useCallback(async (code: string): Promise<{ error?: string }> => {
    if (!user) return { error: 'Not authenticated' };
    try {
      const { data, error } = await supabase.functions.invoke('totp-verify', {
        body: { action: 'setup-verify', code },
      });
      if (error || data?.error) {
        return { error: data?.error || error?.message || 'Nieprawidłowy kod' };
      }
      setTotpEnabled(true);
      return {};
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Błąd weryfikacji 2FA' };
    }
  }, [user]);

  const disableTOTP = useCallback(async (): Promise<{ error?: string }> => {
    if (!user) return { error: 'Not authenticated' };
    try {
      const { data, error } = await supabase.functions.invoke('totp-verify', {
        body: { action: 'disable' },
      });
      if (error || data?.error) {
        return { error: data?.error || error?.message || 'Błąd wyłączania 2FA' };
      }
      setTotpEnabled(false);
      return {};
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Błąd wyłączania 2FA' };
    }
  }, [user]);

  const verifyTOTPLogin = useCallback(async (code: string): Promise<{ error?: string }> => {
    if (!user) return { error: 'Not authenticated' };
    try {
      const { data, error } = await supabase.functions.invoke('totp-verify', {
        body: { action: 'login-verify', code },
      });
      if (error || data?.error) {
        return { error: data?.error || error?.message || 'Nieprawidłowy kod 2FA' };
      }
      return {};
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Błąd weryfikacji 2FA' };
    }
  }, [user]);

  // ─── SMS 2FA ───

  const setupSms2fa = useCallback(async (phoneNumber: string): Promise<{ error?: string; phone_masked?: string }> => {
    if (!user) return { error: 'Not authenticated' };
    try {
      const { data, error } = await supabase.functions.invoke('send-sms-code', {
        body: { action: 'send_code', phone: phoneNumber, userId: user.id },
      });
      if (error || data?.error) {
        return { error: data?.error || error?.message || 'Nie udało się wysłać kodu SMS' };
      }
      return { phone_masked: data.phone_masked };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Błąd wysyłania SMS' };
    }
  }, [user]);

  const verifySms2faSetup = useCallback(async (code: string): Promise<{ error?: string }> => {
    if (!user) return { error: 'Not authenticated' };
    try {
      const { data, error } = await supabase.functions.invoke('send-sms-code', {
        body: { action: 'verify_code', code, userId: user.id },
      });
      if (error || data?.error) {
        return { error: data?.error || error?.message || 'Nieprawidłowy kod' };
      }
      setSms2faEnabled(true);
      return {};
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Błąd weryfikacji SMS' };
    }
  }, [user]);

  const disableSms2fa = useCallback(async (): Promise<{ error?: string }> => {
    if (!user) return { error: 'Not authenticated' };
    try {
      const { data, error } = await supabase.functions.invoke('send-sms-code', {
        body: { action: 'disable', userId: user.id },
      });
      if (error || data?.error) {
        return { error: data?.error || error?.message || 'Błąd wyłączania SMS 2FA' };
      }
      setSms2faEnabled(false);
      return {};
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Błąd wyłączania SMS 2FA' };
    }
  }, [user]);

  const sendSmsLoginCode = useCallback(async (): Promise<{ error?: string; phone_masked?: string }> => {
    if (!user) return { error: 'Not authenticated' };
    try {
      const { data, error } = await supabase.functions.invoke('send-sms-code', {
        body: { action: 'send_login_code', userId: user.id },
      });
      if (error || data?.error) {
        return { error: data?.error || error?.message || 'Nie udało się wysłać kodu SMS' };
      }
      return { phone_masked: data.phone_masked };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Błąd wysyłania SMS' };
    }
  }, [user]);

  const verifySmsLoginCode = useCallback(async (code: string): Promise<{ error?: string }> => {
    if (!user) return { error: 'Not authenticated' };
    try {
      const { data, error } = await supabase.functions.invoke('send-sms-code', {
        body: { action: 'verify_login_code', code, userId: user.id },
      });
      if (error || data?.error) {
        return { error: data?.error || error?.message || 'Nieprawidłowy kod SMS' };
      }
      return {};
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Błąd weryfikacji SMS' };
    }
  }, [user]);

  // Check TOTP status on auth state change
  useEffect(() => {
    if (user) {
      supabase.functions.invoke('totp-verify', { body: { action: 'check' } }).then(({ data }) => {
        if (data?.totp_enabled !== undefined) setTotpEnabled(data.totp_enabled);
      }).catch(() => {});
    } else {
      setTotpEnabled(false);
    }
  }, [user]);

  // Check SMS 2FA status on auth state change
  useEffect(() => {
    if (user) {
      supabase.functions.invoke('send-sms-code', { body: { action: 'check', userId: user.id } }).then(({ data }) => {
        if (data?.sms_2fa_enabled !== undefined) setSms2faEnabled(data.sms_2fa_enabled);
        if (data?.phone !== undefined) setPhone(data.phone);
        if (data?.twilio_configured !== undefined) setTwilioConfigured(data.twilio_configured);
      }).catch(() => {});
    } else {
      setSms2faEnabled(false);
      setPhone(null);
      setTwilioConfigured(false);
    }
  }, [user]);

  const isAdmin = profile?.role === 'admin';
  const isModerator = profile?.role === 'moderator' || isAdmin;

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        isAdmin,
        isModerator,
        sessionExpiresAt,
        sessionWarning,
        sessionExpired,
        refreshSession,
        signInWithEmail,
        signInWithLogin,
        signUpWithEmail,
        signInWithGoogle,
        signOut,
        hardSignOut,
        updateUserProfile,
        changePassword,
        changeUsername,
        deleteAccount,
        resetPassword,
        registerWebAuthn,
        signInWithWebAuthn,
        removeWebAuthn,
        hasWebAuthn,
        sendVerificationCode,
        verifyCode,
        verifyCodeAndChangePassword,
        totpEnabled,
        setupTOTP,
        verifyTOTPSetup,
        disableTOTP,
        verifyTOTPLogin,
        sms2faEnabled,
        phone,
        twilioConfigured,
        setupSms2fa,
        verifySms2faSetup,
        disableSms2fa,
        sendSmsLoginCode,
        verifySmsLoginCode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}