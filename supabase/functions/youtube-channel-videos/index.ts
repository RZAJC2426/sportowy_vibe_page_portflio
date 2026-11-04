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

// ─── RSS parser ───
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
    const title = titleMatch ? decodeHtmlEntities(titleMatch[1].trim()) : '';
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
    const description = descMatch ? decodeHtmlEntities(descMatch[1].trim()) : '';

    let views = '';
    const viewsMatch = entryXml.match(/<media:statistics[^>]*views="([^"]+)"/);
    if (viewsMatch) views = viewsMatch[1].trim();

    videos.push({ video_id: videoId, title, thumbnail_url: thumbnailUrl, published_at: publishedAt, description, views });
  }
  return videos;
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&#x27;/g, "'");
}

async function fetchRss(): Promise<VideoData[]> {
  const response = await fetch(RSS_URL, {
    headers: {
      'User-Agent': 'SportowyVIBE/1.0 (YouTube RSS Reader)',
      'Accept': 'application/xml, text/xml, */*',
    },
  });

  if (!response.ok) throw new Error(`RSS returned status ${response.status}`);
  const xml = await response.text();
  return parseXmlEntries(xml);
}

// ─── YouTube Data API v3 ───
async function fetchAllViaApi(apiKey: string): Promise<VideoData[]> {
  // Step 1: Get uploads playlist ID
  const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${CHANNEL_ID}&key=${apiKey}`;
  const channelResp = await fetch(channelUrl, { headers: { 'Accept': 'application/json' } });
  if (!channelResp.ok) {
    const text = await channelResp.text();
    throw new Error(`Channel API error ${channelResp.status}: ${text.slice(0, 300)}`);
  }
  const channelData = await channelResp.json();
  if (!channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads) {
    throw new Error('Could not find uploads playlist ID');
  }
  const uploadsPlaylistId = channelData.items[0].contentDetails.relatedPlaylists.uploads;

  // Step 2: Paginate through all playlist items (50 per page)
  const allItems: { videoId: string; title: string; thumb: string; publishedAt: string; description: string }[] = [];
  let nextPageToken: string | undefined = undefined;
  let pages = 0;
  const maxPages = 15; // 15 * 50 = 750 videos max (way above 272)

  do {
    pages++;
    const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=50&key=${apiKey}${nextPageToken ? `&pageToken=${nextPageToken}` : ''}`;
    const resp = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`Playlist API error ${resp.status} page ${pages}: ${text.slice(0, 300)}`);
    }
    const data = await resp.json();

    for (const item of data.items || []) {
      const snippet = item.snippet;
      if (!snippet?.resourceId?.videoId) continue;
      const videoId = snippet.resourceId.videoId;
      const title = snippet.title || '';
      const publishedAt = snippet.publishedAt || '';
      const description = snippet.description || '';
      const thumbs = snippet.thumbnails;
      let thumb = '';
      if (thumbs) {
        thumb = thumbs.maxres?.url || thumbs.standard?.url || thumbs.high?.url || thumbs.medium?.url || thumbs.default?.url || '';
      }
      allItems.push({ videoId, title, thumb, publishedAt, description });
    }

    nextPageToken = data.nextPageToken;
  } while (nextPageToken && pages < maxPages);

  console.log(`[youtube-channel-videos] API: fetched ${allItems.length} items across ${pages} pages`);

  // Step 3: Get view counts in batches (50 per call, 1 quota unit each)
  const videoIds = allItems.map((i) => i.videoId);
  const viewMap: Record<string, string> = {};
  const batchSize = 50;
  for (let i = 0; i < videoIds.length; i += batchSize) {
    const batch = videoIds.slice(i, i + batchSize);
    const idsParam = batch.join(',');
    const statsUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${idsParam}&key=${apiKey}`;
    try {
      const statsResp = await fetch(statsUrl, { headers: { 'Accept': 'application/json' } });
      if (statsResp.ok) {
        const statsData = await statsResp.json();
        for (const item of statsData.items || []) {
          const vc = item.statistics?.viewCount;
          if (vc) viewMap[item.id] = String(vc);
        }
      }
    } catch (err) {
      console.error(`[youtube-channel-videos] Stats batch ${i} failed:`, err);
    }
  }

  const videos: VideoData[] = allItems.map((item) => ({
    video_id: item.videoId,
    title: item.title,
    thumbnail_url: item.thumb,
    published_at: item.publishedAt,
    description: item.description,
    views: viewMap[item.videoId] || '',
  }));

  return videos;
}

// ─── DB helpers ───
async function upsertVideosInDb(supabase: ReturnType<typeof createClient>, videos: VideoData[]) {
  if (videos.length === 0) return;

  const rows = videos.map((v) => ({
    video_id: v.video_id,
    title: v.title || '',
    thumbnail_url: v.thumbnail_url || '',
    published_at: v.published_at || new Date().toISOString(),
    description: v.description || '',
    views: v.views || '',
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
    throw new Error(`DB upsert failed: ${error.message}`);
  } else {
    console.log(`Upserted ${rows.length} videos into DB`);
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

// ─── Merge API + RSS ───
function mergeVideos(apiVideos: VideoData[], rssVideos: VideoData[]): VideoData[] {
  const rssMap = new Map<string, VideoData>();
  for (const v of rssVideos) rssMap.set(v.video_id, v);

  const merged: VideoData[] = [];
  const seenIds = new Set<string>();

  for (const v of apiVideos) {
    const rssV = rssMap.get(v.video_id);
    if (rssV) {
      merged.push({
        video_id: rssV.video_id,
        title: rssV.title,
        thumbnail_url: rssV.thumbnail_url || v.thumbnail_url,
        published_at: rssV.published_at,
        description: rssV.description,
        views: rssV.views,
      });
    } else {
      merged.push(v);
    }
    seenIds.add(v.video_id);
  }

  for (const v of rssVideos) {
    if (!seenIds.has(v.video_id)) {
      merged.push(v);
      seenIds.add(v.video_id);
    }
  }

  merged.sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());
  return merged;
}

// ─── Main handler ───
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

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const apiKey = Deno.env.get('YOUTUBE_API_KEY') ?? '';
  const supabase = supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;

  try {
    let apiVideos: VideoData[] = [];
    let rssVideos: VideoData[] = [];
    let sourceUsed: string = 'unknown';

    // Try YouTube Data API v3 first
    if (apiKey && apiKey.startsWith('AIza') && apiKey.length >= 20) {
      try {
        apiVideos = await fetchAllViaApi(apiKey);
        sourceUsed = 'youtube_api';
        console.log(`[youtube-channel-videos] API fetched ${apiVideos.length} videos`);
      } catch (apiErr) {
        console.error('[youtube-channel-videos] YouTube Data API failed:', apiErr);
      }
    } else {
      console.log('[youtube-channel-videos] No YOUTUBE_API_KEY available, skipping API');
    }

    // Always try RSS for richer data on latest videos
    try {
      rssVideos = await fetchRss();
    } catch (rssErr) {
      console.error('[youtube-channel-videos] RSS fetch failed:', rssErr);
    }

    // Merge
    const merged = mergeVideos(apiVideos, rssVideos);
    if (merged.length > 0 && sourceUsed === 'unknown') {
      sourceUsed = 'rss';
    }

    // Upsert to DB (awaited!)
    if (supabase && merged.length > 0) {
      await upsertVideosInDb(supabase, merged);
    }

    // Re-read from DB to confirm
    let dbVideos: VideoData[] = [];
    if (supabase) {
      dbVideos = await getCachedVideos(supabase);
    }

    return new Response(
      JSON.stringify({
        success: true,
        count: merged.length,
        dbCount: dbVideos.length,
        fetchedAt: new Date().toISOString(),
        source: sourceUsed,
        apiCount: apiVideos.length,
        rssCount: rssVideos.length,
        mergedCount: merged.length,
        apiKeyAvailable: !!(apiKey && apiKey.startsWith('AIza')),
      }),
      { headers: corsHeaders }
    );
  } catch (err) {
    console.error('[youtube-channel-videos] Edge Function error:', err);

    return new Response(
      JSON.stringify({
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
        fetchedAt: new Date().toISOString(),
        apiKeyAvailable: !!(apiKey && apiKey.startsWith('AIza')),
        hint: !apiKey || !apiKey.startsWith('AIza')
          ? 'Dodaj klucz YOUTUBE_API_KEY w Supabase Dashboard -> Edge Function Secrets. Wejdź na console.cloud.google.com, włącz YouTube Data API v3 i utwórz API key.'
          : undefined,
      }),
      { status: 200, headers: corsHeaders }
    );
  }
});
