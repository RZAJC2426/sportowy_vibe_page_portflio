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
    const { token, password, mode } = await req.json();

    if (!token) {
      return new Response(JSON.stringify({
        success: false,
        status: "invalid_token",
        error: "Brak tokenu resetowania w żądaniu.",
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- VERIFY-ONLY MODE: check token validity without consuming it ---
    if (mode === "verify") {
      const { data: profiles, error: findError } = await supabaseAdmin
        .from("profiles")
        .select("id, email, password_reset_token, password_reset_expires_at")
        .eq("password_reset_token", token)
        .limit(1);

      if (findError || !profiles || profiles.length === 0) {
        return new Response(JSON.stringify({
          success: false,
          status: "invalid_token",
          error: "Nieprawidłowy lub już wykorzystany link do resetowania hasła.",
        }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const profile = profiles[0];

      if (profile.password_reset_expires_at) {
        if (Date.now() > new Date(profile.password_reset_expires_at).getTime()) {
          return new Response(JSON.stringify({
            success: false,
            status: "expired",
            error: "Link do resetowania hasła wygasł. Poproś o nowy link.",
          }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      return new Response(JSON.stringify({
        success: true,
        status: "valid",
        email: profile.email,
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- RESET MODE: actually change the password ---

    if (!password || password.length < 6) {
      return new Response(JSON.stringify({
        success: false,
        status: "weak_password",
        error: "Hasło musi mieć minimum 6 znaków.",
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find profile with matching reset token
    const { data: profiles, error: findError } = await supabaseAdmin
      .from("profiles")
      .select("id, email, password_reset_token, password_reset_expires_at")
      .eq("password_reset_token", token)
      .limit(1);

    if (findError || !profiles || profiles.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        status: "invalid_token",
        error: "Nieprawidłowy lub już wykorzystany link do resetowania hasła.",
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const profile = profiles[0];

    // Check expiry
    if (profile.password_reset_expires_at) {
      if (Date.now() > new Date(profile.password_reset_expires_at).getTime()) {
        // Clean up expired token
        await supabaseAdmin
          .from("profiles")
          .update({
            password_reset_token: null,
            password_reset_expires_at: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", profile.id);

        return new Response(JSON.stringify({
          success: false,
          status: "expired",
          error: "Link do resetowania hasła wygasł. Poproś o nowy link.",
        }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Update the user's password via Admin API
    const { error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(
      profile.id,
      { password }
    );

    if (updateAuthError) {
      console.error("[resetPasswordConfirm] Auth update error:", JSON.stringify(updateAuthError));
      return new Response(JSON.stringify({
        success: false,
        status: "error",
        error: "Nie udało się zaktualizować hasła. Spróbuj ponownie później.",
        details: updateAuthError.message,
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Clear the reset token and mark password as updated
    const { error: clearError } = await supabaseAdmin
      .from("profiles")
      .update({
        password_reset_token: null,
        password_reset_expires_at: null,
        password_updated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id);

    if (clearError) {
      console.warn("[resetPasswordConfirm] Token clear warning:", clearError);
    }

    return new Response(JSON.stringify({
      success: true,
      message: "Hasło zostało pomyślnie zmienione. Możesz się teraz zalogować.",
      email: profile.email,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[resetPasswordConfirm] Unexpected error:", err);
    return new Response(JSON.stringify({
      success: false,
      status: "error",
      error: "Wewnętrzny błąd serwera. Spróbuj ponownie później.",
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
