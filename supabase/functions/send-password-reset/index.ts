import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

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
  supabaseAdmin: ReturnType<typeof createClient>,
  templateName: string,
): Promise<{ subject: string; html: string; settings: EmailSetting[] }> {
  const [{ data: tpls, error: tplErr }, { data: sets, error: setErr }] = await Promise.all([
    supabaseAdmin.from("email_templates").select("name,subject,html_body").eq("name", templateName).single(),
    supabaseAdmin.from("email_settings").select("key,value"),
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

async function sendResetEmail(
  toEmail: string,
  resetToken: string,
  supabaseAdmin: ReturnType<typeof createClient>,
): Promise<{ sent: boolean; error?: string }> {
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  const RESEND_FROM_DOMAIN = Deno.env.get("RESEND_FROM_DOMAIN");

  if (!RESEND_API_KEY) return { sent: false, error: "RESEND_API_KEY not configured" };
  if (!RESEND_FROM_DOMAIN) return { sent: false, error: "RESEND_FROM_DOMAIN not configured" };

  try {
    const { subject, html, settings } = await fetchEmailTemplate(supabaseAdmin, "password-reset");

    const fromSetting = settings.find((s) => s.key === "from_address");
    const domainSetting = settings.find((s) => s.key === "domain");
    const brandSetting = settings.find((s) => s.key === "brand_name");

    const fromAddress = fromSetting
      ? `${brandSetting?.value || "Sportowy VIBE"} <${fromSetting.value}>`
      : `Sportowy VIBE <noreply@${RESEND_FROM_DOMAIN}>`;

    const baseDomain = domainSetting?.value || `https://${RESEND_FROM_DOMAIN}`;
    const resetUrl = `${baseDomain}/reset-hasla?token=${resetToken}`;

    const finalHtml = html.replace(/{{action_url}}/g, resetUrl);

    console.log("[sendPasswordReset] Sending to:", toEmail, "from:", fromAddress);

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [toEmail],
        subject,
        html: finalHtml,
      }),
    });

    const responseText = await response.text();
    console.log("[sendPasswordReset] Resend response status:", response.status);

    if (!response.ok) {
      let errorMsg = `Resend HTTP ${response.status}`;
      try {
        const errorData = JSON.parse(responseText);
        errorMsg = errorData?.message || errorMsg;
      } catch { /* ignore */ }
      return { sent: false, error: errorMsg };
    }

    return { sent: true };
  } catch (err) {
    console.error("[sendPasswordReset] Error:", err);
    return { sent: false, error: err instanceof Error ? err.message : "Unknown Resend error" };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  const RESEND_FROM_DOMAIN = Deno.env.get("RESEND_FROM_DOMAIN");

  if (!RESEND_API_KEY || !RESEND_FROM_DOMAIN) {
    return new Response(JSON.stringify({
      success: false,
      error: "Brakuje konfiguracji Resend. Skontaktuj się z administratorem.",
    }), {
      status: 503,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { email } = await req.json();

    if (!email || !email.includes("@")) {
      return new Response(JSON.stringify({
        success: false,
        error: "Podaj prawidłowy adres e-mail.",
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: profiles, error: findError } = await supabaseAdmin
      .from("profiles")
      .select("id, email, email_verified, password_reset_token, password_reset_expires_at")
      .eq("email", normalizedEmail)
      .limit(1);

    if (findError || !profiles || profiles.length === 0) {
      console.log("[sendPasswordReset] Email not found:", normalizedEmail, "— returning success");
      return new Response(JSON.stringify({
        success: true,
        message: "Jeśli konto o podanym adresie istnieje, wysłaliśmy link do resetowania hasła.",
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const profile = profiles[0];

    if (profile.password_reset_expires_at) {
      const tokenAge = Date.now() - new Date(profile.password_reset_expires_at).getTime() + 60 * 60 * 1000;
      const secondsSinceGeneration = (60 * 60 * 1000 - tokenAge) / 1000;
      if (secondsSinceGeneration < 60 && secondsSinceGeneration > 0) {
        return new Response(JSON.stringify({
          success: false,
          error: "Zbyt wiele prób. Poczekaj chwilę przed kolejną wysyłką.",
          rate_limited: true,
        }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const resetToken = generateToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({
        password_reset_token: resetToken,
        password_reset_expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id);

    if (updateError) {
      console.error("[sendPasswordReset] Update error:", updateError);
      return new Response(JSON.stringify({
        success: false,
        error: "Nie udało się wygenerować tokenu resetowania.",
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const emailResult = await sendResetEmail(normalizedEmail, resetToken, supabaseAdmin);

    return new Response(JSON.stringify({
      success: true,
      message: "Jeśli konto o podanym adresie istnieje, wysłaliśmy link do resetowania hasła.",
      email_sent: emailResult.sent,
      email_error: emailResult.sent ? null : emailResult.error,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[sendPasswordReset] Unexpected error:", err);
    return new Response(JSON.stringify({
      success: false,
      error: "Wewnętrzny błąd serwera. Spróbuj ponownie później.",
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
