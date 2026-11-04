import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// TOTP implementation using Web Crypto API
async function generateTOTPSecret(): Promise<string> {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  return base32Encode(bytes);
}

function base32Encode(buffer: Uint8Array): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = 0;
  let value = 0;
  let output = "";

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;

    while (bits >= 5) {
      output += alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += alphabet[(value << (5 - bits)) & 31];
  }

  return output;
}

function base32Decode(encoded: string): Uint8Array {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const cleaned = encoded.toUpperCase().replace(/[^A-Z2-7]/g, "");
  let bits = 0;
  let value = 0;
  const output: number[] = [];

  for (let i = 0; i < cleaned.length; i++) {
    const idx = alphabet.indexOf(cleaned[i]);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;

    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return new Uint8Array(output);
}

async function generateTOTP(secret: string, timeStep = 30, digits = 6): Promise<string> {
  const key = base32Decode(secret);
  const counter = Math.floor(Date.now() / 1000 / timeStep);
  const counterBytes = new Uint8Array(8);
  
  let c = counter;
  for (let i = 7; i >= 0; i--) {
    counterBytes[i] = c & 0xff;
    c = Math.floor(c / 256);
  }

  const cryptoKey = await crypto.subtle.importKey(
    "raw", key,
    { name: "HMAC", hash: "SHA-1" },
    false, ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", cryptoKey, counterBytes);
  const sigBytes = new Uint8Array(signature);
  
  const offset = sigBytes[sigBytes.length - 1] & 0x0f;
  const binary = ((sigBytes[offset] & 0x7f) << 24) |
    ((sigBytes[offset + 1] & 0xff) << 16) |
    ((sigBytes[offset + 2] & 0xff) << 8) |
    (sigBytes[offset + 3] & 0xff);

  const otp = binary % Math.pow(10, digits);
  return String(otp).padStart(digits, "0");
}

serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "User not found" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { action } = await req.json();

    if (action === "setup-generate") {
      // Check if already enabled
      const { data: existing } = await supabaseClient
        .from("profiles")
        .select("totp_enabled")
        .eq("id", user.id)
        .single();

      if (existing?.totp_enabled) {
        return new Response(JSON.stringify({ error: "2FA jest już włączone. Najpierw je wyłącz." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const secret = await generateTOTPSecret();
      const email = user.email || "user";
      const otpauthUrl = `otpauth://totp/Sportowy%20VIBE:${encodeURIComponent(email)}?secret=${secret}&issuer=Sportowy%20VIBE&algorithm=SHA1&digits=6&period=30`;

      // Store secret temporarily (not enabled yet)
      await supabaseClient
        .from("profiles")
        .update({ totp_secret: secret })
        .eq("id", user.id);

      return new Response(JSON.stringify({ success: true, secret, otpauthUrl }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "setup-verify") {
      const { code } = await req.json();

      if (!code || code.length !== 6) {
        return new Response(JSON.stringify({ error: "Nieprawidłowy format kodu" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const { data: profile, error: profileError } = await supabaseClient
        .from("profiles")
        .select("totp_secret, totp_enabled")
        .eq("id", user.id)
        .single();

      if (profileError || !profile?.totp_secret) {
        return new Response(JSON.stringify({ error: "Brak oczekującej konfiguracji 2FA" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      if (profile.totp_enabled) {
        return new Response(JSON.stringify({ error: "2FA jest już włączone" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const expectedCode = await generateTOTP(profile.totp_secret);

      if (expectedCode !== code) {
        return new Response(JSON.stringify({ error: "Nieprawidłowy kod. Spróbuj ponownie." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // Enable TOTP
      await supabaseClient
        .from("profiles")
        .update({ totp_enabled: true })
        .eq("id", user.id);

      return new Response(JSON.stringify({ success: true, message: "2FA włączone" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "disable") {
      await supabaseClient
        .from("profiles")
        .update({ totp_enabled: false, totp_secret: null })
        .eq("id", user.id);

      return new Response(JSON.stringify({ success: true, message: "2FA wyłączone" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "login-verify") {
      const { code: loginCode } = await req.json();

      if (!loginCode) {
        return new Response(JSON.stringify({ error: "Kod wymagany" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const { data: profile } = await supabaseClient
        .from("profiles")
        .select("totp_secret, totp_enabled")
        .eq("id", user.id)
        .single();

      if (!profile?.totp_enabled || !profile?.totp_secret) {
        return new Response(JSON.stringify({ error: "2FA nie jest włączone" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const expectedCode = await generateTOTP(profile.totp_secret);

      if (expectedCode !== loginCode) {
        return new Response(JSON.stringify({ error: "Nieprawidłowy kod 2FA" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      return new Response(JSON.stringify({ success: true, message: "2FA zweryfikowane" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "check") {
      const { data: profile } = await supabaseClient
        .from("profiles")
        .select("totp_enabled")
        .eq("id", user.id)
        .single();

      return new Response(JSON.stringify({ totp_enabled: profile?.totp_enabled ?? false }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});