import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const RESEND_FROM_DOMAIN = Deno.env.get("RESEND_FROM_DOMAIN") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const LOGO_URL =
  "https://storage.readdy-site.link/project_files/6b577641-b4ea-4107-bb56-5f8fbbf97e07/319ec2ab-1af0-46ca-beed-0358e5e16485_sportowy_vibebez-sloganu2.svg";

const corsHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info",
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function esc(v: unknown): string {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

interface FormConfig {
  fromLocal: string;
  ownerLabel: string;
  guestSubject: string;
  ownerSubjectPrefix: string;
  guestGreetingBuilder: (name: string) => string;
  guestBodyHtml: string;
}

function getConfig(formType: string): FormConfig | null {
  if (formType === "contact") {
    return {
      fromLocal: "kontakt",
      ownerLabel: "Formularz kontaktowy",
      guestSubject: "Dziękujemy za kontakt — Sportowy Vibe",
      ownerSubjectPrefix: "Nowa wiadomość z formularza kontaktowego",
      guestGreetingBuilder: (name) => `Cześć${name ? " " + esc(name) : ""}!`,
      guestBodyHtml: `
        <p style="margin:0 0 12px;font-size:15px;line-height:1.65;color:#475569">Dziękujemy za kontakt ze <strong style="color:#0F172A">Sportowym Vibe</strong>. Twoja wiadomość została do nas dostarczona i jest już w naszym systemie.</p>
        <p style="margin:0 0 12px;font-size:15px;line-height:1.65;color:#475569">Odpowiemy najszybciej jak to możliwe — zazwyczaj w ciągu <strong style="color:#0F172A">24 godzin</strong>. Jeśli sprawa jest pilna, napisz bezpośrednio na <a href="mailto:kontakt@sportowyvibe.pl" style="color:#14B8A6;text-decoration:none;font-weight:600">kontakt@sportowyvibe.pl</a>.</p>
        <table cellpadding="0" cellspacing="0" style="margin:20px 0 24px">
          <tr><td align="center" style="background-color:#14B8A6;border-radius:8px">
            <a href="https://www.youtube.com/@Sportowy_Vibe" style="display:inline-block;padding:12px 32px;font-size:15px;font-weight:700;color:#FFFFFF;text-decoration:none;white-space:nowrap">Odwiedź nasz kanał YouTube &rarr;</a>
          </td></tr>
        </table>
        <p style="margin:0 0 8px;font-size:14px;color:#64748B">Tymczasem zapraszamy do śledzenia naszych treści — codziennie nowe materiały sportowe!</p>`,
    };
  }
  if (formType === "wspolpraca") {
    return {
      fromLocal: "biznes",
      ownerLabel: "Formularz współpracy",
      guestSubject: "Zgłoszenie współpracy przyjęte — Sportowy Vibe",
      ownerSubjectPrefix: "Nowe zgłoszenie współpracy",
      guestGreetingBuilder: (name) => `Dziękujemy za zgłoszenie${name ? ", " + esc(name) : ""}!`,
      guestBodyHtml: `
        <p style="margin:0 0 12px;font-size:15px;line-height:1.65;color:#475569">Twoje zgłoszenie współpracy zostało przyjęte przez <strong style="color:#0F172A">Sportowy Vibe</strong>. Nasz zespół ds. współpracy już się z nim zapoznaje.</p>
        <p style="margin:0 0 12px;font-size:15px;line-height:1.65;color:#475569">Przeanalizujemy Twoją propozycję i <strong style="color:#0F172A">skontaktujemy się w ciągu 3–5 dni roboczych</strong>, aby omówić szczegóły i potencjalne możliwości współdziałania.</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;background-color:#F0FDFA;border-left:3px solid #14B8A6;border-radius:0 6px 6px 0">
          <tr><td style="padding:14px 18px;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#0F766E;line-height:1.55">
            <strong style="display:block;margin-bottom:4px">Co dalej?</strong>
            Rozmowa wstępna &rarr; Analiza potencjału &rarr; Propozycja modelu współpracy &rarr; Start działań
          </td></tr>
        </table>
        <p style="margin:0 0 8px;font-size:14px;color:#64748B">Zachęcamy do śledzenia naszych działań na kanale YouTube i social mediach.</p>`,
    };
  }
  if (formType === "certyfikacja") {
    return {
      fromLocal: "biznes",
      ownerLabel: "Formularz certyfikacji (Sport Bez Barier)",
      guestSubject: "Zgłoszenie audytu Sport Bez Barier — Sportowy Vibe",
      ownerSubjectPrefix: "Nowe zgłoszenie audytu Sport Bez Barier",
      guestGreetingBuilder: (name) => `Zgłoszenie przyjęte${name ? ", " + esc(name) : ""}!`,
      guestBodyHtml: `
        <p style="margin:0 0 12px;font-size:15px;line-height:1.65;color:#475569">Twoje zgłoszenie do programu certyfikacji <strong style="color:#0F172A">Sport Bez Barier</strong> zostało przyjęte przez zespół Sportowego Vibe.</p>
        <p style="margin:0 0 12px;font-size:15px;line-height:1.65;color:#475569">Nasz ekspert skontaktuje się z Tobą <strong style="color:#0F172A">w ciągu 24 godzin</strong>, aby omówić kolejne kroki procesu certyfikacji i ustalić dogodny termin wstępnej konsultacji.</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;background-color:#F0FDFA;border-left:3px solid #14B8A6;border-radius:0 6px 6px 0">
          <tr><td style="padding:14px 18px;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#0F766E;line-height:1.55">
            <strong style="display:block;margin-bottom:4px">Twoja ścieżka certyfikacji</strong>
            Konsultacja &rarr; Wizja lokalna &rarr; Analiza dostępności &rarr; Raport &rarr; Certyfikat
          </td></tr>
        </table>
        <p style="margin:0 0 4px;font-size:14px;color:#64748B">Przypominamy: pierwsza konsultacja i wstępna analiza są <strong style="color:#0F172A">bezpłatne</strong>.</p>
        <p style="margin:0 0 8px;font-size:14px;color:#64748B">Możesz skorzystać z <strong style="color:#0F172A">dofinansowania PFRON</strong>, które pokrywa do 80% kosztów audytu i wdrożenia.</p>`,
    };
  }
  return null;
}

function wrapGuestEmail(cfg: FormConfig, greeting: string): string {
  return `<!DOCTYPE html>
<html lang="pl">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#F8FAFC">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F8FAFC;padding:30px 0">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#FFFFFF;border-radius:12px;overflow:hidden">
      <tr><td style="height:4px;background-color:#14B8A6"></td></tr>
      <tr><td align="center" style="padding:32px 24px 8px">
        <img src="${LOGO_URL}" alt="Sportowy Vibe" style="height:44px;width:auto;display:block">
      </td></tr>
      <tr><td style="padding:24px 32px 32px;font-family:Arial,Helvetica,sans-serif;color:#1E293B">
        <h2 style="margin:0 0 16px;font-size:20px;font-weight:700;color:#0F172A;line-height:1.3">${greeting}</h2>
        ${cfg.guestBodyHtml}
        <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0"><tr><td style="border-top:1px solid #E2E8F0"></td></tr></table>
        <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#0F172A">Sportowy Vibe</p>
        <p style="margin:0 0 4px;font-size:12px;color:#94A3B8">Energia Sportu Każdego Dnia</p>
        <p style="margin:0;font-size:12px;color:#94A3B8">
          <a href="mailto:${cfg.fromLocal}@sportowyvibe.pl" style="color:#14B8A6;text-decoration:none">${cfg.fromLocal}@sportowyvibe.pl</a>
          &nbsp;|&nbsp;
          <a href="https://www.youtube.com/@Sportowy_Vibe" style="color:#14B8A6;text-decoration:none">YouTube</a>
          &nbsp;|&nbsp;
          <a href="https://www.facebook.com/RSNSWP" style="color:#14B8A6;text-decoration:none">Facebook</a>
        </p>
      </td></tr>
    </table>
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;margin-top:16px">
      <tr><td align="center" style="font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#94A3B8;padding:0 32px">
        Otrzymujesz tę wiadomość, ponieważ wysłałeś formularz na stronie Sportowy Vibe. Jeśli to nie Ty, zignoruj tę wiadomość.
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

function wrapOwnerEmail(cfg: FormConfig, fields: Record<string, string>): string {
  const rows = Object.entries(fields)
    .filter(([k, v]) => v && String(v).trim() && k !== "consent_email" && k !== "consent_phone")
    .map(
      ([k, v]) =>
        `<tr>
          <td style="padding:8px 12px;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#64748B;font-weight:600;background-color:#F8FAFC;border-bottom:1px solid #E2E8F0;white-space:nowrap;vertical-align:top">${esc(k)}</td>
          <td style="padding:8px 12px;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#0F172A;border-bottom:1px solid #E2E8F0">${esc(v)}</td>
        </tr>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="pl">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#F8FAFC">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F8FAFC;padding:30px 0">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#FFFFFF;border-radius:12px;overflow:hidden">
      <tr><td style="height:4px;background-color:#0F172A"></td></tr>
      <tr><td align="center" style="padding:28px 24px 4px">
        <img src="${LOGO_URL}" alt="Sportowy Vibe" style="height:36px;width:auto;display:block">
      </td></tr>
      <tr><td style="padding:20px 32px 32px;font-family:Arial,Helvetica,sans-serif;color:#1E293B">
        <span style="display:inline-block;padding:4px 10px;background-color:#F0FDFA;color:#0F766E;font-size:11px;font-weight:700;border-radius:20px;text-transform:uppercase;letter-spacing:0.5px">${esc(cfg.ownerLabel)}</span>
        <h2 style="margin:12px 0 4px;font-size:19px;font-weight:700;color:#0F172A;line-height:1.3">Nowe zgłoszenie z formularza</h2>
        <p style="margin:0 0 18px;font-size:13px;color:#64748B">Poniżej dane przesłane przez użytkownika:</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E2E8F0;border-radius:8px;overflow:hidden">
          ${rows}
        </table>
        <p style="margin:18px 0 0;font-size:12px;color:#94A3B8">Powiadomienie wygenerowane automatycznie przez stronę Sportowy Vibe.</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

async function sendResend(from: string, to: string, subject: string, html: string, replyTo?: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      html,
      ...(replyTo ? { reply_to: replyTo } : {}),
    }),
  });
  const data = await res.json().catch(() => {
    return {};
  });
  return { ok: res.ok, data };
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ success: false, error: "Method not allowed" }), {
      headers: corsHeaders,
      status: 405,
    });
  }

  try {
    const body = await req.json();
    const formType: string = body.form_type || "";
    const fields: Record<string, string> = body.fields || {};

    const cfg = getConfig(formType);
    if (!cfg) {
      return new Response(
        JSON.stringify({ success: false, error: `Unknown form_type: ${formType}` }),
        { headers: corsHeaders, status: 400 },
      );
    }

    const guestEmail = (fields.email || "").trim();
    const guestName = (fields.name || "").trim();

    if (!RESEND_API_KEY || !RESEND_FROM_DOMAIN) {
      console.error("Missing RESEND_API_KEY or RESEND_FROM_DOMAIN");
      return new Response(
        JSON.stringify({
          success: false,
          error:
            "Resend nie jest skonfigurowany. Dodaj RESEND_API_KEY i RESEND_FROM_DOMAIN w Supabase Dashboard > Edge Functions > Secrets.",
        }),
        { headers: corsHeaders, status: 500 },
      );
    }

    const fromEmail = `${cfg.fromLocal}@${RESEND_FROM_DOMAIN}`;
    const fromAddress = `Sportowy VIBE <${fromEmail}>`;
    const ownerAddress = fromEmail;

    let submissionId: string | null = null;
    if (SUPABASE_URL && SERVICE_ROLE_KEY) {
      try {
        const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
          auth: { persistSession: false },
        });
        const knownKeys = ["name", "email", "phone", "subject", "organization", "facility", "facility_type", "message"];
        const extra: Record<string, string> = {};
        Object.entries(fields).forEach(([k, v]) => {
          if (!knownKeys.includes(k) && v) extra[k] = v;
        });
        const { data: inserted, error: insErr } = await admin
          .from("form_submissions")
          .insert({
            form_type: formType,
            name: fields.name || null,
            email: fields.email || null,
            phone: fields.phone || null,
            subject: fields.subject || null,
            organization: fields.organization || null,
            facility: fields.facility || null,
            facility_type: fields.facility_type || null,
            message: fields.message || null,
            extra,
            email_status: "pending",
          })
          .select("id")
          .maybeSingle();
        if (insErr) console.error("DB insert error:", insErr);
        else submissionId = inserted?.id ?? null;
      } catch (dbErr) {
        console.error("DB insert exception:", dbErr);
      }
    }

    const ownerHtml = wrapOwnerEmail(cfg, fields);
    const ownerSubject = `${cfg.ownerSubjectPrefix}${guestName ? " — " + guestName : ""}`;
    const ownerResult = await sendResend(
      fromAddress,
      ownerAddress,
      ownerSubject,
      ownerHtml,
      guestEmail && emailRegex.test(guestEmail) ? guestEmail : undefined,
    );
    if (!ownerResult.ok) console.error("Owner email error:", ownerResult.data);

    let guestResult: { ok: boolean; data: unknown } = { ok: false, data: null };
    if (guestEmail && emailRegex.test(guestEmail)) {
      const guestHtml = wrapGuestEmail(cfg, cfg.guestGreetingBuilder(guestName));
      guestResult = await sendResend(fromAddress, guestEmail, cfg.guestSubject, guestHtml, ownerAddress);
      if (!guestResult.ok) console.error("Guest email error:", guestResult.data);
    }

    const status = ownerResult.ok || guestResult.ok ? "sent" : "failed";
    if (submissionId && SUPABASE_URL && SERVICE_ROLE_KEY) {
      try {
        const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
          auth: { persistSession: false },
        });
        await admin.from("form_submissions").update({ email_status: status }).eq("id", submissionId);
      } catch (_e) { /* non-critical */ }
    }

    if (!ownerResult.ok && !guestResult.ok) {
      return new Response(
        JSON.stringify({ success: false, error: "Resend API error", detail: ownerResult.data }),
        { headers: corsHeaders, status: 500 },
      );
    }

    return new Response(
      JSON.stringify({ success: true, submission_id: submissionId, owner_sent: ownerResult.ok, guest_sent: guestResult.ok }),
      { headers: corsHeaders, status: 200 },
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ success: false, error: "Internal error", detail: String(err) }),
      { headers: corsHeaders, status: 500 },
    );
  }
});
