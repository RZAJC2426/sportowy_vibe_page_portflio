import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'apikey, Authorization, Content-Type',
      },
    });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  const { provider, redirectTo } = body;
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';

  if (!provider || !supabaseUrl || !supabaseAnonKey) {
    return new Response(JSON.stringify({ error: 'Missing provider or env vars' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  const authUrl = new URL(`${supabaseUrl}/auth/v1/authorize`);
  authUrl.searchParams.set('provider', provider);
  if (redirectTo) {
    authUrl.searchParams.set('redirect_to', redirectTo);
  }

  const response = await fetch(authUrl.toString(), {
    method: 'GET',
    headers: {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`,
    },
    redirect: 'manual',
  });

  const location = response.headers.get('location');
  if (!location) {
    const respBody = await response.text();
    return new Response(
      JSON.stringify({
        error: 'Supabase did not return redirect',
        status: response.status,
        body: respBody.substring(0, 500),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      },
    );
  }

  return new Response(JSON.stringify({ url: location }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
});
