import { Link, useNavigate, useParams } from 'react-router-dom';
import { fetchArticleBySlug, fetchArticlesByDiscipline, fetchPopularArticles, type Article } from '@/data/articles';
import { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/pages/home/components/Navbar';
import CommentsSection from './components/CommentsSection';
import ArticleReactions from './components/ArticleReactions';
import ReportModal from './components/ReportModal';
import AuthModal from '@/components/feature/AuthModal';
import TopBar from '@/pages/home/components/TopBar';
import Breadcrumbs from '@/components/feature/Breadcrumbs';
import EditableImage from '@/components/feature/EditableImage';
import EditableText from '@/components/feature/EditableText';
import EditableColor from '@/components/feature/EditableColor';
import { useArticleLike, usePageVisit } from '@/hooks/useLikes';

const DISC_ICON_URLS: Record<string, string> = {
  tenis: 'https://storage.readdy-site.link/project_files/6b577641-b4ea-4107-bb56-5f8fbbf97e07/ccb0fd5b-5782-49b3-8ca8-adb4a831211d_tennis_racquet_icon_126044.svg',
  siatkowka: 'https://storage.readdy-site.link/project_files/6b577641-b4ea-4107-bb56-5f8fbbf97e07/6f58c12e-6b36-4c6d-a0d3-83fa6ad87017_volleyball-2.svg',
  koszykowka: 'https://storage.readdy-site.link/project_files/6b577641-b4ea-4107-bb56-5f8fbbf97e07/fb9e341c-57b4-4dd3-9010-e638ee9af8be_basketball.svg',
  'pilka-nozna': 'https://storage.readdy-site.link/project_files/6b577641-b4ea-4107-bb56-5f8fbbf97e07/d756def3-a061-4b62-a00c-2fec9ef47c2f_football.svg',
  hokej: 'https://storage.readdy-site.link/project_files/6b577641-b4ea-4107-bb56-5f8fbbf97e07/e7782d89-a2ea-4c35-a175-56026cb0f6d5_hockey.svg',
  'skoki-narciarskie': 'https://storage.readdy-site.link/project_files/6b577641-b4ea-4107-bb56-5f8fbbf97e07/1db633d3-afda-4235-9391-71404d847f06_ski_jumper.svg',
};

const DISC_NAMES: Record<string, string> = {
  tenis: 'Tenis',
  siatkowka: 'Siatkówka',
  koszykowka: 'Koszykówka',
  'pilka-nozna': 'Piłka nożna',
  hokej: 'Hokej na lodzie',
  'skoki-narciarskie': 'Skoki Narciarskie',
};

const DISCIPLINE_COLORS: Record<string, string> = {
  tenis: '#16a34a',
  siatkowka: '#dc2626',
  'pilka-nozna': '#2563eb',
  koszykowka: '#ea580c',
  hokej: '#0ea5e9',
  'skoki-narciarskie': '#7c3aed',
  inne: '#64748b',
  'nasz-kanal': '#dc2626',
};

const DISCIPLINE_ICONS: Record<string, string> = {
  tenis: 'ri-circle-line',
  siatkowka: 'ri-basketball-line',
  'pilka-nozna': 'ri-football-line',
  koszykowka: 'ri-basketball-line',
  hokej: 'ri-snowflake-line',
  'skoki-narciarskie': 'ri-arrow-up-line',
  inne: 'ri-more-2-line',
  'nasz-kanal': 'ri-youtube-line',
};

function getShareUrls(articleUrl: string, title: string, imageUrl: string, summary: string) {
  const encodedUrl = encodeURIComponent(articleUrl);
  const encodedTitle = encodeURIComponent(title);
  const encodedSummary = encodeURIComponent(summary);
  const encodedImage = encodeURIComponent(imageUrl);

  return {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    x: `https://x.com/intent/post?url=${encodedUrl}&text=${encodedTitle}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    email: `mailto:?subject=${encodedTitle}&body=${encodedTitle}%0A%0A${encodedSummary}%0A%0A${encodedUrl}`,
  };
}

export default function ArtykulPage() {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const { user } = useAuth();
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);
  const [popularArticles, setPopularArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [imageExpanded, setImageExpanded] = useState(false);
  const [galleryExpanded, setGalleryExpanded] = useState(false);
  const [galleryImage, setGalleryImage] = useState<string | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Report modal
  const [reportModalOpen, setReportModalOpen] = useState(false);

  // Page visit tracking
  usePageVisit(slug ? `/artykul/${slug}` : '');

  // Article likes
  const { liked: articleLiked, likeCount: articleLikeCount, toggleLike: toggleArticleLike } = useArticleLike(slug || '', user?.id);

  const articleUrl = useMemo(() => {
    if (!slug) return '';
    return `${window.location.origin}/artykul/${slug}`;
  }, [slug]);

  const [resolvedImageUrl, setResolvedImageUrl] = useState<string>('');

  useEffect(() => {
    if (!slug) { setLoading(false); return; }
    let cancelled = false;
    async function load() {
      const art = await fetchArticleBySlug(slug);
      if (cancelled) return;
      setArticle(art);
      if (art) {
        document.title = `${art.title} — Sportowy Vibe`;
        let metaDesc = document.querySelector('meta[name="description"]');
        if (!metaDesc) {
          metaDesc = document.createElement('meta');
          metaDesc.setAttribute('name', 'description');
          document.head.appendChild(metaDesc);
        }
        metaDesc.setAttribute('content', art.summary);
        let ogTitle = document.querySelector('meta[property="og:title"]');
        if (!ogTitle) {
          ogTitle = document.createElement('meta');
          ogTitle.setAttribute('property', 'og:title');
          document.head.appendChild(ogTitle);
        }
        ogTitle.setAttribute('content', art.title);
        let ogDesc = document.querySelector('meta[property="og:description"]');
        if (!ogDesc) {
          ogDesc = document.createElement('meta');
          ogDesc.setAttribute('property', 'og:description');
          document.head.appendChild(ogDesc);
        }
        ogDesc.setAttribute('content', art.summary);
        let ogImage = document.querySelector('meta[property="og:image"]');
        if (!ogImage) {
          ogImage = document.createElement('meta');
          ogImage.setAttribute('property', 'og:image');
          document.head.appendChild(ogImage);
        }
        ogImage.setAttribute('content', art.image);
        let ogUrl = document.querySelector('meta[property="og:url"]');
        if (!ogUrl) {
          ogUrl = document.createElement('meta');
          ogUrl.setAttribute('property', 'og:url');
          document.head.appendChild(ogUrl);
        }
        ogUrl.setAttribute('content', `${window.location.origin}/artykul/${art.slug}`);
        let twitterCard = document.querySelector('meta[name="twitter:card"]');
        if (!twitterCard) {
          twitterCard = document.createElement('meta');
          twitterCard.setAttribute('name', 'twitter:card');
          document.head.appendChild(twitterCard);
        }
        twitterCard.setAttribute('content', 'summary_large_image');
        let twitterTitle = document.querySelector('meta[name="twitter:title"]');
        if (!twitterTitle) {
          twitterTitle = document.createElement('meta');
          twitterTitle.setAttribute('name', 'twitter:title');
          document.head.appendChild(twitterTitle);
        }
        twitterTitle.setAttribute('content', art.title);
        let twitterImage = document.querySelector('meta[name="twitter:image"]');
        if (!twitterImage) {
          twitterImage = document.createElement('meta');
          twitterImage.setAttribute('name', 'twitter:image');
          document.head.appendChild(twitterImage);
        }
        twitterImage.setAttribute('content', art.image);

        const all = await fetchArticlesByDiscipline(art.disciplineSlug);
        if (!cancelled) {
          setRelatedArticles(all.filter((a) => a.slug !== art.slug).slice(0, 6));
        }

        // Fetch popular articles
        const popular = await fetchPopularArticles(art.slug);
        if (!cancelled) {
          setPopularArticles(popular);
        }
      }
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [slug]);

  useEffect(() => {
    if (!article) return;
    setResolvedImageUrl(article.image);
    import('@/data/siteContent').then(({ getContentByKey }) => {
      getContentByKey(`artykul_img_${article.slug}`).then((url) => {
        if (url && url.length > 0) {
          setResolvedImageUrl(url);
        }
      }).catch(() => {});
    }).catch(() => {});
  }, [article]);

  useEffect(() => {
    if (!resolvedImageUrl) return;
    let ogImage = document.querySelector('meta[property="og:image"]');
    if (!ogImage) {
      ogImage = document.createElement('meta');
      ogImage.setAttribute('property', 'og:image');
      document.head.appendChild(ogImage);
    }
    ogImage.setAttribute('content', resolvedImageUrl);
    let twitterImage = document.querySelector('meta[name="twitter:image"]');
    if (!twitterImage) {
      twitterImage = document.createElement('meta');
      twitterImage.setAttribute('name', 'twitter:image');
      document.head.appendChild(twitterImage);
    }
    twitterImage.setAttribute('content', resolvedImageUrl);
  }, [resolvedImageUrl]);

  const shareUrls = useMemo(() => {
    if (!article) return null;
    const shareImage = resolvedImageUrl || article.image;
    return getShareUrls(articleUrl, article.title, shareImage, article.summary);
  }, [article, articleUrl, resolvedImageUrl]);

  const handleShare = (platform: 'facebook' | 'x' | 'linkedin' | 'email') => {
    if (!shareUrls) return;
    const url = shareUrls[platform];
    if (platform === 'email') {
      window.location.href = url;
    } else {
      window.open(url, '_blank', 'width=600,height=500');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background-50">
        <div className="text-center">
          <span className="flex h-12 w-12 mx-auto items-center justify-center rounded-full bg-background-100 text-primary-500 animate-spin">
            <i className="ri-loader-4-line text-2xl"></i>
          </span>
          <p className="mt-3 text-sm text-foreground-500">{t('artykul.loading')}</p>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background-50">
        <div className="text-center">
          <h1 className="font-heading text-2xl font-bold text-foreground-900">{t('artykul.not_found')}</h1>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="mt-4 inline-flex items-center gap-2 rounded-md bg-primary-500 px-4 py-2 text-sm font-semibold text-white cursor-pointer hover:bg-primary-600"
          >
            <i className="ri-arrow-left-line"></i> {t('artykul.back_home')}
          </button>
        </div>
      </div>
    );
  }

  const discColor = DISCIPLINE_COLORS[article.disciplineSlug] || '#64748b';
  const discIcon = DISCIPLINE_ICONS[article.disciplineSlug] || 'ri-more-2-line';

  const disciplinePath =
    article.disciplineSlug === 'nasz-kanal'
      ? '/nasz-kanal'
      : `/dyscyplina/${article.disciplineSlug}`;

  return (
    <div className="min-h-screen bg-background-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: article.title,
            description: article.summary,
            image: article.image,
            datePublished: article.date,
            author: {
              '@type': 'Organization',
              name: 'Sportowy Vibe',
              url: 'https://sportowyvibe.pl/',
            },
            publisher: {
              '@type': 'Organization',
              name: 'Sportowy Vibe',
              logo: {
                '@type': 'ImageObject',
                url: 'https://storage.readdy-site.link/project_files/6b577641-b4ea-4107-bb56-5f8fbbf97e07/319ec2ab-1af0-46ca-beed-0358e5e16485_sportowy_vibebez-sloganu2.svg',
              },
            },
            mainEntityOfPage: {
              '@type': 'WebPage',
              '@id': `https://sportowyvibe.pl/artykul/${article.slug}`,
            },
          }),
        }}
      />
      <TopBar />
      <Navbar showBackButton />

      <Breadcrumbs
        currentLabel={article?.title}
        intermediateLabel={article?.discipline}
        intermediateHref={disciplinePath}
        sticky
      />

      <main>
        {/* Header */}
        <section className="py-10 md:py-16 bg-background-100">
          <div className="mx-auto max-w-[680px] px-4 md:px-6">
            <div className="flex items-center gap-3 mb-5">
              <Link
                to={disciplinePath}
                className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold transition-colors hover:bg-background-50 cursor-pointer active:bg-primary-50/50"
                style={{ borderColor: discColor, color: discColor, backgroundColor: `${discColor}10` }}
              >
                <span className="flex h-4 w-4 items-center justify-center">
                  {DISC_ICON_URLS[article.disciplineSlug] ? (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-600">
                      <img src={DISC_ICON_URLS[article.disciplineSlug]} alt="" className="h-2.5 w-2.5 object-contain" />
                    </span>
                  ) : (
                    <i className={`${discIcon} text-xs`}></i>
                  )}
                </span>
                {article.discipline}
              </Link>
              <span className="text-xs text-yellow-500">{article.date}</span>
              {article.featured && (
                <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] font-semibold text-yellow-700">
                  <i className="ri-star-fill text-[10px]"></i>
                  {t('artykul.featured')}
                </span>
              )}
            </div>
            {DISC_ICON_URLS[article.disciplineSlug] && (
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 md:h-14 md:w-14 items-center justify-center rounded-full bg-blue-600 shadow-md">
                  <img
                    src={DISC_ICON_URLS[article.disciplineSlug]}
                    alt={DISC_NAMES[article.disciplineSlug] || article.discipline}
                    className="h-6 w-6 md:h-10 md:w-10 object-contain"
                  />
                </div>
                <span className="text-sm font-medium text-foreground-500">{DISC_NAMES[article.disciplineSlug] || article.discipline}</span>
              </div>
            )}
            <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground-950 leading-tight">
              <EditableColor contentKey="color_artykul_title" fallbackColor="#0F172A">
                {article.title}
              </EditableColor>
            </h1>
            <p className="mt-4 text-base text-foreground-600 leading-relaxed">
              <EditableColor contentKey="color_artykul_summary" fallbackColor="#475569">
                {article.summary}
              </EditableColor>
            </p>
          </div>
        </section>

        {/* Image + Content + Sidebar */}
        <section className="mx-auto max-w-[1280px] px-4 md:px-6 pt-8 md:pt-10 pb-8 md:pb-14">
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">
            {/* Main content column */}
            <div className="flex-1 min-w-0">
              {/* Image */}
              <div className="relative h-56 md:h-80 overflow-hidden rounded-xl cursor-pointer group" onClick={() => setImageExpanded(true)}>
                <EditableImage
                  contentKey={`artykul_img_${article.slug}`}
                  fallbackSrc={article.image}
                  alt={article.title}
                  className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                  containerClassName="absolute inset-0"
                  fetchPriority="high"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm">
                    <i className="ri-fullscreen-line text-xl"></i>
                  </span>
                </div>
              </div>
              {article.image_caption && (
                <p className="mt-2 text-xs text-foreground-400 italic text-right">
                  {article.image_caption}
                </p>
              )}

              {/* Content */}
              <div className="mt-8">
                <article className="text-base md:text-lg text-foreground-700 leading-relaxed whitespace-pre-line
                  [&_h2]:font-heading [&_h2]:font-bold [&_h2]:text-foreground-950 [&_h2]:tracking-tight [&_h2]:text-xl md:[&_h2]:text-2xl [&_h2]:mt-8 [&_h2]:mb-3
                  [&_h3]:font-heading [&_h3]:font-bold [&_h3]:text-foreground-950 [&_h3]:tracking-tight [&_h3]:text-lg md:[&_h3]:text-xl [&_h3]:mt-6 [&_h3]:mb-2
                  [&_p]:leading-relaxed [&_p]:text-foreground-700 [&_p]:mb-4
                  [&_a]:text-primary-600 [&_a]:no-underline hover:[&_a]:underline
                  [&_strong]:text-foreground-900
                  [&_blockquote]:border-l-4 [&_blockquote]:border-l-primary-400 [&_blockquote]:bg-primary-50/50 [&_blockquote]:rounded-r-lg [&_blockquote]:py-3 [&_blockquote]:px-4 [&_blockquote]:text-foreground-700 [&_blockquote]:not-italic [&_blockquote]:my-5
                  [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-4 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-4
                  [&_li]:text-foreground-700 [&_li]:mb-1
                  [&_img]:rounded-lg [&_img]:my-4">
                  {article.content}
                </article>

                {/* Article Emoji Reactions */}
                <div className="mt-6 pt-4 border-t border-background-200/70">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-xs font-semibold text-foreground-500 whitespace-nowrap">Reakcje:</span>
                    <ArticleReactions articleSlug={article.slug} userId={user?.id} onLoginRequest={() => setAuthModalOpen(true)} />
                  </div>
                </div>

                {/* Social Share & Like Buttons */}
                <div className="mt-6 pt-4 border-t border-background-200/70 space-y-4">
                  <div className="flex items-center gap-3 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        if (!user) {
                          setAuthModalOpen(true);
                          return;
                        }
                        toggleArticleLike();
                      }}
                      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                        articleLiked
                          ? 'bg-red-50 text-red-500 border border-red-200 hover:bg-red-100'
                          : 'border border-background-300 bg-background-50 text-foreground-600 hover:border-red-300 hover:text-red-500 hover:bg-red-50'
                      }`}
                      title={articleLiked ? 'Cofnij polubienie' : 'Polub artykuł'}
                    >
                      <i className={`${articleLiked ? 'ri-heart-fill' : 'ri-heart-line'} text-base`}></i>
                      {articleLiked ? 'Polubione' : 'Polub'}
                      {articleLikeCount > 0 && (
                        <span className="-ml-1 text-xs">({articleLikeCount})</span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setReportModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-full border border-background-300 bg-background-50 px-3 py-1.5 text-xs font-medium text-foreground-500 hover:text-red-500 hover:border-red-300 hover:bg-red-50 transition-all cursor-pointer whitespace-nowrap"
                      title="Zgłoś artykuł"
                    >
                      <i className="ri-flag-line text-xs"></i>
                      Zgłoś
                    </button>
                  </div>

                  {/* Share row */}
                  {shareUrls && (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                      <span className="text-sm font-semibold text-foreground-600 whitespace-nowrap flex items-center gap-1.5">
                        <i className="ri-share-forward-line text-sm"></i>
                        Udostępnij:
                      </span>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleShare('facebook')}
                          className="inline-flex items-center gap-1.5 rounded-md bg-[#1877F2] px-3.5 py-2 text-xs font-semibold text-white transition-all hover:bg-[#166fe5] hover:shadow-md whitespace-nowrap cursor-pointer"
                          title="Udostępnij na Facebook"
                        >
                          <i className="ri-facebook-fill text-sm"></i>
                          Facebook
                        </button>
                        <button
                          type="button"
                          onClick={() => handleShare('x')}
                          className="inline-flex items-center gap-1.5 rounded-md bg-[#0F1419] px-3.5 py-2 text-xs font-semibold text-white transition-all hover:bg-[#1a1f24] hover:shadow-md whitespace-nowrap cursor-pointer"
                          title="Udostępnij na X"
                        >
                          <i className="ri-twitter-x-fill text-sm"></i>
                          X
                        </button>
                        <button
                          type="button"
                          onClick={() => handleShare('linkedin')}
                          className="inline-flex items-center gap-1.5 rounded-md bg-[#0A66C2] px-3.5 py-2 text-xs font-semibold text-white transition-all hover:bg-[#0959a8] hover:shadow-md whitespace-nowrap cursor-pointer"
                          title="Udostępnij na LinkedIn"
                        >
                          <i className="ri-linkedin-fill text-sm"></i>
                          LinkedIn
                        </button>
                        <button
                          type="button"
                          onClick={() => handleShare('email')}
                          className="inline-flex items-center gap-1.5 rounded-md border border-background-300 bg-background-50 px-3.5 py-2 text-xs font-semibold text-foreground-700 transition-all hover:bg-background-100 hover:border-foreground-400 whitespace-nowrap cursor-pointer"
                          title="Wyślij e-mailem"
                        >
                          <i className="ri-mail-line text-sm"></i>
                          E-mail
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Gallery */}
                {article.gallery && Array.isArray(article.gallery) && article.gallery.length > 0 && (
                  <div className="mt-8">
                    <h3 className="font-heading text-lg font-bold text-foreground-900 mb-4 flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-100 text-accent-600">
                        <i className="ri-gallery-line text-sm"></i>
                      </span>
                      <EditableColor contentKey="color_artykul_gallery" fallbackColor="#0F172A">
                        <EditableText contentKey="artykul_gallery" fallback={t('artykul.gallery')} />
                      </EditableColor>
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {article.gallery.map((img: string, idx: number) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => { setGalleryImage(img); setGalleryExpanded(true); }}
                          className="relative group overflow-hidden rounded-lg border border-background-200/70 bg-background-100 aspect-[4/3] cursor-pointer"
                        >
                          <EditableImage
                            contentKey={`artykul_gallery_${article.slug}_${idx}`}
                            fallbackSrc={img}
                            alt={`${t('artykul.gallery_image')} ${idx + 1}`}
                            className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              <i className="ri-fullscreen-line text-sm"></i>
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-8 pt-6 border-t border-background-200/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs text-yellow-400">{t('artykul.published')}</span>
                    <p className="text-sm font-medium text-yellow-600">{article.date}</p>
                  </div>
                  <Link
                    to={disciplinePath}
                    className="inline-flex items-center gap-2 rounded-md px-5 py-2.5 text-sm font-semibold transition-all cursor-pointer active:scale-95"
                    style={{ backgroundColor: `${discColor}10`, color: discColor }}
                  >
                    <span className="flex h-4 w-4 items-center justify-center">
                      {DISC_ICON_URLS[article.disciplineSlug] ? (
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-600">
                          <img src={DISC_ICON_URLS[article.disciplineSlug]} alt="" className="h-2.5 w-2.5 object-contain" />
                        </span>
                      ) : (
                        <i className={`${discIcon} text-sm`}></i>
                      )}
                    </span>
                    {t('artykul.more_from')} {article.discipline}
                  </Link>
                </div>
              </div>
            </div>

            {/* Sidebar - Popular Articles */}
            <aside className="w-full lg:w-[300px] flex-shrink-0">
              <div className="sticky top-24">
                <div className="rounded-xl border border-background-200/70 bg-background-50 p-5">
                  <h3 className="font-heading text-base font-bold text-foreground-950 mb-1 flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-100 text-accent-600">
                      <i className="ri-fire-line text-sm"></i>
                    </span>
                    Popularne
                  </h3>
                  <p className="text-xs text-foreground-400 mb-4">Najczęściej czytane artykuły</p>
                  {popularArticles.length === 0 ? (
                    <div className="flex items-center justify-center py-8">
                      <span className="flex h-6 w-6 items-center justify-center text-foreground-300 animate-spin">
                        <i className="ri-loader-4-line text-sm"></i>
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-0">
                      {popularArticles.map((pop, idx) => (
                        <Link
                          key={pop.slug}
                          to={`/artykul/${pop.slug}`}
                          className="flex items-start gap-3 py-3 border-b border-background-100 last:border-b-0 group cursor-pointer transition-colors hover:bg-background-50 -mx-2 px-2 rounded-md"
                        >
                          <span className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md text-xs font-bold ${
                            idx < 3
                              ? 'bg-accent-100 text-accent-700'
                              : 'bg-background-100 text-foreground-400'
                          }`}>
                            {idx + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-foreground-800 group-hover:text-primary-700 transition-colors line-clamp-2 leading-snug">
                              {pop.title}
                            </p>
                            <div className="mt-1 flex items-center gap-2 text-xs text-yellow-500">
                              <span>{pop.date}</span>
                              <span className="text-yellow-300">·</span>
                              <span className="truncate">{pop.discipline}</span>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </aside>
          </div>
        </section>

        {/* Image Lightbox */}
        {imageExpanded && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 cursor-pointer"
            onClick={() => setImageExpanded(false)}
          >
            <button
              type="button"
              onClick={() => setImageExpanded(false)}
              className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors cursor-pointer z-10"
            >
              <i className="ri-close-line text-xl"></i>
            </button>
            <EditableImage
              contentKey={`artykul_img_${article.slug}`}
              fallbackSrc={article.image}
              alt={article.title}
              className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
              containerClassName="inline-block"
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            />
          </div>
        )}

        {/* Comments */}
        <CommentsSection articleSlug={article.slug} articleTitle={article.title} onLoginRequest={() => setAuthModalOpen(true)} />

        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <section className="py-10 md:py-16 bg-background-100">
            <div className="mx-auto max-w-[1280px] px-4 md:px-6">
              <h2 className="font-heading text-2xl font-bold text-foreground-950 mb-8">
                <EditableColor contentKey="color_artykul_related" fallbackColor="#0F172A">
                  <EditableText contentKey="artykul_related" fallback={t('artykul.related')} />
                </EditableColor>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {relatedArticles.map((rel) => (
                  <Link
                    key={rel.slug}
                    to={`/artykul/${rel.slug}`}
                    className="group block rounded-lg border border-background-200/70 bg-background-50 p-5 transition-all duration-300 hover:border-primary-300/50 hover:shadow-lg hover:shadow-primary-500/5 hover:-translate-y-1 cursor-pointer active:bg-primary-50/50"
                  >
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-md text-white mb-3 ${DISC_ICON_URLS[rel.disciplineSlug] ? 'bg-blue-600' : ''}`}
                      style={DISC_ICON_URLS[rel.disciplineSlug] ? {} : { backgroundColor: discColor }}
                    >
                      {DISC_ICON_URLS[rel.disciplineSlug] ? (
                        <img src={DISC_ICON_URLS[rel.disciplineSlug]} alt="" className="h-5 w-5 object-contain" />
                      ) : (
                        <i className={`${discIcon} text-sm`}></i>
                      )}
                    </span>
                    <h3 className="font-heading text-sm font-semibold text-foreground-900 group-hover:text-primary-700 transition-colors line-clamp-2">
                      {rel.title}
                    </h3>
                    <p className="mt-1 text-xs text-yellow-500">{rel.date}</p>
                    {DISC_ICON_URLS[rel.disciplineSlug] && (
                      <div className="mt-2 flex items-center gap-1.5">
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-600">
                          <img src={DISC_ICON_URLS[rel.disciplineSlug]} alt="" className="h-2.5 w-2.5 object-contain" />
                        </span>
                        <span className="text-[10px] font-medium text-foreground-400">{DISC_NAMES[rel.disciplineSlug] || rel.discipline}</span>
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Gallery Lightbox */}
      {galleryExpanded && galleryImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 cursor-pointer"
          onClick={() => { setGalleryExpanded(false); setGalleryImage(null); }}
        >
          <button
            type="button"
            onClick={() => { setGalleryExpanded(false); setGalleryImage(null); }}
            className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors cursor-pointer z-10"
          >
            <i className="ri-close-line text-xl"></i>
          </button>
          <img
            src={galleryImage}
            alt={t('artykul.gallery_image')}
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Auth Modal */}
      <AuthModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} />

      {/* Report Modal */}
      <ReportModal
        open={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        reportType="article"
        reportTarget={article.slug}
        reportLabel={article.title}
      />

      {/* Footer */}
      <footer className="border-t border-background-200/70 bg-background-100">
        <div className="mx-auto max-w-[1280px] px-4 md:px-6 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <Link to="/" className="flex items-center cursor-pointer active:opacity-70">
              <EditableImage
                contentKey="site_logo_footer"
                fallbackSrc="https://storage.readdy-site.link/project_files/6b577641-b4ea-4107-bb56-5f8fbbf97e07/319ec2ab-1af0-46ca-beed-0358e5e16485_sportowy_vibebez-sloganu2.svg"
                alt="Sportowy VIBE"
                className="h-8 w-auto max-w-[130px] object-contain"
              />
            </Link>
            <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
              <Link to="/" className="text-xs font-medium text-foreground-500 hover:text-primary-600 transition-colors whitespace-nowrap">
                Strona główna
              </Link>
              <span className="text-foreground-300 text-xs select-none">|</span>
              <Link to="/nasze-filmy" className="text-xs font-medium text-foreground-500 hover:text-primary-600 transition-colors whitespace-nowrap">
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
            </nav>
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