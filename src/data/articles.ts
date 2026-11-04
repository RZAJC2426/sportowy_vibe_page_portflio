import { supabase } from '@/lib/supabase';

export interface Article {
  slug: string;
  title: string;
  discipline: string;
  disciplineSlug: string;
  date: string;
  summary: string;
  content: string;
  image: string;
  image_caption: string;
  featured: boolean;
  gallery: string[];
}

// ─── In-memory cache ────────────────────────────────────────────────
// Discipline queries are cached forever (data changes rarely).
// Individual articles are cached forever too — if you ever add an admin
// panel to edit articles, just add a cache-bust function here.
const disciplineCache = new Map<string, Article[]>();
const articleCache = new Map<string, Article | null>();

function mapRow(row: Record<string, unknown>): Article {
  let gallery: string[] = [];
  if (row.gallery) {
    if (Array.isArray(row.gallery)) {
      gallery = row.gallery as string[];
    } else if (typeof row.gallery === 'string') {
      try { gallery = JSON.parse(row.gallery); } catch { gallery = []; }
    }
  }
  return {
    slug: row.slug as string,
    title: row.title as string,
    discipline: row.discipline as string,
    disciplineSlug: row.discipline_slug as string,
    date: row.date as string,
    summary: row.summary as string,
    content: (row.content as string) ?? '',
    image: row.image as string,
    image_caption: (row.image_caption as string) ?? '',
    featured: (row.featured as boolean) ?? false,
    gallery,
  };
}

// ─── Image references ────────────────────────────────────────────────
// Storage images are now stored as direct URLs in the `image` column.
// The deprecated `article_images` table no longer exists — legacy
// "article-image:" prefix references are ignored by resolveImageReferences.

async function resolveImageReferences(articles: Article[]): Promise<Article[]> {
  // Pass-through: image URLs are already full Storage URLs
  return articles;
}

// ─── Public API ─────────────────────────────────────────────────────

/**
 * Fetch all articles for a discipline (NO content field — lightweight).
 * Results are cached in memory; subsequent calls are instant.
 */
export async function fetchArticlesByDiscipline(disciplineSlug: string): Promise<Article[]> {
  const cached = disciplineCache.get(disciplineSlug);
  if (cached) return cached;

  const { data, error } = await supabase
    .from('articles')
    .select('slug, title, discipline, discipline_slug, date, summary, image, image_caption, featured')
    .eq('discipline_slug', disciplineSlug)
    .order('featured', { ascending: false })
    .order('date', { ascending: false });

  if (error) {
    console.error('fetchArticlesByDiscipline error:', error);
    return [];
  }

  if (!data || data.length === 0) {
    disciplineCache.set(disciplineSlug, []);
    return [];
  }

  let articles = data.map(mapRow);
  articles = await resolveImageReferences(articles);
  disciplineCache.set(disciplineSlug, articles);
  return articles;
}

/**
 * Fetch a single article by slug (INCLUDES full content).
 * Result is cached in memory; subsequent calls are instant.
 */
export async function fetchArticleBySlug(slug: string): Promise<Article | null> {
  if (articleCache.has(slug)) return articleCache.get(slug)!;

  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (error || !data) {
    articleCache.set(slug, null);
    return null;
  }

  let article = mapRow(data);
  const resolved = await resolveImageReferences([article]);
  article = resolved[0];
  articleCache.set(slug, article);
  return article;
}

/**
 * Fetch top 10 most popular articles (by page visits), excluding current article.
 */
export async function fetchPopularArticles(excludeSlug?: string): Promise<Article[]> {
  const { data: visits, error: visitsError } = await supabase
    .from('page_visits')
    .select('page_path, visit_count')
    .like('page_path', '/artykul/%')
    .order('visit_count', { ascending: false })
    .limit(15);

  if (visitsError || !visits || visits.length === 0) return [];

  // Extract slugs from page paths
  const slugs = visits
    .map((v) => v.page_path.replace('/artykul/', ''))
    .filter((s) => s !== excludeSlug)
    .slice(0, 10);

  if (slugs.length === 0) return [];

  const { data: articles } = await supabase
    .from('articles')
    .select('slug, title, discipline, discipline_slug, date, summary, image')
    .in('slug', slugs);

  if (!articles) return [];

  // Sort by popularity order
  const slugOrder = new Map(slugs.map((s, i) => [s, i]));
  const sorted = articles.sort((a, b) => {
    const aOrder = slugOrder.get(a.slug) ?? 999;
    const bOrder = slugOrder.get(b.slug) ?? 999;
    return aOrder - bOrder;
  });

  return sorted as Article[];
}

/**
 * Bust all caches. Call this after an admin adds/edits/deletes an article
 * so the next page visit fetches fresh data from the database.
 */
export function bustArticleCache(): void {
  disciplineCache.clear();
  articleCache.clear();
}

// ─── Legacy sync stubs (kept for any leftover imports) ─────────────

export function getArticleBySlug(_slug: string): Article | undefined {
  return undefined;
}

export function getArticlesByDiscipline(_disciplineSlug: string): Article[] {
  return [];
}

export function getGridArticles(_disciplineSlug: string): Article[] {
  return [];
}

export function getOlderArticles(_disciplineSlug: string): Article[] {
  return [];
}