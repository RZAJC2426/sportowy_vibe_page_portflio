import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const CHANNEL_ID = 'UCObdCja7XEDvr0mpkxXF8_Q';

serve(async (_req: Request) => {
  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (_req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('YOUTUBE_API_KEY');
    if (!apiKey) {
      console.error('[youtube-channel-stats] Missing YOUTUBE_API_KEY secret');
      return new Response(
        JSON.stringify({
          subscriberCount: 0,
          videoCount: 0,
          viewCount: 0,
          error: 'BRAK_KLUCZA_API: YOUTUBE_API_KEY secret nie jest ustawiony w Supabase Edge Function Secrets',
          hint: 'Dodaj klucz w Supabase: Project Settings -> Edge Function Secrets -> Add secret (name: YOUTUBE_API_KEY, value: AIza...)',
          fetchedAt: new Date().toISOString(),
        }),
        { status: 200, headers: corsHeaders }
      );
    }

    // Sanity check — proper Google API key format starts with AIza
    const trimmedKey = apiKey.trim();
    if (!trimmedKey.startsWith('AIza') || trimmedKey.length < 20) {
      console.error('[youtube-channel-stats] Invalid API key format');
      return new Response(
        JSON.stringify({
          subscriberCount: 0,
          videoCount: 0,
          viewCount: 0,
          error: 'NIEPRAWIDLOWY_KLUCZ: Klucz API ma zły format. Prawidłowy klucz Google zaczyna się od "AIza" i ma ~39 znaków.',
          hint: 'Sprawdź czy w Supabase Secrets (Project Settings -> Edge Function Secrets) wartość YOUTUBE_API_KEY to pełny klucz z Google Cloud Console (Credentials -> API key).',
          fetchedAt: new Date().toISOString(),
        }),
        { status: 200, headers: corsHeaders }
      );
    }

    console.log(`[youtube-channel-stats] Fetching stats for channel ${CHANNEL_ID} using key prefix: ${trimmedKey.substring(0, 6)}...`);
    const url = `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${CHANNEL_ID}&key=${trimmedKey}`;

    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
    });

    const body = await response.text();

    if (!response.ok) {
      console.error(`[youtube-channel-stats] YouTube API error ${response.status}: ${body}`);
      let parsedMsg = body;
      try {
        const parsed = JSON.parse(body);
        parsedMsg = parsed?.error?.message || body;
      } catch { /* use raw body */ }
      return new Response(
        JSON.stringify({
          subscriberCount: 0,
          videoCount: 0,
          viewCount: 0,
          error: `API_ERROR_${response.status}: ${parsedMsg.substring(0, 200)}`,
          hint: response.status === 400
            ? 'Przyczyny: (1) Zły klucz API — sprawdź czy klucz pochodzi z Google Cloud Console -> Credentials -> API key, (2) YouTube Data API v3 nie jest włączone w Google Cloud Console -> APIs & Services -> Library, (3) Klucz ma ograniczenia IP/referrerów.'
            : 'Sprawdź Google Cloud Console -> APIs & Services -> Dashboard dla szczegółów błędu.',
          fetchedAt: new Date().toISOString(),
        }),
        { status: 200, headers: corsHeaders }
      );
    }

    const data = JSON.parse(body);

    if (!data.items || data.items.length === 0) {
      return new Response(
        JSON.stringify({
          subscriberCount: 0,
          videoCount: 0,
          viewCount: 0,
          error: 'NIEODNALEZIONO_KANALU: Channel ID może być błędny',
          fetchedAt: new Date().toISOString(),
        }),
        { status: 200, headers: corsHeaders }
      );
    }

    const stats = data.items[0].statistics;
    const subscriberCount = parseInt(stats.subscriberCount, 10) || 0;

    console.log(`[youtube-channel-stats] Success: ${subscriberCount} subscribers, ${stats.videoCount} videos, ${stats.viewCount} views`);

    return new Response(
      JSON.stringify({
        subscriberCount,
        videoCount: parseInt(stats.videoCount, 10) || 0,
        viewCount: parseInt(stats.viewCount, 10) || 0,
        fetchedAt: new Date().toISOString(),
      }),
      { headers: corsHeaders }
    );
  } catch (err) {
    console.error('[youtube-channel-stats] Unexpected error:', err);
    return new Response(
      JSON.stringify({
        subscriberCount: 0,
        videoCount: 0,
        viewCount: 0,
        error: `WYJATEK: ${err instanceof Error ? err.message : 'Unknown'}`,
        fetchedAt: new Date().toISOString(),
      }),
      { status: 200, headers: corsHeaders }
    );
  }
});
