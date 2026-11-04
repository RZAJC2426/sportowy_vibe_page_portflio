import { useLayoutEffect, useRef, useState, useCallback, useEffect, useMemo, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useYouTubeStats } from '@/hooks/useYouTubeStats';
import EditableText from '@/components/feature/EditableText';
import EditableColor from '@/components/feature/EditableColor';
import EditableIcon from '@/components/feature/EditableIcon';
import LazySection from '@/components/feature/LazySection';
import EditableImage from '@/components/feature/EditableImage';

const InteractiveMap = lazy(() => import('./InteractiveMap'));

gsap.registerPlugin(ScrollTrigger);

const COUNTRIES = [
  { rank: '#1', name: 'Niemcy', views: '71 516+', pct: 100, width: '100%', highlight: true, left: '51%', top: '31%' },
  { rank: '#2', name: 'Wielka Brytania', views: '30 527+', pct: 43, width: '43%', highlight: false, left: '48%', top: '28%' },
  { rank: '#3', name: 'Stany Zjednoczone', views: '26 564+', pct: 37, width: '37%', highlight: false, left: '23%', top: '39%' },
  { rank: '#4', name: 'Tajlandia', views: '18 325+', pct: 26, width: '26%', highlight: false, left: '73%', top: '45%' },
  { rank: '#5', name: 'Filipiny', views: '16 571+', pct: 23, width: '23%', highlight: false, left: '77%', top: '49%' },
  { rank: '#6', name: 'Holandia', views: '9 941+', pct: 14, width: '14%', highlight: false, left: '49%', top: '29%' },
  { rank: '#7', name: 'Kanada', views: '8 092+', pct: 11, width: '11%', highlight: false, left: '18%', top: '25%' },
  { rank: '#8', name: 'Francja', views: '7 317+', pct: 10, width: '10%', highlight: false, left: '49%', top: '32%' },
  { rank: '#9', name: 'Norwegia', views: '4 700+', pct: 7, width: '7%', highlight: false, left: '50%', top: '24%' },
  { rank: '#10', name: 'Włochy', views: '4 388+', pct: 6, width: '6%', highlight: false, left: '52%', top: '35%' },
];

const INITIAL_SHOW = 5;

