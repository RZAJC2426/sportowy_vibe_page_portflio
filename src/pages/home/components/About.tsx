import { useLayoutEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import EditableText from '@/components/feature/EditableText';
import EditableColor from '@/components/feature/EditableColor';
import EditableImage from '@/components/feature/EditableImage';

gsap.registerPlugin(ScrollTrigger);

const EVENTS = [
  { date: 'Sierpień 2025', title: 'Kryzys, który nas zjednoczył', desc: 'Upadek poprzedniego projektu. Moment, który zmienił wszystko i zapoczątkował nową drogę.', icon: 'ri-alert-line' },
  { date: 'Wrzesień 2025', title: 'Próba na Twitchu', desc: 'Zrozumienie, że to nie miejsce dla naszych ambicji. Potrzebowaliśmy własnej przestrzeni.', icon: 'ri-twitch-line' },
  { date: 'Listopad 2025', title: 'Narodził się „Sportowy VIBE"', desc: 'Rebranding awaryjnego kanału. Wracają dawni fani. Nowa nazwa, nowa energia, nowa misja.', icon: 'ri-rocket-line' },
  { date: 'Grudzień 2025', title: 'Pęka granica 100 subskrybentów', desc: 'Pierwszy kamień milowy. Społeczność zaczyna rosnąć organicznie.', icon: 'ri-bar-chart-line' },
  { date: 'Styczeń 2026', title: 'Ewolucja techniczna', desc: 'Paski newsowe, nowe widżety, błyskawiczny rozwój infrastruktury. Podnosimy jakość.', icon: 'ri-settings-3-line' },
  { date: 'Marzec 2026', title: 'Dołącza Dawid Franek', desc: 'Uruchamiamy monetyzację po przekroczeniu 1000 subskrypcji. Zespół rośnie w siłę.', icon: 'ri-user-add-line' },
  { date: 'Kwiecień 2026', title: 'Flashscore zostaje partnerem', desc: 'Pół miliona wyświetleń. Pierwszy poważny partner technologiczny dołącza do projektu.', icon: 'ri-hand-heart-line' },
  { date: 'Maj 2026', title: 'Historyczny MILION odsłon', desc: 'Bariera, o której marzyliśmy, staje się rzeczywistością. Milion wyświetleń na liczniku.', icon: 'ri-trophy-line' },
  { date: 'Czerwiec 2026', title: 'Najlepsze dopiero przed nami!', desc: 'Nowe formaty, nowe cele i jeszcze większe ambicje. To dopiero początek drogi na szczyt.', icon: 'ri-star-line' },
];

type Subsection = 'tworcy' | 'historia';

export default function About() {
  const { t } = useTranslation();
  const sectionRef = useRef<HTMLElement>(null);
  const navigate = useNavigate();
  const [activeSub, setActiveSub] = useState<Subsection>('tworcy');
  const [hoveredSub, setHoveredSub] = useState<Subsection | null>(null);

  const SUBSECTIONS = [
    { id: 'tworcy' as const, label: t('about.tab_creators'), icon: 'ri-team-line', href: '/o-nas/tworcy' },
    { id: 'historia' as const, label: t('about.tab_history'), icon: 'ri-road-map-line', href: '/o-nas/historia' },
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
  }, [activeSub]);

  return (
    <section ref={sectionRef} id="o-nas" className="relative py-14 md:py-20 bg-background-50">
      <div className="mx-auto max-w-[1280px] px-4 md:px-6">
        <div className="mb-10 md:mb-14 text-center">
          <span
            data-anim
            className="inline-flex items-center gap-2 rounded-full border border-primary-300/50 bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-600"
          >
            <EditableImage
              contentKey="home_icon_about"
              fallbackSrc=""
              alt="Ikona"
              loading="lazy"
              className="h-3 w-3 object-contain"
              containerClassName="inline-flex items-center"
            >
              <EditableColor contentKey="home_color_icon_about" fallbackColor="#14B8A6" property="color" className="inline-flex">
                <i className="ri-team-line"></i>
              </EditableColor>
            </EditableImage>
            <EditableColor contentKey="color_home_about_badge" fallbackColor="#14B8A6">
              <EditableText contentKey="home_about_badge" fallback={t('about.badge')} />
            </EditableColor>
          </span>
          <h2
            data-anim
            className="mt-4 font-heading text-3xl md:text-5xl font-bold text-foreground-950 tracking-tight"
          >
            <EditableColor contentKey="color_home_about_title" fallbackColor="#0F172A">
              <EditableText contentKey="home_about_title" fallback={t('about.title')} />
            </EditableColor>
          </h2>
          <p
            data-anim
            className="mx-auto mt-4 max-w-[680px] text-base leading-relaxed text-foreground-600"
          >
            <EditableColor contentKey="color_home_about_desc" fallbackColor="#475569">
              <EditableText contentKey="home_about_description" fallback={t('about.description')} as="span" />
            </EditableColor>
          </p>
        </div>

        {/* Subsection tabs — switching inline content */}
        <div data-anim className="mb-10 flex flex-wrap justify-center gap-2">
          {SUBSECTIONS.map((sub) => (
            <button
              key={sub.id}
              type="button"
              onClick={() => setActiveSub(sub.id)}
              onMouseEnter={() => setHoveredSub(sub.id)}
              onMouseLeave={() => setHoveredSub(null)}
              className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-300 whitespace-nowrap cursor-pointer ${
                activeSub === sub.id
                  ? 'bg-primary-500 text-white shadow-md shadow-primary-500/20'
                  : 'bg-background-200 text-foreground-600 hover:bg-background-300'
              } ${hoveredSub === sub.id && activeSub !== sub.id ? 'scale-105' : ''}`}
            >
              <EditableImage
                contentKey={`home_icon_about_tab_${sub.id}`}
                fallbackSrc=""
                alt={sub.label}
                loading="lazy"
                className="h-3.5 w-3.5 object-contain"
                containerClassName={`inline-flex items-center transition-transform duration-300 ${hoveredSub === sub.id ? 'rotate-12' : ''}`}
              >
                <EditableColor contentKey={`home_color_icon_about_tab_${sub.id}`} fallbackColor={activeSub === sub.id ? '#FFFFFF' : '#475569'} property="color" className="inline-flex">
                  <i className={`${sub.icon} text-sm`}></i>
                </EditableColor>
              </EditableImage>
              {sub.label}
            </button>
          ))}
        </div>

        {/* Twórcy subsection — compact cards + zobacz więcej */}
        {activeSub === 'tworcy' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 place-items-center">
              {/* Michał Card */}
              <div
                data-anim
                className="group flex flex-col rounded-xl border border-background-200/70 bg-background-50 overflow-hidden transition-all duration-300 hover:border-primary-300/50 hover:shadow-xl hover:shadow-primary-500/5 hover:-translate-y-1 max-w-[340px] w-full"
              >
                <div className="relative aspect-[3/4] w-full overflow-hidden">
                  <EditableImage
                    contentKey="tworcy_img_michal"
                    fallbackSrc="https://public.readdy.ai/ai/img_res/edited_b9c2f8286a8bf99ac0f5de15682a10fe_0087523c.jpg"
                    alt="Michał - Sportowy Vibe"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    style={{ objectPosition: '50% 15%' }}
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary-500 px-3 py-1 text-[10px] font-bold tracking-wider text-white">
                      <EditableImage
                        contentKey="home_icon_about_michal_badge"
                        fallbackSrc=""
                        alt="Mikrofon"
                        loading="lazy"
                        className="h-2.5 w-2.5 object-contain"
                        containerClassName="inline-flex items-center"
                      >
                        <EditableColor contentKey="home_color_icon_about_michal_badge" fallbackColor="#FFFFFF" property="color" className="inline-flex">
                          <i className="ri-mic-line text-[10px]"></i>
                        </EditableColor>
                      </EditableImage>
                      {t('about.michal_badge')}
                    </span>
                    <h3 className="mt-2 font-heading text-xl md:text-2xl font-bold text-white">
                      <EditableColor contentKey="color_about_michal_name" fallbackColor="#FFFFFF">
                        <EditableText contentKey="about_michal_name" fallback="Michał" />
                      </EditableColor>
                    </h3>
                  </div>
                </div>
              </div>

              {/* Robert Card */}
              <div
                data-anim
                className="group flex flex-col rounded-xl border border-background-200/70 bg-background-50 overflow-hidden transition-all duration-300 hover:border-accent-300/50 hover:shadow-xl hover:shadow-accent-500/5 hover:-translate-y-1 max-w-[340px] w-full"
              >
                <div className="relative aspect-[3/4] w-full overflow-hidden">
                  <EditableImage
                    contentKey="tworcy_img_robert"
                    fallbackSrc="https://storage.readdy-site.link/project_files/6b577641-b4ea-4107-bb56-5f8fbbf97e07/efec535f-40d7-4a6a-bb74-5936c4495621_compressed_wmremove-transformed.webp"
                    alt="Robert - Sportowy Vibe"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    style={{ objectPosition: '50% 15%' }}
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <span className="inline-flex items-center gap-1 rounded-full bg-accent-500 px-3 py-1 text-[10px] font-bold tracking-wider text-white">
                      <EditableImage
                        contentKey="home_icon_about_robert_badge"
                        fallbackSrc=""
                        alt="Terminal"
                        loading="lazy"
                        className="h-2.5 w-2.5 object-contain"
                        containerClassName="inline-flex items-center"
                      >
                        <EditableColor contentKey="home_color_icon_about_robert_badge" fallbackColor="#FFFFFF" property="color" className="inline-flex">
                          <i className="ri-terminal-box-line text-[10px]"></i>
                        </EditableColor>
                      </EditableImage>
                      {t('about.robert_badge')}
                    </span>
                    <h3 className="mt-2 font-heading text-xl md:text-2xl font-bold text-white">
                      <EditableColor contentKey="color_about_robert_name" fallbackColor="#FFFFFF">
                        <EditableText contentKey="about_robert_name" fallback="Robert" />
                      </EditableColor>
                    </h3>
                  </div>
                </div>
              </div>
            </div>

            {/* Zobacz więcej → link do pełnej podstrony */}
            <div data-anim className="text-center mt-4">
              <button
                type="button"
                onClick={() => navigate('/o-nas/tworcy')}
                className="inline-flex items-center gap-2 rounded-md border border-primary-600 px-5 py-2.5 text-sm font-semibold text-primary-700 transition-all hover:bg-primary-50 hover:border-primary-500 whitespace-nowrap cursor-pointer"
              >
                {t('about.see_creators')}
                <EditableImage
                  contentKey="home_icon_about_cta_tworcy"
                  fallbackSrc=""
                  alt="Strzałka"
                  loading="lazy"
                  className="h-3.5 w-3.5 object-contain"
                  containerClassName="inline-flex items-center"
                >
                  <EditableColor contentKey="home_color_icon_about_cta_tworcy" fallbackColor="#14B8A6" property="color" className="inline-flex">
                    <i className="ri-arrow-right-line text-sm"></i>
                  </EditableColor>
                </EditableImage>
              </button>
            </div>
          </div>
        )}

        {/* Historia subsection — partial timeline + zobacz więcej */}
        {activeSub === 'historia' && (
          <div className="max-w-[800px] mx-auto">
            <div className="relative">
              <div className="absolute left-[19px] top-2 bottom-2 w-px bg-gradient-to-b from-primary-400/60 via-primary-300/30 to-primary-200/10 md:left-1/2 md:-translate-x-px"></div>
              <div className="flex flex-col gap-6">
                {EVENTS.slice(0, 4).map((event, index) => {
                  const isLeft = index % 2 === 0;
                  return (
                    <div
                      key={event.date}
                      data-anim
                      className={`relative flex flex-col ${isLeft ? 'md:flex-row' : 'md:flex-row-reverse'}`}
                    >
                      <div className="absolute left-[9px] top-1 z-10 flex h-[22px] w-[22px] items-center justify-center rounded-full border-2 border-background-100 bg-primary-500 md:left-1/2 md:-translate-x-1/2">
                        <i className={`${event.icon} text-[10px] text-white`}></i>
                      </div>
                      <div className={`pl-12 md:w-1/2 ${isLeft ? 'md:pl-0 md:pr-10 md:text-right' : 'md:pl-0 md:pl-10 md:text-left'}`}>
                        <div className="rounded-lg border border-background-200/70 bg-background-50 p-5 transition-all duration-300 hover:border-primary-300/50 hover:shadow-lg hover:shadow-primary-500/5 hover:-translate-y-1">
                          <span className="inline-block text-xs font-bold uppercase tracking-wider text-primary-500">
                            {event.date}
                          </span>
                          <h3 className="mt-1 font-heading text-base font-semibold text-foreground-900">
                            {event.title}
                          </h3>
                          <p className="mt-1.5 text-sm leading-relaxed text-foreground-500">
                            {event.desc}
                          </p>
                        </div>
                      </div>
                      <div className="hidden md:block md:w-1/2"></div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Zobacz więcej → link do pełnej podstrony */}
            <div data-anim className="text-center mt-8">
              <button
                type="button"
                onClick={() => navigate('/o-nas/historia')}
                className="inline-flex items-center gap-2 rounded-md border border-primary-600 px-5 py-2.5 text-sm font-semibold text-primary-700 transition-all hover:bg-primary-50 hover:border-primary-500 whitespace-nowrap cursor-pointer"
              >
                {t('about.see_history')}
                <EditableImage
                  contentKey="home_icon_about_cta_historia"
                  fallbackSrc=""
                  alt="Strzałka"
                  loading="lazy"
                  className="h-3.5 w-3.5 object-contain"
                  containerClassName="inline-flex items-center"
                >
                  <EditableColor contentKey="home_color_icon_about_cta_historia" fallbackColor="#14B8A6" property="color" className="inline-flex">
                    <i className="ri-arrow-right-line text-sm"></i>
                  </EditableColor>
                </EditableImage>
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}