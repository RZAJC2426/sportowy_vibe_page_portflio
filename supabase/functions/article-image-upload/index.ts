
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

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
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

    if (!profile || (profile.role !== "admin" && profile.role !== "moderator")) {
      return ok({ error: "Forbidden — admin or moderator access required" });
    }

    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    const bucketNames = (buckets || []).map((b: { name: string }) => b.name);
    
    if (!bucketNames.includes("article-images")) {
      const { error: createErr } = await supabaseAdmin.storage.createBucket("article-images", {
        public: true,
        fileSizeLimit: 10485760,
        allowedMimeTypes: ["image/png", "image/jpeg", "image/webp", "image/gif"],
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

    const { imageBase64, fileName: providedName, contentType: providedType } = json as {
      imageBase64?: string;
      fileName?: string;
      contentType?: string;
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

    const allowedMimeTypes = ["image/png", "image/jpeg", "image/webp", "image/gif"];
    if (!allowedMimeTypes.includes(mimeType)) {
      return ok({ error: `Invalid file type: ${mimeType}` });
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

    if (fileBuffer.byteLength > 10 * 1024 * 1024) {
      return ok({ error: `File exceeds 10MB` });
    }

    const safeName = (providedName || `${Date.now()}-upload`).replace(/[^a-zA-Z0-9._-]/g, "_");
    const filePath = `articles/${safeName}.webp`;

    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from("article-images")
      .upload(filePath, fileBuffer, {
        contentType: mimeType,
        upsert: true,
        cacheControl: '2592000',
      });

    if (uploadError) {
      return ok({ error: `Storage upload failed: ${uploadError.message}` });
    }

    const { data: urlData } = supabaseAdmin.storage
      .from("article-images")
      .getPublicUrl(filePath);

    const publicUrl = urlData?.publicUrl || "";

    if (!publicUrl) {
      return ok({ error: "Failed to generate public URL" });
    }

    return ok({ url: publicUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return ok({ error: `Unhandled exception: ${message}` });
  }
});
