import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async () => {
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  
  if (!serviceRoleKey || !supabaseUrl) {
    return new Response(JSON.stringify({ error: 'Missing env vars', envKeys: Object.keys(Deno.env.toObject()).filter(k => k.includes('SUPA') || k.includes('URL')) }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
  
  const response = await fetch(`${supabaseUrl}/auth/v1/admin/providers`, {
    headers: {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey,
    },
  });
  
  const body = await response.text();
  
  return new Response(JSON.stringify({ 
    status: response.status,
    supabaseUrl,
    bodyLength: body.length,
    preview: body.substring(0, 3000),
  }), { status: 200, headers: { 'Content-Type': 'application/json' } });
});
