import { useLayoutEffect, useRef, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { fetchFeaturedDisciplines, type Discipline } from '@/data/disciplines';
import EditableImage from '@/components/feature/EditableImage';
import EditableText from '@/components/feature/EditableText';
import EditableColor from '@/components/feature/EditableColor';

export default function BasketballSection() {
  const { t } = useTranslation();
  const sectionRef = useRef<HTMLElement>(null);
  const [sports, setSports] = useState<Discipline[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const d = await fetchFeaturedDisciplines(6);
      if (!cancelled) setSports(d);
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
    <section ref={sectionRef} className="relative py-14 md:py-20 bg-background-50">
      <div className="mx-auto max-w-[1280px] px-4 md:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center">
          {/* Left: Image */}
          <div data-anim className="relative rounded-xl overflow-hidden">
            <EditableImage
              contentKey="basketball_img_court"
              fallbackSrc="https://storage.readdy-site.link/project_files/6b577641-b4ea-4107-bb56-5f8fbbf97e07/54d2f0f0-c050-4cfd-874b-3dbfb0c34c88_Gemini_Generated_Image_elmj04elmj04elmj.png"
              alt="Boisko do koszykówki"
              className="w-full h-64 md:h-96 object-cover object-top rounded-xl"
              loading="lazy"
              decoding="async"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent rounded-xl" />
          </div>

          {/* Right: Content */}
          <div>
            <span
              data-anim
              className="inline-flex items-center gap-2 rounded-full border border-accent-300/50 bg-accent-50 px-3 py-1 text-xs font-semibold text-accent-600"
            >
              <EditableImage
              contentKey="home_icon_basketball"
              fallbackSrc=""
              alt="Ikona"
              loading="lazy"
              className="h-3 w-3 object-contain"
              containerClassName="inline-flex items-center"
            >
              <EditableColor contentKey="home_color_icon_basketball" fallbackColor="#0EA5E9" property="color" className="inline-flex">
                <i className="ri-basketball-line"></i>
              </EditableColor>
            </EditableImage>
              <EditableColor contentKey="color_basketball_badge" fallbackColor="#0EA5E9">
                <EditableText contentKey="home_basketball_badge" fallback={t('basketball.badge')} />
              </EditableColor>
            </span>
            <h2
              data-anim
              className="mt-4 font-heading text-3xl md:text-4xl font-bold text-foreground-950 tracking-tight"
            >
              <EditableColor contentKey="color_basketball_title" fallbackColor="#0F172A">
                <EditableText contentKey="home_basketball_title" fallback={t('basketball.title')} />
              </EditableColor>
            </h2>
            <p data-anim className="mt-3 text-sm leading-relaxed text-foreground-500 max-w-lg">
              <EditableColor contentKey="color_basketball_desc" fallbackColor="#475569">
                <EditableText contentKey="home_basketball_desc" fallback={t('basketball.description')} as="span" />
              </EditableColor>
            </p>

            {/* Sports icons grid */}
            <div data-anim className="mt-8 grid grid-cols-3 sm:grid-cols-6 gap-5">
              {sports.map((sport) => (
                <div key={sport.slug} className="flex flex-col items-center gap-2">
                  <div
                    className="flex h-14 w-14 md:h-16 md:w-16 items-center justify-center rounded-full bg-primary-500"
                  >
                    {sport.iconSvg ? (
                      <img
                        src={sport.iconSvg}
                        alt={sport.name}
                        className="h-8 w-8 md:h-9 md:w-9 object-contain"
                      />
                    ) : (
                      <i className={`${sport.icon} text-white text-xl`}></i>
                    )}
                  </div>
                  <span className="text-xs font-medium text-foreground-600 text-center leading-tight">
                    {sport.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}