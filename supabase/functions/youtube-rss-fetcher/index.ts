import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CHANNEL_ID = 'UCObdCja7XEDvr0mpkxXF8_Q';
const RSS_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`;

interface VideoData {
  video_id: string;
  title: string;
  thumbnail_url: string;
  published_at: string;
  description: string;
  views: string;
}

function parseXmlEntries(xml: string): VideoData[] {
  const videos: VideoData[] = [];
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  let entryMatch: RegExpExecArray | null;

  while ((entryMatch = entryRegex.exec(xml)) !== null) {
    const entryXml = entryMatch[1];

    let videoId = '';
    const videoIdMatch = entryXml.match(/<yt:videoId>([^<]+)<\/yt:videoId>/);
    if (videoIdMatch) {
      videoId = videoIdMatch[1].trim();
    } else {
      const idMatch = entryXml.match(/<id>yt:video:([^<]+)<\/id>/);
      if (idMatch) videoId = idMatch[1].trim();
    }
    if (!videoId) continue;

    const titleMatch = entryXml.match(/<title>([^<]+)<\/title>/);
    const title = titleMatch ? titleMatch[1].trim().replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'") : '';

    const publishedMatch = entryXml.match(/<published>([^<]+)<\/published>/);
    const publishedAt = publishedMatch ? publishedMatch[1].trim() : '';

    let thumbnailUrl = '';
    const thumbnailRegex = /<media:thumbnail[^>]*url="([^"]+)"/g;
    let thumbMatch: RegExpExecArray | null;
    let lastThumb = '';
    while ((thumbMatch = thumbnailRegex.exec(entryXml)) !== null) {
      lastThumb = thumbMatch[1].trim();
    }
    thumbnailUrl = lastThumb;

    const descMatch = entryXml.match(/<media:description>([\s\S]*?)<\/media:description>/);
    const description = descMatch ? descMatch[1].trim().replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'") : '';

    let views = '';
    const viewsMatch = entryXml.match(/<media:statistics[^>]*views="([^"]+)"/);
    if (viewsMatch) {
      views = viewsMatch[1].trim();
    }

    videos.push({
      video_id: videoId,
      title,
      thumbnail_url: thumbnailUrl,
      published_at: publishedAt,
      description,
      views,
    });
  }

  return videos;
}

async function fetchAndParseYouTubeRss(): Promise<VideoData[]> {
  const response = await fetch(RSS_URL, {
    headers: {
      'User-Agent': 'SportowyVIBE/1.0 (YouTube RSS Reader; +https://sportowyvibe.pl)',
      'Accept': 'application/xml, text/xml, */*',
    },
  });

  if (!response.ok) {
    throw new Error(`YouTube RSS returned status ${response.status}`);
  }

  const xml = await response.text();
  const videos = parseXmlEntries(xml);

  if (videos.length === 0) {
    throw new Error('No video entries found in RSS feed');
  }

  return videos;
}

async function upsertVideosInDb(supabase: ReturnType<typeof createClient>, videos: VideoData[]) {
  if (videos.length === 0) return;

  const rows = videos.map((v) => ({
    video_id: v.video_id,
    title: v.title,
    thumbnail_url: v.thumbnail_url,
    published_at: v.published_at,
    description: v.description,
    views: v.views,
    channel_id: CHANNEL_ID,
    fetched_at: new Date().toISOString(),
    duration_seconds: null,
  }));

  const { error } = await supabase.from('youtube_videos_cache').upsert(rows, {
    onConflict: 'video_id',
    ignoreDuplicates: false,
  });

  if (error) {
    console.error('Failed to upsert videos in DB:', error.message);
  } else {
    console.log(`Upserted ${rows.length} videos into DB (RSS)`);
  }
}

async function getCachedVideos(supabase: ReturnType<typeof createClient>): Promise<VideoData[]> {
  const { data, error } = await supabase
    .from('youtube_videos_cache')
    .select('video_id, title, thumbnail_url, published_at, description, views')
    .eq('channel_id', CHANNEL_ID)
    .order('published_at', { ascending: false });

  if (error) {
    console.error('Failed to read cache:', error.message);
    return [];
  }

  return (data || []) as VideoData[];
}

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
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let videos: VideoData[] = [];

    try {
      videos = await fetchAndParseYouTubeRss();
      // Upsert instead of delete+insert to preserve older videos in cache
      upsertVideosInDb(supabase, videos).catch((err) => console.error('Background cache failed:', err));
    } catch (fetchError) {
      console.error('YouTube fetch failed, falling back to DB cache:', fetchError);
      videos = await getCachedVideos(supabase);
    }

    return new Response(
      JSON.stringify({
        videos,
        fetchedAt: new Date().toISOString(),
        source: videos.length > 0 ? 'youtube' : 'cache',
      }),
      { headers: corsHeaders }
    );
  } catch (err) {
    console.error('Edge Function error:', err);
    return new Response(
      JSON.stringify({
        videos: [],
        error: err instanceof Error ? err.message : 'Unknown error',
        fetchedAt: new Date().toISOString(),
        source: 'error',
      }),
      { status: 200, headers: corsHeaders }
    );
  }
});
