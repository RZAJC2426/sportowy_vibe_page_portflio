import { useLayoutEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import EditableText from '@/components/feature/EditableText';
import EditableColor from '@/components/feature/EditableColor';
import EditableImage from '@/components/feature/EditableImage';
import EditableIcon from '@/components/feature/EditableIcon';
import Certificate3D from '@/components/feature/Certificate3D';

gsap.registerPlugin(ScrollTrigger);

const CERT_SVG_URL = 'https://storage.readdy-site.link/project_files/6b577641-b4ea-4107-bb56-5f8fbbf97e07/2b55db67-77b9-4e27-9f52-71dae827bcde_Certyfikat_Sport_Bez_Barier_Logos_Final.svg';

export default function Certyfikacja() {
  const { t } = useTranslation();
  const sectionRef = useRef<HTMLElement>(null);

  const INFOGRAFIKI = [
    {
      icon: 'ri-global-line',
      title: t('certification.info_1_title'),
      desc: t('certification.info_1_desc'),
    },
    {
      icon: 'ri-funds-line',
      title: t('certification.info_2_title'),
      desc: t('certification.info_2_desc'),
    },
    {
      icon: 'ri-verified-badge-line',
      title: t('certification.info_3_title'),
      desc: t('certification.info_3_desc'),
    },
  ];

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(sectionRef.current?.querySelectorAll('[data-anim]') ?? [], {
        opacity: 0,
        y: 40,
        duration: 1,
        ease: 'power3.out',
        stagger: 0.1,
        scrollTrigger: { trigger: sectionRef.current, start: 'top 78%', once: true },
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="certyfikacja" className="relative overflow-hidden bg-foreground-950">
      {/* Subtle geometric background pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, oklch(var(--primary-500)) 1px, transparent 0)',
            backgroundSize: '48px 48px',
          }}
        />
      </div>

      {/* Top accent glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[2px] bg-gradient-to-r from-transparent via-primary-500/40 to-transparent" />

      <div className="relative mx-auto max-w-[1280px] px-4 md:px-6 py-14 md:py-20">
        {/* Section badge */}
        <div className="mb-10 md:mb-14 text-center">
          <span
            data-anim
            className="inline-flex items-center gap-2 rounded-full border border-primary-500/30 bg-primary-500/10 px-4 py-1.5 text-xs font-semibold text-primary-400 tracking-wide uppercase"
          >
            <EditableImage
              contentKey="home_icon_certyfikacja"
              fallbackSrc=""
              alt="Ikona"
              loading="lazy"
              className="h-3 w-3 object-contain"
              containerClassName="inline-flex items-center"
            >
              <EditableColor contentKey="home_color_icon_certyfikacja" fallbackColor="#34D399" property="color" className="inline-flex">
                <i className="ri-medal-line"></i>
              </EditableColor>
            </EditableImage>
            <EditableColor contentKey="color_home_certyfikacja_badge" fallbackColor="#34D399">
              <EditableText contentKey="home_certyfikacja_badge" fallback={t('certification.badge')} />
            </EditableColor>
          </span>
          <h2
            data-anim
            className="mt-5 font-heading text-3xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight max-w-[700px] mx-auto leading-[1.05]"
          >
            <EditableColor contentKey="color_home_certyfikacja_title" fallbackColor="#FFFFFF">
              <EditableText contentKey="home_certyfikacja_title" fallback={t('certification.title')} />
            </EditableColor>
          </h2>
          <div
            data-anim
            className="mx-auto mt-6 max-w-[620px] text-base leading-relaxed text-foreground-300"
          >
            <EditableColor contentKey="color_home_certyfikacja_desc" fallbackColor="#94A3B8">
              <p className="mb-3 font-medium text-foreground-200">
                <EditableText contentKey="home_certyfikacja_desc_intro" fallback="Odbierz oficjalny Certyfikat Dostępności i wyróżnij swój obiekt na tle konkurencji:">
                  Odbierz oficjalny Certyfikat Dostępności i wyróżnij swój obiekt na tle konkurencji:
                </EditableText>
              </p>
              <ul className="space-y-2 text-left">
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 shrink-0"></span>
                  <EditableText contentKey="home_certyfikacja_desc_item_1" fallback="Wyrównany dostęp – pełna otwartość dla osób z niepełnosprawnościami.">
                    Wyrównany dostęp – pełna otwartość dla osób z niepełnosprawnościami.
                  </EditableText>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 shrink-0"></span>
                  <EditableText contentKey="home_certyfikacja_desc_item_2" fallback="Międzynarodowy prestiż – budowanie zaufania wśród zagranicznych partnerów.">
                    Międzynarodowy prestiż – budowanie zaufania wśród zagranicznych partnerów.
                  </EditableText>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 shrink-0"></span>
                  <EditableText contentKey="home_certyfikacja_desc_item_3" fallback="Lepszy wizerunek – potwierdzenie najwyższych standardów obsługi i infrastruktury.">
                    Lepszy wizerunek – potwierdzenie najwyższych standardów obsługi i infrastruktury.
                  </EditableText>
                </li>
              </ul>
            </EditableColor>
          </div>
        </div>

        {/* MAIN SPLIT-SCREEN LAYOUT */}
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">
          {/* LEFT: Stadium Image */}
          <div data-anim className="w-full lg:w-[48%] shrink-0">
            <div className="relative rounded-xl overflow-hidden border border-foreground-800/60 group">
              <div className="aspect-[4/3] relative">
                <EditableImage
                  contentKey="certyfikacja_img_stadium"
                  fallbackSrc=""
                  alt="Nowoczesny stadion z dedykowaną strefą dostępności dla kibiców z niepełnosprawnościami"
                  className="absolute inset-0 w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
                {/* Gradient overlay for depth */}
                <div className="absolute inset-0 bg-gradient-to-r from-foreground-950/30 via-transparent to-foreground-950/20" />
              </div>
              {/* Bottom tag overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-foreground-950/90 via-foreground-950/50 to-transparent p-5 md:p-6">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-500/20 border border-primary-500/30">
                    <i className="ri-eye-line text-primary-400 text-lg"></i>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white leading-tight">
                      <EditableText
                        contentKey="home_certyfikacja_stadium_caption"
                        fallback={t('certification.stadium_caption')}
                        shadowKey="shadow_certyfikacja_stadium_caption"
                      />
                    </p>
                    <p className="text-xs text-foreground-400 mt-0.5">
                      <EditableText
                        contentKey="home_certyfikacja_stadium_sub"
                        fallback={t('certification.stadium_sub')}
                        shadowKey="shadow_certyfikacja_stadium_sub"
                      />
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Content Panel */}
          <div data-anim className="w-full lg:w-[52%] flex flex-col gap-6">
            {/* Certificate 3D + Smartphone Mockups Row */}
            <div className="grid grid-cols-2 gap-4 md:gap-5">
              {/* Certificate 3D */}
              <div className="rounded-xl border border-primary-500/20 bg-gradient-to-br from-foreground-900 to-foreground-950 p-3 md:p-4 relative overflow-hidden group hover:border-primary-500/40 transition-all duration-500">
                <Certificate3D
                  imageSrc={CERT_SVG_URL}
                  alt="Certyfikat Obiekt Dostępny — Sport Bez Barier"
                  contentKey="home_cert_certificate"
                  className="py-2"
                  cardClassName="max-w-full border-primary-500/30"
                />
              </div>

              {/* Smartphone Google Maps Mockup */}
              <div className="rounded-xl border border-foreground-800/60 bg-gradient-to-br from-foreground-900 to-foreground-950 p-4 md:p-5 relative overflow-hidden group hover:border-primary-500/40 transition-all duration-500">
                <div className="flex flex-col items-center">
                  {/* Phone frame */}
                  <div className="relative w-[72px] md:w-[90px] h-[120px] md:h-[150px] rounded-[14px] md:rounded-[18px] border-2 border-foreground-700 bg-foreground-900 overflow-hidden">
                    {/* Status bar */}
                    <div className="h-4 md:h-5 bg-foreground-800 flex items-center justify-between px-2 md:px-3">
                      <span className="text-[5px] md:text-[6px] text-foreground-500 font-medium">9:41</span>
                      <div className="flex gap-0.5">
                        <div className="w-1 h-1 rounded-full bg-foreground-500" />
                        <div className="w-1 h-1 rounded-full bg-foreground-500" />
                        <div className="w-1 h-1 rounded-full bg-foreground-500" />
                      </div>
                    </div>
                    {/* Maps interface */}
                    <div className="relative flex-1 bg-emerald-900/40">
                      {/* Map grid lines */}
                      <div className="absolute inset-0 opacity-20">
                        <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-primary-400" />
                        <div className="absolute left-1/3 top-0 bottom-0 w-[1px] bg-primary-400" />
                      </div>
                      {/* Stadium pin */}
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full">
                        <div className="flex flex-col items-center">
                          <div className="flex h-5 w-5 md:h-6 md:w-6 items-center justify-center rounded-full bg-primary-500 shadow-lg shadow-primary-500/30">
                            <i className="ri-map-pin-fill text-white text-[8px] md:text-[10px]"></i>
                          </div>
                          <div className="w-[2px] h-2 md:h-3 bg-primary-500/50" />
                          <div className="w-2 h-2 md:w-3 md:h-3 rounded-full border border-primary-400/60 bg-primary-500/20" />
                        </div>
                      </div>
                      {/* Pulse ring */}
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full w-8 h-8 md:w-10 md:h-10 rounded-full border border-primary-500/30 animate-ping" style={{ animationDuration: '2.5s' }} />
                      {/* Bottom label */}
                      <div className="absolute bottom-2 left-0 right-0 flex justify-center">
                        <div className="bg-foreground-950/90 rounded-md px-2 md:px-3 py-0.5 md:py-1 border border-foreground-700/50">
                          <p className="text-[6px] md:text-[7px] text-primary-400 font-semibold whitespace-nowrap">
                            {t('certification.map_pin_label')}
                          </p>
                        </div>
                      </div>
                    </div>
                    {/* Home indicator */}
                    <div className="h-1.5 md:h-2 bg-foreground-900 flex justify-center items-center">
                      <div className="w-6 md:w-8 h-0.5 md:h-1 rounded-full bg-foreground-600" />
                    </div>
                  </div>
                  <p className="mt-2 text-[10px] md:text-xs text-foreground-400 text-center leading-tight">
                    {t('certification.map_subtitle')}
                  </p>
                </div>
              </div>
            </div>

            {/* INFOGRAPHICS - 3 icons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
              {INFOGRAFIKI.map((item, idx) => (
                <div
                  key={item.title}
                  className="group flex sm:flex-col items-start sm:items-start gap-3 sm:gap-4 rounded-xl border border-foreground-800/50 bg-foreground-900/60 p-4 sm:p-5 transition-all duration-300 hover:border-primary-500/30 hover:bg-foreground-900/80"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-500/10 border border-primary-500/20 group-hover:bg-primary-500/15 group-hover:border-primary-500/30 transition-colors">
                    <EditableIcon
                      contentKey={`home_icon_certyfikacja_info_${idx + 1}`}
                      fallbackIcon={item.icon}
                      className="text-primary-400 text-lg"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-white leading-snug break-words">
                      <EditableColor contentKey={`color_home_certyfikacja_info_${idx + 1}_title`} fallbackColor="#FFFFFF">
                        {item.title}
                      </EditableColor>
                    </h3>
                    <p className="mt-1.5 text-xs text-foreground-400 leading-relaxed">
                      <EditableColor contentKey={`color_home_certyfikacja_info_${idx + 1}_desc`} fallbackColor="#94A3B8">
                        {item.desc}
                      </EditableColor>
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA Button */}
            <Link
              to="/certyfikacja"
              className="cursor-pointer group relative inline-flex w-full items-center justify-center gap-3 rounded-xl bg-primary-500 px-6 py-4 text-sm md:text-base font-bold text-foreground-950 transition-all duration-300 hover:bg-primary-400 hover:shadow-xl hover:shadow-primary-500/25 hover:-translate-y-0.5"
            >
              <span className="relative z-10 text-center leading-tight">{t('certification.cta')}</span>
              <span className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-foreground-950/20 group-hover:translate-x-0.5 transition-transform">
                <EditableImage
                  contentKey="home_icon_certyfikacja_cta"
                  fallbackSrc=""
                  alt="Strzałka"
                  loading="lazy"
                  className="h-3.5 w-3.5 object-contain"
                  containerClassName="inline-flex items-center"
                >
                  <EditableColor contentKey="home_color_icon_certyfikacja_cta" fallbackColor="#0F172A" property="color" className="inline-flex">
                    <i className="ri-arrow-right-line text-sm"></i>
                  </EditableColor>
                </EditableImage>
              </span>
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[400px] h-[2px] bg-gradient-to-r from-transparent via-primary-500/30 to-transparent" />
    </section>
  );
}