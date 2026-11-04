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

async function sendVerificationEmail(
  toEmail: string,
  verificationToken: string,
  supabaseAdmin: ReturnType<typeof createClient>,
): Promise<{ sent: boolean; error?: string }> {
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  const RESEND_FROM_DOMAIN = Deno.env.get("RESEND_FROM_DOMAIN");

  if (!RESEND_API_KEY) {
    return { sent: false, error: "RESEND_API_KEY not configured" };
  }
  if (!RESEND_FROM_DOMAIN) {
    return { sent: false, error: "RESEND_FROM_DOMAIN not configured" };
  }

  try {
    const { subject, html, settings } = await fetchEmailTemplate(supabaseAdmin, "email-verification");

    const fromSetting = settings.find((s) => s.key === "from_address");
    const domainSetting = settings.find((s) => s.key === "domain");
    const brandSetting = settings.find((s) => s.key === "brand_name");

    const fromAddress = fromSetting
      ? `${brandSetting?.value || "Sportowy VIBE"} <${fromSetting.value}>`
      : `Sportowy VIBE <noreply@${RESEND_FROM_DOMAIN}>`;

    const baseDomain = domainSetting?.value || `https://${RESEND_FROM_DOMAIN}`;
    const verificationUrl = `${baseDomain}/weryfikacja-email?token=${verificationToken}`;

    const finalHtml = html.replace(/{{action_url}}/g, verificationUrl);

    console.log("[sendVerificationEmail] Sending to:", toEmail, "from:", fromAddress);

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
    console.log("[sendVerificationEmail] Resend response status:", response.status, "body:", responseText);

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
    console.error("[sendVerificationEmail] Error:", err);
    return { sent: false, error: err instanceof Error ? err.message : "Unknown Resend error" };
  }
}

