import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const MAX_PIN_ATTEMPTS = 5;
const PIN_LOCKOUT_MINUTES = 15;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function hashPin(pin: string, userId: string): Promise<string> {
  const data = new TextEncoder().encode(pin + ":" + userId);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { action, pin, userId } = await req.json();

    if (!action || !pin || !userId) {
      return new Response(JSON.stringify({ error: "Missing required fields: action, pin, userId" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!/^\d{4,6}$/.test(pin)) {
      return new Response(JSON.stringify({ error: "PIN musi mie\u0107 od 4 do 6 cyfr" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate userId is a valid UUID to prevent injection
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      return new Response(JSON.stringify({ error: "Invalid userId format" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // --- BRUTE-FORCE CHECK for login/verify actions ---
    if (action === "login" || action === "verify") {
      const { data: profileData } = await supabaseAdmin
        .from("profiles")
        .select("pin_attempts, pin_locked_until")
        .eq("id", userId)
        .maybeSingle();

      if (profileData?.pin_locked_until) {
        const lockedUntil = new Date(profileData.pin_locked_until);
        const now = new Date();
        if (lockedUntil > now) {
          const remainingMinutes = Math.ceil((lockedUntil.getTime() - now.getTime()) / 60000);
          return new Response(JSON.stringify({
            error: `PIN tymczasowo zablokowany. Spr\u00f3buj ponownie za ${remainingMinutes} ${remainingMinutes === 1 ? 'minut\u0119' : remainingMinutes < 5 ? 'minuty' : 'minut'}.`,
            locked: true,
            remaining_minutes: remainingMinutes,
          }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        // Lock expired — clear it
        await supabaseAdmin
          .from("profiles")
          .update({ pin_locked_until: null, pin_attempts: 0 })
          .eq("id", userId);
      }
    }

    // --- SET ---
    if (action === "set") {
      const pinHash = await hashPin(pin, userId);

      const { error: updateError } = await supabaseAdmin
        .from("profiles")
        .update({ pin_hash: pinHash, updated_at: new Date().toISOString() })
        .eq("id", userId);

      if (updateError) {
        console.error("Failed to set PIN:", updateError.message);
        return new Response(JSON.stringify({ error: "Nie uda\u0142o si\u0119 zapisa\u0107 PIN-u" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- LOGIN ---
    if (action === "login") {
      const { data: profile, error: fetchError } = await supabaseAdmin
        .from("profiles")
        .select("pin_hash, id")
        .eq("id", userId)
        .maybeSingle();

      if (fetchError || !profile) {
        return new Response(JSON.stringify({ error: "Nie znaleziono profilu" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!profile.pin_hash) {
        return new Response(JSON.stringify({ error: "PIN nie zosta\u0142 ustawiony dla tego konta" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const expectedHash = await hashPin(pin, userId);

      if (expectedHash !== profile.pin_hash) {
        // Increment failed attempts
        const { data: currentProfile } = await supabaseAdmin
          .from("profiles")
          .select("pin_attempts")
          .eq("id", userId)
          .maybeSingle();

        const newAttempts = (currentProfile?.pin_attempts ?? 0) + 1;
        const updates: Record<string, unknown> = { pin_attempts: newAttempts };

        if (newAttempts >= MAX_PIN_ATTEMPTS) {
          const lockUntil = new Date(Date.now() + PIN_LOCKOUT_MINUTES * 60 * 1000);
          updates.pin_locked_until = lockUntil.toISOString();
        }

        await supabaseAdmin.from("profiles").update(updates).eq("id", userId);

        if (newAttempts >= MAX_PIN_ATTEMPTS) {
          return new Response(JSON.stringify({
            error: `PIN zablokowany po ${MAX_PIN_ATTEMPTS} nieudanych pr\u00f3bach. Spr\u00f3buj ponownie za ${PIN_LOCKOUT_MINUTES} minut.`,
            locked: true,
          }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify({ error: "Nieprawid\u0142owy PIN" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Success — reset attempts
      await supabaseAdmin
        .from("profiles")
        .update({ pin_attempts: 0, pin_locked_until: null })
        .eq("id", userId);

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- VERIFY ---
    if (action === "verify") {
      const { data: profile, error: fetchError } = await supabaseAdmin
        .from("profiles")
        .select("pin_hash, id")
        .eq("id", userId)
        .maybeSingle();

      if (fetchError || !profile) {
        return new Response(JSON.stringify({ error: "Nie znaleziono profilu" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!profile.pin_hash) {
        return new Response(JSON.stringify({ error: "PIN nie zosta\u0142 ustawiony" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const expectedHash = await hashPin(pin, userId);

      if (expectedHash !== profile.pin_hash) {
        const { data: currentProfile } = await supabaseAdmin
          .from("profiles")
          .select("pin_attempts")
          .eq("id", userId)
          .maybeSingle();

        const newAttempts = (currentProfile?.pin_attempts ?? 0) + 1;
        const updates: Record<string, unknown> = { pin_attempts: newAttempts };

        if (newAttempts >= MAX_PIN_ATTEMPTS) {
          const lockUntil = new Date(Date.now() + PIN_LOCKOUT_MINUTES * 60 * 1000);
          updates.pin_locked_until = lockUntil.toISOString();
        }

        await supabaseAdmin.from("profiles").update(updates).eq("id", userId);

        if (newAttempts >= MAX_PIN_ATTEMPTS) {
          return new Response(JSON.stringify({
            error: `PIN zablokowany po ${MAX_PIN_ATTEMPTS} nieudanych pr\u00f3bach.`,
            locked: true,
          }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify({ error: "Nieprawid\u0142owy PIN" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      await supabaseAdmin
        .from("profiles")
        .update({ pin_attempts: 0, pin_locked_until: null })
        .eq("id", userId);

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- REMOVE ---
    if (action === "remove") {
      const { error: updateError } = await supabaseAdmin
        .from("profiles")
        .update({ pin_hash: null, pin_attempts: 0, pin_locked_until: null, updated_at: new Date().toISOString() })
        .eq("id", userId);

      if (updateError) {
        return new Response(JSON.stringify({ error: "Nie uda\u0142o si\u0119 usun\u0105\u0107 PIN-u" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Nieznana akcja: " + action }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("pin-auth error:", err);
    return new Response(JSON.stringify({ error: "Wewn\u0119trzny b\u0142\u0105d serwera" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
