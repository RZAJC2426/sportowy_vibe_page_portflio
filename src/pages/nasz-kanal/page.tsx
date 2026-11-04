import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchAllChannelNews, type ChannelNewsItem } from '@/data/disciplines';
import TopBar from '@/pages/home/components/TopBar';
import Navbar from '@/pages/home/components/Navbar';
import EditableText from '@/components/feature/EditableText';
import EditableColor from '@/components/feature/EditableColor';
import EditableImage from '@/components/feature/EditableImage';
import Breadcrumbs from '@/components/feature/Breadcrumbs';

export default function NaszKanalPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [channelNews, setChannelNews] = useState<ChannelNewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [heroImgReady, setHeroImgReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const news = await fetchAllChannelNews();
      if (!cancelled) {
        setChannelNews(news);
        setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setHeroImgReady(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen bg-background-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'Nasz Kanał — Aktualności i Informacje | Sportowy Vibe',
            description: 'Poznaj kanał Sportowy Vibe — aktualności, zapowiedzi transmisji, formaty video i studio meczowe. Sportowa energia prosto z YouTube, tworzona przez Roberta i Michała.',
          }),
        }}
      />
      <TopBar />
      <Navbar showBackButton />

      <Breadcrumbs sticky />

      <main>
        {/* Hero */}
        <section className="relative py-12 md:py-20 bg-background-100 overflow-hidden">
          <div className="mx-auto max-w-[1280px] px-4 md:px-6">
            <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-14">
              {/* Tekst */}
              <div className={`flex-1 text-center lg:text-left transition-all duration-1000 ease-out ${heroImgReady ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}>
                <div className="inline-block mb-5 overflow-hidden rounded-lg px-4 py-2">
                  <EditableImage
                    contentKey="nasz_kanal_hero_logo"
                    fallbackSrc="https://storage.readdy-site.link/project_files/6b577641-b4ea-4107-bb56-5f8fbbf97e07/5f809f16-726f-4e78-9150-591a36aa9ee5_sportowy_vibeslogan_white.svg"
                    alt="Sportowy VIBE — Energia Sportu Każdego Dnia"
                    className="h-14 md:h-18 w-auto object-contain transition-transform duration-300 ease-out hover:scale-110"
                  />
                </div>
                <h1 className="font-heading text-3xl md:text-5xl font-bold text-primary-600 tracking-tight">
                  <EditableColor contentKey="color_nasz_kanal_hero_title" fallbackColor="#14B8A6">
                    <EditableText contentKey="nasz_kanal_hero_title" fallback={t('nasz_kanal.hero_title')} />
                  </EditableColor>
                </h1>
                <p className="mt-4 max-w-lg mx-auto lg:mx-0 text-base text-foreground-600 leading-relaxed">
                  <EditableColor contentKey="color_nasz_kanal_hero_desc" fallbackColor="#475569">
                    <EditableText contentKey="nasz_kanal_hero_desc" fallback={t('nasz_kanal.hero_desc')} as="p" />
                  </EditableColor>
                </p>
                <div className="mt-6 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
                  <a
                    href="https://www.youtube.com/@Sportowy_Vibe"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-md bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-red-700 whitespace-nowrap cursor-pointer"
                  >
                    <i className="ri-youtube-fill"></i>
                    YouTube
                  </a>
                  <Link
                    to="/harmonogram-kanalu"
                    className="inline-flex items-center gap-2 rounded-md border border-primary-500/50 px-5 py-2.5 text-sm font-semibold text-primary-600 transition-all hover:border-primary-500 hover:bg-primary-50/50 whitespace-nowrap cursor-pointer"
                  >
                    <i className="ri-calendar-schedule-line"></i>
                    {t('nasz_kanal.schedule_link')}
                  </Link>
                </div>
              </div>

              {/* Obraz z efektem rozwijania */}
              <div className={`flex-1 w-full max-w-[640px] lg:max-w-none transition-all duration-1000 ease-out delay-200 ${heroImgReady ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}>
                <div className="group relative cursor-pointer">
                  <div className="overflow-hidden rounded-2xl bg-background-200 transition-all duration-700 ease-out group-hover:rounded-xl shadow-lg">
                    <EditableImage
                      contentKey="nasz_kanal_hero_mockup"
                      fallbackSrc="https://storage.readdy-site.link/project_files/6b577641-b4ea-4107-bb56-5f8fbbf97e07/a78fdebf-1ca4-456c-82fe-d1ace8668290_compressed_modern-laptop-mockup-with-airpods.webp"
                      alt="Sportowy VIBE — Nasz Kanał YouTube na laptopie"
                      containerClassName="w-full"
                      className="w-full h-auto object-contain transition-all duration-700 ease-out scale-95 brightness-90 group-hover:scale-105 group-hover:brightness-110"
                    />
                  </div>
                  {/* Subtelna poświata pod obrazem po hover */}
                  <div className="absolute -inset-2 -z-10 rounded-3xl bg-primary-400/20 opacity-0 blur-2xl transition-opacity duration-700 group-hover:opacity-100" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Aktualności Kanału */}
        <section className="py-10 md:py-16">
          <div className="mx-auto max-w-[1280px] px-4 md:px-6">
            <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-accent-300/50 bg-accent-50 px-3 py-1 text-xs font-semibold text-accent-600">
                  <i className="ri-megaphone-line"></i>
                  {t('nasz_kanal.news_badge')}
                </span>
                <h2 className="mt-4 font-heading text-2xl md:text-3xl font-bold text-primary-600">
                  <EditableColor contentKey="color_nasz_kanal_news_title" fallbackColor="#14B8A6">
                    <EditableText contentKey="nasz_kanal_news_title" fallback={t('nasz_kanal.news_title')} />
                  </EditableColor>
                </h2>
                <p className="mt-1 text-sm text-foreground-500">
                  {loading ? t('nasz_kanal.loading') : t('nasz_kanal.news_count', { count: channelNews.length })}
                </p>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-14">
                <span className="flex h-12 w-12 mx-auto items-center justify-center rounded-full bg-background-100 text-primary-500 animate-spin">
                  <i className="ri-loader-4-line text-2xl"></i>
                </span>
                <p className="mt-3 text-sm text-foreground-500">{t('nasz_kanal.loading')}</p>
              </div>
            ) : channelNews.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {channelNews.map((item) => (
                  <Link
                    key={item.id}
                    to={`/nasz-kanal/aktualnosc/${item.id}`}
                    className="group flex items-start gap-4 rounded-lg border border-background-200/70 bg-background-50 p-5 transition-all duration-300 hover:border-primary-300/50 hover:shadow-lg hover:shadow-primary-500/5 hover:-translate-y-1 cursor-pointer"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary-50 text-primary-500 transition-colors group-hover:bg-primary-100">
                      <i className={`${item.icon} text-lg`}></i>
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="inline-block rounded-full bg-accent-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent-700">
                          {item.tag}
                        </span>
                        {item.newsDate && (
                          <span className="text-[10px] text-foreground-400">{item.newsDate}</span>
                        )}
                      </div>
                      <h3 className="font-heading text-base font-semibold leading-snug text-primary-600 transition-colors group-hover:text-primary-500">
                        {item.title}
                      </h3>
                      {item.description && (
                        <p className="mt-2 text-sm leading-relaxed text-foreground-500">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-14">
                <span className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-background-200/70 text-foreground-400 mb-4">
                  <i className="ri-megaphone-line text-2xl"></i>
                </span>
                <p className="text-sm text-foreground-500">
                  {t('nasz_kanal.no_news')}
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Channel Info + Stats */}
        <section className="py-14 md:py-20 bg-background-100">
          <div className="mx-auto max-w-[1280px] px-4 md:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="rounded-xl border border-background-200/70 bg-background-50 p-6 md:p-8">
                <span className="inline-flex items-center gap-2 rounded-full border border-primary-300/50 bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-600 mb-4">
                  <i className="ri-youtube-line"></i>
                  {t('nasz_kanal.info_badge')}
                </span>
                <h2 className="font-heading text-2xl md:text-3xl font-bold text-primary-600 tracking-tight">
                  <EditableColor contentKey="color_nasz_kanal_info_title" fallbackColor="#14B8A6">
                    <EditableText contentKey="nasz_kanal_info_title" fallback={t('nasz_kanal.info_title')} />
                  </EditableColor>
                </h2>
                <p className="mt-4 text-sm leading-relaxed text-foreground-600">
                  {t('nasz_kanal.info_desc_1')}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-foreground-600">
                  {t('nasz_kanal.info_desc_2')}
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  <span className="rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-xs font-medium text-primary-600">{t('nasz_kanal.tag_live')}</span>
                  <span className="rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-xs font-medium text-primary-600">{t('nasz_kanal.tag_analysis')}</span>
                  <span className="rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-xs font-medium text-primary-600">{t('nasz_kanal.tag_shorts')}</span>
                  <span className="rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-xs font-medium text-primary-600">{t('nasz_kanal.tag_studio')}</span>
                </div>
              </div>

              <div className="rounded-xl border border-background-200/70 bg-background-50 p-6 md:p-8">
                <span className="inline-flex items-center gap-2 rounded-full border border-accent-300/50 bg-accent-50 px-3 py-1 text-xs font-semibold text-accent-600 mb-4">
                  <i className="ri-bar-chart-line"></i>
                  {t('nasz_kanal.stats_badge')}
                </span>
                <h2 className="font-heading text-2xl md:text-3xl font-bold text-primary-600 tracking-tight">
                  <EditableColor contentKey="color_nasz_kanal_stats_title" fallbackColor="#14B8A6">
                    <EditableText contentKey="nasz_kanal_stats_title" fallback={t('nasz_kanal.stats_title')} />
                  </EditableColor>
                </h2>
                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="rounded-lg border border-background-200/70 bg-background-100 p-4 text-center">
                    <div className="font-heading text-2xl md:text-3xl font-bold text-primary-600">1M+</div>
                    <div className="mt-1 text-xs text-foreground-500">{t('nasz_kanal.stats_views_label')}</div>
                  </div>
                  <div className="rounded-lg border border-background-200/70 bg-background-100 p-4 text-center">
                    <div className="font-heading text-2xl md:text-3xl font-bold text-primary-600">6+</div>
                    <div className="mt-1 text-xs text-foreground-500">{t('nasz_kanal.stats_disciplines_label')}</div>
                  </div>
                  <div className="rounded-lg border border-background-200/70 bg-background-100 p-4 text-center">
                    <div className="font-heading text-2xl md:text-3xl font-bold text-primary-600">1000+</div>
                    <div className="mt-1 text-xs text-foreground-500">{t('nasz_kanal.stats_subs_label')}</div>
                  </div>
                  <div className="rounded-lg border border-background-200/70 bg-background-100 p-4 text-center">
                    <div className="font-heading text-2xl md:text-3xl font-bold text-primary-600">3</div>
                    <div className="mt-1 text-xs text-foreground-500">{t('nasz_kanal.stats_creators_label')}</div>
                  </div>
                </div>
                <p className="mt-4 text-sm text-foreground-500 leading-relaxed">
                  {t('nasz_kanal.stats_desc')}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Formats */}
        <section className="py-14 md:py-20">
          <div className="mx-auto max-w-[1280px] px-4 md:px-6">
            <div className="mb-10 md:mb-14 text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-accent-300/50 bg-accent-50 px-3 py-1 text-xs font-semibold text-accent-600">
                <i className="ri-clapperboard-line"></i>
                {t('nasz_kanal.formats_badge')}
              </span>
              <h2 className="mt-4 font-heading text-3xl md:text-4xl font-bold text-primary-600 tracking-tight">
                <EditableColor contentKey="color_nasz_kanal_formats_title" fallbackColor="#14B8A6">
                  <EditableText contentKey="nasz_kanal_formats_title" fallback={t('nasz_kanal.formats_title')} />
                </EditableColor>
              </h2>
              <p className="mt-2 max-w-lg mx-auto text-sm text-foreground-500">
                {t('nasz_kanal.formats_desc')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="rounded-lg border border-background-200/70 bg-background-50 p-6 transition-all duration-300 hover:border-primary-300/50 hover:shadow-lg hover:shadow-primary-500/5 hover:-translate-y-1">
                <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-50 text-primary-500 mb-4">
                  <i className="ri-live-line text-2xl"></i>
                </span>
                <h3 className="font-heading text-lg font-semibold text-primary-600">{t('nasz_kanal.format_live_title')}</h3>
                <p className="mt-2 text-sm text-foreground-500 leading-relaxed">
                  {t('nasz_kanal.format_live_desc')}
                </p>
              </div>
              <div className="rounded-lg border border-background-200/70 bg-background-50 p-6 transition-all duration-300 hover:border-primary-300/50 hover:shadow-lg hover:shadow-primary-500/5 hover:-translate-y-1">
                <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent-50 text-accent-500 mb-4">
                  <i className="ri-newspaper-line text-2xl"></i>
                </span>
                <h3 className="font-heading text-lg font-semibold text-primary-600">{t('nasz_kanal.format_magazine_title')}</h3>
                <p className="mt-2 text-sm text-foreground-500 leading-relaxed">
                  {t('nasz_kanal.format_magazine_desc')}
                </p>
              </div>
              <div className="rounded-lg border border-background-200/70 bg-background-50 p-6 transition-all duration-300 hover:border-primary-300/50 hover:shadow-lg hover:shadow-primary-500/5 hover:-translate-y-1">
                <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary-50 text-secondary-500 mb-4">
                  <i className="ri-smartphone-line text-2xl"></i>
                </span>
                <h3 className="font-heading text-lg font-semibold text-primary-600">{t('nasz_kanal.format_shorts_title')}</h3>
                <p className="mt-2 text-sm text-foreground-500 leading-relaxed">
                  {t('nasz_kanal.format_shorts_desc')}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-14 md:py-20 bg-background-100">
          <div className="mx-auto max-w-[800px] px-4 md:px-6 text-center">
            <h2 className="font-heading text-2xl md:text-3xl font-bold text-primary-600">
              <EditableColor contentKey="color_nasz_kanal_cta_title" fallbackColor="#14B8A6">
                <EditableText contentKey="nasz_kanal_cta_title" fallback={t('nasz_kanal.cta_title')} />
              </EditableColor>
            </h2>
            <p className="mt-3 text-sm text-foreground-500">
              {t('nasz_kanal.cta_desc')}
            </p>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href="https://www.youtube.com/@Sportowy_Vibe"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-md bg-red-600 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-red-700 whitespace-nowrap cursor-pointer"
              >
                <i className="ri-youtube-fill"></i>
                YouTube
              </a>
              <Link to="/harmonogram-kanalu"
                className="inline-flex items-center gap-2 rounded-md bg-primary-500 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-primary-600 whitespace-nowrap cursor-pointer active:scale-95"
              >
                <i className="ri-calendar-schedule-line"></i>
                {t('nasz_kanal.schedule_link')}
              </Link>
              <Link to="/nasze-filmy"
                className="inline-flex items-center gap-2 rounded-md border border-primary-500/50 px-6 py-3 text-sm font-semibold text-primary-600 transition-all hover:border-primary-500 hover:bg-primary-50/50 whitespace-nowrap cursor-pointer active:scale-95 active:bg-primary-100/50"
              >
                <i className="ri-film-line"></i>
                {t('footer.movies')}
              </Link>
            </div>
          </div>
        </section>
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
              <span className="text-foreground-300 text-xs select-none">|</span>
              <Link to="/regulamin-serwisu" className="text-xs font-medium text-foreground-500 hover:text-primary-600 transition-colors whitespace-nowrap">
                Regulamin Serwisu
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