import { supabase } from '@/lib/supabase';

export interface SiteContent {
  id: number;
  content_key: string;
  content_text: string;
  updated_at: string;
}

// ─── Cache with queue lock ─────────────────────────────────────────
let contentCache: Map<string, string> | null = null;
let cacheLoading: Promise<Map<string, string>> | null = null;

function ensureCache(): Promise<Map<string, string>> {
  if (contentCache) return Promise.resolve(contentCache);
  if (cacheLoading) return cacheLoading;

  cacheLoading = (async () => {
    let retries = 3;
    while (retries > 0) {
      const { data, error } = await supabase
        .from('site_content')
        .select('content_key, content_text');

      if (!error && data) {
        contentCache = new Map();
        for (const row of data) {
          contentCache.set(row.content_key, row.content_text);
        }
        return contentCache;
      }

      console.warn(`[siteContent] ensureCache attempt failed (${4 - retries}/3):`, error?.message);
      retries--;
      if (retries > 0) {
        await new Promise((r) => setTimeout(r, 500));
      }
    }

    // Last resort: empty cache so we fall through to direct fetches
    console.error('[siteContent] ensureCache: all retries exhausted, using empty cache');
    contentCache = new Map();
    return contentCache;
  })();

  return cacheLoading;
}

/**
 * Get a single content entry by key.
 * Returns the text or null if not found.
 */
export async function getContentByKey(key: string): Promise<string | null> {
  const cache = await ensureCache();
  if (cache.has(key)) return cache.get(key)!;

  // Direct fetch as fallback
  const { data, error } = await supabase
    .from('site_content')
    .select('content_text')
    .eq('content_key', key)
    .maybeSingle();

  if (error || !data) return null;

  const text = data.content_text;
  cache.set(key, text);
  return text;
}

/**
 * Get multiple content entries by key prefix.
 */
export async function getContentByPrefix(prefix: string): Promise<Record<string, string>> {
  const cache = await ensureCache();
  const result: Record<string, string> = {};

  for (const [key, text] of cache) {
    if (key.startsWith(prefix)) {
      result[key] = text;
    }
  }

  if (Object.keys(result).length > 0) return result;

  const { data, error } = await supabase
    .from('site_content')
    .select('content_key, content_text')
    .ilike('content_key', `${prefix}%`);

  if (error || !data) return {};

  for (const row of data) {
    result[row.content_key] = row.content_text;
    cache.set(row.content_key, row.content_text);
  }
  return result;
}

/**
 * Perform the raw upsert and VERIFY it actually wrote a row.
 *
 * CRITICAL: Supabase .upsert() WITHOUT .select() returns NO error when RLS
 * silently blocks the write (0 rows affected) — e.g. when the access token is
 * stale and auth.uid() becomes null inside the RLS policy. That produced a
 * fake "Zapisano!" while nothing persisted. By adding .select() and checking
 * that a row actually came back, we can tell a real success from a silent block.
 */
async function rawUpsert(key: string, text: string): Promise<{ ok: boolean; blocked: boolean; message?: string }> {
  const { data, error } = await supabase
    .from('site_content')
    .upsert(
      { content_key: key, content_text: text, updated_at: new Date().toISOString() },
      { onConflict: 'content_key' }
    )
    .select('content_key');

  if (error) {
    // 42501 = RLS violation / insufficient privilege
    const blocked = error.code === '42501' || /row-level security|policy/i.test(error.message || '');
    return { ok: false, blocked, message: error.message };
  }

  // No error but ALSO no returned row => RLS silently swallowed the write.
  if (!data || data.length === 0) {
    return { ok: false, blocked: true, message: 'RLS blocked write (0 rows) — token likely stale' };
  }

  return { ok: true, blocked: false };
}

/**
 * Update (upsert) a content entry. Admin-only via RLS.
 * Returns true ONLY when the row genuinely persisted in the database.
 *
 * If the first attempt is silently blocked (stale token), we refresh the
 * Supabase session to restore a valid auth.uid() and retry once.
 */
export async function updateContent(key: string, text: string): Promise<boolean> {
  let result = await rawUpsert(key, text);

  // Silent block or explicit RLS error => the token is probably stale.
  // Refresh the session so auth.uid() resolves again, then retry once.
  if (!result.ok && result.blocked) {
    console.warn(`[siteContent] updateContent("${key}") blocked — refreshing session and retrying...`);
    try {
      await supabase.auth.refreshSession();
    } catch (e) {
      console.warn('[siteContent] refreshSession failed:', e);
    }
    result = await rawUpsert(key, text);
  }

  if (!result.ok) {
    console.error(`[siteContent] updateContent("${key}") FAILED to persist:`, result.message);
    // Keep cache in sync with reality: drop any stale optimistic value.
    if (contentCache && contentCache.has(key)) {
      // do not overwrite with unsaved text
    }
    return false;
  }

  // Verified write — update cache.
  if (contentCache) {
    contentCache.set(key, text);
  }
  return true;
}

/**
 * Fetch all content entries (for admin panel).
 */
export async function fetchAllContent(): Promise<SiteContent[]> {
  const { data, error } = await supabase
    .from('site_content')
    .select('*')
    .order('content_key', { ascending: true });

  if (error) {
    console.error('[siteContent] fetchAllContent error:', error);
    return [];
  }

  return (data || []) as SiteContent[];
}

/**
 * Bust cache (after admin changes).
 */
export function bustContentCache(): void {
  contentCache = null;
  cacheLoading = null;
}