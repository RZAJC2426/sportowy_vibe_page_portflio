import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Simple in-memory rate limiter (per-function-instance, resets on cold start)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 20; // max 20 checks per IP per 60 seconds
const RATE_LIMIT_WINDOW_MS = 60_000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

Deno.serve(async (req: Request) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers });
  }

  // Rate limiting by IP
  const ip = req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for') || 'unknown';
  const clientIp = ip.split(',')[0].trim();
  
  if (!checkRateLimit(clientIp)) {
    return new Response(
      JSON.stringify({ available: false, error: 'Zbyt wiele zapytań. Spróbuj ponownie za chwilę.' }),
      { status: 200, headers }
    );
  }

  try {
    const { username, excludeUserId } = await req.json();

    if (!username || typeof username !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Username is required' }),
        { status: 400, headers }
      );
    }

    const trimmed = username.trim().toLowerCase();

    // Validate format: 3-30 chars, alphanumeric, underscores, hyphens
    if (!/^[a-z0-9_-]{3,30}$/.test(trimmed)) {
      return new Response(
        JSON.stringify({ available: false, error: 'Username must be 3-30 characters (letters, numbers, underscores, hyphens)' }),
        { status: 200, headers }
      );
    }

    // Validate excludeUserId is a valid UUID if provided
    if (excludeUserId) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(excludeUserId)) {
        return new Response(
          JSON.stringify({ error: 'Invalid excludeUserId format' }),
          { status: 200, headers }
        );
      }
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    let query = supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('username', trimmed);

    if (excludeUserId) {
      query = query.neq('id', excludeUserId);
    }

    const { data } = await query.maybeSingle();

    return new Response(
      JSON.stringify({ available: !data, username: trimmed }),
      { status: 200, headers }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers }
    );
  }
});
