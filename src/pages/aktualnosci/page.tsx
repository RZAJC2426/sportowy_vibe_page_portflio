import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import TopBar from '@/pages/home/components/TopBar';
import Navbar from '@/pages/home/components/Navbar';
import EditableText from '@/components/feature/EditableText';
import EditableColor from '@/components/feature/EditableColor';
import Breadcrumbs from '@/components/feature/Breadcrumbs';
import EditableImage from '@/components/feature/EditableImage';
import { usePageVisit } from '@/hooks/useLikes';
import {
  fetchAllDisciplines,
  fetchAllChannelNews,
  bustDisciplinesCache,
  type Discipline,
  type ChannelNewsItem,
} from '@/data/disciplines';

export default function AktualnosciPage() {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [channelNews, setChannelNews] = useState<ChannelNewsItem[]>([]);

  usePageVisit('/aktualnosci');

  useEffect(() => {
    let cancelled = false;
    bustDisciplinesCache();
    async function load() {
      const [d, n] = await Promise.all([
        fetchAllDisciplines(),
        fetchAllChannelNews(),
      ]);
      if (!cancelled) {
        setDisciplines(d);
        setChannelNews(n);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const DISCIPLINE_SVG_OVERRIDE: Record<string, string> = {
    zuzel: 'https://storage.readdy-site.link/project_files/6b577641-b4ea-4107-bb56-5f8fbbf97e07/ab68809f-14fa-4ac4-9765-91813daa0e44_motorcycle-27.svg',
    siatkowka: 'https://storage.readdy-site.link/project_files/6b577641-b4ea-4107-bb56-5f8fbbf97e07/6f58c12e-6b36-4c6d-a0d3-83fa6ad87017_volleyball-2.svg',
    koszykowka: 'https://storage.readdy-site.link/project_files/6b577641-b4ea-4107-bb56-5f8fbbf97e07/fb9e341c-57b4-4dd3-9010-e638ee9af8be_basketball.svg',
    'pilka-nozna': 'https://storage.readdy-site.link/project_files/6b577641-b4ea-4107-bb56-5f8fbbf97e07/d756def3-a061-4b62-a00c-2fec9ef47c2f_football.svg',
    tenis: 'https://storage.readdy-site.link/project_files/6b577641-b4ea-4107-bb56-5f8fbbf97e07/ccb0fd5b-5782-49b3-8ca8-adb4a831211d_tennis_racquet_icon_126044.svg',
  };

  const getDisciplineIcon = (discipline: Discipline) => DISCIPLINE_SVG_OVERRIDE[discipline.slug] || discipline.iconSvg;

  const handleCardClick = (discipline: Discipline) => {
    if (discipline.hasSubpage) {
      navigate(`/dyscyplina/${discipline.slug}`);
    }
  };

  return (
    <div className="min-h-screen bg-background-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'Aktualności Sportowe — Dyscypliny i Wiadomości | Sportowy Vibe',
            description: 'Najnowsze wiadomości sportowe z piłki nożnej, koszykówki, siatkówki, tenisa, sportów walki, lekkoatletyki, żużla, hokeja i skoków narciarskich. Bądź na bieżąco ze Sportowym Vibe.',
          }),
        }}
      />
      <TopBar />
      <Navbar />

      <Breadcrumbs sticky />

      <main>
        {/* Hero */}
        <section className="relative py-16 md:py-24 overflow-hidden">
          <div className="absolute inset-0">
            <EditableImage
              contentKey="aktualnosci_hero_bg"
              fallbackSrc="https://storage.readdy-site.link/project_files/6b577641-b4ea-4107-bb56-5f8fbbf97e07/3ee7a9de-cf70-4104-8b34-d2e630ef65a4_compressed_Gemini_Generated_Image_tzbsdrtzbsdrtzbs.webp"
              alt="Tło aktualności"
              containerClassName="h-full w-full"
              className="h-full w-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-black/25 dark:bg-black/60" />
          </div>
          <div className="relative mx-auto max-w-[900px] px-4 md:px-6 text-center">
            <div className="mb-6">
              <EditableImage
                contentKey="aktualnosci_hero_logo"
                fallbackSrc="https://storage.readdy-site.link/project_files/6b577641-b4ea-4107-bb56-5f8fbbf97e07/5f809f16-726f-4e78-9150-591a36aa9ee5_sportowy_vibeslogan_white.svg"
                alt="Sportowy VIBE — Energia Sportu Każdego Dnia"
                containerClassName="inline-block mx-auto"
                className="h-16 md:h-20 w-auto object-contain transition-transform duration-300 ease-out hover:scale-110"
              />
            </div>
            <h1 className="font-heading text-3xl md:text-5xl font-bold text-white tracking-tight drop-shadow-sm">
              <EditableColor contentKey="color_aktualnosci_hero_title" fallbackColor="#FFFFFF">
                <EditableText contentKey="aktualnosci_hero_title" fallback={t('aktualnosci.hero_title')} />
              </EditableColor>
            </h1>
            <p className="mt-4 max-w-xl mx-auto text-base text-white/90 drop-shadow-sm">
              <EditableColor contentKey="color_aktualnosci_hero_desc" fallbackColor="rgba(255,255,255,0.9)">
                <EditableText contentKey="aktualnosci_hero_desc" fallback={t('aktualnosci.hero_desc')} as="span" />
              </EditableColor>
            </p>
          </div>
        </section>

        {/* Sports disciplines */}
        <section id="dyscypliny" className="py-14 md:py-20">
          <div className="mx-auto max-w-[1280px] px-4 md:px-6">
            <div className="mb-10 md:mb-14">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary-300/50 bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-600">
                <EditableImage contentKey="aktualnosci_icon_disciplines" fallbackSrc="" alt="" className="h-3.5 w-3.5 object-contain">
                  <i className="ri-football-line"></i>
                </EditableImage>
                <EditableText contentKey="aktualnosci_disciplines_badge" fallback={t('aktualnosci.disciplines_badge')} />
              </span>
              <h2 className="mt-4 font-heading text-3xl md:text-4xl font-bold text-primary-600 dark:text-white tracking-tight">
                <EditableColor contentKey="color_aktualnosci_disciplines_title" fallbackColor="#2563eb">
                  <EditableText contentKey="aktualnosci_disciplines_title" fallback={t('aktualnosci.disciplines_title')} />
                </EditableColor>
              </h2>
              <p className="mt-2 max-w-lg text-sm font-medium text-foreground-600 dark:text-foreground-300">
                {t('aktualnosci.disciplines_desc')}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {disciplines.filter((d) => d.cardImage).map((discipline) => (
                <div
                  key={discipline.slug}
                  className="group relative overflow-hidden rounded-lg border border-background-200/70 bg-background-100 cursor-pointer transition-all duration-300 hover:border-primary-300/50 hover:shadow-lg hover:shadow-primary-500/5"
                  onClick={() => handleCardClick(discipline)}
                >
                  <div className="relative h-56 md:h-72 overflow-hidden">
                    <img
                      src={discipline.cardImage || ''}
                      alt={discipline.name}
                      className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                    <span className="absolute top-4 left-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary-500 text-white">
                      {getDisciplineIcon(discipline) ? (
                        <img
                          src={getDisciplineIcon(discipline)!}
                          alt={discipline.name}
                          className="h-6 w-6 object-contain dark:brightness-0 dark:invert"
                        />
                      ) : (
                        <i className={`${discipline.icon} text-lg`}></i>
                      )}
                    </span>
                    <div className="absolute bottom-4 left-4 right-4">
                      <span className="text-xl font-heading font-bold text-white drop-shadow-sm">{discipline.name}</span>
                      <p className="mt-1 text-sm text-white/80 line-clamp-2 drop-shadow-sm">{discipline.description}</p>
                    </div>
                    <span className="absolute bottom-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm text-white transition-transform duration-300 group-hover:translate-x-0.5">
                      <i className="ri-arrow-right-line text-lg"></i>
                    </span>
                  </div>


                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Channel news */}
        <section id="aktualnosci-kanalu" className="py-14 md:py-20 bg-background-100">
          <div className="mx-auto max-w-[1280px] px-4 md:px-6">
            <div className="mb-10 md:mb-14">
              <span className="inline-flex items-center gap-2 rounded-full border border-accent-300/50 bg-accent-50 px-3 py-1 text-xs font-semibold text-accent-600">
                <EditableImage contentKey="aktualnosci_icon_channel" fallbackSrc="" alt="" className="h-3.5 w-3.5 object-contain">
                  <i className="ri-megaphone-line"></i>
                </EditableImage>
                {t('aktualnosci.channel_badge')}
              </span>
              <h2 className="mt-4 font-heading text-3xl md:text-4xl font-bold text-primary-600 dark:text-white tracking-tight">
                <EditableColor contentKey="color_aktualnosci_channel_title" fallbackColor="#2563eb">
                  <EditableText contentKey="aktualnosci_channel_title" fallback={t('aktualnosci.channel_title')} />
                </EditableColor>
              </h2>
              <p className="mt-2 max-w-lg text-sm font-medium text-foreground-600 dark:text-foreground-300">
                {t('aktualnosci.channel_desc')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {channelNews.map((item) => (
                <div
                  key={item.id}
                  className="group flex items-start gap-4 rounded-lg border border-background-200/70 bg-background-50 p-6 transition-all duration-300 hover:border-primary-300/50 hover:shadow-lg hover:shadow-primary-500/5 hover:-translate-y-1"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-500 transition-colors group-hover:bg-primary-100">
                    <i className={`${item.icon} text-xl`}></i>
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-yellow-600">
                        {item.tag}
                      </span>
                      {item.newsDate && (
                        <span className="text-[10px] text-yellow-500">{item.newsDate}</span>
                      )}
                    </div>
                    <h3 className="font-heading text-lg font-semibold leading-snug text-primary-600 dark:text-primary-400 transition-colors duration-300 group-hover:text-primary-400 dark:group-hover:text-white">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm font-medium leading-relaxed text-foreground-500 dark:text-foreground-300">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact CTA */}
        <section id="kontakt" className="py-14 md:py-20">
          <div className="mx-auto max-w-[800px] px-4 md:px-6 text-center">
            <h2 className="font-heading text-2xl md:text-3xl font-bold text-primary-600 dark:text-white">
              <EditableColor contentKey="color_aktualnosci_cta_title" fallbackColor="#2563eb">
                <EditableText contentKey="aktualnosci_cta_title" fallback={t('aktualnosci.cta_title')} />
              </EditableColor>
            </h2>
            <p className="mt-3 text-sm text-foreground-600 dark:text-foreground-300">
              {t('aktualnosci.cta_desc')}
            </p>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href="/#kontakt"
                className="inline-flex items-center gap-2 rounded-md bg-primary-500 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-primary-600 whitespace-nowrap cursor-pointer"
              >
                <EditableImage contentKey="aktualnosci_icon_mail" fallbackSrc="" alt="" className="h-4 w-4 object-contain">
                  <i className="ri-mail-send-line text-sm"></i>
                </EditableImage>
                {t('nav.write_to_us')}
              </a>
              <a
                href="https://www.youtube.com/@sportowy_vibe"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-md border border-primary-500/50 px-6 py-3 text-sm font-semibold text-primary-600 transition-all hover:border-primary-500 hover:bg-primary-50/50 whitespace-nowrap cursor-pointer"
              >
                <EditableImage contentKey="aktualnosci_icon_youtube" fallbackSrc="" alt="" className="h-4 w-4 object-contain">
                  <i className="ri-youtube-fill text-sm"></i>
                </EditableImage>
                YouTube
              </a>
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