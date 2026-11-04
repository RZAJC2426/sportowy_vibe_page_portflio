import { Link, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchArticlesByDiscipline, type Article } from '@/data/articles';
import { fetchDisciplineBySlug, type Discipline } from '@/data/disciplines';
import TopBar from '@/pages/home/components/TopBar';
import Navbar from '@/pages/home/components/Navbar';
import EditableImage from '@/components/feature/EditableImage';
import EditableText from '@/components/feature/EditableText';
import EditableColor from '@/components/feature/EditableColor';
import Breadcrumbs from '@/components/feature/Breadcrumbs';
import { usePageVisit } from '@/hooks/useLikes';

// Map of discipline slugs to their uploaded SVG icon URLs
const DISC_ICON_URLS: Record<string, string> = {
  tenis: 'https://storage.readdy-site.link/project_files/6b577641-b4ea-4107-bb56-5f8fbbf97e07/ccb0fd5b-5782-49b3-8ca8-adb4a831211d_tennis_racquet_icon_126044.svg',
  siatkowka: 'https://storage.readdy-site.link/project_files/6b577641-b4ea-4107-bb56-5f8fbbf97e07/6f58c12e-6b36-4c6d-a0d3-83fa6ad87017_volleyball-2.svg',
  koszykowka: 'https://storage.readdy-site.link/project_files/6b577641-b4ea-4107-bb56-5f8fbbf97e07/fb9e341c-57b4-4dd3-9010-e638ee9af8be_basketball.svg',
  'pilka-nozna': 'https://storage.readdy-site.link/project_files/6b577641-b4ea-4107-bb56-5f8fbbf97e07/d756def3-a061-4b62-a00c-2fec9ef47c2f_football.svg',
  hokej: 'https://storage.readdy-site.link/project_files/6b577641-b4ea-4107-bb56-5f8fbbf97e07/e7782d89-a2ea-4c35-a175-56026cb0f6d5_hockey.svg',
  'skoki-narciarskie': 'https://storage.readdy-site.link/project_files/6b577641-b4ea-4107-bb56-5f8fbbf97e07/1db633d3-afda-4235-9391-71404d847f06_ski_jumper.svg',
};

const DISC_COLORS: Record<string, string> = {
  tenis: '#16a34a',
  siatkowka: '#2563eb',
  koszykowka: '#ea580c',
  'pilka-nozna': '#2563eb',
  hokej: '#0ea5e9',
  'skoki-narciarskie': '#7c3aed',
};

const DISC_NAMES: Record<string, string> = {
  tenis: 'Tenis',
  siatkowka: 'Siatkówka',
  koszykowka: 'Koszykówka',
  'pilka-nozna': 'Piłka nożna',
  hokej: 'Hokej na lodzie',
  'skoki-narciarskie': 'Skoki Narciarskie',
};

function DisciplineIcon({ slug, sizeClass }: { slug?: string; sizeClass: string }) {
  if (!slug || !DISC_ICON_URLS[slug]) return null;
  return (
    <span className={`flex ${sizeClass} items-center justify-center rounded-full bg-blue-600`}>
      <EditableImage
        contentKey={`discipline_icon_${slug}`}
        fallbackSrc={DISC_ICON_URLS[slug]}
        alt=""
        className="h-2/3 w-2/3 object-contain"
      />
    </span>
  );
}

function DisciplineBadge({ slug }: { slug?: string }) {
  if (!slug || !DISC_ICON_URLS[slug]) return null;
  return (
    <div className="mt-3 flex items-center gap-1.5">
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600">
        <EditableImage
          contentKey={`discipline_icon_${slug}`}
          fallbackSrc={DISC_ICON_URLS[slug]}
          alt=""
          className="h-3 w-3 object-contain"
        />
      </span>
      <span className="text-[10px] font-medium text-foreground-400">{DISC_NAMES[slug]}</span>
    </div>
  );
}

