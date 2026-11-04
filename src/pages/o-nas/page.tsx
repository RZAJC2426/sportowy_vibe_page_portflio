import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import TopBar from '@/pages/home/components/TopBar';
import Navbar from '@/pages/home/components/Navbar';
import EditableImage from '@/components/feature/EditableImage';
import EditableText from '@/components/feature/EditableText';
import EditableColor from '@/components/feature/EditableColor';
import Breadcrumbs from '@/components/feature/Breadcrumbs';
import { usePageVisit } from '@/hooks/useLikes';

export default function ONasPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  usePageVisit('/o-nas');

  const sections = [
    {
      key: 'creators',
      href: '/o-nas/tworcy',
      icon: 'ri-team-line',
      colorClass: 'bg-primary-50 text-primary-600 group-hover:bg-primary-500 group-hover:text-white',
      borderHover: 'group-hover:border-primary-300/70',
    },
    {
      key: 'history',
      href: '/o-nas/historia',
      icon: 'ri-history-line',
      colorClass: 'bg-accent-50 text-accent-600 group-hover:bg-accent-500 group-hover:text-white',
      borderHover: 'group-hover:border-accent-300/70',
    },
    {
      key: 'moderators',
      href: '/o-nas/moderatorzy',
      icon: 'ri-shield-star-line',
      colorClass: 'bg-secondary-50 text-secondary-600 group-hover:bg-secondary-500 group-hover:text-white',
      borderHover: 'group-hover:border-secondary-300/70',
    },
    {
      key: 'cooperation',
      href: '/o-nas/wspolpraca',
      icon: 'ri-links-line',
      colorClass: 'bg-amber-50 text-amber-600 group-hover:bg-amber-500 group-hover:text-white',
      borderHover: 'group-hover:border-amber-300/70',
    },
  ];

  return (
    <div className="min-h-screen bg-background-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'O Nas — Twórcy, Historia, Moderatorzy | Sportowy Vibe',
            description: 'Poznaj zespół Sportowy Vibe — Roberta i Michała, historię kanału, moderatorów i możliwości współpracy. Sportowa pasja, która łączy ludzi.',
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
              contentKey="o_nas_hero_img"
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
              <EditableImage contentKey="onas_icon_hero" fallbackSrc="" alt="" className="h-3.5 w-3.5 object-contain">
                <i className="ri-team-line"></i>
              </EditableImage>
              <EditableColor contentKey="color_o_nas_hero_badge" fallbackColor="#2563eb">
                <EditableText contentKey="o_nas_hero_badge" fallback={t('o_nas.hero_badge')} />
              </EditableColor>
            </span>
            <h1 className="font-heading text-3xl md:text-5xl font-bold text-foreground-950 tracking-tight">
              <EditableColor contentKey="color_o_nas_hero_title" fallbackColor="#0F172A">
                <EditableText contentKey="o_nas_hero_title" fallback={t('o_nas.hero_title')} shadowKey="shadow_o_nas_hero_h1" shadowFallback="0 2px 10px rgba(0,0,0,0.45)" />
              </EditableColor>
            </h1>
            <p className="mt-4 max-w-xl mx-auto text-base text-foreground-600">
              <EditableColor contentKey="color_o_nas_hero_desc" fallbackColor="#475569">
                <EditableText contentKey="o_nas_hero_desc" fallback={t('o_nas.hero_desc')} as="span" shadowKey="shadow_o_nas_hero_p" shadowFallback="0 2px 8px rgba(0,0,0,0.32)" />
              </EditableColor>
            </p>
          </div>
        </section>

        {/* Sections grid */}
        <section className="py-14 md:py-20">
          <div className="mx-auto max-w-[1100px] px-4 md:px-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {sections.map((section) => (
                <Link
                  key={section.key}
                  to={section.href}
                  className={`group flex flex-col rounded-xl border border-background-200/70 bg-background-50 p-6 md:p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${section.borderHover} cursor-pointer`}
                >
                  <span className={`inline-flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-300 ${section.colorClass}`}>
                    <EditableImage contentKey={`onas_icon_${section.key}`} fallbackSrc="" alt="" className="h-5 w-5 object-contain">
                      <i className={`${section.icon} text-xl`}></i>
                    </EditableImage>
                  </span>
                  <h3 className="mt-5 font-heading text-xl md:text-2xl font-bold text-foreground-900 group-hover:text-primary-600 transition-colors">
                    {t(`o_nas.${section.key}_title`)}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-foreground-600">
                    {t(`o_nas.${section.key}_desc`)}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 group-hover:gap-2.5 transition-all">
                    {t('o_nas.learn_more')}
                    <i className="ri-arrow-right-line text-sm transition-transform group-hover:translate-x-0.5"></i>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="py-12 md:py-16 bg-background-100">
          <div className="mx-auto max-w-[700px] px-4 md:px-6 text-center">
            <p className="text-sm md:text-base leading-relaxed text-foreground-600">
              {t('o_nas.bottom_text')}
            </p>
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
              <Link to="/o-nas/tworcy" className="text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors whitespace-nowrap">
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