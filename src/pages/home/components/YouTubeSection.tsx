import { useState, useLayoutEffect, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { invokeEdgeFunction } from '@/lib/supabase';
import { Link } from 'react-router-dom';
import EditableText from '@/components/feature/EditableText';
import EditableColor from '@/components/feature/EditableColor';
import EditableImage from '@/components/feature/EditableImage';

interface Video {
  video_id: string;
  title: string;
  thumbnail_url: string;
  published_at: string;
  description: string;
  views?: number;
  type: 'FILM' | 'SHORTS' | 'LIVE';
}

function detectVideoType(title: string): Video['type'] {
  const lower = title.toLowerCase();
  if (lower.includes('#shorts') || lower.includes('short')) return 'SHORTS';
  if (lower.includes('#live') || lower.includes('live:') || lower.includes('na żywo') || lower.includes('transmisja')) return 'LIVE';
  return 'FILM';
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

export default function YouTubeSection() {
  const { t } = useTranslation();

  const MOCK_VIDEOS: Video[] = [
    { video_id: 'mock-1', title: 'Magazyn „Między skoczniami" — Puchar Świata', thumbnail_url: '', published_at: '2026-06-18T00:00:00Z', description: 'Podsumowanie weekendu ze skoczniami. Analiza formy polskich skoczków.', type: 'FILM' },
    { video_id: 'mock-2', title: 'Analiza transferowa — okno letnie', thumbnail_url: '', published_at: '2026-06-15T00:00:00Z', description: 'Kto zmienia klub? Wszystkie gorące nazwiska i potencjalne przejścia.', type: 'FILM' },
    { video_id: 'mock-3', title: 'Studio Siatkówki — Liga Narodów', thumbnail_url: '', published_at: '2026-06-10T00:00:00Z', description: 'Podsumowanie tygodnia z reprezentacją Polski. Składy, taktyka, wyniki.', type: 'FILM' },
    { video_id: 'mock-4', title: 'Nieznane fakty o Lewandowskim', thumbnail_url: '', published_at: '2026-06-17T00:00:00Z', description: 'Czy wiedziałeś, że...? 60 sekund ciekawostek o legendzie polskiego futbolu.', type: 'SHORTS' },
    { video_id: 'mock-5', title: 'Skoczek, który pobił rekord', thumbnail_url: '', published_at: '2026-06-14T00:00:00Z', description: 'Błyskawiczna dawka wiedzy o najdłuższym skoku w historii.', type: 'SHORTS' },
    { video_id: 'mock-6', title: 'Hokej w 60 sekund', thumbnail_url: '', published_at: '2026-06-12T00:00:00Z', description: 'Podsumowanie dnia z NHL. Wyniki, asysty, gole.', type: 'SHORTS' },
    { video_id: 'mock-7', title: 'Studio meczowe — Liga Mistrzów', thumbnail_url: '', published_at: '2026-06-20T00:00:00Z', description: 'Analiza na żywo przed i po meczu. Twój komentarz liczy się najbardziej.', type: 'LIVE' },
    { video_id: 'mock-8', title: 'Turniej Czterech Skoczni — Innsbruck', thumbnail_url: '', published_at: '2026-01-03T00:00:00Z', description: 'Relacja na żywo z trzeciego konkursu. Emocje prosto z Austrii.', type: 'LIVE' },
    { video_id: 'mock-9', title: 'Relacja live — MŚ w siatkówce', thumbnail_url: '', published_at: '2026-09-15T00:00:00Z', description: 'Wspólne oglądanie z chat. Komentarz, emocje, reakcje.', type: 'LIVE' },
  ];

  const TABS = [
    { id: 'FILM' as const, label: t('youtube.tab_films'), icon: 'ri-youtube-line' },
    { id: 'SHORTS' as const, label: t('youtube.tab_shorts'), icon: 'ri-flashlight-line' },
    { id: 'LIVE' as const, label: t('youtube.tab_live'), icon: 'ri-live-line' },
  ];

  const [activeTab, setActiveTab] = useState<'FILM' | 'SHORTS' | 'LIVE'>('FILM');
  const [videos, setVideos] = useState<Video[]>(MOCK_VIDEOS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const { data, error: fnError } = await invokeEdgeFunction('youtube-rss-fetcher');
        if (fnError) throw fnError;
        if (data?.videos && Array.isArray(data.videos)) {
          const enriched: Video[] = data.videos.map((v: any) => ({
            video_id: v.video_id ?? v.id,
            title: v.title,
            thumbnail_url: v.thumbnail_url,
            published_at: v.published_at,
            description: v.description ?? '',
            views: v.views,
            type: detectVideoType(v.title),
          }));
          setVideos(enriched);
          setError(null);
        } else {
          setVideos(MOCK_VIDEOS);
        }
      } catch (err) {
        console.error('Błąd pobierania filmów:', err);
        setVideos(MOCK_VIDEOS);
        setError(t('youtube.error'));
      } finally {
        setLoading(false);
      }
    };
    fetchVideos();
  }, [t]);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        sectionRef.current?.querySelectorAll('[data-anim]') ?? [],
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: 'power3.out',
          stagger: 0.08,
          scrollTrigger: { trigger: sectionRef.current, start: 'top 80%', once: true },
        }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  const filtered = videos.filter((v) => v.type === activeTab);

  return (
    <section ref={sectionRef} id="youtube" className="relative py-14 md:py-20 bg-background-100">
      <div className="mx-auto max-w-[1280px] px-4 md:px-6">
        <div className="mb-10 md:mb-14 text-center">
          <span
            data-anim
            className="inline-flex items-center gap-2 rounded-full border border-red-300/50 bg-red-50 px-3 py-1 text-xs font-semibold text-red-600"
          >
            <EditableImage
              contentKey="home_icon_youtube"
              fallbackSrc=""
              alt="Ikona"
              loading="lazy"
              className="h-3 w-3 object-contain"
              containerClassName="inline-flex items-center"
            >
              <EditableColor contentKey="home_color_icon_youtube" fallbackColor="#DC2626" property="color" className="inline-flex">
                <i className="ri-youtube-line"></i>
              </EditableColor>
            </EditableImage>
            <EditableColor contentKey="color_home_youtube_badge" fallbackColor="#DC2626">
              <EditableText contentKey="home_youtube_badge" fallback={t('youtube.badge')} />
            </EditableColor>
          </span>
          <h2
            data-anim
            className="mt-4 font-heading text-3xl md:text-4xl font-bold text-foreground-950 tracking-tight"
          >
            <EditableColor contentKey="color_home_youtube_title" fallbackColor="#0F172A">
              <EditableText contentKey="home_youtube_title" fallback={t('youtube.title')} />
            </EditableColor>
          </h2>
          <p data-anim className="mt-2 max-w-lg mx-auto text-sm text-foreground-500">
            <EditableColor contentKey="color_home_youtube_desc" fallbackColor="#64748B">
              <EditableText contentKey="home_youtube_description" fallback={t('youtube.description')} as="span" />
            </EditableColor>
          </p>
        </div>

        {/* Channel header card */}
        <div
          data-anim
          className="mb-8 rounded-xl border border-background-200/70 bg-background-50 p-6 md:p-8 flex flex-col md:flex-row items-center gap-6"
        >
          <div className="flex h-20 w-32 shrink-0 items-center justify-center">
            <EditableImage
              contentKey="youtube_section_logo"
              fallbackSrc="https://storage.readdy-site.link/project_files/6b577641-b4ea-4107-bb56-5f8fbbf97e07/319ec2ab-1af0-46ca-beed-0358e5e16485_sportowy_vibebez-sloganu2.svg"
              alt="Sportowy VIBE"
              className="h-full w-full object-contain"
              width={128}
              height={80}
            />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h3 className="font-heading text-xl font-semibold text-foreground-900">
              <EditableColor contentKey="color_youtube_channel_name" fallbackColor="#0F172A">
                <EditableText contentKey="youtube_channel_name" fallback="@Sportowy_Vibe" />
              </EditableColor>
            </h3>
            <p className="mt-1 text-sm text-foreground-700">
              {t('youtube.channel_desc')}
            </p>
          </div>
          <a
            href="https://www.youtube.com/@Sportowy_Vibe"
            target="_blank"
            rel="noopener noreferrer"
            className="cursor-pointer inline-flex items-center gap-2 rounded-md bg-red-600 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-red-700 whitespace-nowrap"
          >
            <EditableImage
              contentKey="home_icon_youtube_subscribe"
              fallbackSrc=""
              alt="Subskrybuj"
              loading="lazy"
              className="h-4 w-4 object-contain"
              containerClassName="inline-flex items-center"
            >
              <EditableColor contentKey="home_color_icon_youtube_subscribe" fallbackColor="#FFFFFF" property="color" className="inline-flex">
                <i className="ri-youtube-fill text-base"></i>
              </EditableColor>
            </EditableImage>
            {t('youtube.subscribe')}
          </a>
        </div>

        {/* Tabs */}
        <div data-anim className="mb-6 flex flex-wrap justify-center gap-2">
          {TABS.map((tab) => {
            const count = videos.filter((v) => v.type === tab.id).length;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-red-600 text-white'
                    : 'bg-background-200 text-foreground-600 hover:bg-background-300'
                }`}
              >
                <EditableImage
                  contentKey={`home_icon_youtube_tab_${tab.id.toLowerCase()}`}
                  fallbackSrc=""
                  alt={tab.label}
                  loading="lazy"
                  className="h-3.5 w-3.5 object-contain"
                  containerClassName="inline-flex items-center"
                >
                  <EditableColor contentKey={`home_color_icon_youtube_tab_${tab.id.toLowerCase()}`} fallbackColor={isActive ? '#FFFFFF' : '#475569'} property="color" className="inline-flex">
                    <i className={`${tab.icon} text-sm`}></i>
                  </EditableColor>
                </EditableImage>
                {tab.label} {count > 0 && <span className="opacity-80">{count}</span>}
              </button>
            );
          })}
        </div>

        {/* Loading / Error */}
        {loading && (
          <div className="flex justify-center py-10">
            <div className="inline-flex items-center gap-2 text-sm text-foreground-500">
              <i className="ri-loader-4-line animate-spin text-lg"></i>
              {t('youtube.loading')}
            </div>
          </div>
        )}
        {error && !loading && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 text-center">
            {error}
          </div>
        )}

        {/* Cards grid — only 3 newest */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.slice(0, 3).map((item) => (
            <div
              key={item.video_id}
              className="group flex flex-col rounded-lg border border-background-200/70 bg-background-50 overflow-hidden transition-all duration-300 hover:border-red-300/50 hover:shadow-lg hover:shadow-red-500/5 hover:-translate-y-1"
            >
              <div className="relative h-52 md:h-56 overflow-hidden bg-background-200">
                {item.thumbnail_url ? (
                  <img
                    src={item.thumbnail_url}
                    alt={item.title}
                    loading="lazy"
                    decoding="async"
                    width={480}
                    height={360}
                    className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => {
                      const img = e.currentTarget;
                      if (item.video_id && !img.dataset.ytFallback) {
                        img.dataset.ytFallback = '1';
                        img.src = `https://i.ytimg.com/vi/${item.video_id}/hqdefault.jpg`;
                      }
                    }}
                  />
                ) : item.video_id && item.video_id.startsWith('mock-') ? (
                  <div className="flex h-full w-full items-center justify-center bg-background-200">
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-background-300/50 text-foreground-300">
                      <i className="ri-play-circle-line text-3xl"></i>
                    </span>
                  </div>
                ) : (
                  <img
                    src={`https://i.ytimg.com/vi/${item.video_id}/hqdefault.jpg`}
                    alt={item.title}
                    loading="lazy"
                    decoding="async"
                    width={480}
                    height={360}
                    className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                <div className="absolute top-3 left-3">
                  <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wider text-white bg-red-600">
                    <i className="ri-play-circle-fill text-[8px]"></i>
                    {item.type === 'LIVE' ? 'LIVE' : item.type === 'SHORTS' ? t('youtube.badge_short') : t('youtube.badge_film')}
                  </span>
                </div>
                <div className="absolute bottom-3 right-3">
                  <span className="inline-flex items-center gap-1 rounded-md bg-black/70 px-2 py-1 text-[10px] font-medium text-white backdrop-blur-sm">
                    <i className="ri-calendar-line text-[8px]"></i>
                    {formatDate(item.published_at)}
                  </span>
                </div>
              </div>
              <div className="flex flex-col flex-1 p-5">
                <h4 className="font-heading text-base font-semibold text-foreground-900 transition-colors group-hover:text-red-600 leading-snug">
                  {item.title}
                </h4>
                <p className="mt-2 text-sm leading-relaxed text-foreground-700 line-clamp-3">
                  {item.description}
                </p>
                <div className="mt-auto pt-4">
                  <a
                    href={`https://www.youtube.com/watch?v=${item.video_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm font-semibold text-red-600 hover:text-red-700 transition-colors"
                  >
                    {t('youtube.watch')}
                    <i className="ri-arrow-right-line text-sm"></i>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-10">
            <p className="text-sm text-foreground-500">
              {t('youtube.empty')}
            </p>
          </div>
        )}

        {/* See More CTA */}
        {!loading && videos.length > 0 && (
          <div className="mt-12 text-center">
            <Link
              to="/nasze-filmy"
              className="inline-flex items-center gap-2 rounded-md bg-red-600 px-6 py-3.5 text-sm font-semibold text-white transition-all hover:bg-red-700 whitespace-nowrap cursor-pointer"
            >
              <EditableImage
                contentKey="home_icon_youtube_cta_more"
                fallbackSrc=""
                alt="Playlista"
                loading="lazy"
                className="h-4 w-4 object-contain"
                containerClassName="inline-flex items-center"
              >
                <EditableColor contentKey="home_color_icon_youtube_cta_more" fallbackColor="#FFFFFF" property="color" className="inline-flex">
                  <i className="ri-play-list-2-line text-base"></i>
                </EditableColor>
              </EditableImage>
              {t('youtube.see_more_details')}
              <EditableImage
                contentKey="home_icon_youtube_cta_more_arrow"
                fallbackSrc=""
                alt="Strzałka"
                loading="lazy"
                className="h-3.5 w-3.5 object-contain"
                containerClassName="inline-flex items-center"
              >
                <EditableColor contentKey="home_color_icon_youtube_cta_more_arrow" fallbackColor="#FFFFFF" property="color" className="inline-flex">
                  <i className="ri-arrow-right-line text-sm"></i>
                </EditableColor>
              </EditableImage>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}