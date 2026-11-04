import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';
import TopBar from '@/pages/home/components/TopBar';
import Navbar from '@/pages/home/components/Navbar';
import EditableText from '@/components/feature/EditableText';
import EditableColor from '@/components/feature/EditableColor';
import EditableImage from '@/components/feature/EditableImage';
import Breadcrumbs from '@/components/feature/Breadcrumbs';

interface Moderator {
  id: string;
  name: string;
  image_url: string;
  display_order: number;
}

export default function ModeratorzyPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [moderators, setModerators] = useState<Moderator[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  useEffect(() => {
    const fetchModerators = async () => {
      const { data, error } = await supabase
        .from('moderators')
        .select('id, name, image_url, display_order')
        .order('display_order', { ascending: true });

      if (!error && data) {
        setModerators(data as Moderator[]);
      }
      setLoading(false);
    };
    fetchModerators();
  }, []);

  return (
    <div className="min-h-screen bg-background-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'Moderatorzy — Zespół Wsparcia | Sportowy Vibe',
            description: 'Poznaj moderatorów kanału Sportowy Vibe — zespół, który dba o społeczność i atmosferę podczas transmisji na żywo. Dziękujemy za Wasze wsparcie.',
          }),
        }}
      />
      <TopBar />
      <Navbar showBackButton />

      <Breadcrumbs sticky />

      <main>
        {/* Hero */}
        <section className="relative py-16 md:py-24 bg-background-100">
          <div className="mx-auto max-w-[900px] px-4 md:px-6 text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary-300/50 bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-600 mb-4">
              <EditableImage contentKey="moderatorzy_icon_hero" fallbackSrc="" alt="" className="h-3.5 w-3.5 object-contain">
                <i className="ri-shield-star-line"></i>
              </EditableImage>
              <EditableText contentKey="moderatorzy_hero_badge" fallback={t('moderatorzy.hero_badge')} />
            </span>
            <h1 className="font-heading text-3xl md:text-5xl font-bold text-foreground-950 tracking-tight">
              <EditableColor contentKey="color_moderatorzy_hero_title" fallbackColor="#0F172A">
                <EditableText contentKey="moderatorzy_hero_title" fallback={t('moderatorzy.hero_title')} />
              </EditableColor>
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-base text-foreground-600">
              <EditableColor contentKey="color_moderatorzy_hero_desc" fallbackColor="#475569">
                <EditableText contentKey="moderatorzy_hero_desc" fallback={t('moderatorzy.hero_desc')} as="span" />
              </EditableColor>
            </p>
            <div className="mt-6 flex justify-center gap-4">
              <span className="inline-flex items-center gap-2 rounded-full bg-secondary-500 px-5 py-2.5 text-sm font-semibold text-white whitespace-nowrap cursor-default">
                <EditableImage contentKey="moderatorzy_icon_tab_moderators" fallbackSrc="" alt="" className="h-4 w-4 object-contain">
                  <i className="ri-shield-star-line text-sm"></i>
                </EditableImage>
                {t('moderatorzy.hero_badge')}
              </span>
            </div>
          </div>
        </section>

        {/* Moderators Grid */}
        <section className="py-14 md:py-20">
          <div className="mx-auto max-w-[1280px] px-4 md:px-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
              {moderators.map((mod) => (
                <div
                  key={mod.id}
                  className="group flex flex-col items-center rounded-xl border border-background-200/70 bg-background-50 p-4 md:p-5 transition-all duration-300 hover:border-primary-300/50 hover:shadow-lg hover:shadow-primary-500/5 hover:-translate-y-1"
                >
                  <div className="relative w-full aspect-square max-w-[160px] max-h-[160px] flex items-center justify-center overflow-hidden rounded-lg bg-background-100">
                    <EditableImage
                      contentKey={mod.image_url}
                      fallbackSrc={mod.image_url}
                      alt={mod.name}
                      className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                  <h3 className="mt-3 text-sm md:text-base font-semibold text-foreground-800 text-center whitespace-nowrap">
                    {mod.name}
                  </h3>
                  <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-secondary-50 px-2.5 py-0.5 text-[10px] font-semibold text-secondary-700">
                    <i className="ri-shield-star-line text-[10px]"></i>
                    {t('moderatorzy.role')}
                  </span>
                </div>
              ))}
            </div>

            {/* Description */}
            <div className="mt-12 rounded-xl border border-background-200/70 bg-background-100 p-6 md:p-8">
              <div className="flex items-start gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-500">
                  <i className="ri-shield-check-line text-lg"></i>
                </span>
                <div>
                  <h3 className="text-lg font-semibold text-foreground-800">
                    <EditableColor contentKey="color_moderatorzy_section_title" fallbackColor="#1E293B">
                      <EditableText contentKey="moderatorzy_section_title" fallback={t('moderatorzy.section_title')} />
                    </EditableColor>
                  </h3>
                  <p className="mt-2 text-sm md:text-base leading-relaxed text-foreground-600">
                    {t('moderatorzy.section_desc')}
                  </p>
                </div>
              </div>
            </div>

            {/* Thanks */}
            <div className="mt-8 rounded-xl border border-accent-200/60 bg-accent-50/60 p-6 md:p-8">
              <div className="flex items-start gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-100 text-accent-500">
                  <i className="ri-heart-3-line text-lg"></i>
                </span>
                <div>
                  <h3 className="text-lg font-semibold text-foreground-800">
                    <EditableColor contentKey="color_moderatorzy_thanks_title" fallbackColor="#1E293B">
                      <EditableText contentKey="moderatorzy_thanks_title" fallback={t('moderatorzy.thanks_title')} />
                    </EditableColor>
                  </h3>
                  <p className="mt-2 text-sm md:text-base leading-relaxed text-foreground-600">
                    {t('moderatorzy.thanks_desc')}
                  </p>
                </div>
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