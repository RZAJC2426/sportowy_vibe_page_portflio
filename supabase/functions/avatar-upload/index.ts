
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    let json: Record<string, unknown> = {};
    const contentTypeHeader = req.headers.get("content-type") || "";

    if (!contentTypeHeader.includes("multipart/form-data")) {
      try {
        json = await req.json();
      } catch {
        // ignore
      }
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: "Server misconfiguration" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized — missing auth token" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");

    const verifyResp = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "apikey": supabaseServiceKey,
      },
    });
    const verifyData = await verifyResp.json();
    const callerId = verifyData?.id;

    if (!verifyResp.ok || !callerId) {
      return new Response(
        JSON.stringify({ error: "Unauthorized — invalid token" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const listUrl = `${supabaseUrl}/storage/v1/bucket`;
    const listResp = await fetch(listUrl, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${supabaseServiceKey}`,
        "apikey": supabaseServiceKey,
        "Content-Type": "application/json",
      },
    });

    if (!listResp.ok) {
      return new Response(
        JSON.stringify({ error: "Storage API not available" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let buckets: Array<{ id: string; name: string; public: boolean }> = [];
    try {
      buckets = await listResp.json();
    } catch {
      // non-JSON response
    }

    const avatarsBucket = buckets?.find((b) => b.name === "avatars");
    if (!avatarsBucket) {
      const createResp = await fetch(`${supabaseUrl}/storage/v1/bucket`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${supabaseServiceKey}`,
          "apikey": supabaseServiceKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: "avatars",
          name: "avatars",
          public: true,
          file_size_limit: 5242880,
          allowed_mime_types: ["image/png", "image/jpeg", "image/webp", "image/gif"],
        }),
      });
      if (!createResp.ok) {
        return new Response(
          JSON.stringify({ error: "Storage createBucket failed" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    let fileBuffer: Uint8Array;
    let filePath: string;
    let mimeType: string;
    let userId: string;

    if (contentTypeHeader.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      userId = (formData.get("userId") as string | null) || "";

      if (!file || !userId) {
        return new Response(
          JSON.stringify({ error: "Missing file or userId" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (userId !== callerId) {
        return new Response(
          JSON.stringify({ error: "Forbidden — can only upload your own avatar" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      fileBuffer = new Uint8Array(await file.arrayBuffer());
      const ext = (file.name || "avatar.png").split(".").pop() || "png";
      const safeExt = ext.replace(/[^a-zA-Z0-9]/g, "");
      filePath = `${userId}/${Date.now()}.${safeExt}`;
      mimeType = file.type || `image/${safeExt}`;

      const allowedMimeTypes = ["image/png", "image/jpeg", "image/webp", "image/gif"];
      if (!allowedMimeTypes.includes(mimeType)) {
        return new Response(
          JSON.stringify({ error: `Invalid file type: ${mimeType}` }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else {
      const { fileBase64, userId: uid, fileName, contentType: ct } = json as {
        fileBase64?: string;
        userId?: string;
        fileName?: string;
        contentType?: string;
      };
      userId = uid || "";

      if (userId !== callerId) {
        return new Response(
          JSON.stringify({ error: "Forbidden — can only upload your own avatar" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!fileBase64 || typeof fileBase64 !== "string" || !userId) {
        return new Response(
          JSON.stringify({ error: "Missing or invalid fileBase64 / userId" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      try {
        fileBuffer = decodeBase64(fileBase64);
      } catch (decodeErr) {
        const msg = decodeErr instanceof Error ? decodeErr.message : "Base64 decode failed";
        return new Response(
          JSON.stringify({ error: `Base64 decode failed: ${msg}` }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const safeName = (fileName || `${Date.now()}`).replace(/[^a-zA-Z0-9._-]/g, "_");
      filePath = `${userId}/${safeName}`;
      mimeType = ct || "image/jpeg";

      const allowedMimeTypes = ["image/png", "image/jpeg", "image/webp", "image/gif"];
      if (!allowedMimeTypes.includes(mimeType)) {
        return new Response(
          JSON.stringify({ error: `Invalid file type: ${mimeType}` }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    if (fileBuffer.byteLength > 5 * 1024 * 1024) {
      return new Response(
        JSON.stringify({ error: `File exceeds 5MB` }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const uploadUrl = `${supabaseUrl}/storage/v1/object/avatars/${filePath}`;

    const uploadResp = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${supabaseServiceKey}`,
        "apikey": supabaseServiceKey,
        "Content-Type": mimeType,
        "x-upsert": "true",
        "Cache-Control": "max-age=2592000",
      },
      body: fileBuffer,
    });

    const uploadText = await uploadResp.text();

    if (!uploadResp.ok) {
      return new Response(
        JSON.stringify({ error: `Storage upload failed: ${uploadResp.status} — ${uploadText.slice(0, 200)}` }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const avatarUrl = `${supabaseUrl}/storage/v1/object/public/avatars/${filePath}`;

    const profileResp = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${userId}`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${supabaseServiceKey}`,
        "apikey": supabaseServiceKey,
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
      },
      body: JSON.stringify({
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      }),
    });

    if (!profileResp.ok) {
      return new Response(
        JSON.stringify({ error: "Profile update failed" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ avatarUrl }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: `Unhandled: ${message}` }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
