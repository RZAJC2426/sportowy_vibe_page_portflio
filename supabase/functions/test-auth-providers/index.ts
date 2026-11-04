import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async () => {
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  
  if (!serviceRoleKey || !supabaseUrl) {
    return new Response(JSON.stringify({ error: 'Missing env vars' }), { status: 200 });
  }
  
  const supabase = createClient(supabaseUrl, serviceRoleKey);
  
  // Try calling Supabase GoTrue admin providers endpoint
  const response = await fetch(`${supabaseUrl}/auth/v1/admin/providers`, {
    headers: {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey,
    },
  });
  
  const body = await response.text();
  
  // Save result to test_results table
  await supabase.from('test_results').insert({
    test_name: 'admin_providers',
    status: response.status,
    body: body.substring(0, 500),
  });
  
  return new Response(JSON.stringify({ 
    status: response.status,
    saved: true,
  }), { status: 200 });
});