function formatNumber(n: number): string {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

export default function Stats() {
  const { t } = useTranslation();
  const ytStats = useYouTubeStats();

  // Dynamic stat numbers from YouTube API with hardcoded fallbacks
  const STAT_NUMBERS = useMemo(() => [
    { numeric: ytStats.viewCount > 0 ? ytStats.viewCount : 1000000, suffix: '+', label: t('stats.stat_1') },
    { numeric: ytStats.subscriberCount > 0 ? ytStats.subscriberCount : 2000, suffix: '+', label: t('stats.stat_2') },
    { numeric: ytStats.videoCount > 0 ? ytStats.videoCount : 8, suffix: '', label: t('stats.stat_3_videos') },
    { numeric: 150000, suffix: '+', label: t('stats.stat_4') },
  ], [ytStats.viewCount, ytStats.subscriberCount, ytStats.videoCount, t]);

  // Refresh timer display
  const [secSinceRefresh, setSecSinceRefresh] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      if (ytStats.fetchedAt) {
        const diff = Math.floor((Date.now() - new Date(ytStats.fetchedAt).getTime()) / 1000);
        setSecSinceRefresh(diff);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [ytStats.fetchedAt]);

  const sectionRef = useRef<HTMLElement>(null);
  const counterRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const barRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [showAll, setShowAll] = useState(false);

  const setCounterRef = useCallback((i: number) => (el: HTMLSpanElement | null) => {
    counterRefs.current[i] = el;
  }, []);

  const setBarRef = useCallback((i: number) => (el: HTMLDivElement | null) => {
    barRefs.current[i] = el;
  }, []);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // --- fade-up animations for other elements ---
      gsap.from(sectionRef.current?.querySelectorAll('[data-anim]') ?? [], {
        opacity: 0,
        y: 30,
        duration: 0.9,
        ease: 'power3.out',
        stagger: 0.06,
        scrollTrigger: { trigger: sectionRef.current, start: 'top 80%', once: true },
      });

      // --- counter animation ---
      const counters = counterRefs.current.filter(Boolean) as HTMLSpanElement[];
      if (counters.length > 0) {
        const targets = STAT_NUMBERS.map((s) => s.numeric);
        const suffixes = STAT_NUMBERS.map((s) => s.suffix);

        const proxy = { v0: 0, v1: 0, v2: 0, v3: 0 };

        gsap.to(proxy, {
          v0: targets[0],
          v1: targets[1],
          v2: targets[2],
          v3: targets[3],
          duration: 2.5,
          ease: 'power2.out',
          scrollTrigger: { trigger: sectionRef.current, start: 'top 80%', once: true },
          onUpdate: () => {
            const vals = [proxy.v0, proxy.v1, proxy.v2, proxy.v3];
            counters.forEach((el, i) => {
              el.textContent = formatNumber(Math.round(vals[i])) + suffixes[i];
            });
          },
        });
      }

      // --- country bars width animation (initially visible ones only) ---
      const bars = barRefs.current.filter(Boolean) as HTMLDivElement[];
      if (bars.length > 0) {
        bars.forEach((bar, i) => {
          const dataIdx = i < COUNTRIES.length ? i : 0;

          gsap.fromTo(
            bar,
            { width: '0%' },
            {
              width: COUNTRIES[dataIdx].width,
              duration: 1.5,
              delay: i * 0.06,
              ease: 'power3.out',
              scrollTrigger: {
                trigger: bar.closest('[data-country-bars]'),
                start: 'top 85%',
                once: true,
              },
            },
          );
        });
      }
    }, sectionRef);
    return () => ctx.revert();
  }, [STAT_NUMBERS]);

  // Animate newly revealed country bars when "Pokaż więcej" is clicked
  useEffect(() => {
    if (!showAll) return;
    const timer = setTimeout(() => {
      const newBars = barRefs.current.slice(INITIAL_SHOW).filter(Boolean) as HTMLDivElement[];
      newBars.forEach((bar, i) => {
        const dataIdx = INITIAL_SHOW + i;
        if (dataIdx >= COUNTRIES.length) return;
        gsap.fromTo(
          bar,
          { width: '0%' },
          {
            width: COUNTRIES[dataIdx].width,
            duration: 1.5,
            delay: i * 0.06,
            ease: 'power3.out',
          },
        );
      });
    }, 50);
    return () => clearTimeout(timer);
  }, [showAll]);

  const displayed = showAll ? COUNTRIES : COUNTRIES.slice(0, INITIAL_SHOW);

  return (
    <section ref={sectionRef} id="stats" className="relative overflow-hidden py-16 md:py-24 bg-background-50">
      <div className="relative z-10 mx-auto max-w-[1200px] px-4 md:px-6">
        <div className="mb-12 text-center">
          <span
            data-anim
            className="inline-flex items-center gap-2 rounded-full border border-primary-300/50 bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-600"
          >
            <EditableIcon contentKey="home_icon_stats" fallbackIcon="ri-global-line" className="text-primary-500" />
            <EditableColor contentKey="color_home_stats_badge" fallbackColor="#14B8A6">
              <EditableText contentKey="home_stats_badge" fallback={t('stats.badge')} />
            </EditableColor>
          </span>
          {ytStats.viewCount > 0 && (
            <span
              data-anim
              className="inline-flex items-center gap-1.5 ml-2 rounded-full bg-accent-100 px-2.5 py-1 text-[11px] font-medium text-accent-700"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-accent-500 animate-pulse"></span>
              Na żywo &middot; odśw. co 60s
            </span>
          )}
          <h2
            data-anim
            className="mt-4 font-heading text-3xl md:text-4xl font-bold text-foreground-950 tracking-tight"
          >
            <EditableColor contentKey="color_home_stats_title" fallbackColor="#0F172A">
              <EditableText contentKey="home_stats_title" fallback={t('stats.title')} />
            </EditableColor>
          </h2>
          <p
            data-anim
            className="mt-3 text-sm text-foreground-500 max-w-xl mx-auto"
          >
            <EditableColor contentKey="color_home_stats_desc" fallbackColor="#64748B">
              <EditableText contentKey="home_stats_description" fallback={t('stats.description')} as="span" />
            </EditableColor>
          </p>
        </div>

        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 mb-16">
          {STAT_NUMBERS.map((stat, i) => (
            <div
              key={stat.label}
              data-anim
              className="flex flex-col items-center text-center"
            >
              <span
                ref={setCounterRef(i)}
                className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-primary-500"
              >
                {formatNumber(stat.numeric)}{stat.suffix}
              </span>
              <p className="mt-2 max-w-[200px] text-sm leading-snug text-foreground-500">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

      {/* Interactive Map — lazy loaded when scrolled into view */}
      <LazySection minHeight="450px">
        <Suspense fallback={null}>
          <InteractiveMap />
        </Suspense>
      </LazySection>

      {/* Country bars — live progress */}
        <div data-country-bars className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {displayed.map((c, idx) => (
            <div
              key={c.name}
              data-anim
              className="rounded-lg bg-background-100 px-3 py-3 border border-background-200/50"
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-5 text-center text-xs font-bold text-foreground-400">{c.rank}</span>
                  <span className="text-sm font-semibold whitespace-nowrap text-foreground-700">
                    {c.name}
                  </span>
                  {c.highlight && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-1.5 py-0.5 text-[10px] font-bold text-primary-600">
                      <i className="ri-fire-line text-[9px]"></i>
                      {t('stats.top_badge')}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-bold text-foreground-900 whitespace-nowrap">{c.views}</span>
                  <span className="font-heading text-xs font-bold text-primary-500">{c.pct}%</span>
                </div>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-background-200">
                <div
                  ref={setBarRef(idx)}
                  data-bar={c.pct}
                  className="h-full rounded-full bg-gradient-to-r from-primary-600 to-primary-400"
                  style={{ width: '0%' }}
                ></div>
              </div>
            </div>
          ))}
        </div>

        {/* Zobacz więcej / Pokaż mniej */}
        <div className="text-center mt-6">
          <button
            type="button"
            onClick={() => setShowAll(!showAll)}
            className="inline-flex items-center gap-2 rounded-md border border-primary-600 px-5 py-2.5 text-sm font-semibold text-primary-700 transition-all hover:bg-primary-50 hover:border-primary-500 whitespace-nowrap cursor-pointer"
          >
            {showAll ? (
              <>
                {t('stats.show_less')}
                <EditableIcon contentKey="home_icon_stats_show_less" fallbackIcon="ri-arrow-up-s-line" className="text-sm" />
              </>
            ) : (
              <>
                {t('stats.show_more')}
                <EditableIcon contentKey="home_icon_stats_show_more" fallbackIcon="ri-arrow-down-s-line" className="text-sm" />
              </>
            )}
          </button>
        </div>
      </div>
    </section>
  );
}