import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

function ok(payload: unknown) {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const ALLOWED_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "video/mp4",
  "video/webm",
  "video/ogg",
];

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

function extFromMime(mimeType: string): string {
  switch (mimeType) {
    case "image/svg+xml": return "svg";
    case "image/png": return "png";
    case "image/jpeg": return "jpg";
    case "image/webp": return "webp";
    case "image/gif": return "gif";
    case "video/mp4": return "mp4";
    case "video/webm": return "webm";
    case "video/ogg": return "ogg";
    default: return "bin";
  }
}

function sanitizeName(name: string): string {
  const clean = name.replace(/[^a-zA-Z0-9._-]/g, "_");
  return clean.replace(/\.(svg|png|jpe?g|webp|gif|mp4|webm|ogg)$/i, "");
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("[site-image-upload] Request received");

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !supabaseServiceKey) {
      return ok({ error: "Server misconfiguration" });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return ok({ error: "Unauthorized — missing auth token" });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: verifyError } = await supabaseAdmin.auth.getUser(token);
    const caller = userData?.user;

    if (verifyError || !caller) {
      return ok({ error: "Unauthorized — invalid token" });
    }

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", caller.id)
      .maybeSingle();

    if (!profile || profile.role !== "admin") {
      return ok({ error: "Forbidden — admin access required" });
    }

    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    const bucketNames = (buckets || []).map((b: { name: string }) => b.name);

    if (!bucketNames.includes("site-images")) {
      const { error: createErr } = await supabaseAdmin.storage.createBucket("site-images", {
        public: true,
        fileSizeLimit: MAX_FILE_SIZE,
      });
      if (createErr) {
        return ok({ error: `Bucket creation failed: ${createErr.message}` });
      }
    }

    let json: Record<string, unknown> = {};
    try {
      json = await req.json();
    } catch {
      return ok({ error: "Invalid JSON body" });
    }

    const {
      imageBase64,
      fileName: providedName,
      contentType: providedType,
      existingUrl,
    } = json as {
      imageBase64?: string;
      fileName?: string;
      contentType?: string;
      existingUrl?: string;
    };

    if (!imageBase64 || typeof imageBase64 !== "string") {
      return ok({ error: "Missing imageBase64" });
    }

    let base64Data = imageBase64;
    let mimeType = providedType || "image/webp";
    if (imageBase64.startsWith("data:")) {
      const parts = imageBase64.match(/^data:(.+);base64,(.*)$/);
      if (!parts || parts.length !== 3) {
        return ok({ error: "Invalid data URL format" });
      }
      mimeType = parts[1] || mimeType;
      base64Data = parts[2];
    }

    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      return ok({
        error: `Invalid file type: ${mimeType}. Allowed: ${ALLOWED_MIME_TYPES.join(", ")}`,
      });
    }

    if (base64Data.length === 0) {
      return ok({ error: "Empty base64 data" });
    }

    let fileBuffer: Uint8Array;
    try {
      fileBuffer = decodeBase64(base64Data);
    } catch (decodeErr) {
      const msg = decodeErr instanceof Error ? decodeErr.message : "Base64 decode failed";
      return ok({ error: `Base64 decode failed: ${msg}` });
    }

    if (fileBuffer.byteLength > MAX_FILE_SIZE) {
      return ok({
        error: `File exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB (${Math.round(fileBuffer.byteLength / 1024)}KB)`,
      });
    }

    const ext = extFromMime(mimeType);
    const safeName = sanitizeName(providedName || `${Date.now()}-upload`);

    let filePath: string;

    if (existingUrl && typeof existingUrl === "string") {
      const publicIdx = existingUrl.indexOf("/public/site-images/");
      const simpleIdx = existingUrl.indexOf("/site-images/");

      if (publicIdx !== -1) {
        const afterBucket = existingUrl.substring(publicIdx + "/public/site-images/".length);
        filePath = decodeURIComponent(afterBucket.split("?")[0]);
        console.log("[site-image-upload] Overwriting (public path):", filePath);
      } else if (simpleIdx !== -1) {
        const afterBucket = existingUrl.substring(simpleIdx + "/site-images/".length);
        filePath = decodeURIComponent(afterBucket.split("?")[0]);
        console.log("[site-image-upload] Overwriting (simple path):", filePath);
      } else {
        filePath = `site/${safeName}.${ext}`;
        console.log("[site-image-upload] New file (URL parsing failed — no /site-images/ in URL):", filePath);
      }
    } else {
      filePath = `site/${safeName}.${ext}`;
      console.log("[site-image-upload] New file (no existingUrl):", filePath);
    }

    const fileBlob = new Blob([fileBuffer], { type: mimeType });

    const isOverwrite = !!(existingUrl && typeof existingUrl === "string" &&
      (existingUrl.includes("/public/site-images/") || existingUrl.includes("/site-images/")));

    if (isOverwrite) {
      console.log("[site-image-upload] Removing existing file before overwrite:", filePath);
      const { error: removeErr } = await supabaseAdmin.storage
        .from("site-images")
        .remove([filePath]);

      if (removeErr) {
        console.warn("[site-image-upload] Remove warning (file may not exist yet):", removeErr.message);
      }
    }

    const { error: uploadError } = await supabaseAdmin.storage
      .from("site-images")
      .upload(filePath, fileBlob, {
        contentType: mimeType,
        upsert: true,
        cacheControl: "2592000",
      });

    if (uploadError) {
      return ok({ error: `Upload failed: ${uploadError.message}` });
    }

    const { data: urlData } = supabaseAdmin.storage
      .from("site-images")
      .getPublicUrl(filePath);

    const publicUrl = urlData?.publicUrl || "";

    if (!publicUrl) {
      return ok({ error: "Failed to generate public URL" });
    }

    console.log("[site-image-upload] Success:", publicUrl);

    return ok({
      url: publicUrl,
      overwritten: isOverwrite,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return ok({ error: `Unhandled: ${message}` });
  }
});