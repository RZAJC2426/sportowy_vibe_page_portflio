import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import TopBar from '@/pages/home/components/TopBar';
import Navbar from '@/pages/home/components/Navbar';
import EditableText from '@/components/feature/EditableText';
import EditableColor from '@/components/feature/EditableColor';
import EditableImage from '@/components/feature/EditableImage';
import Breadcrumbs from '@/components/feature/Breadcrumbs';
import { usePageVisit } from '@/hooks/useLikes';

export default function TworcyPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  usePageVisit('/o-nas/tworcy');

  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="min-h-screen bg-background-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'Twórcy — Robert i Michał | Sportowy Vibe',
            description: 'Poznaj twórców kanału Sportowy Vibe — Robert i Michał. Dwóch pasjonatów sportu, którzy dzielą się wiedzą, analizami i sportową energią na YouTube.',
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
              contentKey="tworcy_hero_img"
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
              <EditableImage contentKey="tworcy_icon_hero" fallbackSrc="" alt="" className="h-3.5 w-3.5 object-contain">
                <i className="ri-team-line"></i>
              </EditableImage>
              <EditableText contentKey="tworcy_hero_badge" fallback={t('tworcy.hero_badge')} />
            </span>
            <h1 className="font-heading text-3xl md:text-5xl font-bold text-foreground-950 tracking-tight">
              <EditableColor contentKey="color_tworcy_hero_title" fallbackColor="#0F172A">
                <EditableText contentKey="tworcy_hero_title" fallback={t('tworcy.hero_title')} shadowKey="shadow_tworcy_hero_h1" shadowFallback="0 2px 10px rgba(0,0,0,0.45)" />
              </EditableColor>
            </h1>
            <p className="mt-4 max-w-xl mx-auto text-base text-foreground-600">
              <EditableColor contentKey="color_tworcy_hero_desc" fallbackColor="#475569">
                <EditableText contentKey="tworcy_hero_desc" fallback={t('tworcy.hero_desc')} as="span" shadowKey="shadow_tworcy_hero_p" shadowFallback="0 2px 8px rgba(0,0,0,0.32)" />
              </EditableColor>
            </p>
            <div className="mt-6 flex justify-center gap-4">
              <span className="inline-flex items-center gap-2 rounded-full bg-primary-500 px-5 py-2.5 text-sm font-semibold text-white whitespace-nowrap cursor-default">
                <EditableImage contentKey="tworcy_icon_tab_creators" fallbackSrc="" alt="" className="h-4 w-4 object-contain">
                  <i className="ri-team-line text-sm"></i>
                </EditableImage>
                {t('tworcy.tab_creators')}
              </span>
              <Link to="/o-nas/historia" className="inline-flex items-center gap-2 rounded-full border border-foreground-300 px-5 py-2.5 text-sm font-semibold text-foreground-700 transition-all hover:bg-background-200 whitespace-nowrap cursor-pointer active:bg-primary-100/50">
                <EditableImage contentKey="tworcy_icon_tab_history" fallbackSrc="" alt="" className="h-4 w-4 object-contain">
                  <i className="ri-road-map-line text-sm"></i>
                </EditableImage>
                {t('tworcy.tab_history')}
              </Link>
            </div>
          </div>
        </section>

        {/* Creator Cards */}
        <section className="py-14 md:py-20">
          <div className="mx-auto max-w-[1280px] px-4 md:px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 place-items-center">
              {/* Michał */}
              <div className="group flex flex-col rounded-xl border border-background-200/70 bg-background-50 overflow-hidden transition-all duration-300 hover:border-primary-300/50 hover:shadow-xl hover:shadow-primary-500/5 hover:-translate-y-1 max-w-[380px] w-full">
                <div className="relative aspect-[3/4] w-full overflow-hidden">
                  <EditableImage
                    contentKey="tworcy_img_michal"
                    fallbackSrc="https://public.readdy.ai/ai/img_res/edited_b9c2f8286a8bf99ac0f5de15682a10fe_0087523c.jpg"
                    alt={t('tworcy.michal_name')}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    style={{ objectPosition: '50% 15%' }}
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary-500 px-3 py-1 text-[10px] font-bold tracking-wider text-white">
                      <i className="ri-mic-line text-[10px]"></i>
                      {t('tworcy.michal_badge')}
                    </span>
                    <h2 className="mt-2 font-heading text-2xl md:text-3xl font-bold text-white">
                      <EditableColor contentKey="color_tworcy_michal_name" fallbackColor="#FFFFFF">
                        <EditableText contentKey="tworcy_michal_name" fallback={t('tworcy.michal_name')} />
                      </EditableColor>
                    </h2>
                    <p className="text-sm text-white/90 font-medium">
                      {t('tworcy.michal_subtitle')}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col flex-1 p-5 md:p-6">
                  <p className="text-sm md:text-base leading-relaxed text-foreground-600">
                    <EditableColor contentKey="color_tworcy_michal_desc_before" fallbackColor="#475569">
                      <EditableText contentKey="tworcy_michal_desc_before" fallback={t('tworcy.michal_desc_before')} as="span" />
                    </EditableColor>
                  </p>
                  <blockquote className="my-4 rounded-lg border-l-4 border-primary-400 bg-primary-50/60 p-4 italic text-foreground-700">
                    <span className="text-primary-500 text-lg leading-none mr-1">"</span>
                    <EditableColor contentKey="color_tworcy_michal_quote" fallbackColor="#334155">
                      <EditableText contentKey="tworcy_michal_quote" fallback={t('tworcy.michal_quote')} as="span" />
                    </EditableColor>
                    <span className="text-primary-500 text-lg leading-none ml-1">"</span>
                  </blockquote>
                  <p className="text-sm md:text-base leading-relaxed text-foreground-600">
                    <EditableColor contentKey="color_tworcy_michal_desc_after" fallbackColor="#475569">
                      <EditableText contentKey="tworcy_michal_desc_after" fallback={t('tworcy.michal_desc_after')} as="span" />
                    </EditableColor>
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-xs font-medium text-primary-600">{t('tworcy.michal_tag_golf')}</span>
                    <span className="rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-xs font-medium text-primary-600">{t('tworcy.michal_tag_voice')}</span>
                    <span className="rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-xs font-medium text-primary-600">{t('tworcy.michal_tag_relations')}</span>
                  </div>
                </div>
              </div>

              {/* Robert */}
              <div className="group flex flex-col rounded-xl border border-background-200/70 bg-background-50 overflow-hidden transition-all duration-300 hover:border-accent-300/50 hover:shadow-xl hover:shadow-accent-500/5 hover:-translate-y-1 max-w-[380px] w-full">
                <div className="relative aspect-[3/4] w-full overflow-hidden">
                  <EditableImage
                    contentKey="tworcy_img_robert"
                    fallbackSrc="https://storage.readdy-site.link/project_files/6b577641-b4ea-4107-bb56-5f8fbbf97e07/efec535f-40d7-4a6a-bb74-5936c4495621_compressed_wmremove-transformed.webp"
                    alt={t('tworcy.robert_name')}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    style={{ objectPosition: '50% 15%' }}
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <span className="inline-flex items-center gap-1 rounded-full bg-accent-500 px-3 py-1 text-[10px] font-bold tracking-wider text-white">
                      <i className="ri-terminal-box-line text-[10px]"></i>
                      {t('tworcy.robert_badge')}
                    </span>
                    <h2 className="mt-2 font-heading text-2xl md:text-3xl font-bold text-white">
                      <EditableColor contentKey="color_tworcy_robert_name" fallbackColor="#FFFFFF">
                        <EditableText contentKey="tworcy_robert_name" fallback={t('tworcy.robert_name')} />
                      </EditableColor>
                    </h2>
                    <p className="text-sm text-white/90 font-medium">
                      {t('tworcy.robert_subtitle')}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col flex-1 p-5 md:p-6">
                  <p className="text-sm md:text-base leading-relaxed text-foreground-600">
                    <EditableColor contentKey="color_tworcy_robert_desc_before" fallbackColor="#475569">
                      <EditableText contentKey="tworcy_robert_desc_before" fallback={t('tworcy.robert_desc_before')} as="span" />
                    </EditableColor>
                  </p>
                  <blockquote className="my-4 rounded-lg border-l-4 border-accent-400 bg-accent-50/60 p-4 italic text-foreground-700">
                    <span className="text-accent-500 text-lg leading-none mr-1">"</span>
                    <EditableColor contentKey="color_tworcy_robert_quote" fallbackColor="#334155">
                      <EditableText contentKey="tworcy_robert_quote" fallback={t('tworcy.robert_quote')} as="span" />
                    </EditableColor>
                    <span className="text-accent-500 text-lg leading-none ml-1">"</span>
                  </blockquote>
                  <p className="text-sm md:text-base leading-relaxed text-foreground-600">
                    <EditableColor contentKey="color_tworcy_robert_desc_after" fallbackColor="#475569">
                      <EditableText contentKey="tworcy_robert_desc_after" fallback={t('tworcy.robert_desc_after')} as="span" />
                    </EditableColor>
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-full border border-accent-200 bg-accent-50 px-3 py-1 text-xs font-medium text-accent-600">{t('tworcy.robert_tag_volleyball')}</span>
                    <span className="rounded-full border border-accent-200 bg-accent-50 px-3 py-1 text-xs font-medium text-accent-600">{t('tworcy.robert_tag_ski_jumping')}</span>
                    <span className="rounded-full border border-accent-200 bg-accent-50 px-3 py-1 text-xs font-medium text-accent-600">{t('tworcy.robert_tag_tech')}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 rounded-lg border border-primary-200/60 bg-primary-50/50 p-5 md:p-6 text-center">
              <p className="text-sm md:text-base leading-relaxed text-foreground-700">
                <strong className="text-primary-600">{t('tworcy.combo_text')}</strong> {t('about.description')}
              </p>
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