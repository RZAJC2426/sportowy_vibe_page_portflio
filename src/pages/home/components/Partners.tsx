import { useState, useLayoutEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import EditableText from '@/components/feature/EditableText';
import EditableColor from '@/components/feature/EditableColor';
import EditableImage from '@/components/feature/EditableImage';

gsap.registerPlugin(ScrollTrigger);

const PARTNERS = [
  {
    name: 'Flashscore',
    role: 'Partner Techniczny',
    img: 'https://storage.readdy-site.link/project_files/6b577641-b4ea-4107-bb56-5f8fbbf97e07/fe68955e-3d20-4972-b5bb-d5eb0ff0bec8_m_flashscore.jpg',
    website: 'https://www.flashscore.pl',
  },
  {
    name: 'Skocznia Strachoczanka',
    role: 'Partner Strategiczny',
    img: 'https://storage.readdy-site.link/project_files/6b577641-b4ea-4107-bb56-5f8fbbf97e07/3fee4b0d-3940-4322-bb1e-797f0c377ca5_m_strachoczanka.png',
    website: 'https://www.facebook.com/skoczniastrachoczanka',
  },
  {
    name: 'Klub Golfowy w Jeleniej Górze',
    role: 'Partner Promocyjny',
    img: 'https://storage.readdy-site.link/project_files/6b577641-b4ea-4107-bb56-5f8fbbf97e07/df12863d-0f87-4df8-bb8f-376652f151bf_m_golf_club.png',
    website: 'https://www.facebook.com/golfclubjeleniagora',
  },
  {
    name: 'Fundacja na Maksa',
    role: 'Partner Promocyjny',
    img: 'https://storage.readdy-site.link/project_files/6b577641-b4ea-4107-bb56-5f8fbbf97e07/3d6eb28c-9691-4cbd-a178-57925dba5239_m_fundacja_na_maksa.jpg',
    website: 'https://www.facebook.com/fundacja.na.maksa',
  },
  {
    name: 'Vonsky',
    role: 'Partner Promocyjny',
    img: 'https://storage.readdy-site.link/project_files/6b577641-b4ea-4107-bb56-5f8fbbf97e07/3600bd84-6228-4397-b0a9-084a2199c821_m_vonsky.jpg',
    website: 'https://www.youtube.com/@VonskyTeam',
  },
  {
    name: 'Sportowy Fanatyk',
    role: 'Partner Strategiczny',
    img: 'https://storage.readdy-site.link/project_files/6b577641-b4ea-4107-bb56-5f8fbbf97e07/cef4fcce-43dd-46e9-a7d8-76a1ceddb809_m_sportowy_fanatyk.jpg',
    website: 'https://www.facebook.com/sportowyfanatyk',
  },
];

const INITIAL_SHOW = 3;

export default function Partners() {
  const { t } = useTranslation();
  const [showAll, setShowAll] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const displayed = showAll ? PARTNERS : PARTNERS.slice(0, INITIAL_SHOW);

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
        },
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section id="wspolpraca" ref={sectionRef} className="relative py-14 md:py-20 bg-background-50">
      <div className="mx-auto max-w-[1200px] px-4 md:px-6">
        <div className="mb-10 md:mb-14 text-center">
          <span data-anim className="inline-flex items-center gap-2 rounded-full border border-accent-300/50 bg-accent-50 px-3 py-1 text-xs font-semibold text-accent-600">
            <EditableImage
              contentKey="home_icon_partners"
              fallbackSrc=""
              alt="Ikona"
              loading="lazy"
              className="h-3 w-3 object-contain"
              containerClassName="inline-flex items-center"
            >
              <EditableColor contentKey="home_color_icon_partners" fallbackColor="#0EA5E9" property="color" className="inline-flex">
                <i className="ri-service-line w-4 h-4 flex items-center justify-center"></i>
              </EditableColor>
            </EditableImage>
            <EditableColor contentKey="color_home_partners_badge" fallbackColor="#0EA5E9">
              <EditableText contentKey="home_partners_badge" fallback={t('partners.badge')} />
            </EditableColor>
          </span>
          <h2 data-anim className="mt-4 font-heading text-3xl md:text-4xl font-bold text-foreground-950 tracking-tight">
            <EditableColor contentKey="color_home_partners_title" fallbackColor="#0F172A">
              <EditableText contentKey="home_partners_title" fallback={t('partners.title')} />
            </EditableColor>
          </h2>
          <p data-anim className="mt-3 max-w-xl mx-auto text-sm text-foreground-600">
            <EditableColor contentKey="color_home_partners_desc" fallbackColor="#475569">
              <EditableText contentKey="home_partners_description" fallback={t('partners.description')} as="span" />
            </EditableColor>
          </p>
        </div>

        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {displayed.map((p) => (
            <a
              key={p.name}
              data-anim
              href={p.website}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col items-center gap-4 rounded-xl border border-background-200/80 bg-background-50 p-5 transition-all duration-300 hover:border-primary-300/60 hover:shadow-lg hover:shadow-primary-500/5 hover:-translate-y-1 cursor-pointer"
            >
              <div className="flex h-28 md:h-36 w-full items-center justify-center rounded-lg">
                <EditableImage
                  contentKey={`wspolpraca_img_${p.name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')}`}
                  fallbackSrc={p.img}
                  alt={p.name}
                  className="h-auto w-auto max-h-full max-w-full object-contain"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div className="text-center">
                <p className="font-heading text-sm font-bold text-foreground-900 leading-snug transition-colors group-hover:text-primary-600">
                  {p.name}
                </p>
                <p className="mt-0.5 text-xs font-medium text-foreground-500">{p.role}</p>
              </div>
            </a>
          ))}
        </div>

        {/* Zobacz więcej / Pokaż mniej */}
        <div className="text-center mb-8">
          <button
            type="button"
            onClick={() => setShowAll(!showAll)}
            className="inline-flex items-center gap-2 rounded-md border border-accent-500/40 px-5 py-2.5 text-sm font-semibold text-accent-600 transition-all hover:bg-accent-50 hover:border-accent-500 whitespace-nowrap cursor-pointer"
          >
            {showAll ? (
              <>
                {t('partners.show_less')}
                <EditableImage
                  contentKey="home_icon_partners_show_less"
                  fallbackSrc=""
                  alt="Strzałka"
                  loading="lazy"
                  className="h-3.5 w-3.5 object-contain"
                  containerClassName="inline-flex items-center"
                >
                  <EditableColor contentKey="home_color_icon_partners_show_less" fallbackColor="#0EA5E9" property="color" className="inline-flex">
                    <i className="ri-arrow-up-s-line text-sm"></i>
                  </EditableColor>
                </EditableImage>
              </>
            ) : (
              <>
                {t('partners.show_more')}
                <EditableImage
                  contentKey="home_icon_partners_show_more"
                  fallbackSrc=""
                  alt="Strzałka"
                  loading="lazy"
                  className="h-3.5 w-3.5 object-contain"
                  containerClassName="inline-flex items-center"
                >
                  <EditableColor contentKey="home_color_icon_partners_show_more" fallbackColor="#0EA5E9" property="color" className="inline-flex">
                    <i className="ri-arrow-down-s-line text-sm"></i>
                  </EditableColor>
                </EditableImage>
              </>
            )}
          </button>
        </div>

        <div className="rounded-xl border border-primary-200/70 bg-background-50 p-6 md:p-8 text-center">
          <p className="mb-5 text-base leading-relaxed text-foreground-700">
            <strong className="text-foreground-900">{t('partners.cta_text')}</strong>
          </p>
          <a
            href="/o-nas/wspolpraca"
            className="cursor-pointer inline-flex items-center gap-2 rounded-md bg-primary-500 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-primary-600 hover:shadow-lg hover:shadow-primary-500/20 whitespace-nowrap"
          >
            <EditableImage
              contentKey="home_icon_partners_cta"
              fallbackSrc=""
              alt="Wiadomość"
              loading="lazy"
              className="h-4 w-4 object-contain"
              containerClassName="inline-flex items-center"
            >
              <EditableColor contentKey="home_color_icon_partners_cta" fallbackColor="#FFFFFF" property="color" className="inline-flex">
                <i className="ri-mail-send-line text-base"></i>
              </EditableColor>
            </EditableImage>
            {t('partners.cta_button')}
          </a>
        </div>
      </div>
    </section>
  );
}