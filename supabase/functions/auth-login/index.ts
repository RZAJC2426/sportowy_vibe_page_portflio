import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MAX_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 300; // 5 minutes

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    const body = await req.json();
    const { login, password, track_only, success } = body || {};

    // ── TRACK-ONLY MODE (fire-and-forget brute-force tracking) ──
    if (track_only === true && login) {
      const normalizedLogin = login.trim().toLowerCase();
      const { data: profiles } = await supabaseAdmin
        .from("profiles")
        .select("id, login_attempts, locked_until, username, email")
        .or(`username.eq.${normalizedLogin},email.eq.${normalizedLogin}`)
        .limit(1);

      const profile = profiles?.[0];
      if (profile) {
        if (success) {
          await supabaseAdmin.from("profiles").update({
            login_attempts: 0,
            locked_until: null,
          }).eq("id", profile.id);
        } else {
          const attempts = (profile.login_attempts || 0) + 1;
          const update: Record<string, unknown> = { login_attempts: attempts };
          if (attempts >= MAX_ATTEMPTS) {
            update.locked_until = new Date(Date.now() + LOCKOUT_SECONDS * 1000).toISOString();
          }
          await supabaseAdmin.from("profiles").update(update).eq("id", profile.id);
        }
      }
      return new Response(JSON.stringify({ tracked: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── FULL LOGIN MODE (fallback when direct signInWithPassword fails) ──
    if (!login || !password) {
      return new Response(JSON.stringify({ error: "Login i has\u0142o s\u0105 wymagane" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const normalizedLogin = login.trim().toLowerCase();

    // Brute-force check via profiles table
    const { data: bruteData } = await supabaseAdmin
      .from("profiles")
      .select("id, login_attempts, locked_until, username, email")
      .or(`username.eq.${normalizedLogin},email.eq.${normalizedLogin}`)
      .limit(1);

    const profile = bruteData?.[0];

    if (profile?.locked_until) {
      const lockUntil = new Date(profile.locked_until).getTime();
      if (Date.now() < lockUntil) {
        const remaining = Math.ceil((lockUntil - Date.now()) / 1000);
        return new Response(JSON.stringify({ error: `Zbyt wiele pr\u00f3b logowania. Spr\u00f3buj ponownie za ${remaining} sekund.` }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Try login with admin API
    const emailForLogin = profile?.email || normalizedLogin;

    const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
      email: emailForLogin,
      password,
    });

    if (authError || !authData?.session) {
      // Increment attempt counter
      if (profile) {
        const attempts = (profile.login_attempts || 0) + 1;
        const update: Record<string, unknown> = { login_attempts: attempts };
        if (attempts >= MAX_ATTEMPTS) {
          update.locked_until = new Date(Date.now() + LOCKOUT_SECONDS * 1000).toISOString();
        }
        await supabaseAdmin.from("profiles").update(update).eq("id", profile.id);
      }

      const msg = authError?.message || "Nieprawid\u0142owy login lub has\u0142o";
      return new Response(JSON.stringify({ error: msg }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Reset brute-force counter on success
    if (profile) {
      await supabaseAdmin.from("profiles").update({
        login_attempts: 0,
        locked_until: null,
      }).eq("id", profile.id);
    }

    return new Response(JSON.stringify({
      session: {
        access_token: authData.session.access_token,
        refresh_token: authData.session.refresh_token,
        expires_at: authData.session.expires_at,
      },
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[auth-login] Unexpected error:", err);
    return new Response(JSON.stringify({ error: "Wewn\u0119trzny b\u0142\u0105d serwera" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