function appResponse(data: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  const RESEND_FROM_DOMAIN = Deno.env.get("RESEND_FROM_DOMAIN");
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  console.log("[register-user] ENV check — RESEND_API_KEY present:", !!RESEND_API_KEY, "RESEND_FROM_DOMAIN:", RESEND_FROM_DOMAIN, "SUPABASE_URL present:", !!SUPABASE_URL, "SUPABASE_SERVICE_ROLE_KEY present:", !!SUPABASE_SERVICE_ROLE_KEY);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (!RESEND_API_KEY || !RESEND_FROM_DOMAIN) {
    const missing = [];
    if (!RESEND_API_KEY) missing.push("RESEND_API_KEY");
    if (!RESEND_FROM_DOMAIN) missing.push("RESEND_FROM_DOMAIN");
    console.error("[register-user] MISSING secrets:", missing.join(", "));
    return appResponse({
      success: false,
      error: `Brakuje konfiguracji Resend: ${missing.join(", ")}. Dodaj brakujące zmienne w Supabase Dashboard → Secrets.`,
    }, 503);
  }

  if (!SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_URL) {
    console.error("[register-user] MISSING SUPABASE config");
    return appResponse({
      success: false,
      error: "Server configuration error: missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_URL",
    }, 500);
  }

  try {
    const body = await req.json();
    const { email, password, newsletterConsent, turnstileToken, action } = body;

    console.log("[register-user] Request action:", action, "email:", email ? email.slice(0, 3) + "..." : "none");

    const supabaseAdmin = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    // --- RESEND ACTION ---
    if (action === "resend") {
      if (!email) {
        return appResponse({ success: false, error: "Adres e-mail jest wymagany" });
      }

      const normalizedEmail = email.trim().toLowerCase();

      const { data: profiles, error: findError } = await supabaseAdmin
        .from("profiles")
        .select("id, email, email_verified, verification_token_expires_at")
        .eq("email", normalizedEmail)
        .limit(1);

      if (findError || !profiles || profiles.length === 0) {
        return appResponse({ success: false, error: "Nie znaleziono konta dla tego adresu e-mail" });
      }

      const profile = profiles[0];

      if (profile.email_verified) {
        return appResponse({ success: true, already_verified: true, message: "Adres e-mail jest już zweryfikowany" });
      }

      if (profile.verification_token_expires_at) {
        const tokenAge = Date.now() - new Date(profile.verification_token_expires_at).getTime() + 24 * 60 * 60 * 1000;
        const secondsSinceGeneration = (24 * 60 * 60 * 1000 - tokenAge) / 1000;
        if (secondsSinceGeneration < 60 && secondsSinceGeneration > 0) {
          return appResponse({ success: false, error: "Zbyt wiele prób. Poczekaj chwilę przed kolejną wysyłką.", rate_limited: true });
        }
      }

      const verificationToken = generateToken();
      const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      const { error: updateError } = await supabaseAdmin
        .from("profiles")
        .update({
          verification_token: verificationToken,
          verification_token_expires_at: tokenExpiresAt,
        })
        .eq("id", profile.id);

      if (updateError) {
        console.error("[register-user] Resend update error:", updateError);
        return appResponse({ success: false, error: "Nie udało się wygenerować tokenu" });
      }

      const emailResult = await sendVerificationEmail(normalizedEmail, verificationToken, supabaseAdmin);

      return appResponse({
        success: true,
        message: "E-mail weryfikacyjny wysłany ponownie",
        email_sent: emailResult.sent,
        email_error: emailResult.sent ? null : emailResult.error,
      });
    }

    // --- REGISTER ACTION (default) ---
    if (!email || !password) {
      return appResponse({ success: false, error: "Email i hasło są wymagane" });
    }

    if (password.length < 6) {
      return appResponse({ success: false, error: "Hasło musi mieć minimum 6 znaków" });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Verify Turnstile — STRICT MODE
    if (turnstileToken) {
      const TURNSTILE_SECRET = Deno.env.get("TURNSTILE_SECRET_KEY");
      if (!TURNSTILE_SECRET) {
        console.warn("[register-user] TURNSTILE_SECRET_KEY not configured — allowing registration without captcha");
      } else {
        try {
          const formData = new URLSearchParams();
          formData.append("secret", TURNSTILE_SECRET);
          formData.append("response", turnstileToken);
          const turnstileRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
            method: "POST",
            body: formData,
          });
          const turnstileData = await turnstileRes.json();
          console.log("[register-user] Turnstile response:", JSON.stringify(turnstileData));

          if (!turnstileData.success) {
            const errorCodes: string[] = turnstileData["error-codes"] || [];
            console.warn("[register-user] Turnstile verification FAILED — error codes:", errorCodes.join(", "));
            return appResponse({
              success: false,
              error: "Weryfikacja captcha nie powiodła się. Spróbuj ponownie.",
            });
          }
          console.log("[register-user] Turnstile verification passed");
        } catch (e) {
          console.error("[register-user] Turnstile verification network error:", e);
          return appResponse({
            success: false,
            error: "Nie udało się zweryfikować captcha. Spróbuj ponownie.",
          });
        }
      }
    }

    // Check if email already exists
    console.log("[register-user] Checking if email exists...");
    const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (!listError && existingUsers?.users) {
      const exists = existingUsers.users.some((u) => u.email?.toLowerCase() === normalizedEmail);
      if (exists) {
        return appResponse({
          success: false,
          error: "Ten adres e-mail jest już zarejestrowany. Zaloguj się lub skorzystaj z opcji resetowania hasła.",
        });
      }
    }

    // Create user via Admin API
    console.log("[register-user] Creating user...");
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: normalizedEmail,
      password: password,
      email_confirm: true,
      user_metadata: {
        newsletter_consent: newsletterConsent || false,
      },
    });

    if (createError || !newUser?.user) {
      console.error("[register-user] createUser error:", createError);
      const msg = createError?.message || "Nie udało się utworzyć konta";
      if (msg.toLowerCase().includes("already") || msg.toLowerCase().includes("exists")) {
        return appResponse({
          success: false,
          error: "Ten adres e-mail jest już zarejestrowany. Zaloguj się lub skorzystaj z opcji resetowania hasła.",
        });
      }
      return appResponse({ success: false, error: msg });
    }

    const userId = newUser.user.id;
    console.log("[register-user] User created, id:", userId);

    const verificationToken = generateToken();
    const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert({
        id: userId,
        email: normalizedEmail,
        email_verified: false,
        verification_token: verificationToken,
        verification_token_expires_at: tokenExpiresAt,
        newsletter_consent: newsletterConsent || false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: "id" });

    if (profileError) {
      console.error("[register-user] Profile creation error:", profileError);
      try { await supabaseAdmin.auth.admin.deleteUser(userId); } catch { /* ignore */ }
      return appResponse({ success: false, error: "Nie udało się utworzyć profilu" });
    }

    console.log("[register-user] Profile created, sending verification email...");
    const emailResult = await sendVerificationEmail(normalizedEmail, verificationToken, supabaseAdmin);

    return appResponse({
      success: true,
      message: "Konto utworzone. Sprawdź swoją skrzynkę e-mail, aby potwierdzić rejestrację.",
      email_sent: emailResult.sent,
      email_error: emailResult.sent ? null : emailResult.error,
    });
  } catch (err) {
    console.error("[register-user] Unexpected error:", err);
    return appResponse({
      success: false,
      error: "Wewnętrzny błąd serwera. Spróbuj ponownie później.",
    }, 500);
  }
});
