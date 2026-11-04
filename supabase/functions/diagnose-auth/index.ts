import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

// Read-only diagnostic. Reproduces BOTH auth paths against register-user:
//  (A) the legacy anon JWT key (server-side SUPABASE_ANON_KEY)
//  (B) the NEW publishable key that the BROWSER actually uses (sb_publishable_...)
// so we can see if the gateway treats the two keys differently — that mismatch
// is the prime suspect for the browser-only "Method POST is not allowed" error.
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
  const LEGACY_ANON = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  // The exact publishable key the browser ships (public, safe to embed here for a probe)
  const PUBLISHABLE = "sb_publishable_5RnlEH-2wjc9TWxgKrCHrA_vme4QJUW";

  const url = `${SUPABASE_URL}/functions/v1/register-user`;

  async function probe(label: string, key: string) {
    let httpStatus = 0;
    let bodyText = "";
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${key}`,
          "apikey": key,
        },
        body: JSON.stringify({ action: "__diagnostic_probe__" }),
      });
      httpStatus = res.status;
      bodyText = (await res.text()).slice(0, 300);
    } catch (e) {
      bodyText = "fetch error: " + (e instanceof Error ? e.message : String(e));
    }
    const lower = bodyText.toLowerCase();
    const blocked = httpStatus === 401 || httpStatus === 405 ||
      lower.includes("method post is not allowed") ||
      lower.includes("invalid jwt") ||
      lower.includes("missing authorization") ||
      lower.includes("no api key") ||
      lower.includes("invalid api key");
    return {
      label,
      keyPrefix: key.slice(0, 14) + "…",
      httpStatus,
      verdict: blocked ? "❌ BLOCKED by gateway" : "✅ POST reaches function code",
      bodyPreview: bodyText,
    };
  }

  const results = [
    await probe("Legacy anon JWT (SUPABASE_ANON_KEY)", LEGACY_ANON),
    await probe("NEW publishable key (what the BROWSER uses)", PUBLISHABLE),
  ];

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Auth Key Diagnostic</title>
  <style>body{font-family:monospace;background:#0f172a;color:#e2e8f0;padding:24px;line-height:1.6}
  h1{color:#14b8a6}.ok{color:#4ade80}.bad{color:#f87171}table{border-collapse:collapse;width:100%;margin-top:16px}
  td,th{border:1px solid #334155;padding:8px 12px;text-align:left;font-size:13px;vertical-align:top}th{background:#1e293b}</style></head>
  <body><h1>register-user — two-key probe</h1>
  <table><tr><th>Auth key</th><th>Prefix</th><th>HTTP</th><th>Verdict</th><th>Body preview</th></tr>
  ${results.map((r) => `<tr><td>${r.label}</td><td>${r.keyPrefix}</td><td>${r.httpStatus}</td><td class="${String(r.verdict).startsWith("✅") ? "ok" : "bad"}">${r.verdict}</td><td>${String(r.bodyPreview).replace(/</g, "&lt;")}</td></tr>`).join("")}
  </table></body></html>`;

  return new Response(html, {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
  });
});
