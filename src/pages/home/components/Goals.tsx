import { useLayoutEffect, useRef, useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { invokeEdgeFunction } from '@/lib/supabase';
import EditableText from '@/components/feature/EditableText';
import EditableColor from '@/components/feature/EditableColor';
import EditableIcon from '@/components/feature/EditableIcon';
import EditableImage from '@/components/feature/EditableImage';

gsap.registerPlugin(ScrollTrigger);

const GOAL_SUBS_10K = 10000;
const GOAL_VIEWS_10M = 10000000;
const GOAL_SILVER_100K = 100000;

// Ostatnie znane wartości sprzed usunięcia kanału — pokazywane gdy YouTube API nie odpowiada,
// żeby paski nie wyglądały na zepsute (zamrożone na 0%) tylko na "ostatni znany stan".
const FALLBACK_SUBS = 2700;
const FALLBACK_VIEWS = 1500000;

function calcPct(current: number, goal: number): number {
  if (current <= 0 || goal <= 0) return 0;
  return Math.min(Math.round((current / goal) * 100), 100);
}

export default function Goals() {
  const { t } = useTranslation();
  const sectionRef = useRef<HTMLElement>(null);
  const [subs, setSubs] = useState<number | null>(null);
  const [views, setViews] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isFallback, setIsFallback] = useState(false);

  const useFallback = useCallback((reason: string) => {
    console.error('[Goals] YouTube stats fetch failed:', reason);
    setSubs(FALLBACK_SUBS);
    setViews(FALLBACK_VIEWS);
    setIsFallback(true);
    setErrorMsg(null);
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const { data, error: fnError } = await invokeEdgeFunction('youtube-channel-stats', {
        body: {},
      });

      if (fnError) {
        useFallback(fnError.message || 'nieznany błąd połączenia');
        return;
      }

      if (data?.error) {
        useFallback(data.error);
        return;
      }

      if (typeof data?.subscriberCount === 'number') {
        setSubs(data.subscriberCount);
        setViews(data.viewCount ?? null);
        setErrorMsg(null);
        setIsFallback(false);
      } else {
        useFallback('brak danych subskrybentów w odpowiedzi');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'nieznany';
      useFallback(msg);
    } finally {
      setLoading(false);
    }
  }, [useFallback]);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  const currentSubs = subs ?? 0;
  const currentViews = views ?? 0;

  const subs10kPct = subs !== null ? calcPct(currentSubs, GOAL_SUBS_10K) : 0;
  const views10mPct = views !== null ? calcPct(currentViews, GOAL_VIEWS_10M) : 0;
  const silver100kPct = subs !== null ? calcPct(currentSubs, GOAL_SILVER_100K) : 0;

  const formatNum = (n: number): string => n.toLocaleString('pl-PL');

  const GOALS = [
    {
      label: t('goals.goal_10k'),
      pct: subs10kPct,
      current: currentSubs,
      target: GOAL_SUBS_10K,
      metric: t('goals.subscribers'),
      icon: 'ri-user-add-line',
    },
    {
      label: t('goals.goal_10m'),
      pct: views10mPct,
      current: currentViews,
      target: GOAL_VIEWS_10M,
      metric: t('goals.views'),
      icon: 'ri-eye-line',
    },
    {
      label: t('goals.goal_100k'),
      pct: silver100kPct,
      current: currentSubs,
      target: GOAL_SILVER_100K,
      metric: t('goals.subscribers'),
      icon: 'ri-medal-line',
    },
  ];

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(sectionRef.current?.querySelectorAll('[data-anim]') ?? [], {
        opacity: 0,
        y: 30,
        duration: 0.9,
        ease: 'power3.out',
        stagger: 0.08,
        scrollTrigger: { trigger: sectionRef.current, start: 'top 80%', once: true },
      });

      const bars = sectionRef.current?.querySelectorAll('[data-bar]') ?? [];
      bars.forEach((bar) => {
        const width = (bar as HTMLElement).dataset.bar;
        gsap.fromTo(
          bar,
          { width: '0%' },
          {
            width: `${width}%`,
            duration: 1.5,
            ease: 'power3.out',
            scrollTrigger: { trigger: sectionRef.current, start: 'top 70%', once: true },
          },
        );
      });
    }, sectionRef);
    return () => ctx.revert();
  }, [subs, views, t]);

  return (
    <section ref={sectionRef} id="cele" className="relative py-10 md:py-14 bg-background-100">
      <div className="mx-auto max-w-[800px] px-4 md:px-6">
        <div className="mb-6 md:mb-8 text-center">
          <span
            data-anim
            className="inline-flex items-center gap-2 rounded-full border border-primary-300/50 bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-600"
          >
            <EditableIcon contentKey="home_icon_goals" fallbackIcon="ri-flag-line" className="text-primary-500" />
            <EditableColor contentKey="color_home_goals_badge" fallbackColor="#14B8A6">
              <EditableText contentKey="home_goals_badge" fallback={t('goals.badge')} />
            </EditableColor>
          </span>
          <h2
            data-anim
            className="mt-4 font-heading text-3xl md:text-4xl font-bold text-foreground-950 tracking-tight"
          >
            <EditableColor contentKey="color_home_goals_title" fallbackColor="#0F172A">
              <EditableText contentKey="home_goals_title" fallback={t('goals.title')} />
            </EditableColor>
          </h2>
          <p data-anim className="mt-2 text-sm text-foreground-500">
            {t('goals.subtitle')}
            {loading && (
              <span className="ml-2 inline-flex items-center gap-1 text-xs text-foreground-400">
                <i className="ri-loader-4-line animate-spin"></i>
                {t('goals.loading')}
              </span>
            )}
            {!loading && subs !== null && !isFallback && (
              <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-primary-50 px-2 py-0.5 text-xs font-semibold text-primary-600">
                <i className="ri-user-fill text-[10px]"></i>
                {formatNum(currentSubs)} {t('goals.subscribers')}
                <span className="ml-1 text-[10px] text-primary-400">● {t('goals.live')}</span>
              </span>
            )}
            {!loading && isFallback && (
              <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-600">
                <i className="ri-time-line text-[10px]"></i>
                {formatNum(currentSubs)} {t('goals.subscribers')}
                <span className="ml-1 text-[10px] text-amber-500">· ostatnia znana wartość</span>
              </span>
            )}
            {!loading && errorMsg && (
              <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs text-red-500">
                <i className="ri-error-warning-line text-[10px]"></i>
                {t('goals.offline')}
              </span>
            )}
          </p>
        </div>

        <div className="space-y-6 rounded-lg border border-background-200/70 bg-background-50 p-6 md:p-8">
          {GOALS.map((g) => (
            <div key={g.label} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground-700 flex items-center gap-2">
                  <EditableIcon contentKey={`home_icon_goals_${g.icon.replace('ri-', '').replace(/-/g, '_')}`} fallbackIcon={g.icon} className="text-primary-500 text-sm" />
                  {g.label}
                  {subs !== null && (
                    <span className="ml-2 text-[11px] text-primary-500 font-normal">
                      {formatNum(g.current)} / {formatNum(g.target)} {g.metric}
                    </span>
                  )}
                </span>
                <span className="font-heading text-sm font-bold text-primary-500">{g.pct}%</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-background-200">
                <div
                  data-bar={g.pct}
                  className="h-full rounded-full bg-gradient-to-r from-primary-600 to-primary-400"
                  style={{ width: '0%' }}
                ></div>
              </div>
            </div>
          ))}
        </div>

        {!loading && subs !== null && (
          <p data-anim className="mt-4 text-center text-[11px] text-foreground-400">
            {t('goals.footer')}
            {isFallback ? (
              <span> · dane z ostatniej dostępnej aktualizacji</span>
            ) : (
              <span> · {t('goals.last_update')} {new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}</span>
            )}
          </p>
        )}
      </div>
    </section>
  );
}