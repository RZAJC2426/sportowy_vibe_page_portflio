import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function generatePassword(length = 16): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*_-+=";
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");

    // Verify token via getUser
    const { data: userData, error: verifyError } = await supabaseAdmin.auth.getUser(token);
    const authUser = userData?.user;

    if (verifyError || !authUser) {
      console.error("Token verification failed:", verifyError?.message || "No user");
      return new Response(
        JSON.stringify({ error: "Unauthorized — invalid token" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse body for optional custom password
    let customPassword: string | null = null;
    try {
      const body = await req.json();
      if (body?.password && typeof body.password === "string" && body.password.length >= 6) {
        customPassword = body.password;
      }
    } catch {
      // No body or invalid JSON — ignore, will use generated password
    }

    // Get FULL user details via admin API (includes encrypted_password)
    const { data: fullUserData } = await supabaseAdmin.auth.admin.getUserById(authUser.id);
    const fullUser = fullUserData?.user;

    // CRITICAL FIX: Check if user already has a password set.
    // If they do and no custom password was provided, do NOT overwrite it.
    const hasPassword = !!(fullUser?.encrypted_password && fullUser.encrypted_password.length > 0);

    if (hasPassword && !customPassword) {
      return new Response(
        JSON.stringify({
          already_exists: true,
          message: "User already has a password set — not overwriting",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use custom password if provided, otherwise generate one
    const password = customPassword || generatePassword(16);

    // Set the password via admin API — works for all users including OAuth
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      authUser.id,
      { password }
    );

    if (updateError) {
      console.error("Failed to set password:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to set password: " + updateError.message }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Record password_updated_at in profiles and backfill email
    const now = new Date().toISOString();
    try {
      const profileUpdates: Record<string, any> = {
        password_updated_at: now,
        updated_at: now,
      };
      if (authUser.email) {
        profileUpdates.email = authUser.email;
      }
      await supabaseAdmin
        .from("profiles")
        .update(profileUpdates)
        .eq("id", authUser.id);
    } catch {
      // Ignore — not critical
    }

    return new Response(
      JSON.stringify({
        success: true,
        auto_generated: !customPassword,
        password_updated_at: now,
        message_pl: customPassword
          ? "Has\u0142o zosta\u0142o zmienione. Mo\u017cesz teraz logowa\u0107 si\u0119 e-mailem i has\u0142em."
          : "Twoje has\u0142o do logowania bezpo\u015bredniego zosta\u0142o automatycznie wygenerowane. Mo\u017cesz teraz logowa\u0107 si\u0119 zar\u00f3wno przez Google, jak i bezpo\u015brednio e-mailem i has\u0142em.",
        message_en: customPassword
          ? "Password has been changed. You can now log in with your email and password."
          : "Your direct login password has been auto-generated. You can now log in both via Google and directly with your email and password.",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
