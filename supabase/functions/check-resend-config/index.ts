import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async () => {
  const resendKey = Deno.env.get("RESEND_API_KEY");
  const fromDomain = Deno.env.get("RESEND_FROM_DOMAIN");

  const checks = {
    resend_api_key_present: !!resendKey,
    resend_api_key_prefix: resendKey ? resendKey.slice(0, 10) + "..." : null,
    resend_from_domain_present: !!fromDomain,
    resend_from_domain_value: fromDomain || null,
  };

  const allOk = checks.resend_api_key_present && checks.resend_from_domain_present;

  return new Response(
    JSON.stringify({
      status: allOk ? "ok" : "missing_config",
      checks,
      message: allOk
        ? "Wszystkie sekrety Resend są skonfigurowane poprawnie."
        : "Brakuje konfiguracji Resend. Dodaj brakujące secrets w Supabase Dashboard.",
    }, null, 2),
    {
      status: allOk ? 200 : 503,
      headers: { "Content-Type": "application/json" },
    }
  );
});
