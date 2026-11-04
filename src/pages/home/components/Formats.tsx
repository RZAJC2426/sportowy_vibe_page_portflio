import { useLayoutEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import EditableText from '@/components/feature/EditableText';
import EditableHTML from '@/components/feature/EditableHTML';
import EditableColor from '@/components/feature/EditableColor';
import EditableImage from '@/components/feature/EditableImage';
import EditableIcon from '@/components/feature/EditableIcon';

gsap.registerPlugin(ScrollTrigger);

export default function Formats() {
  const { t } = useTranslation();
  const sectionRef = useRef<HTMLElement>(null);

  const FORMATS = [
    {
      icon: 'ri-live-line',
      title: t('formats.live_title'),
      desc: t('formats.live_desc'),
      image: 'https://storage.helloreaddy.io/project_files/6b577641-b4ea-4107-bb56-5f8fbbf97e07/94b44344-3e38-4cd8-8ecc-dfaf6f2cd61f_compressed_kamera.webp',
      badge: t('formats.badge_live'),
      color: 'primary',
    },
    {
      icon: 'ri-flashlight-line',
      title: t('formats.shorts_title'),
      desc: t('formats.shorts_desc'),
      image: 'https://storage.helloreaddy.io/project_files/6b577641-b4ea-4107-bb56-5f8fbbf97e07/c2abd57e-be00-4b10-b50a-2eeca9d1f48a_compressed_telefon.webp',
      badge: t('formats.badge_shorts'),
      color: 'accent',
    },
    {
      icon: 'ri-newspaper-line',
      title: t('formats.posts_title'),
      desc: t('formats.posts_desc'),
      image: 'https://storage.helloreaddy.io/project_files/6b577641-b4ea-4107-bb56-5f8fbbf97e07/21641678-d40c-4065-9634-19da8abdf05a_compressed_laptop.webp',
      badge: t('formats.badge_posts'),
      color: 'secondary',
    },
  ];

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

  return (
    <section ref={sectionRef} id="formats" className="relative py-8 md:py-10 bg-background-100">
      <div className="mx-auto max-w-[1280px] px-4 md:px-6">
        <div className="mb-5 md:mb-6 text-center">
          <span
            data-anim
            className="inline-flex items-center gap-2 rounded-full border border-accent-300/50 bg-accent-50 px-3 py-1 text-xs font-semibold text-accent-600"
          >
            <EditableImage
              contentKey="home_icon_formats"
              fallbackSrc=""
              alt="Ikona"
              loading="lazy"
              className="h-3 w-3 object-contain"
              containerClassName="inline-flex items-center"
            >
              <EditableColor contentKey="home_color_icon_formats" fallbackColor="#0EA5E9" property="color" className="inline-flex">
                <i className="ri-stack-line"></i>
              </EditableColor>
            </EditableImage>
            <EditableColor contentKey="color_home_formats_badge" fallbackColor="#0EA5E9">
              <EditableText contentKey="home_formats_badge" fallback={t('formats.badge')} />
            </EditableColor>
          </span>
          <h2
            data-anim
            className="mt-3 font-heading text-2xl md:text-4xl font-bold text-foreground-950 tracking-tight"
          >
            <EditableColor contentKey="color_home_formats_title" fallbackColor="#0F172A">
              <EditableText contentKey="home_formats_title" fallback={t('formats.title')} />
            </EditableColor>
          </h2>
          <p data-anim className="mt-2 max-w-lg mx-auto text-sm text-foreground-600">
            <EditableColor contentKey="color_home_formats_desc" fallbackColor="#475569">
              <EditableText contentKey="home_formats_description" fallback={t('formats.description')} as="span" />
            </EditableColor>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {FORMATS.map((f) => (
            <div
              key={f.title}
              data-anim
              className="group flex flex-col rounded-lg border border-background-200/70 bg-background-50 overflow-hidden transition-all duration-300 hover:border-primary-300/50 hover:shadow-lg hover:shadow-primary-500/5 hover:-translate-y-1"
            >
              <div className="relative h-44 md:h-48 overflow-hidden">
                <EditableImage
                  contentKey={`formats_img_${f.color}`}
                  fallbackSrc={f.image}
                  alt={f.title}
                  className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                  containerClassName="h-full w-full"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute top-3 left-3">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wider text-white ${f.color === 'primary' ? 'bg-primary-500' : f.color === 'accent' ? 'bg-accent-500' : 'bg-secondary-500'}`}>
                    <EditableIcon contentKey={`formats_badge_icon_${f.color}`} fallbackIcon="ri-record-circle-fill" className="text-[8px]"></EditableIcon>
                    {f.badge}
                  </span>
                </div>
                <span className="absolute bottom-3 left-3 flex h-10 w-10 items-center justify-center rounded-lg bg-background-50/90 backdrop-blur-sm text-foreground-900 shadow-sm">
                  <EditableIcon contentKey={`formats_card_icon_${f.color}`} fallbackIcon={f.icon} className="text-lg"></EditableIcon>
                </span>
              </div>
              <div className="flex flex-col flex-1 p-4">
                <h3 className="font-heading text-base md:text-lg font-semibold text-foreground-900 transition-colors group-hover:text-primary-700">
                  <EditableText contentKey={`formats_title_${f.color}`} fallback={f.title} as="span" />
                </h3>
                <div className="mt-1.5 text-sm leading-relaxed text-foreground-600">
                  <EditableHTML contentKey={`formats_desc_${f.color}`} fallback={f.desc} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}