function GridCard({ article, color, icon, t, slug }: { article: Article; color: string; icon: string; t: (key: string) => string; slug?: string }) {
  return (
    <Link
      to={`/artykul/${article.slug}`}
      className="group flex flex-col rounded-lg border border-background-200/70 bg-background-50 overflow-hidden transition-all duration-300 hover:border-primary-300/50 hover:shadow-lg hover:shadow-primary-500/5 hover:-translate-y-1 cursor-pointer active:bg-primary-50/50 active:scale-[0.98]"
    >
      {/* Image area */}
      <div className="relative h-28 md:h-32 overflow-hidden bg-background-200">
        <img
          src={article.image}
          alt={article.title}
          className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        {article.featured && (
          <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-accent-500 px-2 py-0.5 text-[10px] font-semibold text-white">
            <i className="ri-star-fill text-[10px]"></i>
            {t('dyscyplina.featured')}
          </span>
        )}
        <div className="absolute bottom-2 left-2 right-2">
          <span className="text-[10px] font-medium text-white/80">{article.date}</span>
        </div>
      </div>
      {/* Content */}
      <div className="flex flex-col flex-1 p-3 md:p-4">
        <span
          className="inline-flex self-start items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold mb-2"
          style={{ backgroundColor: `${color}15`, color }}
        >
          <span className="flex h-3 w-3 items-center justify-center">
            {slug && DISC_ICON_URLS[slug] ? (
              <span className="flex h-3 w-3 items-center justify-center rounded-full bg-blue-600">
                <EditableImage
                  contentKey={`discipline_icon_${slug}`}
                  fallbackSrc={DISC_ICON_URLS[slug]}
                  alt=""
                  className="h-2 w-2 object-contain"
                />
              </span>
            ) : (
              <i className={`${icon} text-[10px]`}></i>
            )}
          </span>
          {article.discipline}
        </span>
        <h3 className="font-heading text-sm font-semibold text-foreground-900 group-hover:text-primary-700 transition-colors line-clamp-2 leading-snug">
          {article.title}
        </h3>
        <p className="mt-2 text-xs text-foreground-500 line-clamp-2 leading-relaxed flex-1">
          {article.summary}
        </p>
        <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-primary-600">
          {t('dyscyplina.read_more')}
          <span className="flex h-3 w-3 items-center justify-center">
            <i className="ri-arrow-right-line text-[10px]"></i>
          </span>
        </span>
        <DisciplineBadge slug={slug} />
      </div>
    </Link>
  );
}

function OlderArticleRow({ article, color, icon, t, slug }: { article: Article; color: string; icon: string; t: (key: string) => string; slug?: string }) {
  return (
    <Link
      to={`/artykul/${article.slug}`}
      className="group flex items-start gap-4 rounded-lg border border-background-200/70 bg-background-50 p-4 transition-all duration-300 hover:border-primary-300/50 hover:shadow-sm hover:-translate-y-0.5 cursor-pointer active:bg-primary-50/50 active:scale-[0.99]"
    >
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white"
        style={{ backgroundColor: slug && DISC_ICON_URLS[slug] ? undefined : color }}
      >
        {slug && DISC_ICON_URLS[slug] ? (
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
            <EditableImage
              contentKey={`discipline_icon_${slug}`}
              fallbackSrc={DISC_ICON_URLS[slug]}
              alt=""
              className="h-6 w-6 object-contain"
            />
          </span>
        ) : (
          <i className={`${icon} text-base`}></i>
        )}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-medium text-foreground-400">{article.date}</span>
          {article.featured && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-accent-100 px-1.5 py-0.5 text-[9px] font-semibold text-accent-700">
              <i className="ri-star-fill text-[8px]"></i>
            </span>
          )}
        </div>
        <h3 className="font-heading text-sm font-semibold text-foreground-900 group-hover:text-primary-700 transition-colors line-clamp-2 leading-snug">
          {article.title}
        </h3>
        <p className="mt-1 text-xs text-foreground-500 line-clamp-2 md:line-clamp-1">
          {article.summary}
        </p>
        {slug && DISC_ICON_URLS[slug] && (
          <div className="mt-2 flex items-center gap-1.5">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600">
              <EditableImage
                contentKey={`discipline_icon_${slug}`}
                fallbackSrc={DISC_ICON_URLS[slug]}
                alt=""
                className="h-3 w-3 object-contain"
              />
            </span>
            <span className="text-[10px] font-medium text-foreground-400">{DISC_NAMES[slug]}</span>
          </div>
        )}
      </div>
      <span className="hidden md:flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-foreground-300 group-hover:text-primary-500 group-hover:bg-primary-50 transition-colors">
        <i className="ri-arrow-right-line text-base"></i>
      </span>
    </Link>
  );
}

