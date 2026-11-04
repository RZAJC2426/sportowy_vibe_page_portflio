import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  action: 'send_code' | 'verify_code' | 'send_login_code' | 'verify_login_code' | 'disable' | 'check';
  phone?: string;
  code?: string;
  userId?: string;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { action, phone, code, userId }: RequestBody = await req.json();

    const twilioSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioPhone = Deno.env.get('TWILIO_PHONE_NUMBER');

    const twilioConfigured = !!(twilioSid && twilioToken && twilioPhone);

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    if (action === 'check') {
      if (!userId) {
        return new Response(JSON.stringify({ error: 'userId required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      const { data: profile } = await supabaseClient.from('profiles').select('sms_2fa_enabled, phone').eq('id', userId).maybeSingle();
      return new Response(JSON.stringify({
        sms_2fa_enabled: profile?.sms_2fa_enabled ?? false,
        phone: profile?.phone ?? null,
        twilio_configured: twilioConfigured,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'disable') {
      if (!userId) {
        return new Response(JSON.stringify({ error: 'userId required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      const { error } = await supabaseClient.from('profiles').update({
        sms_2fa_enabled: false,
        sms_verification_code: null,
        sms_code_expires_at: null,
      }).eq('id', userId);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (!twilioConfigured) {
      return new Response(JSON.stringify({
        error: 'SMS 2FA nie jest jeszcze skonfigurowane. Administrator musi dodać klucze TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN i TWILIO_PHONE_NUMBER w Supabase Dashboard.',
      }), { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'send_code') {
      if (!phone || !userId) {
        return new Response(JSON.stringify({ error: 'phone and userId required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      const { data: existing } = await supabaseClient.from('profiles').select('sms_code_expires_at').eq('id', userId).maybeSingle();
      if (existing?.sms_code_expires_at) {
        const expiresAt = new Date(existing.sms_code_expires_at).getTime();
        if (expiresAt > Date.now() - 9 * 60 * 1000) {
          return new Response(JSON.stringify({ error: 'Kod został już wysłany. Poczekaj 60 sekund przed kolejną próbą.' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
      }
      const smsCode = String(Math.floor(100000 + Math.random() * 900000));
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      const { error: updateErr } = await supabaseClient.from('profiles').update({
        phone, sms_verification_code: smsCode, sms_code_expires_at: expiresAt,
      }).eq('id', userId);
      if (updateErr) throw updateErr;
      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
      const twilioAuth = btoa(`${twilioSid}:${twilioToken}`);
      const twilioRes = await fetch(twilioUrl, {
        method: 'POST',
        headers: { 'Authorization': `Basic ${twilioAuth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ To: phone, From: twilioPhone, Body: `Sportowy VIBE: Twoj kod weryfikacyjny to: ${smsCode}. Wazny 10 minut.` }),
      });
      if (!twilioRes.ok) {
        return new Response(JSON.stringify({ error: 'Nie udalo sie wyslac SMS-a. Sprawdz numer telefonu i sprobuj ponownie.' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      return new Response(JSON.stringify({ success: true, phone_masked: phone.slice(-4).padStart(phone.length, '*') }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'verify_code') {
      if (!code || !userId) {
        return new Response(JSON.stringify({ error: 'code and userId required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      const { data: profile } = await supabaseClient.from('profiles').select('sms_verification_code, sms_code_expires_at').eq('id', userId).maybeSingle();
      if (!profile?.sms_verification_code) {
        return new Response(JSON.stringify({ error: 'Nie znaleziono kodu. Wyslij kod ponownie.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      if (profile.sms_code_expires_at && new Date(profile.sms_code_expires_at) < new Date()) {
        return new Response(JSON.stringify({ error: 'Kod wygasl. Wyslij nowy kod.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      if (profile.sms_verification_code !== code) {
        return new Response(JSON.stringify({ error: 'Nieprawidlowy kod.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      const { error: enableErr } = await supabaseClient.from('profiles').update({
        sms_2fa_enabled: true, sms_verification_code: null, sms_code_expires_at: null,
      }).eq('id', userId);
      if (enableErr) throw enableErr;
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'send_login_code') {
      if (!userId) {
        return new Response(JSON.stringify({ error: 'userId required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      const { data: profile } = await supabaseClient.from('profiles').select('phone, sms_2fa_enabled, sms_code_expires_at').eq('id', userId).maybeSingle();
      if (!profile?.sms_2fa_enabled || !profile?.phone) {
        return new Response(JSON.stringify({ error: 'SMS 2FA nie jest wlaczone.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      if (profile.sms_code_expires_at) {
        const expiresAt = new Date(profile.sms_code_expires_at).getTime();
        if (expiresAt > Date.now() - 9 * 60 * 1000) {
          return new Response(JSON.stringify({ error: 'Kod zostal juz wyslany. Poczekaj 60 sekund.' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
      }
      const smsCode = String(Math.floor(100000 + Math.random() * 900000));
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      const { error: updateErr } = await supabaseClient.from('profiles').update({
        sms_verification_code: smsCode, sms_code_expires_at: expiresAt,
      }).eq('id', userId);
      if (updateErr) throw updateErr;
      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
      const twilioAuth = btoa(`${twilioSid}:${twilioToken}`);
      const twilioRes = await fetch(twilioUrl, {
        method: 'POST',
        headers: { 'Authorization': `Basic ${twilioAuth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ To: profile.phone, From: twilioPhone, Body: `Sportowy VIBE: Twoj kod logowania to: ${smsCode}. Wazny 10 minut.` }),
      });
      if (!twilioRes.ok) {
        return new Response(JSON.stringify({ error: 'Nie udalo sie wyslac SMS-a.' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      return new Response(JSON.stringify({ success: true, phone_masked: profile.phone.slice(-4).padStart(profile.phone.length, '*') }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'verify_login_code') {
      if (!code || !userId) {
        return new Response(JSON.stringify({ error: 'code and userId required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      const { data: profile } = await supabaseClient.from('profiles').select('sms_verification_code, sms_code_expires_at').eq('id', userId).maybeSingle();
      if (!profile?.sms_verification_code) {
        return new Response(JSON.stringify({ error: 'Nie znaleziono kodu.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      if (profile.sms_code_expires_at && new Date(profile.sms_code_expires_at) < new Date()) {
        return new Response(JSON.stringify({ error: 'Kod wygasl.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      if (profile.sms_verification_code !== code) {
        return new Response(JSON.stringify({ error: 'Nieprawidlowy kod.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      await supabaseClient.from('profiles').update({ sms_verification_code: null, sms_code_expires_at: null }).eq('id', userId);
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('send-sms-code error:', err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Internal error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
