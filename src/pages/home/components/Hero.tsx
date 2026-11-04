import { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { getContentByKey, updateContent } from '@/data/siteContent';
import EditableText from '@/components/feature/EditableText';
import EditableColor from '@/components/feature/EditableColor';
import EditableImage from '@/components/feature/EditableImage';

const HeroAdminModal = lazy(() => import('./HeroAdminModal'));

const DEFAULT_VIDEO_URL =
  'https://storage.readdy-site.link/project_files/6b577641-b4ea-4107-bb56-5f8fbbf97e07/bc57f15c-d12a-4042-a069-769e68655ec4_sekcja_hero-skompresowanych-konwerter-online-1.mp4';

const POSTER_URL =
  'https://storage.helloreaddy.io/project_files/6b577641-b4ea-4107-bb56-5f8fbbf97e07/e4a6ca95-ba7d-4b56-a878-75016301a6e0_compressed_klatka.webp';

function isVideoUrl(url: string): boolean {
  return /\.(mp4|webm|ogg)(\?|$)/i.test(url);
}

export default function Hero() {
  const { t } = useTranslation();
  const { isAdmin } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);

  const [bgUrl, setBgUrl] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [shouldLoadVideo, setShouldLoadVideo] = useState(false);

  // Only load video on non-mobile (saves data & CPU on mobile)
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

  useEffect(() => {
    let cancelled = false;
    getContentByKey('home_hero_background_video').then((url) => {
      if (cancelled) return;
      setBgUrl(url || null);
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (isMobile) return;
    const id = setTimeout(() => setShouldLoadVideo(true), 2000);
    return () => clearTimeout(id);
  }, [isMobile]);

  const displayUrl = bgUrl || DEFAULT_VIDEO_URL;
  const displayIsVideo = isVideoUrl(displayUrl);

  useEffect(() => {
    setVideoReady(false);
  }, [displayUrl]);

  useEffect(() => {
    if (!displayIsVideo || !shouldLoadVideo) return;
    const v = videoRef.current;
    if (!v) return;
    v.muted = true;
    v.playsInline = true;
    v.play().catch(() => {});
  }, [displayUrl, displayIsVideo, shouldLoadVideo]);

  const openModal = useCallback(() => setModalOpen(true), []);
  const closeModal = useCallback(() => setModalOpen(false), []);

  const handleSaved = useCallback((url: string) => {
    setBgUrl(url);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2000);
  }, []);

  const handleReset = useCallback(() => {
    setBgUrl(null);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2000);
  }, []);

  return (
    <section
      id="hero"
      className="relative flex min-h-[580px] md:min-h-[680px] items-center justify-center overflow-hidden"
    >
      {/* Desktop background: poster image + optional video + gradient overlays */}
      <div className="absolute inset-0 hidden md:block">
        <img
          src={POSTER_URL}
          alt=""
          width="1920"
          height="1080"
          className="absolute inset-0 h-full w-full object-cover object-top"
          loading="eager"
          fetchPriority="high"
          decoding="async"
          onError={() => console.error('[Hero] Poster failed to load:', POSTER_URL)}
        />

        {displayIsVideo && shouldLoadVideo && (
          <video
            ref={videoRef}
            key={displayUrl}
            autoPlay
            muted
            loop
            playsInline
            preload="none"
            poster={POSTER_URL}
            onPlaying={() => setVideoReady(true)}
            className={`absolute inset-0 h-full w-full object-cover object-top transition-opacity duration-1000 ${videoReady ? 'opacity-100' : 'opacity-0'}`}
          >
            <source src={displayUrl} type="video/mp4" />
          </video>
        )}

        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/50" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />
      </div>

      {/* Mobile background: lightweight CSS gradient — zero image download, instant paint */}
      <div className="absolute inset-0 md:hidden bg-gradient-to-b from-gray-900 via-gray-800 to-gray-950">
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/60" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />
      </div>

      {isAdmin && (
        <>
          <button
            type="button"
            onClick={openModal}
            className="absolute top-3 right-3 z-30 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm opacity-0 hover:opacity-100 hover:bg-white/30 transition-all duration-200 hover:scale-110"
            title="Zmień tło hero"
          >
            <i className="ri-image-edit-line text-base"></i>
          </button>
          <div className="absolute inset-0 z-20 pointer-events-none opacity-0 hover:opacity-100 transition-opacity duration-300">
            <div className="absolute inset-0 border-2 border-dashed border-accent-400/60 rounded-lg m-2" />
          </div>
        </>
      )}

      {savedFlash && (
        <div className="fixed top-6 left-1/2 z-[110] -translate-x-1/2 flex items-center gap-1.5 rounded-full bg-green-500 px-4 py-2 text-sm font-bold text-white shadow-lg animate-pulse pointer-events-none whitespace-nowrap">
          <i className="ri-check-line"></i>
          Tło zapisane!
        </div>
      )}

      <div className="relative z-10 mx-auto flex w-full max-w-[900px] flex-col items-center px-4 md:px-6 text-center">
        <div className="mb-4 hero-animate-init animate-hero-fade" style={{ animationDelay: '0.1s' }}>
          <div className="inline-block overflow-hidden rounded-lg px-4 py-2">
            <EditableImage
              contentKey="site_logo_hero"
              fallbackSrc="https://storage.readdy-site.link/project_files/6b577641-b4ea-4107-bb56-5f8fbbf97e07/5f809f16-726f-4e78-9150-591a36aa9ee5_sportowy_vibeslogan_white.svg"
              alt="Sportowy VIBE — Energia Sportu Każdego Dnia"
              className="h-20 md:h-28 w-[300px] md:w-[420px] object-contain transition-transform duration-300 ease-out hover:scale-110"
              fetchPriority="high"
              width={420}
              height={112}
            />
          </div>
        </div>

        <div className="mb-6 mt-4 hero-animate-init animate-hero-fade" style={{ animationDelay: '0.2s' }}>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-white">
            <EditableImage
              contentKey="home_icon_hero"
              fallbackSrc=""
              alt="Badge"
              loading="lazy"
              className="h-3 w-3 object-contain"
              containerClassName="inline-flex items-center"
              width={12}
              height={12}
            >
              <EditableColor contentKey="home_color_icon_hero" fallbackColor="#FFFFFF" property="color" className="inline-flex">
                <i className="ri-live-line text-xs"></i>
              </EditableColor>
            </EditableImage>
            <EditableColor contentKey="color_home_hero_badge" fallbackColor="#FFFFFF">
              <EditableText contentKey="home_hero_badge" fallback={t('hero.badge')} />
            </EditableColor>
          </span>
        </div>

        <h1 className="font-heading text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-white leading-[0.95] hero-animate-init animate-hero-slide-up" style={{ animationDelay: '0.25s' }}>
          <EditableColor contentKey="color_home_hero_headline_1" fallbackColor="#FFFFFF">
            <EditableText contentKey="home_hero_headline_1" fallback={t('hero.headline_1')} shadowKey="shadow_home_hero_h1_1" shadowFallback="0 3px 14px rgba(0,0,0,0.55), 0 1px 4px rgba(0,0,0,0.4)" />
          </EditableColor>
          <br />
          <span className="text-primary-500">
            <EditableColor contentKey="color_home_hero_headline_2" fallbackColor="#14B8A6">
              <EditableText contentKey="home_hero_headline_2" fallback={t('hero.headline_2')} shadowKey="shadow_home_hero_h1_2" shadowFallback="0 3px 14px rgba(0,0,0,0.55), 0 1px 4px rgba(0,0,0,0.4)" />
            </EditableColor>
          </span>
        </h1>

        <p className="mt-6 max-w-[680px] text-base md:text-lg leading-relaxed text-white/90 font-body font-light hero-animate-init animate-hero-slide-up" style={{ animationDelay: '0.35s' }}>
          <EditableColor contentKey="color_home_hero_desc" fallbackColor="rgba(255,255,255,0.9)">
            <EditableText contentKey="home_hero_description" fallback={t('hero.description')} as="span" shadowKey="shadow_home_hero_p" shadowFallback="0 2px 8px rgba(0,0,0,0.45), 0 1px 3px rgba(0,0,0,0.3)" />
          </EditableColor>
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center gap-3 hero-animate-init animate-hero-slide-up" style={{ animationDelay: '0.45s' }}>
          <a
            className="cursor-pointer inline-flex items-center gap-2 rounded-md bg-primary-500 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-primary-600 hover:shadow-lg hover:shadow-primary-500/20 whitespace-nowrap"
            href="/aktualnosci"
          >
            <EditableImage
              contentKey="home_icon_hero_cta_news"
              fallbackSrc=""
              alt="Ikona aktualności"
              loading="lazy"
              className="h-4 w-4 object-contain"
              containerClassName="inline-flex items-center"
              width={16}
              height={16}
            >
              <EditableColor contentKey="home_color_icon_hero_cta_news" fallbackColor="#FFFFFF" property="color" className="inline-flex">
                <i className="ri-flashlight-line text-base"></i>
              </EditableColor>
            </EditableImage>
            <EditableText contentKey="home_hero_cta_news" fallback={t('hero.cta_news')} />
          </a>
          <a
            className="cursor-pointer inline-flex items-center gap-2 rounded-md border border-white/40 bg-white/15 px-6 py-3 text-sm font-semibold text-white transition-all hover:border-white/60 hover:bg-white/25 whitespace-nowrap"
            href="#o-nas"
          >
            <EditableImage
              contentKey="home_icon_hero_cta_community"
              fallbackSrc=""
              alt="Ikona społeczności"
              loading="lazy"
              className="h-4 w-4 object-contain"
              containerClassName="inline-flex items-center"
              width={16}
              height={16}
            >
              <EditableColor contentKey="home_color_icon_hero_cta_community" fallbackColor="#FFFFFF" property="color" className="inline-flex">
                <i className="ri-group-line text-base"></i>
              </EditableColor>
            </EditableImage>
            <EditableText contentKey="home_hero_cta_community" fallback={t('hero.cta_community')} />
          </a>
        </div>
      </div>

      {modalOpen && (
        <Suspense fallback={null}>
          <HeroAdminModal
            open={modalOpen}
            onClose={closeModal}
            displayUrl={displayUrl}
            displayIsVideo={displayIsVideo}
            bgUrl={bgUrl}
            onSaved={handleSaved}
            onReset={handleReset}
          />
        </Suspense>
      )}
    </section>
  );
}