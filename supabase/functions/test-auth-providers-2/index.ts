import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async () => {
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  
  if (!serviceRoleKey || !supabaseUrl) {
    return new Response(JSON.stringify({ error: 'Missing env vars' }), { status: 200 });
  }
  
  // Try calling Supabase GoTrue admin providers endpoint
  const response = await fetch(`${supabaseUrl}/auth/v1/admin/providers`, {
    headers: {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey,
    },
  });
  
  const body = await response.text();
  
  return new Response(JSON.stringify({ 
    status: response.status,
    body: body.substring(0, 500),
  }), { status: 200 });
});