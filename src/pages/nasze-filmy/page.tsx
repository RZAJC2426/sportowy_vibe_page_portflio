import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { invokeEdgeFunction, supabase } from '@/lib/supabase';
import type { AllVideo } from '@/mocks/allVideos';
import TopBar from '@/pages/home/components/TopBar';
import Navbar from '@/pages/home/components/Navbar';
import Breadcrumbs from '@/components/feature/Breadcrumbs';
import EditableImage from '@/components/feature/EditableImage';
import EditableText from '@/components/feature/EditableText';
import EditableColor from '@/components/feature/EditableColor';

const ITEMS_PER_PAGE = 12;
const REFRESH_INTERVAL_SECONDS = 15 * 60;
const CHANNEL_ID = 'UCObdCja7XEDvr0mpkxXF8_Q';

type ViewMode = 'grid' | 'list';

// --- Discipline keyword matching ---
const DISCIPLINE_KEYWORDS: { slug: string; i18nKey: string; keywords: string[] }[] = [
  { slug: 'ski_jumping', i18nKey: 'nasze_filmy.discipline_ski_jumping', keywords: ['skok', 'skoczni', 'skoczek', 'skoczkowie', 'między skoczniami', 'turniej czterech skoczni', 'puchar świata w skokach'] },
  { slug: 'volleyball', i18nKey: 'nasze_filmy.discipline_volleyball', keywords: ['siatkówk', 'siatkarz', 'liga narodów', 'siatkarsk'] },
  { slug: 'football', i18nKey: 'nasze_filmy.discipline_football', keywords: ['piłka nożna', 'piłkarsk', 'liga mistrzów', 'futbol', 'lewandowski', 'transferow', 'euro 2026', 'mundial', 'gol ', 'bramk', 'stadion', 'fc barcelona', 'real vs'] },
  { slug: 'tennis', i18nKey: 'nasze_filmy.discipline_tennis', keywords: ['tenis', 'kort', 'wimbledon', 'roland garros', 'ślwiątek', 'świątek'] },
  { slug: 'basketball', i18nKey: 'nasze_filmy.discipline_basketball', keywords: ['koszykówk', 'nba', 'kosz'] },
  { slug: 'hockey', i18nKey: 'nasze_filmy.discipline_hockey', keywords: ['hokej', 'nhl', 'puchar stanleya'] },
  { slug: 'golf', i18nKey: 'nasze_filmy.discipline_golf', keywords: ['golf'] },
  { slug: 'handball', i18nKey: 'nasze_filmy.discipline_handball', keywords: ['piłka ręczna', 'piłce ręcznej', 'szczypiorniak'] },
  { slug: 'athletics', i18nKey: 'nasze_filmy.discipline_athletics', keywords: ['lekkoatletyk', 'bieg', 'skok w dal', 'rzut', 'memoriał'] },
  { slug: 'cycling', i18nKey: 'nasze_filmy.discipline_cycling', keywords: ['kolarstwo', 'kolarz', 'tour de france', 'wyścig'] },
  { slug: 'boxing', i18nKey: 'nasze_filmy.discipline_boxing', keywords: ['boks'] },
  { slug: 'mma', i18nKey: 'nasze_filmy.discipline_mma', keywords: ['mma', 'ufc', 'oktagon'] },
  { slug: 'speedway', i18nKey: 'nasze_filmy.discipline_speedway', keywords: ['żużel', 'żużlu'] },
  { slug: 'f1', i18nKey: 'nasze_filmy.discipline_f1', keywords: ['formuła 1', 'formuły 1', 'grand prix', 'gp monako'] },
  { slug: 'swimming', i18nKey: 'nasze_filmy.discipline_swimming', keywords: ['pływanie', 'pływaniu'] },
];

function detectDisciplineSlug(title: string): string | null {
  const lower = title.toLowerCase();
  for (const disc of DISCIPLINE_KEYWORDS) {
    for (const kw of disc.keywords) {
      if (lower.includes(kw.toLowerCase())) return disc.slug;
    }
  }
  return null;
}

// --- Helpers ---
function guessVideoType(title: string): 'FILM' | 'SHORTS' | 'LIVE' {
  const lower = title.toLowerCase();
  if (lower.includes('#shorts') || lower.includes('#short') || lower.match(/\b(short|shorts)\b/)) return 'SHORTS';
  if (lower.includes('#live') || lower.includes('live:') || lower.match(/\b(live|na żywo|transmisja|studio meczowe live)\b/)) return 'LIVE';
  return 'FILM';
}

function guessDuration(video: AllVideo): string {
  const type = video.type || guessVideoType(video.title);
  if (type === 'SHORTS') return '< 1 min';
  if (type === 'LIVE') return 'LIVE';
  return '—';
}

function formatViews(views: string): string {
  const num = parseInt(views, 10);
  if (!num) return '';
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return String(num);
}

