import { Link, useNavigate, useParams } from 'react-router-dom';
import { fetchChannelNewsById, fetchAllChannelNews, type ChannelNewsItem } from '@/data/disciplines';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import TopBar from '@/pages/home/components/TopBar';
import Navbar from '@/pages/home/components/Navbar';
import Breadcrumbs from '@/components/feature/Breadcrumbs';
import EditableImage from '@/components/feature/EditableImage';
import EditableText from '@/components/feature/EditableText';
import EditableColor from '@/components/feature/EditableColor';

export default function AktualnoscKanaluPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { id } = useParams<{ id: string }>();
  const [news, setNews] = useState<ChannelNewsItem | null>(null);
  const [allNews, setAllNews] = useState<ChannelNewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    let cancelled = false;
    async function load() {
      const numericId = parseInt(id, 10);
      if (isNaN(numericId)) { setLoading(false); return; }
      const item = await fetchChannelNewsById(numericId);
      if (cancelled) return;
      setNews(item);
      if (item) {
        const all = await fetchAllChannelNews();
        if (!cancelled) {
          setAllNews(all.filter((n) => n.id !== item.id).slice(0, 3));
        }
      }
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background-50">
        <div className="text-center">
          <span className="flex h-12 w-12 mx-auto items-center justify-center rounded-full bg-background-100 text-primary-500 animate-spin">
            <i className="ri-loader-4-line text-2xl"></i>
          </span>
          <p className="mt-3 text-sm text-foreground-500">{t('nasz_kanal.loading')}</p>
        </div>
      </div>
    );
  }

  if (!news) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background-50">
        <div className="text-center">
          <h1 className="font-heading text-2xl font-bold text-foreground-900">{t('nasz_kanal.news_not_found')}</h1>
          <button
            type="button"
            onClick={() => navigate('/nasz-kanal')}
            className="mt-4 inline-flex items-center gap-2 rounded-md bg-primary-500 px-4 py-2 text-sm font-semibold text-white cursor-pointer hover:bg-primary-600"
          >
            <i className="ri-arrow-left-line"></i> {t('nasz_kanal.back_to_channel')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-50">
      <TopBar />
      <Navbar showBackButton />

      <Breadcrumbs
        currentLabel={news.title}
        sticky
      />

      <main>
        {/* Header */}
        <section className="py-10 md:py-16 bg-background-100">
          <div className="mx-auto max-w-[900px] px-4 md:px-6">
            <div className="flex items-center gap-3 mb-5">
              <Link
                to="/nasz-kanal"
                className="inline-flex items-center gap-2 rounded-full border border-accent-300/50 bg-accent-50 px-3 py-1 text-xs font-semibold text-accent-700 transition-colors hover:bg-accent-100 cursor-pointer whitespace-nowrap"
              >
                <i className={`${news.icon} text-xs`}></i>
                {t('nasz_kanal.hero_title')}
              </Link>
              <span className="rounded-full bg-accent-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent-700">
                {news.tag}
              </span>
              {news.newsDate && (
                <span className="text-xs text-foreground-400">{news.newsDate}</span>
              )}
            </div>
            <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground-950 leading-tight">
              <EditableColor contentKey="color_nasz_kanal_hero_title" fallbackColor="#0F172A">
                <EditableText contentKey="kanal_aktualnosc_title" fallback={news.title} />
              </EditableColor>
            </h1>
            {news.description && (
              <p className="mt-4 text-base text-foreground-600 leading-relaxed">
                <EditableColor contentKey="color_nasz_kanal_hero_desc" fallbackColor="#475569">
                  <EditableText contentKey="kanal_aktualnosc_desc" fallback={news.description} as="span" />
                </EditableColor>
              </p>
            )}
          </div>
        </section>

        {/* Content */}
        <section className="py-10 md:py-16">
          <div className="mx-auto max-w-[800px] px-4 md:px-6">
            {news.content ? (
              <article className="prose prose-lg max-w-none text-foreground-700 leading-relaxed whitespace-pre-line">
                {news.content}
              </article>
            ) : news.description ? (
              <article className="prose prose-lg max-w-none text-foreground-700 leading-relaxed whitespace-pre-line">
                {news.description}
              </article>
            ) : (
              <div className="text-center py-10">
                <span className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-background-200/70 text-foreground-400 mb-4">
                  <i className="ri-file-text-line text-2xl"></i>
                </span>
                <p className="text-sm text-foreground-500">
                  {t('nasz_kanal.no_news_content')}
                </p>
              </div>
            )}

            <div className="mt-10 pt-8 border-t border-background-200/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs text-foreground-400">{t('nasz_kanal.published')}</span>
                <p className="text-sm font-medium text-foreground-700">{news.newsDate || '—'}</p>
              </div>
              <Link
                to="/nasz-kanal"
                className="inline-flex items-center gap-2 rounded-md border border-primary-500/50 px-5 py-2.5 text-sm font-semibold text-primary-600 transition-all hover:border-primary-500 hover:bg-primary-50/50 whitespace-nowrap cursor-pointer active:scale-95"
              >
                <i className="ri-arrow-left-line"></i>
                {t('nasz_kanal.back_to_channel')}
              </Link>
            </div>
          </div>
        </section>

        {/* Related News */}
        {allNews.length > 0 && (
          <section className="py-10 md:py-16 bg-background-100">
            <div className="mx-auto max-w-[1280px] px-4 md:px-6">
              <h2 className="font-heading text-2xl font-bold text-foreground-950 mb-8">
                {t('nasz_kanal.other_news')}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {allNews.map((item) => (
                  <Link
                    key={item.id}
                    to={`/nasz-kanal/aktualnosc/${item.id}`}
                    className="group block rounded-lg border border-background-200/70 bg-background-50 p-5 transition-all duration-300 hover:border-primary-300/50 hover:shadow-lg hover:shadow-primary-500/5 hover:-translate-y-1 cursor-pointer active:bg-primary-50/50"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary-50 text-primary-500 mb-3 transition-colors group-hover:bg-primary-100">
                      <i className={`${item.icon} text-lg`}></i>
                    </span>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="rounded-full bg-accent-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent-700">
                        {item.tag}
                      </span>
                    </div>
                    <h3 className="font-heading text-sm font-semibold text-foreground-900 group-hover:text-primary-700 transition-colors line-clamp-2">
                      {item.title}
                    </h3>
                    {item.newsDate && (
                      <p className="mt-1 text-xs text-foreground-400">{item.newsDate}</p>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

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