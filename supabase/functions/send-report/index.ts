import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const RESEND_FROM_DOMAIN = Deno.env.get("RESEND_FROM_DOMAIN") || "sportowyvibe.pl";
const ADMIN_EMAIL = "admin@sportowyvibe.pl";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface ReportBody {
  reportType: "article" | "comment";
  reportTarget: string;
  reportLabel: string;
  reporterEmail: string;
  reason: string;
  details?: string;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body: ReportBody = await req.json();
    const { reportType, reportTarget, reportLabel, reporterEmail, reason, details } = body;

    if (!reportType || !reportTarget || !reporterEmail || !reason) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resend = new Resend(RESEND_API_KEY);
    const fromAddress = `Sportowy VIBE <noreply@${RESEND_FROM_DOMAIN}>`;

    const typeLabel = reportType === "article" ? "artykuł" : "komentarz";
    const siteUrl = "https://sportowyvibe.pl";
    const targetUrl = reportType === "article"
      ? `${siteUrl}/artykul/${reportTarget}`
      : `${siteUrl}/artykul/${reportTarget}#komentarze`;

    // Email to admin
    await resend.emails.send({
      from: fromAddress,
      to: ADMIN_EMAIL,
      subject: `[ZGŁOSZENIE] ${typeLabel}: ${reportLabel.substring(0, 80)}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">Nowe zgłoszenie ${typeLabel}u</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px 12px; background: #f9fafb; font-weight: 600;">Typ zgłoszenia</td><td style="padding: 8px 12px;">${typeLabel}</td></tr>
            <tr><td style="padding: 8px 12px; font-weight: 600;">${reportType === "article" ? "Artykuł" : "Komentarz"}</td><td style="padding: 8px 12px;">${reportLabel}</td></tr>
            <tr><td style="padding: 8px 12px; background: #f9fafb; font-weight: 600;">Link</td><td style="padding: 8px 12px;"><a href="${targetUrl}">${targetUrl}</a></td></tr>
            <tr><td style="padding: 8px 12px; font-weight: 600;">Powód</td><td style="padding: 8px 12px;">${reason}</td></tr>
            <tr><td style="padding: 8px 12px; background: #f9fafb; font-weight: 600;">E-mail zgłaszającego</td><td style="padding: 8px 12px;">${reporterEmail}</td></tr>
            ${details ? `<tr><td style="padding: 8px 12px; font-weight: 600;">Dodatkowe informacje</td><td style="padding: 8px 12px;">${details}</td></tr>` : ""}
          </table>
          <p style="margin-top: 20px; font-size: 12px; color: #6b7280;">Zgłoszenie z serwisu Sportowy Vibe</p>
        </div>
      `,
    });

    // Confirmation to reporter
    await resend.emails.send({
      from: fromAddress,
      to: reporterEmail,
      subject: `Potwierdzenie zgłoszenia — Sportowy Vibe`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0F172A;">Dziękujemy za zgłoszenie!</h2>
          <p>Otrzymaliśmy Twoje zgłoszenie dotyczące ${typeLabel}u <strong>"${reportLabel}"</strong>.</p>
          <p><strong>Powód:</strong> ${reason}</p>
          ${details ? `<p><strong>Dodatkowe informacje:</strong> ${details}</p>` : ""}
          <p>Nasz zespół przeanalizuje zgłoszenie w ciągu 24 godzin i podejmie odpowiednie działania.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
          <p style="font-size: 12px; color: #6b7280;">
            To automatyczna wiadomość z serwisu <strong>Sportowy Vibe</strong>. Prosimy na nią nie odpowiadać.
          </p>
        </div>
      `,
    });

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Report error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