function formatDate(isoStr: string): string {
  const d = new Date(isoStr);
  return d.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatTimeAgo(dateStr: string, t: (key: string) => string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 60) return `${diffMin} ${t('nasze_filmy.min_ago')}`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH} ${t('nasze_filmy.hrs_ago')}`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `${diffD} ${t('nasze_filmy.days_ago')}`;
  return formatDate(dateStr);
}

function formatCountdown(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function getTypeColor(type: string): string {
  if (type === 'LIVE') return 'bg-red-600';
  if (type === 'SHORTS') return 'bg-accent-500';
  return 'bg-primary-500';
}

type FilterTab = 'wszystko' | 'FILM' | 'SHORTS' | 'LIVE';

type SortOption = 'newest' | 'oldest' | 'alphabetical' | 'popular';

export default function NaszeFilmyPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // --- State ---
  const [allVideos, setAllVideos] = useState<AllVideo[]>([]);
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL_SECONDS);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [filterTab, setFilterTab] = useState<FilterTab>('wszystko');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDisciplines, setSelectedDisciplines] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [showDisciplines, setShowDisciplines] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [animDirection, setAnimDirection] = useState<'forward' | 'backward'>('forward');
  const [hoveredVideoId, setHoveredVideoId] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [videoCount, setVideoCount] = useState(0);
  const [dataSource, setDataSource] = useState('cache');
  const [apiKeyMissing, setApiKeyMissing] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const prevPageRef = useRef(1);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const hasLoadedRef = useRef(false);
  const isRefreshingRef = useRef(false);

  const TAB_FILTERS = [
    { id: 'wszystko' as const, labelKey: 'nasze_filmy.tab_all', icon: 'ri-apps-line' },
    { id: 'FILM' as const, labelKey: 'nasze_filmy.tab_films', icon: 'ri-youtube-line' },
    { id: 'SHORTS' as const, labelKey: 'nasze_filmy.tab_shorts', icon: 'ri-flashlight-line' },
    { id: 'LIVE' as const, labelKey: 'nasze_filmy.tab_live', icon: 'ri-live-line' },
  ];

  

  // --- 2. Read from Supabase cache ---
  const fetchFromCache = useCallback(async (): Promise<AllVideo[]> => {
    try {
      const { data, error } = await supabase
        .from('youtube_videos_cache')
        .select('video_id, title, thumbnail_url, published_at, description, views')
        .eq('channel_id', CHANNEL_ID)
        .order('published_at', { ascending: false })
        .limit(1000);

      if (error) {
        console.error('Cache read error:', error.message);
        return [];
      }

      if (!data || data.length === 0) {
        console.warn('[NaszeFilmy] Cache returned 0 rows for channel', CHANNEL_ID);
        return [];
      }

      console.log('[NaszeFilmy] Cache returned', data.length, 'rows');

      const enriched: AllVideo[] = data.map((v: any) => ({
        video_id: v.video_id,
        title: v.title,
        thumbnail_url: v.thumbnail_url,
        published_at: v.published_at,
        description: v.description ?? '',
        views: v.views ?? '',
        type: guessVideoType(v.title),
      }));

      return enriched;
    } catch (err) {
      console.error('Cache read failed:', err);
      return [];
    }
  }, []);

  // --- 3. Refresh from YouTube edge function ---
  const fetchFromYouTube = useCallback(async () => {
    if (isRefreshingRef.current) return false;
    isRefreshingRef.current = true;
    setIsRefreshing(true);
    try {
      const { data, error } = await invokeEdgeFunction('youtube-channel-videos');
      if (error) {
        console.error('YouTube edge function error:', error);
        return false;
      }

      if (!data) {
        console.error('No data from edge function');
        return false;
      }

      if (data.apiKeyAvailable === false) {
        setApiKeyMissing(true);
      } else {
        setApiKeyMissing(false);
      }

      // After edge function upserts to DB, re-read from DB
      if (data.success && data.count > 0) {
        const freshCache = await fetchFromCache();
        setAllVideos(freshCache);
        setVideoCount(freshCache.length);
        setDataSource(data.source || 'cache');
        setLastRefresh(new Date());
        return true;
      }

      if (data.hint) {
        console.warn('[youtube-channel-videos] Hint:', data.hint);
      }
      return false;
    } catch (err) {
      console.error('YouTube refresh failed:', err);
      return false;
    } finally {
      setIsRefreshing(false);
      setCountdown(REFRESH_INTERVAL_SECONDS);
      isRefreshingRef.current = false;
    }
  }, [fetchFromCache]);

  // --- 4. Full load: cache → merge with mock → YouTube refresh ---
  const loadVideos = useCallback(async (forceRefresh = false) => {
    let cacheVideos: AllVideo[] = [];

    if (!forceRefresh && !hasLoadedRef.current) {
      cacheVideos = await fetchFromCache();
      console.log('[NaszeFilmy] Initial cache load:', cacheVideos.length, 'videos');

      if (cacheVideos.length > 0) {
        setAllVideos(cacheVideos);
        setVideoCount(cacheVideos.length);
        setDataSource('cache');
        setLastRefresh(new Date());
        hasLoadedRef.current = true;
      }
    } else if (forceRefresh) {
      cacheVideos = await fetchFromCache();
      if (cacheVideos.length > 0) {
        setAllVideos(cacheVideos);
        setVideoCount(cacheVideos.length);
        setDataSource('cache');
      }
    }

    // Always try YouTube in background
    await fetchFromYouTube();
  }, [fetchFromCache, fetchFromYouTube]);

  useEffect(() => {
    loadVideos();
  }, []); // Only run once on mount

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          loadVideos(true);
          return REFRESH_INTERVAL_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loadVideos]);

  const handleManualRefresh = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    loadVideos(true);
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          loadVideos(true);
          return REFRESH_INTERVAL_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // --- Filtering ---
  const filteredVideos = useMemo(() => {
    let result = allVideos;

    if (filterTab !== 'wszystko') {
      result = result.filter((v) => {
        const vt = v.type || guessVideoType(v.title);
        return vt === filterTab;
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((v) => v.title.toLowerCase().includes(q));
    }

    if (selectedDisciplines.size > 0) {
      result = result.filter((v) => {
        const slug = detectDisciplineSlug(v.title);
        return slug !== null && selectedDisciplines.has(slug);
      });
    }

    // Sort
    switch (sortBy) {
      case 'oldest':
        result.sort((a, b) => new Date(a.published_at).getTime() - new Date(b.published_at).getTime());
        break;
      case 'alphabetical':
        result.sort((a, b) => a.title.localeCompare(b.title, 'pl'));
        break;
      case 'popular':
        result.sort((a, b) => (parseInt(b.views, 10) || 0) - (parseInt(a.views, 10) || 0));
        break;
      case 'newest':
      default:
        result.sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());
    }

    return result;
  }, [allVideos, filterTab, searchQuery, selectedDisciplines, sortBy]);

  // --- Pagination ---
  const totalPages = Math.max(1, Math.ceil(filteredVideos.length / ITEMS_PER_PAGE));

  const handlePageChange = useCallback((newPage: number) => {
    if (newPage === currentPage) return;
    setAnimDirection(newPage > currentPage ? 'forward' : 'backward');
    prevPageRef.current = currentPage;
    setCurrentPage(newPage);
  }, [currentPage]);

  useEffect(() => {
    setCurrentPage(1);
    prevPageRef.current = 1;
  }, [filterTab, searchQuery, selectedDisciplines]);

  const safePage = Math.min(currentPage, totalPages);
  const startIdx = (safePage - 1) * ITEMS_PER_PAGE;
  const pagedVideos = filteredVideos.slice(startIdx, startIdx + ITEMS_PER_PAGE);

  // --- Discipline toggle ---
  const toggleDiscipline = (slug: string) => {
    setSelectedDisciplines((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) {
        next.delete(slug);
      } else {
        next.add(slug);
      }
      return next;
    });
  };

  const clearDisciplineFilters = () => {
    setSelectedDisciplines(new Set());
  };

  // --- Count per discipline ---
  const disciplineCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const disc of DISCIPLINE_KEYWORDS) {
      counts[disc.slug] = allVideos.filter((v) => detectDisciplineSlug(v.title) === disc.slug).length;
    }
    return counts;
  }, [allVideos]);

  // --- Type counts ---
  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = { wszystko: allVideos.length };
    for (const tab of TAB_FILTERS) {
      if (tab.id === 'wszystko') continue;
      counts[tab.id] = allVideos.filter((v) => {
        const vt = v.type || guessVideoType(v.title);
        return vt === tab.id;
      }).length;
    }
    return counts;
  }, [allVideos, TAB_FILTERS]);

  // --- Pagination range ---
  const paginationRange = useMemo(() => {
    const range: (number | '...')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) range.push(i);
    } else {
      range.push(1);
      if (safePage > 3) range.push('...');
      const start = Math.max(2, safePage - 1);
      const end = Math.min(totalPages - 1, safePage + 1);
      for (let i = start; i <= end; i++) range.push(i);
      if (safePage < totalPages - 2) range.push('...');
      range.push(totalPages);
    }
    return range;
  }, [safePage, totalPages]);

  const getTypeLabel = (vidType: string): string => {
    if (vidType === 'LIVE') return t('nasze_filmy.type_live');
    if (vidType === 'SHORTS') return t('nasze_filmy.type_shorts');
    return t('nasze_filmy.type_film');
  };

  const hasActiveDisciplineFilter = selectedDisciplines.size > 0;

  const handleTooltipMove = (e: React.MouseEvent, videoId: string) => {
    setHoveredVideoId(videoId);
    setTooltipPos({ x: e.clientX, y: e.clientY });
  };

  const handleTooltipLeave = () => {
    setHoveredVideoId(null);
  };

  const dataSourceLabel = useMemo(() => {
    if (dataSource === 'youtube_api') return ` ${videoCount} filmów z YouTube API`;
    if (videoCount > 0) return ` ${videoCount} filmów z YouTube`;
    return ' ładowanie...';
  }, [videoCount, dataSource]);

  return (
    <div className="min-h-screen bg-background-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'Nasze Filmy — YouTube Sportowy Vibe | Wszystkie Materiały',
            description: 'Przeglądaj wszystkie filmy kanału Sportowy Vibe na YouTube. Transmisje na żywo, analizy sportowe, formaty video i Shortsy — sportowa energia w każdym formacie.',
          }),
        }}
      />
      <TopBar />
      <Navbar />

      <Breadcrumbs sticky />

      <main>
        {/* Hero */}
        <section className="relative py-12 md:py-20 bg-background-100">
          <div className="mx-auto max-w-[1280px] px-4 md:px-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-center md:text-left">
                <div className="inline-flex items-center gap-2 mb-4">
                  <EditableImage
                    contentKey="filmy_hero_logo"
                    fallbackSrc="https://storage.readdy-site.link/project_files/6b577641-b4ea-4107-bb56-5f8fbbf97e07/319ec2ab-1af0-46ca-beed-0358e5e16485_sportowy_vibebez-sloganu2.svg"
                    alt="Sportowy VIBE"
                    className="h-12 md:h-16 w-auto object-contain transition-transform duration-300 ease-out hover:scale-110"
                  />
                </div>
                <h1 className="font-heading text-3xl md:text-5xl font-bold text-foreground-950 tracking-tight">
                  <EditableColor contentKey="color_filmy_hero_title" fallbackColor="#0F172A">
                    <EditableText contentKey="filmy_hero_title" fallback={t('nasze_filmy.hero_title')} />
                  </EditableColor>
                </h1>
                <p className="mt-3 max-w-md text-sm text-foreground-500">
                  <EditableColor contentKey="color_filmy_hero_desc" fallbackColor="#475569">
                    <EditableText contentKey="filmy_hero_desc" fallback={t('nasze_filmy.hero_desc')} as="span" />
                  </EditableColor>
                </p>
              </div>

              <div className="flex flex-col items-center md:items-end gap-3">
                <div className="flex items-center gap-3 rounded-lg border border-background-200/70 bg-background-50 px-5 py-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-50 text-primary-500">
                      <i className="ri-timer-line text-lg"></i>
                    </span>
                    <div className="flex flex-col">
                      <span className="text-xs text-foreground-400 font-medium">{t('nasze_filmy.auto_refresh_label')}</span>
                      <span className={`font-mono text-xl font-bold tabular-nums ${countdown <= 60 ? 'text-red-500' : 'text-primary-600'}`}>
                        {formatCountdown(countdown)}
                      </span>
                    </div>
                  </div>
                  <div className="w-px h-10 bg-background-200/70"></div>
                  <button
                    type="button"
                    onClick={handleManualRefresh}
                    disabled={isRefreshing}
                    className="inline-flex items-center gap-2 rounded-md bg-primary-500 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer"
                  >
                    <i className={`text-sm ${isRefreshing ? 'ri-loader-4-line animate-spin' : 'ri-refresh-line'}`}></i>
                    {isRefreshing ? t('nasze_filmy.refreshing') : t('nasze_filmy.refresh_now')}
                  </button>
                </div>
                <p className="text-xs text-foreground-400 flex items-center gap-1">
                  <i className={`${videoCount > 0 ? 'ri-check-line text-green-500' : 'ri-loader-4-line animate-spin text-foreground-400'}`}></i>
                  {t('nasze_filmy.last_refresh')}:{' '}
                  {lastRefresh.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  <span className="text-foreground-500">—</span>
                  {dataSourceLabel}
                </p>
                {apiKeyMissing && (
                  <p className="text-[11px] text-amber-600 flex items-center gap-1 max-w-xs text-right">
                    <i className="ri-alert-line"></i>
                    Brak klucza YouTube API — dodaj YOUTUBE_API_KEY w Supabase Edge Function Secrets, aby pobrać wszystkie 272 materiały.
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Filters section */}
        <section className="pb-0 pt-10 md:pt-14">
          <div className="mx-auto max-w-[1280px] px-4 md:px-6">
            {/* Search + discipline toggle + view toggle row */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
              <div className="relative flex-1 max-w-md">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-400">
                  <i className="ri-search-line text-lg"></i>
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('nasze_filmy.search_placeholder')}
                  className="w-full rounded-lg border border-background-200/70 bg-background-50 pl-10 pr-10 py-2.5 text-sm text-foreground-900 placeholder-foreground-400 outline-none transition-colors focus:border-primary-400 focus:ring-1 focus:ring-primary-400/30"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-400 hover:text-foreground-600"
                  >
                    <i className="ri-close-line text-lg"></i>
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setShowDisciplines(!showDisciplines)}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  showDisciplines || hasActiveDisciplineFilter
                    ? 'bg-red-600 text-white'
                    : 'bg-background-200 text-foreground-600 hover:bg-background-300'
                }`}
              >
                <i className="ri-filter-3-line text-sm"></i>
                {t('nasze_filmy.filter_disciplines')}
                {hasActiveDisciplineFilter && (
                  <span className="ml-0.5 rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-bold text-white">
                    {selectedDisciplines.size}
                  </span>
                )}
              </button>

              {hasActiveDisciplineFilter && (
                <button
                  type="button"
                  onClick={clearDisciplineFilters}
                  className="inline-flex items-center gap-1 text-xs text-foreground-500 hover:text-red-600 transition-colors whitespace-nowrap cursor-pointer"
                >
                  <i className="ri-close-circle-line text-sm"></i>
                  {t('nasze_filmy.clear_filters')}
                </button>
              )}

              {/* View mode toggle */}
              <div className="ml-auto flex items-center gap-2">
                {/* Sort dropdown */}
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="appearance-none rounded-full border border-background-200/70 bg-background-50 pl-4 pr-9 py-2 text-xs font-semibold text-foreground-600 outline-none transition-colors focus:border-primary-400 focus:ring-1 focus:ring-primary-400/30 cursor-pointer"
                  >
                    <option value="newest">{t('nasze_filmy.sort_newest')}</option>
                    <option value="oldest">{t('nasze_filmy.sort_oldest')}</option>
                    <option value="alphabetical">{t('nasze_filmy.sort_alphabetical')}</option>
                    <option value="popular">{t('nasze_filmy.sort_popular')}</option>
                  </select>
                  <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-foreground-400">
                    <i className="ri-arrow-down-s-line text-sm"></i>
                  </span>
                </div>

                <div className="flex items-center rounded-full border border-background-200/70 bg-background-50 p-1">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    viewMode === 'grid'
                      ? 'bg-primary-500 text-white'
                      : 'text-foreground-500 hover:text-foreground-700'
                  }`}
                  title={t('nasze_filmy.view_grid')}
                >
                  <i className="ri-layout-grid-line text-sm"></i>
                  {t('nasze_filmy.view_grid')}
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    viewMode === 'list'
                      ? 'bg-primary-500 text-white'
                      : 'text-foreground-500 hover:text-foreground-700'
                  }`}
                  title={t('nasze_filmy.view_list')}
                >
                  <i className="ri-list-check text-sm"></i>
                  {t('nasze_filmy.view_list')}
                </button>
              </div>
              </div>
            </div>

            {/* Discipline filter panel */}
            {showDisciplines && (
              <div className="mb-4 rounded-lg border border-background-200/70 bg-background-50 p-4 transition-all duration-200">
                <div className="flex flex-wrap gap-2">
                  {DISCIPLINE_KEYWORDS.map((disc) => {
                    const isSelected = selectedDisciplines.has(disc.slug);
                    const count = disciplineCounts[disc.slug] || 0;
                    return (
                      <button
                        key={disc.slug}
                        type="button"
                        onClick={() => toggleDiscipline(disc.slug)}
                        className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                          isSelected
                            ? 'bg-red-600 text-white'
                            : 'bg-background-100 text-foreground-600 hover:bg-background-200'
                        }`}
                      >
                        {isSelected && <i className="ri-check-line text-[10px]"></i>}
                        {t(disc.i18nKey)}
                        <span className={`ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-background-200 text-foreground-400'
                        }`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Type tabs + count */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-2">
              <div className="flex flex-wrap justify-center gap-2">
                {TAB_FILTERS.map((tab) => {
                  const count = tabCounts[tab.id] || 0;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setFilterTab(tab.id)}
                      className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                        filterTab === tab.id
                          ? 'bg-red-600 text-white'
                          : 'bg-background-200 text-foreground-600 hover:bg-background-300'
                      }`}
                    >
                      <i className={`${tab.icon} text-sm`}></i>
                      {t(tab.labelKey)}
                      <span className={`ml-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                        filterTab === tab.id
                          ? 'bg-white/20 text-white'
                          : 'bg-background-300 text-foreground-500'
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
              <span className="text-xs text-foreground-400 whitespace-nowrap">
                {t('nasze_filmy.video_count', { filtered: filteredVideos.length, total: allVideos.length })}
              </span>
            </div>
          </div>
        </section>

        {/* Content: Grid or List with animation */}
        <section className="py-10 md:py-14">
          <div className="mx-auto max-w-[1280px] px-4 md:px-6">
            {pagedVideos.length === 0 ? (
              <div className="text-center py-20">
                <span className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-background-100 text-foreground-300">
                  <i className="ri-video-line text-3xl"></i>
                </span>
                <p className="mt-4 text-foreground-500">
                  {searchQuery
                    ? t('nasze_filmy.no_results', { query: searchQuery })
                    : t('nasze_filmy.no_category', { category: t(TAB_FILTERS.find((tb) => tb.id === filterTab)?.labelKey || 'nasze_filmy.tab_all') })}
                </p>
                {(hasActiveDisciplineFilter || searchQuery) && (
                  <button
                    type="button"
                    onClick={() => { setSearchQuery(''); clearDisciplineFilters(); }}
                    className="mt-4 inline-flex items-center gap-2 rounded-md bg-primary-500 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-600 transition-all whitespace-nowrap cursor-pointer"
                  >
                    <i className="ri-refresh-line text-sm"></i>
                    {t('nasze_filmy.clear_filters')}
                  </button>
                )}
              </div>
            ) : viewMode === 'grid' ? (
              /* ===== GRID VIEW with page transition animation ===== */
              <div
                ref={contentRef}
                key={`grid-${safePage}`}
                className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 ${
                  animDirection === 'forward' ? 'animate-fadeInRight' : 'animate-fadeInLeft'
                }`}
              >
                {pagedVideos.map((video) => {
                  const vid = video.video_id;
                  const thumb = video.thumbnail_url;
                  const pubDate = video.published_at;
                  const viewCount = video.views ? (typeof video.views === 'string' && video.views.match(/^\d+$/) ? formatViews(video.views) : video.views) : '';
                  const vidType = video.type || guessVideoType(video.title);
                  const vidDuration = guessDuration(video);
                  const discSlug = detectDisciplineSlug(video.title);
                  const discLabel = discSlug
                    ? t(DISCIPLINE_KEYWORDS.find((d) => d.slug === discSlug)?.i18nKey || '')
                    : '';

                  return (
                    <a
                      key={vid}
                      href={`https://www.youtube.com/watch?v=${vid}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex flex-col rounded-lg border border-background-200/70 bg-background-50 overflow-hidden transition-all duration-300 hover:border-red-300/50 hover:shadow-lg hover:shadow-red-500/5 hover:-translate-y-1 cursor-pointer"
                    >
                      <div className="relative h-44 md:h-48 overflow-hidden">
                        <img
                          src={thumb}
                          alt={video.title}
                          loading="lazy"
                          className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        <div className="absolute top-3 left-3 flex items-center gap-1.5">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wider text-white ${getTypeColor(vidType)}`}>
                            <i className={`text-[8px] ${vidType === 'LIVE' ? 'ri-live-line' : 'ri-play-circle-fill'}`}></i>
                            {getTypeLabel(vidType)}
                          </span>
                          {discLabel && (
                            <span className="inline-flex items-center rounded-full bg-black/60 backdrop-blur-sm px-2 py-1 text-[9px] font-semibold text-white/90">
                              {discLabel}
                            </span>
                          )}
                        </div>
                        <div className="absolute bottom-3 right-3">
                          <span className="inline-flex items-center gap-1 rounded-md bg-black/70 px-2 py-1 text-[10px] font-medium text-white backdrop-blur-sm">
                            <i className="ri-time-line text-[8px]"></i>
                            {vidDuration}
                          </span>
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-red-600/90 text-white">
                            <i className="ri-play-fill text-2xl ml-0.5"></i>
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col flex-1 p-5">
                        <h3 className="font-heading text-base font-semibold text-foreground-900 transition-colors group-hover:text-red-600 leading-snug line-clamp-2">
                          {video.title}
                        </h3>
                        {video.description && (
                          <p className="mt-2 text-sm leading-relaxed text-foreground-500 line-clamp-2">
                            {video.description}
                          </p>
                        )}
                        <div className="mt-3 flex items-center gap-3 text-xs text-foreground-400 flex-wrap">
                          {viewCount && (
                            <span className="flex items-center gap-1">
                              <i className="ri-eye-line text-[10px]"></i>
                              {viewCount} {t('nasze_filmy.views')}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <i className="ri-calendar-line text-[10px]"></i>
                            {formatTimeAgo(pubDate, t)}
                          </span>
                        </div>
                        <div className="mt-auto pt-4">
                          <span className="inline-flex items-center gap-1 text-sm font-semibold text-red-600 group-hover:text-red-700 transition-colors">
                            {t('nasze_filmy.watch_youtube')}
                            <i className="ri-arrow-right-line text-sm group-hover:translate-x-0.5 transition-transform"></i>
                          </span>
                        </div>
                      </div>
                    </a>
                  );
                })}
              </div>
            ) : (
              /* ===== TABLE / LIST VIEW with page transition animation ===== */
              <div
                ref={contentRef}
                key={`list-${safePage}`}
                className={`overflow-hidden rounded-lg border border-background-200/70 bg-background-50 ${
                  animDirection === 'forward' ? 'animate-fadeInUp' : 'animate-fadeInDown'
                }`}
              >
                {/* Table header */}
                <div className="hidden md:grid grid-cols-[80px_1fr_140px_90px_130px_100px] items-center gap-3 bg-background-100 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-foreground-500">
                  <span>{t('nasze_filmy.col_thumbnail')}</span>
                  <span>{t('nasze_filmy.col_title')}</span>
                  <span>{t('nasze_filmy.col_date')}</span>
                  <span>{t('nasze_filmy.col_type')}</span>
                  <span>{t('nasze_filmy.col_discipline')}</span>
                  <span className="text-right">{t('nasze_filmy.col_views')}</span>
                </div>

                {/* Table rows */}
                {pagedVideos.map((video, idx) => {
                  const vid = video.video_id;
                  const thumb = video.thumbnail_url;
                  const pubDate = video.published_at;
                  const viewCount = video.views ? (typeof video.views === 'string' && video.views.match(/^\d+$/) ? formatViews(video.views) : video.views) : '';
                  const vidType = video.type || guessVideoType(video.title);
                  const discSlug = detectDisciplineSlug(video.title);
                  const discLabel = discSlug
                    ? t(DISCIPLINE_KEYWORDS.find((d) => d.slug === discSlug)?.i18nKey || '')
                    : '';

                  return (
                    <a
                      key={vid}
                      href={`https://www.youtube.com/watch?v=${vid}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`relative grid grid-cols-1 md:grid-cols-[80px_1fr_140px_90px_130px_100px] items-center gap-3 px-5 py-3.5 border-b border-background-100 transition-all duration-200 hover:bg-red-50/40 cursor-pointer ${
                        idx % 2 === 1 ? 'bg-background-50/50' : ''
                      }`}
                      onMouseMove={(e) => handleTooltipMove(e, vid)}
                      onMouseLeave={handleTooltipLeave}
                    >
                      {/* Thumbnail */}
                      <div className="flex items-center gap-3 md:gap-0">
                        <div className="relative h-[54px] w-[96px] md:h-[50px] md:w-[72px] flex-shrink-0 overflow-hidden rounded-md bg-background-200 group/listrow">
                          <img
                            src={thumb}
                            alt={video.title}
                            loading="lazy"
                            className="h-full w-full object-cover object-top"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover/listrow:opacity-100 transition-opacity">
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-red-600/90 text-white">
                              <i className="ri-play-fill text-sm ml-0.5"></i>
                            </span>
                          </div>
                        </div>
                        {/* Mobile-only title column */}
                        <div className="flex flex-col min-w-0 md:hidden">
                          <span className="text-sm font-semibold text-foreground-900 line-clamp-2 leading-snug">{video.title}</span>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold text-white ${getTypeColor(vidType)}`}>
                              {getTypeLabel(vidType)}
                            </span>
                            {discLabel && (
                              <span className="inline-flex items-center rounded-full bg-background-200 px-2 py-0.5 text-[10px] font-semibold text-foreground-600">
                                {discLabel}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1.5 text-[11px] text-foreground-400">
                            <span>{formatDate(pubDate)}</span>
                            {viewCount && (
                              <>
                                <span className="text-foreground-300">·</span>
                                <span className="flex items-center gap-0.5">
                                  <i className="ri-eye-line text-[9px]"></i>
                                  {viewCount}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Title (desktop only) */}
                      <span className="hidden md:block text-sm font-semibold text-foreground-900 line-clamp-2 leading-snug group-hover:text-red-600 transition-colors">
                        {video.title}
                      </span>

                      {/* Date */}
                      <span className="hidden md:flex items-center gap-1.5 text-xs text-foreground-500">
                        <i className="ri-calendar-line text-[11px] text-foreground-400"></i>
                        {formatDate(pubDate)}
                      </span>

                      {/* Type badge */}
                      <span className={`hidden md:inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold text-white whitespace-nowrap w-fit ${getTypeColor(vidType)}`}>
                        <i className={`text-[9px] ${vidType === 'LIVE' ? 'ri-live-line' : 'ri-play-circle-fill'}`}></i>
                        {getTypeLabel(vidType)}
                      </span>

                      {/* Discipline */}
                      <span className="hidden md:block text-xs text-foreground-500 truncate">
                        {discLabel || '—'}
                      </span>

                      {/* Views */}
                      <span className="hidden md:flex items-center justify-end gap-1 text-xs text-foreground-500 whitespace-nowrap">
                        {viewCount ? (
                          <>
                            <i className="ri-eye-line text-[11px] text-foreground-400"></i>
                            {viewCount}
                          </>
                        ) : '—'}
                      </span>
                    </a>
                  );
                })}
              </div>
            )}

            {/* Hover tooltip */}
            {hoveredVideoId && viewMode === 'list' && (() => {
              const hoveredVideo = pagedVideos.find((v) => v.video_id === hoveredVideoId);
              if (!hoveredVideo) return null;
              return (
                <div
                  className="fixed z-[9998] pointer-events-none rounded-lg border border-background-200/70 bg-background-50 shadow-lg overflow-hidden animate-tooltipIn"
                  style={{
                    left: `${Math.min(tooltipPos.x + 16, window.innerWidth - 340)}px`,
                    top: `${Math.min(tooltipPos.y - 120, window.innerHeight - 260)}px`,
                    width: '320px',
                  }}
                >
                  <div className="relative h-[180px] overflow-hidden">
                    <img
                      src={hoveredVideo.thumbnail_url}
                      alt={hoveredVideo.title}
                      className="h-full w-full object-cover object-top"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3">
                      <p className="text-sm font-semibold text-white line-clamp-2 leading-snug">
                        {hoveredVideo.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold text-white ${getTypeColor(hoveredVideo.type || guessVideoType(hoveredVideo.title))}`}>
                          {getTypeLabel(hoveredVideo.type || guessVideoType(hoveredVideo.title))}
                        </span>
                        {hoveredVideo.views && (
                          <span className="text-[10px] text-white/80 flex items-center gap-1">
                            <i className="ri-eye-line text-[8px]"></i>
                            {typeof hoveredVideo.views === 'string' && hoveredVideo.views.match(/^\d+$/) ? formatViews(hoveredVideo.views) : hoveredVideo.views}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-12 flex items-center justify-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handlePageChange(Math.max(1, safePage - 1))}
                  disabled={safePage <= 1}
                  className="flex h-9 w-9 items-center justify-center rounded-md border border-background-200/70 bg-background-50 text-foreground-600 transition-all hover:bg-background-100 hover:text-primary-600 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                >
                  <i className="ri-arrow-left-s-line text-sm"></i>
                </button>

                {paginationRange.map((item, idx) =>
                  item === '...' ? (
                    <span key={`dots-${idx}`} className="flex h-9 w-9 items-center justify-center text-xs text-foreground-400">
                      ...
                    </span>
                  ) : (
                    <button
                      key={item}
                      type="button"
                      onClick={() => handlePageChange(item)}
                      className={`flex h-9 w-9 items-center justify-center rounded-md text-sm font-semibold transition-all cursor-pointer ${
                        safePage === item
                          ? 'bg-red-600 text-white'
                          : 'border border-background-200/70 bg-background-50 text-foreground-600 hover:bg-background-100 hover:text-primary-600'
                      }`}
                    >
                      {item}
                    </button>
                  )
                )}

                <button
                  type="button"
                  onClick={() => handlePageChange(Math.min(totalPages, safePage + 1))}
                  disabled={safePage >= totalPages}
                  className="flex h-9 w-9 items-center justify-center rounded-md border border-background-200/70 bg-background-50 text-foreground-600 transition-all hover:bg-background-100 hover:text-primary-600 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                >
                  <i className="ri-arrow-right-s-line text-sm"></i>
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Channel CTA */}
        <section className="py-12 md:py-16 bg-background-100">
          <div className="mx-auto max-w-[800px] px-4 md:px-6 text-center">
            <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-red-50 text-red-600">
              <i className="ri-youtube-fill text-3xl"></i>
            </div>
            <h2 className="mt-5 font-heading text-2xl md:text-3xl font-bold text-foreground-950">
              <EditableColor contentKey="color_filmy_cta_title" fallbackColor="#0F172A">
                <EditableText contentKey="filmy_cta_title" fallback={t('nasze_filmy.cta_title')} />
              </EditableColor>
            </h2>
            <p className="mt-3 max-w-md mx-auto text-sm text-foreground-500">
              <EditableColor contentKey="color_filmy_cta_desc" fallbackColor="#475569">
                {t('nasze_filmy.cta_desc')}
              </EditableColor>
            </p>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href="https://www.youtube.com/@Sportowy_Vibe"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-md bg-red-600 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-red-700 whitespace-nowrap cursor-pointer"
              >
                <i className="ri-youtube-fill text-base"></i>
                {t('nasze_filmy.subscribe')}
              </a>
              <button
                type="button"
                onClick={handleManualRefresh}
                className="inline-flex items-center gap-2 rounded-md border border-primary-500/50 px-6 py-3 text-sm font-semibold text-primary-600 transition-all hover:border-primary-500 hover:bg-primary-50/50 whitespace-nowrap cursor-pointer"
              >
                <i className="ri-refresh-line text-sm"></i>
                {t('nasze_filmy.refresh_list')}
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-background-200/70 bg-background-100">
        <div className="mx-auto max-w-[1280px] px-4 md:px-6 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Logo */}
            <Link to="/" className="flex items-center cursor-pointer active:opacity-70">
              <EditableImage
                contentKey="site_logo_footer"
                fallbackSrc="https://storage.readdy-site.link/project_files/6b577641-b4ea-4107-bb56-5f8fbbf97e07/319ec2ab-1af0-46ca-beed-0358e5e16485_sportowy_vibebez-sloganu2.svg"
                alt="Sportowy VIBE"
                className="h-8 w-auto max-w-[130px] object-contain"
              />
            </Link>

            {/* Navigation links */}
            <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
              <Link to="/" className="text-xs font-medium text-foreground-500 hover:text-primary-600 transition-colors whitespace-nowrap">
                Strona główna
              </Link>
              <span className="text-foreground-300 text-xs select-none">|</span>
              <Link to="/nasze-filmy" className="text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors whitespace-nowrap">
                Filmy
              </Link>
              <span className="text-foreground-300 text-xs select-none">|</span>
              <Link to="/o-nas/tworcy" className="text-xs font-medium text-foreground-500 hover:text-primary-600 transition-colors whitespace-nowrap">
                O nas
              </Link>
              <span className="text-foreground-300 text-xs select-none">|</span>
              <button
                type="button"
                onClick={() => { navigate('/'); setTimeout(() => document.getElementById('kontakt')?.scrollIntoView({ behavior: 'smooth' }), 300); }}
                className="text-xs font-medium text-foreground-500 hover:text-primary-600 transition-colors whitespace-nowrap cursor-pointer"
              >
                Kontakt
              </button>
              <span className="text-foreground-300 text-xs select-none">|</span>
              <Link to="/o-nas/wspolpraca" className="text-xs font-medium text-foreground-500 hover:text-primary-600 transition-colors whitespace-nowrap">
                Współpraca
              </Link>
              <span className="text-foreground-300 text-xs select-none">|</span>
              <Link to="/polityka-prywatnosci" className="text-xs font-medium text-foreground-500 hover:text-primary-600 transition-colors whitespace-nowrap">
                Polityka prywatności
              </Link>
              <span className="text-foreground-300 text-xs select-none">|</span>
              <Link to="/regulamin-serwisu" className="text-xs font-medium text-foreground-500 hover:text-primary-600 transition-colors whitespace-nowrap">
                Regulamin Serwisu
              </Link>
            </nav>

            {/* Social icons */}
            <div className="flex items-center gap-3">
              <a href="https://www.youtube.com/@sportowy_vibe" target="_blank" rel="noopener noreferrer" className="text-foreground-400 hover:text-primary-500 transition-colors" aria-label="YouTube">
                <span className="flex h-8 w-8 items-center justify-center">
                  <i className="ri-youtube-fill text-lg"></i>
                </span>
              </a>
              <a href="https://www.facebook.com/sportowy_vibe" target="_blank" rel="noopener noreferrer" className="text-foreground-400 hover:text-primary-500 transition-colors" aria-label="Facebook">
                <span className="flex h-8 w-8 items-center justify-center">
                  <i className="ri-facebook-fill text-lg"></i>
                </span>
              </a>
              <a href="https://www.instagram.com/sportowy_vibe" target="_blank" rel="noopener noreferrer" className="text-foreground-400 hover:text-primary-500 transition-colors" aria-label="Instagram">
                <span className="flex h-8 w-8 items-center justify-center">
                  <i className="ri-instagram-line text-lg"></i>
                </span>
              </a>
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-background-200/70 text-center">
            <p className="text-xs text-foreground-400">
              {t('footer.rights')}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}