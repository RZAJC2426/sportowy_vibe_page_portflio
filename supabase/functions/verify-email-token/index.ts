import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

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
    const { token } = await req.json();

    if (!token) {
      return new Response(JSON.stringify({ success: false, status: "invalid_token", error: "Brak tokenu weryfikacyjnego" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find profile with matching token
    const { data: profiles, error: findError } = await supabaseAdmin
      .from("profiles")
      .select("id, email, email_verified, verification_token, verification_token_expires_at")
      .eq("verification_token", token)
      .limit(1);

    if (findError || !profiles || profiles.length === 0) {
      return new Response(JSON.stringify({ success: false, status: "invalid_token", error: "Nieprawidłowy lub wygasły token weryfikacyjny" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const profile = profiles[0];

    if (profile.email_verified) {
      return new Response(JSON.stringify({ success: true, already_verified: true, email: profile.email, message: "Adres e-mail był już wcześniej zweryfikowany" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check expiry
    if (profile.verification_token_expires_at) {
      const expiresAt = new Date(profile.verification_token_expires_at).getTime();
      if (Date.now() > expiresAt) {
        return new Response(JSON.stringify({ success: false, status: "expired", error: "Token weryfikacyjny wygasł. Zarejestruj się ponownie." }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Mark as verified
    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({
        email_verified: true,
        verification_token: null,
        verification_token_expires_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id);

    if (updateError) {
      console.error("[verify-email-token] Update error:", updateError);
      return new Response(JSON.stringify({ success: false, status: "error", error: "Nie udało się zweryfikować adresu e-mail" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, already_verified: false, email: profile.email, message: "Adres e-mail został zweryfikowany" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[verify-email-token] Unexpected error:", err);
    return new Response(JSON.stringify({ success: false, status: "error", error: "Wewnętrzny błąd serwera" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
