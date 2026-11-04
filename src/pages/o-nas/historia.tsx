import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import TopBar from '@/pages/home/components/TopBar';
import Navbar from '@/pages/home/components/Navbar';
import EditableText from '@/components/feature/EditableText';
import EditableColor from '@/components/feature/EditableColor';
import EditableImage from '@/components/feature/EditableImage';
import Breadcrumbs from '@/components/feature/Breadcrumbs';
import { usePageVisit } from '@/hooks/useLikes';

const EVENT_ICONS = [
  'ri-alert-line',
  'ri-twitch-line',
  'ri-rocket-line',
  'ri-bar-chart-line',
  'ri-settings-3-line',
  'ri-user-add-line',
  'ri-hand-heart-line',
  'ri-trophy-line',
  'ri-star-line',
];

export default function HistoriaPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  usePageVisit('/o-nas/historia');

  const EVENTS = [
    { dateKey: 'historia.event_1_date', titleKey: 'historia.event_1_title', descKey: 'historia.event_1_desc' },
    { dateKey: 'historia.event_2_date', titleKey: 'historia.event_2_title', descKey: 'historia.event_2_desc' },
    { dateKey: 'historia.event_3_date', titleKey: 'historia.event_3_title', descKey: 'historia.event_3_desc' },
    { dateKey: 'historia.event_4_date', titleKey: 'historia.event_4_title', descKey: 'historia.event_4_desc' },
    { dateKey: 'historia.event_5_date', titleKey: 'historia.event_5_title', descKey: 'historia.event_5_desc' },
    { dateKey: 'historia.event_6_date', titleKey: 'historia.event_6_title', descKey: 'historia.event_6_desc' },
    { dateKey: 'historia.event_7_date', titleKey: 'historia.event_7_title', descKey: 'historia.event_7_desc' },
    { dateKey: 'historia.event_8_date', titleKey: 'historia.event_8_title', descKey: 'historia.event_8_desc' },
    { dateKey: 'historia.event_9_date', titleKey: 'historia.event_9_title', descKey: 'historia.event_9_desc' },
  ];

  return (
    <div className="min-h-screen bg-background-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'Historia Kanału — Droga Sportowego Vibe | Kalendarium',
            description: 'Poznaj historię kanału Sportowy Vibe — od pierwszych transmisji po miliony wyświetleń. Kalendarium najważniejszych wydarzeń i kamieni milowych.',
          }),
        }}
      />
      <TopBar />
      <Navbar showBackButton />

      <Breadcrumbs sticky />

      <main>
        {/* Hero */}
        <section className="relative py-16 md:py-24 overflow-hidden">
          {/* Hero background image */}
          <div className="absolute inset-0">
            <EditableImage
              contentKey="historia_hero_img"
              fallbackSrc=""
              alt=""
              className="h-full w-full object-cover object-top"
              containerClassName="h-full w-full"
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/15 to-background-100 pointer-events-none" />
          </div>
          <div className="relative mx-auto max-w-[900px] px-4 md:px-6 text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary-300/50 bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-600 mb-4">
              <EditableImage contentKey="historia_icon_hero" fallbackSrc="" alt="" className="h-3.5 w-3.5 object-contain">
                <i className="ri-road-map-line"></i>
              </EditableImage>
              <EditableText contentKey="historia_hero_badge" fallback={t('historia.hero_badge')} />
            </span>
            <h1 className="font-heading text-3xl md:text-5xl font-bold text-foreground-950 tracking-tight">
              <EditableColor contentKey="color_historia_hero_title" fallbackColor="#0F172A">
                <EditableText contentKey="historia_hero_title" fallback={t('historia.hero_title')} shadowKey="shadow_historia_hero_h1" shadowFallback="0 2px 10px rgba(0,0,0,0.45)" />
              </EditableColor>
            </h1>
            <p className="mt-4 max-w-xl mx-auto text-base text-foreground-600">
              <EditableColor contentKey="color_historia_hero_desc" fallbackColor="#475569">
                <EditableText contentKey="historia_hero_desc" fallback={t('historia.hero_desc')} as="span" shadowKey="shadow_historia_hero_p" shadowFallback="0 2px 8px rgba(0,0,0,0.32)" />
              </EditableColor>
            </p>
            <div className="mt-6 flex justify-center gap-4">
              <Link to="/o-nas/tworcy" className="inline-flex items-center gap-2 rounded-full border border-foreground-300 px-5 py-2.5 text-sm font-semibold text-foreground-700 transition-all hover:bg-background-200 whitespace-nowrap cursor-pointer active:bg-primary-100/50">
                <EditableImage contentKey="historia_icon_tab_creators" fallbackSrc="" alt="" className="h-4 w-4 object-contain">
                  <i className="ri-team-line text-sm"></i>
                </EditableImage>
                {t('historia.tab_creators')}
              </Link>
              <span className="inline-flex items-center gap-2 rounded-full bg-primary-500 px-5 py-2.5 text-sm font-semibold text-white whitespace-nowrap cursor-default">
                <EditableImage contentKey="historia_icon_tab_history" fallbackSrc="" alt="" className="h-4 w-4 object-contain">
                  <i className="ri-road-map-line text-sm"></i>
                </EditableImage>
                {t('historia.tab_history')}
              </span>
            </div>
          </div>
        </section>

        {/* Timeline */}
        <section className="py-14 md:py-20">
          <div className="mx-auto max-w-[800px] px-4 md:px-6">
            <div className="relative">
              <div className="absolute left-[19px] top-2 bottom-2 w-px bg-gradient-to-b from-primary-400/60 via-primary-300/30 to-primary-200/10 md:left-1/2 md:-translate-x-px"></div>
              <div className="flex flex-col gap-6">
                {EVENTS.map((event, index) => {
                  const isLeft = index % 2 === 0;
                  return (
                    <div
                      key={event.dateKey}
                      className={`relative flex flex-col ${isLeft ? 'md:flex-row' : 'md:flex-row-reverse'}`}
                    >
                      <div className="absolute left-[9px] top-1 z-10 flex h-[22px] w-[22px] items-center justify-center rounded-full border-2 border-background-100 bg-primary-500 md:left-1/2 md:-translate-x-1/2">
                        <i className={`${EVENT_ICONS[index]} text-[10px] text-white`}></i>
                      </div>
                      <div className={`pl-12 md:w-1/2 ${isLeft ? 'md:pl-0 md:pr-10 md:text-right' : 'md:pl-0 md:pl-10 md:text-left'}`}>
                        <div className="rounded-lg border border-background-200/70 bg-background-50 p-5 transition-all duration-300 hover:border-primary-300/50 hover:shadow-lg hover:shadow-primary-500/5 hover:-translate-y-1">
                          <span className="inline-block text-xs font-bold uppercase tracking-wider text-primary-500">
                            {t(event.dateKey)}
                          </span>
                          <h3 className="mt-1 font-heading text-base font-semibold text-foreground-900">
                            {t(event.titleKey)}
                          </h3>
                          <p className="mt-1.5 text-sm leading-relaxed text-foreground-500">
                            {t(event.descKey)}
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
      </main>

      {/* Footer */}
      <footer className="border-t border-background-200/70 bg-background-100">
        <div className="mx-auto max-w-[1280px] px-4 md:px-6 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <Link to="/" className="flex items-center cursor-pointer active:opacity-70">
              <EditableImage
                contentKey="site_logo_footer"
                fallbackSrc="https://storage.readdy-site.link/project_files/6b577641-b4ea-4107-bb56-5f8fbbf97e07/319ec2ab-1af0-46ca-beed-0358e5e16485_sportowy_vibebez-sloganu2.svg"
                alt="Sportowy VIBE"
                className="h-8 w-auto max-w-[130px] object-contain"
              />
            </Link>
            <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
              <Link to="/" className="text-xs font-medium text-foreground-500 hover:text-primary-600 transition-colors whitespace-nowrap">
                Strona główna
              </Link>
              <span className="text-foreground-300 text-xs select-none">|</span>
              <Link to="/nasze-filmy" className="text-xs font-medium text-foreground-500 hover:text-primary-600 transition-colors whitespace-nowrap">
                Filmy
              </Link>
              <span className="text-foreground-300 text-xs select-none">|</span>
              <Link to="/o-nas/tworcy" className="text-xs font-medium text-foreground-500 hover:text-primary-600 transition-colors whitespace-nowrap">
                O nas
              </Link>
              <span className="text-foreground-300 text-xs select-none">|</span>
              <button
                type="button"
                onClick={() => { navigate('/'); setTimeout(() => document.getElementById('kontakt')?.scrollIntoView({ behavior: 'smooth' }), 300); }}
                className="text-xs font-medium text-foreground-500 hover:text-primary-600 transition-colors whitespace-nowrap cursor-pointer"
              >
                Kontakt
              </button>
              <span className="text-foreground-300 text-xs select-none">|</span>
              <Link to="/o-nas/wspolpraca" className="text-xs font-medium text-foreground-500 hover:text-primary-600 transition-colors whitespace-nowrap">
                Współpraca
              </Link>
              <span className="text-foreground-300 text-xs select-none">|</span>
              <Link to="/polityka-prywatnosci" className="text-xs font-medium text-foreground-500 hover:text-primary-600 transition-colors whitespace-nowrap">
                Polityka prywatności
              </Link>
              <span className="text-foreground-300 text-xs select-none">|</span>
              <Link to="/regulamin-serwisu" className="text-xs font-medium text-foreground-500 hover:text-primary-600 transition-colors whitespace-nowrap">
                Regulamin Serwisu
              </Link>
            </nav>
            <div className="flex items-center gap-3">
              <a href="https://www.youtube.com/@sportowy_vibe" target="_blank" rel="noopener noreferrer" className="text-foreground-400 hover:text-primary-500 transition-colors" aria-label="YouTube">
                <span className="flex h-8 w-8 items-center justify-center">
                  <i className="ri-youtube-fill text-lg"></i>
                </span>
              </a>
              <a href="https://www.facebook.com/sportowy_vibe" target="_blank" rel="noopener noreferrer" className="text-foreground-400 hover:text-primary-500 transition-colors" aria-label="Facebook">
                <span className="flex h-8 w-8 items-center justify-center">
                  <i className="ri-facebook-fill text-lg"></i>
                </span>
              </a>
              <a href="https://www.instagram.com/sportowy_vibe" target="_blank" rel="noopener noreferrer" className="text-foreground-400 hover:text-primary-500 transition-colors" aria-label="Instagram">
                <span className="flex h-8 w-8 items-center justify-center">
                  <i className="ri-instagram-line text-lg"></i>
                </span>
              </a>
            </div>
          </div>
          <div className="mt-6 pt-5 border-t border-background-200/70 text-center">
            <p className="text-xs text-foreground-400">
              {t('footer.rights')}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}