import { useLayoutEffect, useRef, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  fetchFeaturedDisciplines,
  fetchAllChannelNews,
  type Discipline,
  type ChannelNewsItem,
} from '@/data/disciplines';
import EditableText from '@/components/feature/EditableText';
import EditableColor from '@/components/feature/EditableColor';
import EditableImage from '@/components/feature/EditableImage';

export default function News() {
  const { t } = useTranslation();
  const sectionRef = useRef<HTMLElement>(null);
  const [hoveredSport, setHoveredSport] = useState<string | null>(null);
  const [sports, setSports] = useState<Discipline[]>([]);
  const [channelNews, setChannelNews] = useState<ChannelNewsItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [d, n] = await Promise.all([
        fetchFeaturedDisciplines(5),
        fetchAllChannelNews(),
      ]);
      if (!cancelled) {
        setSports(d);
        setChannelNews(n);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

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
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="aktualnosci" className="relative py-14 md:py-20 bg-background-50">
      <div className="mx-auto max-w-[1280px] px-4 md:px-6">
        <div className="mb-10 md:mb-14 text-center">
          <span
            data-anim
            className="inline-flex items-center gap-2 rounded-full border border-primary-300/50 bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-600"
          >
            <EditableImage
              contentKey="home_icon_news"
              fallbackSrc=""
              alt="Ikona"
              loading="lazy"
              className="h-3 w-3 object-contain"
              containerClassName="inline-flex items-center"
            >
              <EditableColor contentKey="home_color_icon_news" fallbackColor="#2563eb" property="color" className="inline-flex">
                <i className="ri-flashlight-line"></i>
              </EditableColor>
            </EditableImage>
            <EditableColor contentKey="color_news_badge" fallbackColor="#2563eb">
              <EditableText contentKey="home_news_badge" fallback={t('news.badge')} />
            </EditableColor>
          </span>
          <h2
            data-anim
            className="mt-4 font-heading text-3xl md:text-4xl font-bold text-foreground-950 tracking-tight"
          >
            <EditableColor contentKey="color_news_title" fallbackColor="#0F172A">
              <EditableText contentKey="home_news_title" fallback={t('news.title')} />
            </EditableColor>
          </h2>
          <p data-anim className="mt-2 max-w-lg mx-auto text-sm text-foreground-500">
            <EditableColor contentKey="color_news_desc" fallbackColor="#475569">
              <EditableText contentKey="home_news_desc" fallback={t('news.description')} as="span" />
            </EditableColor>
          </p>
        </div>

        {/* Sports disciplines — hover expands */}
        <div className="mb-14">
          <h3 data-anim className="mb-5 font-heading text-lg font-semibold text-foreground-800 flex items-center gap-2">
            <EditableImage
              contentKey="home_icon_news_sports"
              fallbackSrc=""
              alt="Ikona"
              loading="lazy"
              className="h-4 w-4 object-contain"
              containerClassName="inline-flex items-center"
            >
              <EditableColor contentKey="home_color_icon_news_sports" fallbackColor="#14B8A6" property="color" className="inline-flex">
                <span className="flex h-7 w-7 items-center justify-center rounded bg-primary-50">
                  <i className="ri-football-line text-sm"></i>
                </span>
              </EditableColor>
            </EditableImage>
            {t('news.sports_heading')}
          </h3>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
            {sports.map((sport) => (
              <div
                key={sport.slug}
                data-anim
                className="group relative overflow-hidden rounded-lg border border-background-200/70 bg-background-100 cursor-pointer transition-all duration-300 hover:border-primary-300/50 hover:shadow-lg hover:shadow-primary-500/5"
                onMouseEnter={() => setHoveredSport(sport.name)}
                onMouseLeave={() => setHoveredSport(null)}
              >
                <div className="relative h-40 md:h-48 overflow-hidden">
                  <EditableImage
                    contentKey={`news_discipline_img_${sport.slug}`}
                    fallbackSrc={sport.cardImage || ''}
                    alt={sport.name}
                    loading="lazy"
                    className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <span className="absolute top-3 left-3 flex h-8 w-8 items-center justify-center rounded-full bg-primary-500 text-white">
                    {sport.iconSvg ? (
                      <img src={sport.iconSvg} alt={sport.name} className="h-5 w-5 object-contain" />
                    ) : (
                      <i className={`${sport.icon} text-sm`}></i>
                    )}
                  </span>
                  <span className="absolute bottom-3 left-3 text-base font-heading font-bold text-white">
                    {sport.name}
                  </span>
                </div>
                <div
                  className={`overflow-hidden transition-all duration-300 ease-out ${
                    hoveredSport === sport.name ? 'max-h-32 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="p-4 bg-background-50">
                    <p className="text-sm text-foreground-600 leading-relaxed">{sport.description}</p>
                    <a
                      href="/aktualnosci"
                      className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary-500 hover:text-primary-600"
                    >
                      {t('news.more')}
                      <i className="ri-arrow-right-line text-xs"></i>
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Channel news */}
        <div>
          <h3 data-anim className="mb-5 font-heading text-lg font-semibold text-foreground-800 flex items-center gap-2">
            <EditableImage
              contentKey="home_icon_news_channel"
              fallbackSrc=""
              alt="Ikona"
              loading="lazy"
              className="h-4 w-4 object-contain"
              containerClassName="inline-flex items-center"
            >
              <EditableColor contentKey="home_color_icon_news_channel" fallbackColor="#0EA5E9" property="color" className="inline-flex">
                <span className="flex h-7 w-7 items-center justify-center rounded bg-accent-50">
                  <i className="ri-megaphone-line text-sm"></i>
                </span>
              </EditableColor>
            </EditableImage>
            {t('news.channel_heading')}
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {channelNews.slice(0, 3).map((item) => (
              <div
                key={item.id}
                data-anim
                className="group flex items-start gap-4 rounded-lg border border-background-200/70 bg-background-100 p-5 transition-all duration-300 hover:border-primary-300/50 hover:shadow-lg hover:shadow-primary-500/5 hover:-translate-y-1"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary-50 text-primary-500 transition-colors group-hover:bg-primary-100">
                  <i className={`${item.icon} text-lg`}></i>
                </span>
                <div>
                  <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-yellow-600 mb-1">
                    {item.tag}
                  </span>
                  <h4 className="font-heading text-base font-semibold leading-snug text-foreground-900 transition-colors group-hover:text-primary-700">
                    {item.title}
                  </h4>
                  <p className="mt-1 text-sm leading-relaxed text-foreground-700">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div data-anim className="mt-10 text-center">
          <a
            href="/aktualnosci"
            className="inline-flex items-center gap-2 rounded-md bg-primary-500 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-primary-600 hover:shadow-lg hover:shadow-primary-500/20 whitespace-nowrap cursor-pointer"
          >
            {t('news.see_all')}
            <EditableImage
              contentKey="home_icon_news_cta_all"
              fallbackSrc=""
              alt="Strzałka"
              loading="lazy"
              className="h-3.5 w-3.5 object-contain"
              containerClassName="inline-flex items-center"
            >
              <EditableColor contentKey="home_color_icon_news_cta_all" fallbackColor="#FFFFFF" property="color" className="inline-flex">
                <i className="ri-arrow-right-line text-sm"></i>
              </EditableColor>
            </EditableImage>
          </a>
        </div>
      </div>
    </section>
  );
}