export default function DyscyplinaPage() {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<Discipline | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [heroAnim, setHeroAnim] = useState(false);

  usePageVisit(slug ? `/dyscyplina/${slug}` : '');

  useEffect(() => {
    if (!slug) { setLoading(false); return; }
    let cancelled = false;
    setError(false);
    setLoading(true);
    async function load() {
      try {
        const all = await fetchDisciplineBySlug(slug);
        if (!cancelled) {
          setData(all);
          setLoading(false);
        }
      } catch (e) {
        console.error('fetchDisciplineBySlug failed:', e);
        if (!cancelled) {
          setData(null);
          setLoading(false);
          setError(true);
        }
      }
    }
    load();
    return () => { cancelled = true; };
  }, [slug]);

  useEffect(() => {
    const t = setTimeout(() => setHeroAnim(true), 120);
    return () => clearTimeout(t);
  }, [slug]);

  const [articles, setArticles] = useState<Article[]>([]);
  const [articlesLoading, setArticlesLoading] = useState(true);

  useEffect(() => {
    if (!slug) { return; }
    let cancelled = false;
    setArticlesLoading(true);
    async function load() {
      try {
        const all = await fetchArticlesByDiscipline(slug);
        if (!cancelled) {
          setArticles(all);
          setArticlesLoading(false);
        }
      } catch (e) {
        console.error('fetchArticlesByDiscipline failed:', e);
        if (!cancelled) {
          setArticles([]);
          setArticlesLoading(false);
        }
      }
    }
    load();
    return () => { cancelled = true; };
  }, [slug]);

  const gridArticles = articles.slice(0, 36);
  const olderArticles = articles.slice(36);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background-50">
        <div className="text-center">
          <span className="flex h-12 w-12 mx-auto items-center justify-center rounded-full bg-background-100 text-primary-500 animate-spin">
            <i className="ri-loader-4-line text-2xl"></i>
          </span>
          <p className="mt-3 text-sm text-foreground-500">{t('dyscyplina.loading')}</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background-50">
        <div className="text-center max-w-md px-4">
          <span className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-red-50 text-red-400 mb-4">
            <i className="ri-error-warning-line text-2xl"></i>
          </span>
          <h1 className="font-heading text-2xl font-bold text-foreground-900">{t('dyscyplina.not_found')}</h1>
          <p className="mt-2 text-sm text-foreground-500">
            {error
              ? t('dyscyplina.error_desc')
              : t('dyscyplina.not_found_desc', { slug: slug || '' })}
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 rounded-md bg-primary-500 px-4 py-2 text-sm font-semibold text-white cursor-pointer hover:bg-primary-600"
            >
              <i className="ri-refresh-line"></i> {t('dyscyplina.retry')}
            </button>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 rounded-md border border-primary-500/50 px-4 py-2 text-sm font-semibold text-primary-600 cursor-pointer hover:border-primary-500 hover:bg-primary-50/50"
            >
              <i className="ri-arrow-left-line"></i> {t('dyscyplina.home')}
            </button>
          </div>
        </div>
      </div>
    );
  }



  return (
    <div className="min-h-screen bg-background-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: `${data.name} — Artykuły i Analizy | Sportowy Vibe`,
            description: `Najnowsze artykuły i analizy ze świata ${data.name.toLowerCase()} na kanale Sportowy Vibe. Ekspercka wiedza, komentarze i sportowa energia.`,
          }),
        }}
      />
      <TopBar />
      <Navbar showBackButton />

      <Breadcrumbs currentLabel={data?.name} sticky />

      <main>
        {/* Hero */}
        <section className="relative h-64 md:h-96 overflow-hidden">
          <EditableImage
            contentKey={`discipline_hero_${slug}`}
            fallbackSrc={data.heroImage || ''}
            alt={data.name}
            className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-[1800ms] ease-out"
            containerClassName="absolute inset-0"
            fetchPriority="high"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />
          <div className="absolute inset-0 flex items-end">
            <div className="mx-auto w-full max-w-[1280px] px-4 md:px-6 pb-8 md:pb-12 relative z-10">
              {slug && DISC_ICON_URLS[slug] && (
                <EditableImage
                  contentKey={`discipline_icon_${slug}`}
                  fallbackSrc={DISC_ICON_URLS[slug]}
                  alt=""
                  aria-hidden="true"
                  className={`absolute right-0 md:right-8 -top-16 md:-top-24 h-32 w-32 md:h-56 md:w-56 object-contain opacity-[0.12] rotate-[15deg] pointer-events-none select-none hero-animate-init animate-hero-fade delay-hero-2 ${heroAnim ? '' : ''}`}
                />
              )}
              {slug && DISC_ICON_URLS[slug] ? (
                <div className="mb-3 flex h-14 w-14 md:h-20 md:w-20 items-center justify-center rounded-full bg-blue-600 shadow-xl hero-animate-init animate-hero-slide-up delay-hero-1">
                  <EditableImage
                    contentKey={`discipline_icon_${slug}`}
                    fallbackSrc={DISC_ICON_URLS[slug]}
                    alt={DISC_NAMES[slug] || data.name}
                    className="h-8 w-8 md:h-12 md:w-12 object-contain"
                  />
                </div>
              ) : (
                <div
                  className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full hero-animate-init animate-hero-slide-up delay-hero-1"
                  style={{ backgroundColor: data.color }}
                >
                  <i className={`${data.icon} text-xl text-white`}></i>
                </div>
              )}
              <h1 className="font-heading text-3xl md:text-5xl font-bold text-white tracking-tight hero-animate-init animate-hero-slide-up delay-hero-2">
                <EditableColor contentKey="color_dyscyplina_hero_title" fallbackColor="#FFFFFF">
                  <EditableText contentKey="dyscyplina_hero_title" fallback={data.name} shadowKey="shadow_dyscyplina_hero_h1" shadowFallback="0 2px 13px rgba(0,0,0,0.65)" />
                </EditableColor>
              </h1>
              <p className="mt-2 max-w-xl text-sm md:text-base text-white/80 hero-animate-init animate-hero-slide-up delay-hero-3">
                <EditableColor contentKey="color_dyscyplina_hero_desc" fallbackColor="rgba(255,255,255,0.8)">
                  <EditableText contentKey="dyscyplina_hero_desc" fallback={data.description} as="span" shadowKey="shadow_dyscyplina_hero_p" shadowFallback="0 2px 10px rgba(0,0,0,0.52)" />
                </EditableColor>
              </p>
            </div>
          </div>
        </section>

        {/* Artykuły — siatka 6×6 */}
        <section className="py-10 md:py-16">
          <div className="mx-auto max-w-[1400px] px-4 md:px-6">
            <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-primary-300/50 bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-600">
                  {slug && DISC_ICON_URLS[slug] ? (
                    <EditableImage
                      contentKey={`discipline_icon_${slug}`}
                      fallbackSrc={DISC_ICON_URLS[slug]}
                      alt=""
                      className="h-3.5 w-3.5 object-contain"
                    />
                  ) : (
                    <EditableImage contentKey={`dyscyplina_icon_grid_${slug || 'default'}`} fallbackSrc="" alt="" className="h-3.5 w-3.5 object-contain">
                      <i className="ri-grid-line"></i>
                    </EditableImage>
                  )}
                  {t('dyscyplina.articles_badge')}
                </span>
                <h2 className="mt-4 font-heading text-2xl md:text-3xl font-bold text-foreground-950">
                  {data.name} — {t('dyscyplina.articles_badge').toLowerCase()}
                </h2>
                <p className="mt-1 text-sm text-foreground-500">
                  {articlesLoading ? t('dyscyplina.articles_loading') : t('dyscyplina.articles_count', { count: gridArticles.length })}
                </p>
              </div>
            </div>

            {articlesLoading ? (
              <div className="text-center py-14">
                <span className="flex h-12 w-12 mx-auto items-center justify-center rounded-full bg-background-100 text-primary-500 animate-spin">
                  <i className="ri-loader-4-line text-2xl"></i>
                </span>
                <p className="mt-3 text-sm text-foreground-500">{t('dyscyplina.articles_loading')}</p>
              </div>
            ) : gridArticles.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {gridArticles.map((article) => (
                  <GridCard
                    key={article.slug}
                    article={article}
                    color={data.color}
                    icon={data.icon}
                    t={t}
                    slug={slug}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-14">
                <span className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-background-200/70 text-foreground-400 mb-4">
                  <i className="ri-article-line text-2xl"></i>
                </span>
                <p className="text-sm text-foreground-500">
                  {t('dyscyplina.no_articles')}
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Starsze artykuły */}
        {!articlesLoading && olderArticles.length > 0 && (
          <section className="py-10 md:py-16 bg-background-100">
            <div className="mx-auto max-w-[1280px] px-4 md:px-6">
              <div className="mb-8">
                <span className="inline-flex items-center gap-2 rounded-full border border-background-300/50 bg-background-200/70 px-3 py-1 text-xs font-semibold text-foreground-500">
                  <EditableImage contentKey={`dyscyplina_icon_archive_${slug || 'default'}`} fallbackSrc="" alt="" className="h-3.5 w-3.5 object-contain">
                    <i className="ri-archive-line"></i>
                  </EditableImage>
                  {t('dyscyplina.archive')}
                </span>
                <h2 className="mt-4 font-heading text-2xl md:text-3xl font-bold text-foreground-950">
                  {t('dyscyplina.archive')} — {data.name}
                </h2>
                <p className="mt-1 text-sm text-foreground-500">
                  {t('dyscyplina.archive_desc', { count: olderArticles.length })}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {olderArticles.map((article) => (
                  <OlderArticleRow
                    key={article.slug}
                    article={article}
                    color={data.color}
                    icon={data.icon}
                    t={t}
                    slug={slug}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="py-14 md:py-20">
          <div className="mx-auto max-w-[800px] px-4 md:px-6 text-center">
            <p className="text-sm text-foreground-500 mb-4">
              {t('dyscyplina.cta_text', { discipline: data.name.toLowerCase() })}
            </p>
            {slug && DISC_ICON_URLS[slug] && (
              <div className="mb-6 flex items-center justify-center">
                <EditableImage
                  contentKey={`discipline_icon_${slug}`}
                  fallbackSrc={DISC_ICON_URLS[slug]}
                  alt={DISC_NAMES[slug] || data.name}
                  className="h-10 w-10 md:h-14 md:w-14 object-contain opacity-60"
                />
              </div>
            )}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href="https://www.youtube.com/@Sportowy_Vibe"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-md bg-red-600 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-red-700 whitespace-nowrap cursor-pointer active:scale-95"
              >
                <i className="ri-youtube-fill"></i>
                {t('dyscyplina.watch_youtube')}
              </a>
              <Link
                to="/aktualnosci"
                className="inline-flex items-center gap-2 rounded-md border border-primary-500/50 px-6 py-3 text-sm font-semibold text-primary-600 transition-all hover:border-primary-500 hover:bg-primary-50/50 whitespace-nowrap cursor-pointer active:scale-95 active:bg-primary-100/50"
              >
                <i className="ri-arrow-left-line"></i>
                {t('dyscyplina.all_news')}
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-background-200/70 bg-background-100 py-8">
        <div className="mx-auto max-w-[1280px] px-4 md:px-6">
          {/* Navigation links */}
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 mb-6 text-xs font-medium text-foreground-500">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="cursor-pointer hover:text-primary-600 transition-colors whitespace-nowrap"
            >
              {t('nav.home')}
            </button>
            <span className="text-foreground-300">|</span>
            <button
              type="button"
              onClick={() => navigate('/nasze-filmy')}
              className="cursor-pointer hover:text-primary-600 transition-colors whitespace-nowrap"
            >
              {t('footer.movies')}
            </button>
            <span className="text-foreground-300">|</span>
            <button
              type="button"
              onClick={() => navigate('/o-nas/tworcy')}
              className="cursor-pointer hover:text-primary-600 transition-colors whitespace-nowrap"
            >
              {t('nav.about')}
            </button>
            <span className="text-foreground-300">|</span>
            <button
              type="button"
              onClick={() => {
                if (window.location.pathname !== '/') {
                  navigate('/');
                  setTimeout(() => {
                    document.getElementById('kontakt')?.scrollIntoView({ behavior: 'smooth' });
                  }, 300);
                } else {
                  document.getElementById('kontakt')?.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="cursor-pointer hover:text-primary-600 transition-colors whitespace-nowrap"
            >
              {t('nav.contact')}
            </button>
            <span className="text-foreground-300">|</span>
            <button
              type="button"
              onClick={() => navigate('/o-nas/wspolpraca')}
              className="cursor-pointer hover:text-primary-600 transition-colors whitespace-nowrap"
            >
              {t('nav.cooperation')}
            </button>
            <span className="text-foreground-300">|</span>
            <button
              type="button"
              onClick={() => navigate('/polityka-prywatnosci')}
              className="cursor-pointer hover:text-primary-600 transition-colors whitespace-nowrap"
            >
              {t('nav.privacy')}
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <Link to="/" className="flex items-center cursor-pointer active:opacity-70">
              <EditableImage
                contentKey="site_logo_footer"
                fallbackSrc="https://storage.readdy-site.link/project_files/6b577641-b4ea-4107-bb56-5f8fbbf97e07/319ec2ab-1af0-46ca-beed-0358e5e16485_sportowy_vibebez-sloganu2.svg"
                alt="Sportowy VIBE"
                className="h-8 w-auto max-w-[130px] object-contain"
              />
            </Link>
            <p className="text-xs text-foreground-400">
              {t('footer.rights')}
            </p>
            <div className="flex items-center gap-3">
              <a href="https://www.youtube.com/@sportowy_vibe" target="_blank" rel="noopener noreferrer" className="text-foreground-400 hover:text-primary-500 transition-colors">
                <span className="flex h-8 w-8 items-center justify-center">
                  <i className="ri-youtube-fill text-lg"></i>
                </span>
              </a>
              <a href="https://www.facebook.com/sportowy_vibe" target="_blank" rel="noopener noreferrer" className="text-foreground-400 hover:text-primary-500 transition-colors">
                <span className="flex h-8 w-8 items-center justify-center">
                  <i className="ri-facebook-fill text-lg"></i>
                </span>
              </a>
              <a href="https://www.instagram.com/sportowy_vibe" target="_blank" rel="noopener noreferrer" className="text-foreground-400 hover:text-primary-500 transition-colors">
                <span className="flex h-8 w-8 items-center justify-center">
                  <i className="ri-instagram-line text-lg"></i>
                </span>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}