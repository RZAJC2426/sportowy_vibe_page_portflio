import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "npm:@simplewebauthn/server@11.0.0";

let BufferPolyfilled = false;
try {
  const nodeBuffer = await import("node:buffer");
  (globalThis as any).Buffer = nodeBuffer.Buffer;
  BufferPolyfilled = true;
} catch {
  // node:buffer unavailable; esm.sh / npm: polyfills should cover it
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function uint8ArrayToBase64(arr: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < arr.length; i++) binary += String.fromCharCode(arr[i]);
  return btoa(binary);
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function uint8ArrayToBase64url(arr: Uint8Array): string {
  return uint8ArrayToBase64(arr).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64urlToUint8Array(base64url: string): Uint8Array {
  let base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) base64 += "=";
  return base64ToUint8Array(base64);
}

function base64ToBase64url(base64: string): string {
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function stripDiacritics(str: string): string {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function hasCredential(val: string | null | undefined): boolean {
  return !!val && val.length > 0;
}

function shuffleString(str: string): string {
  const arr = str.split("");
  const bytes = new Uint8Array(arr.length);
  crypto.getRandomValues(bytes);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = bytes[i] % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.join("");
}

function generatePassword(length = 24): string {
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const digits = "0123456789";
  const special = "!@#$%&*_-+=";
  const all = lower + upper + digits + special;

  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);

  let password = "";
  password += lower[bytes[0] % lower.length];
  password += upper[bytes[1] % upper.length];
  password += digits[bytes[2] % digits.length];
  password += special[bytes[3] % special.length];

  for (let i = 4; i < length; i++) {
    password += all[bytes[i] % all.length];
  }

  return shuffleString(password);
}

const CHALLENGE_TTL_MS = 300_000;

function getRpConfig(origin: string) {
  const url = new URL(origin);
  const hostname = url.hostname;
  return { rpID: hostname, origin };
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const body = await req.json();
    const { action, userId, userName, userDisplayName, credential, origin, challengeKey, identifier } = body;

    const originToUse = origin || req.headers.get("origin") || "http://localhost:5173";
    const { rpID } = getRpConfig(originToUse);

    if (action === "resolve-user") {
      if (!identifier) return jsonResponse({ error: "Missing identifier" });

      const trimmed = identifier.trim().toLowerCase();
      const stripped = stripDiacritics(trimmed).toLowerCase();
      let resolvedUserId: string | null = null;
      let hasWebAuthn = false;

      if (trimmed.includes("@")) {
        const { data: profileByEmail } = await supabaseAdmin
          .from("profiles")
          .select("id, webauthn_credential_id, email")
          .eq("email", trimmed)
          .maybeSingle();

        if (profileByEmail) {
          resolvedUserId = profileByEmail.id;
          hasWebAuthn = hasCredential(profileByEmail.webauthn_credential_id);
        }

        if (!resolvedUserId) {
          let page = 1;
          const perPage = 1000;
          while (!resolvedUserId) {
            const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
            if (usersError) break;
            const users = usersData?.users || [];
            if (users.length === 0) break;

            const matchedUser = users.find((u: any) => u.email?.toLowerCase() === trimmed);
            if (matchedUser) {
              resolvedUserId = matchedUser.id;
              const { data: profile } = await supabaseAdmin
                .from("profiles")
                .select("webauthn_credential_id")
                .eq("id", resolvedUserId)
                .maybeSingle();
              hasWebAuthn = hasCredential(profile?.webauthn_credential_id);
              break;
            }
            if (users.length < perPage) break;
            page++;
          }
        }
      } else {
        const strategies = [
          async () => {
            const { data } = await supabaseAdmin
              .from("profiles")
              .select("id, webauthn_credential_id")
              .eq("username", trimmed)
              .maybeSingle();
            return data;
          },
          async () => {
            if (stripped === trimmed) return null;
            const { data } = await supabaseAdmin
              .from("profiles")
              .select("id, webauthn_credential_id")
              .eq("username", stripped)
              .maybeSingle();
            return data;
          },
          async () => {
            const { data } = await supabaseAdmin
              .from("profiles")
              .select("id, webauthn_credential_id")
              .ilike("display_name", trimmed)
              .maybeSingle();
            return data;
          },
          async () => {
            const { data } = await supabaseAdmin
              .from("profiles")
              .select("id, webauthn_credential_id")
              .ilike("email", `%${trimmed}%`)
              .maybeSingle();
            return data;
          },
        ];

        for (const strategy of strategies) {
          const profile = await strategy();
          if (profile) {
            resolvedUserId = profile.id;
            hasWebAuthn = hasCredential(profile.webauthn_credential_id);
            break;
          }
        }
      }

      return jsonResponse({ userId: resolvedUserId, hasWebAuthn });
    }

    if (action === "register-challenge") {
      if (!userId || !userName) {
        return jsonResponse({ error: "Missing userId or userName" });
      }

      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("webauthn_credential_id")
        .eq("id", userId)
        .maybeSingle();

      const excludeCredentials = hasCredential(profile?.webauthn_credential_id)
        ? [{ id: base64ToBase64url(profile.webauthn_credential_id), type: "public-key" as const }]
        : [];

      const options = await generateRegistrationOptions({
        rpName: "Sportowy VIBE",
        rpID,
        userID: new TextEncoder().encode(userId),
        userName,
        userDisplayName: userDisplayName || userName,
        attestationType: "none",
        excludeCredentials,
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          residentKey: "preferred",
          userVerification: "preferred",
        },
      });

      const { error: storeErr } = await supabaseAdmin
        .from("profiles")
        .update({
          webauthn_challenge: options.challenge,
          webauthn_challenge_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (storeErr) {
        return jsonResponse({ error: "Failed to store challenge: " + storeErr.message });
      }

      return jsonResponse({ options });
    }

    if (action === "register-verify") {
      if (!userId || !credential) {
        return jsonResponse({ error: "Missing userId or credential" });
      }

      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("webauthn_challenge, webauthn_challenge_at, email")
        .eq("id", userId)
        .maybeSingle();

      if (!profile?.webauthn_challenge || !profile?.webauthn_challenge_at) {
        return jsonResponse({ error: "Challenge wygasł lub nie został znaleziony. Rozpocznij rejestrację ponownie." });
      }

      const challengeAge = Date.now() - new Date(profile.webauthn_challenge_at).getTime();
      if (challengeAge > CHALLENGE_TTL_MS) {
        await supabaseAdmin
          .from("profiles")
          .update({ webauthn_challenge: null, webauthn_challenge_at: null })
          .eq("id", userId);
        return jsonResponse({ error: "Challenge wygasł. Rozpocznij rejestrację ponownie." });
      }

      try {
        const verification = await verifyRegistrationResponse({
          response: credential,
          expectedChallenge: profile.webauthn_challenge,
          expectedOrigin: originToUse,
          expectedRPID: rpID,
        });

        if (!verification.verified || !verification.registrationInfo) {
          return jsonResponse({ error: "Weryfikacja rejestracji nie powiodła się. Spróbuj ponownie." });
        }

        const regInfo = verification.registrationInfo;
        let credentialIdBytes: Uint8Array;
        let credentialPubKeyBytes: Uint8Array;

        if (regInfo.credential) {
          const idVal = (regInfo.credential as any).id;
          const pubKeyVal = (regInfo.credential as any).publicKey;
          if (typeof idVal === "string") {
            credentialIdBytes = base64urlToUint8Array(idVal);
          } else {
            credentialIdBytes = new Uint8Array(idVal as Uint8Array);
          }
          credentialPubKeyBytes = new Uint8Array(pubKeyVal as Uint8Array);
        } else if ((regInfo as any).credentialID && (regInfo as any).credentialPublicKey) {
          credentialIdBytes = new Uint8Array((regInfo as any).credentialID as Uint8Array);
          credentialPubKeyBytes = new Uint8Array((regInfo as any).credentialPublicKey as Uint8Array);
        } else {
          return jsonResponse({ error: "Nie można odczytać danych uwierzytelniających z wyniku weryfikacji." });
        }

        if (credentialIdBytes.length === 0) {
          return jsonResponse({ error: "ID uwierzytelnienia jest puste." });
        }

        const credIdBase64 = uint8ArrayToBase64(credentialIdBytes);
        const pubKeyBase64 = uint8ArrayToBase64(credentialPubKeyBytes);

        const updatePayload: Record<string, any> = {
          webauthn_credential_id: credIdBase64,
          webauthn_public_key: pubKeyBase64,
          webauthn_challenge: null,
          webauthn_challenge_at: null,
          updated_at: new Date().toISOString(),
        };
        if (profile.email) {
          updatePayload.email = profile.email;
        }

        const { error: updateErr } = await supabaseAdmin
          .from("profiles")
          .update(updatePayload)
          .eq("id", userId);

        if (updateErr) {
          return jsonResponse({ error: "Nie udało się zapisać danych biometrycznych: " + updateErr.message });
        }

        return jsonResponse({ success: true });
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        if (errMsg.includes("exclude") || errMsg.includes("already") || errMsg.includes("InvalidStateError")) {
          return jsonResponse({ error: "Windows Hello ma już zapisane dane biometryczne dla tego konta na tym urządzeniu. Usuń je w ustawieniach Windows Hello i spróbuj ponownie." });
        }
        return jsonResponse({ error: "Błąd weryfikacji: " + errMsg });
      }
    }

    if (action === "auth-challenge") {
      if (!userId) {
        return jsonResponse({ error: "userId is required. Provide login or email first." });
      }

      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("webauthn_credential_id")
        .eq("id", userId)
        .maybeSingle();

      if (!hasCredential(profile?.webauthn_credential_id)) {
        return jsonResponse({ error: "Windows Hello not registered for this account." });
      }

      await supabaseAdmin.from("webauthn_challenges").delete().eq("user_id", userId);

      const newChallengeKey = crypto.randomUUID();
      const allowCredentials = [{
        id: base64ToBase64url(profile!.webauthn_credential_id),
        type: "public-key" as const,
      }];

      const options = await generateAuthenticationOptions({
        rpID,
        userVerification: "preferred",
        allowCredentials,
      });

      const { error: storeErr } = await supabaseAdmin.from("webauthn_challenges").insert({
        challenge_key: newChallengeKey,
        challenge: options.challenge,
        user_id: userId,
        created_at: new Date().toISOString(),
      });

      if (storeErr) {
        return jsonResponse({ error: "Failed to store challenge: " + storeErr.message });
      }

      try {
        const cutoff = new Date(Date.now() - CHALLENGE_TTL_MS).toISOString();
        await supabaseAdmin.from("webauthn_challenges").delete().lt("created_at", cutoff);
      } catch { /* noop */ }

      return jsonResponse({ options, challengeKey: newChallengeKey });
    }

    if (action === "auth-verify") {
      if (!credential || !challengeKey) {
        return jsonResponse({ error: "Missing credential or challengeKey" });
      }

      const { data: row } = await supabaseAdmin
        .from("webauthn_challenges")
        .select("challenge, created_at, user_id")
        .eq("challenge_key", challengeKey)
        .maybeSingle();

      if (!row?.challenge) {
        return jsonResponse({ error: "Challenge expired. Try again." });
      }

      const challengeAge = Date.now() - new Date(row.created_at).getTime();
      if (challengeAge > CHALLENGE_TTL_MS) {
        await supabaseAdmin.from("webauthn_challenges").delete().eq("challenge_key", challengeKey);
        return jsonResponse({ error: "Challenge expired. Try again." });
      }

      const credIdRaw = credential.id || credential.rawId;
      const credIdUrl = typeof credIdRaw === "string"
        ? credIdRaw
        : uint8ArrayToBase64url(new Uint8Array(Object.values(credIdRaw)));

      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("id, webauthn_credential_id, webauthn_public_key")
        .eq("id", row.user_id)
        .maybeSingle();

      if (!hasCredential(profile?.webauthn_credential_id)) {
        return jsonResponse({ error: "Credential not found for this user." });
      }

      const dbCredIdUrl = uint8ArrayToBase64url(base64ToUint8Array(profile!.webauthn_credential_id));
      if (dbCredIdUrl !== credIdUrl) {
        return jsonResponse({ error: "Credential mismatch." });
      }

      const credentialPublicKey = base64ToUint8Array(profile!.webauthn_public_key);
      const credentialIDBytes = base64ToUint8Array(profile!.webauthn_credential_id);
      const credentialIdBase64url = uint8ArrayToBase64url(credentialIDBytes);

      try {
        const verification = await verifyAuthenticationResponse({
          response: credential,
          expectedChallenge: row.challenge,
          expectedOrigin: originToUse,
          expectedRPID: rpID,
          credential: {
            id: credentialIdBase64url,
            publicKey: credentialPublicKey,
            counter: 0,
          },
        });

        if (!verification.verified) {
          return jsonResponse({ error: "Weryfikacja biometryczna nie powiodła się" });
        }

        // ─── WebAuthn verified — now create a real Supabase session ───
        const verifiedUserId = row.user_id;

        // Get user email from auth
        const { data: { user: authUser }, error: userErr } = await supabaseAdmin.auth.admin.getUserById(verifiedUserId);
        if (userErr || !authUser?.email) {
          await supabaseAdmin.from("webauthn_challenges").delete().eq("challenge_key", challengeKey);
          return jsonResponse({ error: "Nie można znaleźć adresu e-mail dla tego konta." });
        }

        const email = authUser.email;

        // Save current password hash so we can restore it later
        const { data: oldHash } = await supabaseAdmin.rpc("get_user_password_hash", { user_id: verifiedUserId });
        const hasExistingPassword = oldHash && oldHash.length > 0;

        // Generate temporary password (only we know it, never revealed to user)
        const tempPassword = generatePassword(24);

        // Set temp password via admin API
        const { error: setPwErr } = await supabaseAdmin.auth.admin.updateUserById(verifiedUserId, { password: tempPassword });
        if (setPwErr) {
          await supabaseAdmin.from("webauthn_challenges").delete().eq("challenge_key", challengeKey);
          return jsonResponse({ error: "Nie udało się przygotować sesji: " + setPwErr.message });
        }

        // Sign in to get real session tokens
        const { data: signInData, error: signInErr } = await supabaseAdmin.auth.signInWithPassword({
          email,
          password: tempPassword,
        });

        // Restore original password hash (or clear if user had none)
        if (hasExistingPassword) {
          await supabaseAdmin.rpc("restore_user_password_hash", { user_id: verifiedUserId, password_hash: oldHash });
        } else {
          await supabaseAdmin.rpc("restore_user_password_hash", { user_id: verifiedUserId, password_hash: null });
        }

        if (signInErr || !signInData?.session) {
          await supabaseAdmin.from("webauthn_challenges").delete().eq("challenge_key", challengeKey);
          return jsonResponse({ error: "Weryfikacja biometryczna OK, ale nie udało się utworzyć sesji. Spróbuj ponownie." });
        }

        // Clean up challenge
        await supabaseAdmin.from("webauthn_challenges").delete().eq("challenge_key", challengeKey);

        return jsonResponse({
          success: true,
          userId: verifiedUserId,
          session: {
            access_token: signInData.session.access_token,
            refresh_token: signInData.session.refresh_token,
            expires_at: signInData.session.expires_at,
          },
        });
      } catch (err) {
        return jsonResponse({ error: "Verification error: " + (err instanceof Error ? err.message : String(err)) });
      }
    }

    if (action === "remove") {
      if (!userId) {
        return jsonResponse({ error: "Missing userId" });
      }
      await supabaseAdmin.from("webauthn_challenges").delete().eq("user_id", userId);
      const { error } = await supabaseAdmin
        .from("profiles")
        .update({
          webauthn_credential_id: null,
          webauthn_public_key: null,
          webauthn_challenge: null,
          webauthn_challenge_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);
      if (error) return jsonResponse({ error: error.message });
      return jsonResponse({ success: true });
    }

    if (action === "check") {
      if (!userId) return jsonResponse({ error: "Missing userId" });
      const { data } = await supabaseAdmin
        .from("profiles")
        .select("webauthn_credential_id")
        .eq("id", userId)
        .maybeSingle();
      return jsonResponse({ hasWebAuthn: hasCredential(data?.webauthn_credential_id) });
    }

    return jsonResponse({ error: "Unknown action: " + action });
  } catch (err) {
    console.error("webauthn-auth error:", err);
    return jsonResponse({ error: "Internal server error: " + (err instanceof Error ? err.message : String(err)) });
  }
});

function jsonResponse(body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
