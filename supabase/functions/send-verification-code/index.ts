import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const RESEND_FROM_DOMAIN = Deno.env.get("RESEND_FROM_DOMAIN");

interface EmailSetting {
  key: string;
  value: string;
}

interface EmailTemplate {
  name: string;
  subject: string;
  html_body: string;
}

async function fetchEmailTemplate(
  supabaseClient: ReturnType<typeof createClient>,
  templateName: string,
): Promise<{ subject: string; html: string; settings: EmailSetting[] }> {
  const [{ data: tpls, error: tplErr }, { data: sets, error: setErr }] = await Promise.all([
    supabaseClient.from("email_templates").select("name,subject,html_body").eq("name", templateName).single(),
    supabaseClient.from("email_settings").select("key,value"),
  ]);

  if (tplErr || !tpls) {
    throw new Error(`Template '${templateName}' not found: ${tplErr?.message || "unknown"}`);
  }
  if (setErr) {
    throw new Error(`Email settings error: ${setErr.message}`);
  }

  const template = tpls as EmailTemplate;
  const settings = (sets || []) as EmailSetting[];

  let subject = template.subject;
  let html = template.html_body;

  settings.forEach((s) => {
    const re = new RegExp(`{{${s.key}}}`, "g");
    subject = subject.replace(re, s.value);
    html = html.replace(re, s.value);
  });

  return { subject, html, settings };
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
    if (userError || !user?.email) {
      return new Response(JSON.stringify({ error: "User not found" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const userEmail = user.email;

    // CRITICAL: Parse body ONCE - req.json() is a one-time stream
    const body = await req.json();
    const { action, code } = body;

    if (action === "send") {
      const generatedCode = String(Math.floor(100000 + Math.random() * 900000));
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      const { error: updateError } = await supabaseClient
        .from("profiles")
        .update({
          email_verification_code: generatedCode,
          email_verification_expires_at: expiresAt,
        })
        .eq("id", user.id);

      if (updateError) {
        console.error("Update error:", updateError);
        return new Response(JSON.stringify({ error: "Failed to store verification code" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      if (!RESEND_API_KEY) {
        return new Response(JSON.stringify({ error: "Resend not configured" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      try {
        const { subject, html, settings } = await fetchEmailTemplate(supabaseClient, "verification-code");

        const fromSetting = settings.find((s) => s.key === "from_address");
        const brandSetting = settings.find((s) => s.key === "brand_name");
        const fromDomain = RESEND_FROM_DOMAIN || "resend.dev";
        const fromAddress = fromSetting
          ? `${brandSetting?.value || "Sportowy VIBE"} <${fromSetting.value}>`
          : fromDomain === "resend.dev"
            ? "onboarding@resend.dev"
            : `Sportowy VIBE <noreply@${fromDomain}>`;

        const finalHtml = html.replace(/{{code}}/g, generatedCode);

        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: fromAddress,
            to: [userEmail],
            subject,
            html: finalHtml,
          }),
        });

        if (!response.ok) {
          const responseText = await response.text();
          let errorData: Record<string, unknown> = {};
          try { errorData = JSON.parse(responseText); } catch { /* ignore */ }
          console.error("Resend error:", errorData);
          await supabaseClient.from("profiles").update({ email_verification_code: null, email_verification_expires_at: null }).eq("id", user.id);
          return new Response(JSON.stringify({ error: String(errorData?.message || responseText || `Resend HTTP ${response.status}`) }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
      } catch (err) {
        console.error("Resend fetch error:", err);
        await supabaseClient.from("profiles").update({ email_verification_code: null, email_verification_expires_at: null }).eq("id", user.id);
        return new Response(JSON.stringify({ error: "Failed to send verification email" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      return new Response(JSON.stringify({ success: true, message: "Verification code sent" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "verify") {
      if (!code || code.length !== 6) {
        return new Response(JSON.stringify({ error: "Invalid code format" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const { data: profile, error: profileError } = await supabaseClient
        .from("profiles")
        .select("email_verification_code, email_verification_expires_at")
        .eq("id", user.id)
        .single();

      if (profileError || !profile) {
        return new Response(JSON.stringify({ error: "No verification code found" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      if (!profile.email_verification_code || !profile.email_verification_expires_at) {
        return new Response(JSON.stringify({ error: "No pending verification" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      if (new Date(profile.email_verification_expires_at) < new Date()) {
        await supabaseClient.from("profiles").update({ email_verification_code: null, email_verification_expires_at: null }).eq("id", user.id);
        return new Response(JSON.stringify({ error: "Kod wygasl. Wyslij nowy kod." }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      if (profile.email_verification_code !== code) {
        return new Response(JSON.stringify({ error: "Nieprawidlowy kod" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      await supabaseClient.from("profiles").update({ email_verification_code: null, email_verification_expires_at: null }).eq("id", user.id);

      return new Response(JSON.stringify({ success: true, message: "Code verified" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
