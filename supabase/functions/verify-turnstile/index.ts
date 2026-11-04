import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { token } = await req.json();

    if (!token) {
      return new Response(JSON.stringify({ success: false, error: "Brak tokenu captcha" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const TURNSTILE_SECRET_KEY = Deno.env.get("TURNSTILE_SECRET_KEY");

    if (!TURNSTILE_SECRET_KEY) {
      console.error("[verify-turnstile] TURNSTILE_SECRET_KEY not configured");
      return new Response(JSON.stringify({ success: false, error: "Captcha nie jest skonfigurowana" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("[verify-turnstile] Verifying token, secret prefix:", TURNSTILE_SECRET_KEY.slice(0, 8) + "...");

    const formData = new URLSearchParams();
    formData.append("secret", TURNSTILE_SECRET_KEY);
    formData.append("response", token);

    const ip = req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for") || "";
    if (ip) formData.append("remoteip", ip.split(",")[0].trim());

    const verifyRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData.toString(),
    });

    const verifyData = await verifyRes.json();
    console.log("[verify-turnstile] Cloudflare response:", JSON.stringify(verifyData));

    if (!verifyData.success) {
      const errorCodes: string[] = verifyData["error-codes"] || [];
      console.warn("[verify-turnstile] Verification FAILED — error codes:", errorCodes.join(", "));
      return new Response(JSON.stringify({
        success: false,
        error: "Weryfikacja captcha nie powiodła się",
        error_codes: errorCodes,
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("[verify-turnstile] Verification passed");
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[verify-turnstile] Unexpected error:", err);
    return new Response(JSON.stringify({ success: false, error: "Błąd weryfikacji captcha" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
