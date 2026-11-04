import { useLayoutEffect, useRef } from 'react';
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

export default function Timeline() {
  const { t } = useTranslation();
  const sectionRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(sectionRef.current?.querySelectorAll('[data-anim]') ?? [], {
        opacity: 0,
        y: 30,
        duration: 0.9,
        ease: 'power3.out',
        stagger: 0.06,
        scrollTrigger: { trigger: sectionRef.current, start: 'top 80%', once: true },
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="droga" className="relative py-14 md:py-20 bg-background-100">
      <div className="mx-auto max-w-[800px] px-4 md:px-6">
        <div className="mb-10 md:mb-14 text-center">
          <span
            data-anim
            className="inline-flex items-center gap-2 rounded-full border border-accent-300/50 bg-accent-50 px-3 py-1 text-xs font-semibold text-accent-600"
          >
            <EditableImage
              contentKey="home_icon_timeline"
              fallbackSrc=""
              alt="Ikona"
              loading="lazy"
              className="h-3 w-3 object-contain"
              containerClassName="inline-flex items-center"
            >
              <EditableColor contentKey="home_color_icon_timeline" fallbackColor="#0EA5E9" property="color" className="inline-flex">
                <i className="ri-road-map-line"></i>
              </EditableColor>
            </EditableImage>
            <EditableColor contentKey="color_timeline_badge" fallbackColor="#0EA5E9">
              <EditableText contentKey="home_timeline_badge" fallback={t('timeline.badge')} />
            </EditableColor>
          </span>
          <h2
            data-anim
            className="mt-4 font-heading text-3xl md:text-4xl font-bold text-foreground-950 tracking-tight"
          >
            <EditableColor contentKey="color_timeline_title" fallbackColor="#0F172A">
              <EditableText contentKey="home_timeline_title" fallback={t('timeline.title')} />
            </EditableColor>
          </h2>
        </div>

        <div className="relative">
          <div className="absolute left-[19px] top-2 bottom-2 w-px bg-gradient-to-b from-primary-400/60 via-primary-300/30 to-primary-200/10 md:left-1/2 md:-translate-x-px"></div>
          <div className="flex flex-col gap-6">
            {EVENTS.map((event, index) => {
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
      </div>
    </section>
  );
}