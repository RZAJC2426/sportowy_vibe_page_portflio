import { createClient } from '@supabase/supabase-js';

let supabaseUrl = import.meta.env.VITE_PUBLIC_SUPABASE_URL as string;
let supabaseAnonKey = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY as string;

// Strip surrounding quotes that Readdy adds to .env values
supabaseUrl = supabaseUrl.replace(/^"|"$/g, '').replace(/\/+$/, '');
supabaseAnonKey = supabaseAnonKey.replace(/^"|"$/g, '');

export { supabaseAnonKey, supabaseUrl };

// Use the Readdy proxy URL for all Supabase calls (auth, REST, edge functions)
// The .supabase.co direct URL does not resolve DNS for this project
// Explicit auth config is critical for MOBILE: keeps the session alive across
// tab-backgrounding and auto-refreshes the access token so updateUser()/edge
// calls don't fail with "Auth session missing".
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
});

interface FunctionInvokeOptions {
  body?: Record<string, unknown>;
}

export async function invokeEdgeFunction(name: string, options?: FunctionInvokeOptions) {
  // Use supabase.functions.invoke() which handles the Readdy proxy correctly
  // Manual fetch() to supabaseUrl/functions/v1/... fails with "Failed to fetch"
  // because the Readdy proxy requires additional headers that the Supabase client provides
  const { data, error } = await supabase.functions.invoke(name, {
    body: options?.body,
  });

  if (error) {
    throw error;
  }

  return { data, error: null };
}