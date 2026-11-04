import { supabase } from '@/lib/supabase';

export interface Discipline {
  slug: string;
  name: string;
  icon: string;
  iconSvg: string | null;
  color: string;
  description: string | null;
  heroImage: string | null;
  heroPosition: string | null;
  cardImage: string | null;
  latestHeadline: string | null;
  sortOrder: number;
  hasSubpage: boolean;
}

export interface ChannelNewsItem {
  id: number;
  icon: string;
  tag: string;
  title: string;
  description: string | null;
  content: string | null;
  newsDate: string | null;
  sortOrder: number;
}

// ─── In-memory cache ────────────────────────────────────────────────
let disciplinesCache: Discipline[] | null = null;
let disciplinesMapCache: Record<string, Discipline> | null = null;
let channelNewsCache: ChannelNewsItem[] | null = null;

function mapDiscipline(row: Record<string, unknown>): Discipline {
  return {
    slug: row.slug as string,
    name: row.name as string,
    icon: row.icon as string,
    iconSvg: (row.icon_svg as string) ?? null,
    color: row.color as string,
    description: (row.description as string) ?? null,
    heroImage: (row.hero_image as string) ?? null,
    heroPosition: (row.hero_position as string) ?? 'center',
    cardImage: (row.card_image as string) ?? null,
    latestHeadline: (row.latest_headline as string) ?? null,
    sortOrder: (row.sort_order as number) ?? 0,
    hasSubpage: (row.has_subpage as boolean) ?? true,
  };
}

function mapChannelNews(row: Record<string, unknown>): ChannelNewsItem {
  return {
    id: row.id as number,
    icon: row.icon as string,
    tag: row.tag as string,
    title: row.title as string,
    description: (row.description as string) ?? null,
    content: (row.content as string) ?? null,
    newsDate: (row.news_date as string) ?? null,
    sortOrder: (row.sort_order as number) ?? 0,
  };
}

/**
 * Fetch all disciplines ordered by sort_order.
 */
export async function fetchAllDisciplines(): Promise<Discipline[]> {
  if (disciplinesCache) {
    return disciplinesCache;
  }

  const { data, error } = await supabase
    .from('disciplines')
    .select('slug, name, icon, icon_svg, color, description, hero_image, hero_position, card_image, latest_headline, sort_order, has_subpage')
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('fetchAllDisciplines error:', error);
    return [];
  }

  if (!data || data.length === 0) {
    return [];
  }

  disciplinesCache = data.map(mapDiscipline);
  return disciplinesCache;
}

/**
 * Fetch a single discipline by slug.
 * Uses direct query with .limit(1) instead of maybeSingle().
 */
export async function fetchDisciplineBySlug(slug: string): Promise<Discipline | null> {
  const { data, error } = await supabase
    .from('disciplines')
    .select('slug, name, icon, icon_svg, color, description, hero_image, hero_position, card_image, latest_headline, sort_order, has_subpage')
    .eq('slug', slug)
    .limit(1);

  if (error) {
    console.error('fetchDisciplineBySlug error:', error);
  }

  if (data && data.length > 0) {
    return mapDiscipline(data[0]);
  }

  // Fallback to cache
  const all = await fetchAllDisciplines();
  disciplinesMapCache = {};
  for (const d of all) {
    disciplinesMapCache[d.slug] = d;
  }
  return disciplinesMapCache[slug] ?? null;
}

/**
 * Get disciplines for display cards (must have cardImage).
 */
export async function fetchDisciplinesForCards(): Promise<Discipline[]> {
  const all = await fetchAllDisciplines();
  return all.filter((d) => d.cardImage);
}

/**
 * Fetch all channel news ordered by sort_order.
 */
export async function fetchAllChannelNews(): Promise<ChannelNewsItem[]> {
  if (channelNewsCache) return channelNewsCache;

  const { data, error } = await supabase
    .from('channel_news')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('fetchAllChannelNews error:', error);
    return [];
  }

  if (!data || data.length === 0) {
    channelNewsCache = [];
    return [];
  }

  channelNewsCache = data.map(mapChannelNews);
  return channelNewsCache;
}

/**
 * Fetch a single channel news item by id (INCLUDES full content).
 */
export async function fetchChannelNewsById(id: number): Promise<ChannelNewsItem | null> {
  const { data, error } = await supabase
    .from('channel_news')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error || !data) {
    console.error('fetchChannelNewsById error:', error);
    return null;
  }

  return mapChannelNews(data);
}

/**
 * Get featured disciplines (limited count, for homepage cards).
 */
export async function fetchFeaturedDisciplines(limit = 6): Promise<Discipline[]> {
  const all = await fetchDisciplinesForCards();
  return all.slice(0, limit);
}

/**
 * Bust all caches. Call after admin edits.
 */
export function bustDisciplinesCache(): void {
  disciplinesCache = null;
  disciplinesMapCache = null;
  channelNewsCache = null;
}