import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/hooks/useTheme';
import UserCommentsList from './components/UserCommentsList';
import TopBar from '@/pages/home/components/TopBar';
import EditableText from '@/components/feature/EditableText';
import EditableColor from '@/components/feature/EditableColor';
import EditableImage from '@/components/feature/EditableImage';
import Breadcrumbs from '@/components/feature/Breadcrumbs';

export default function StrefaKibicaPage() {
  const { t } = useTranslation('common');
  const { user, profile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { updateUserProfile } = useAuth();
  const themeIcon = theme === 'dark' ? 'ri-moon-line' : 'ri-sun-line';
  const handleThemeToggle = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    try { localStorage.setItem('sportowy-vibe-theme', nextTheme); } catch { /* noop */ }
    toggleTheme();
    updateUserProfile({ theme: nextTheme }).catch(() => {});
  };
  const navigate = useNavigate();

  const avatarUrl = user?.user_metadata?.avatar_url ?? user?.user_metadata?.picture ?? null;
  const displayName = profile?.display_name
    ?? profile?.username
    ?? user?.user_metadata?.full_name
    ?? user?.user_metadata?.name
    ?? user?.email?.split('@')[0]
    ?? 'Kibicu';
  const initials = displayName.charAt(0).toUpperCase();
  const provider = user?.app_metadata?.provider ?? 'email';
  const providerIcon = provider === 'google' ? 'ri-google-fill' : 'ri-mail-fill';
  const createdAt = user?.created_at ? new Date(user.created_at).toLocaleDateString('pl-PL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }) : null;

  return (
    <div className="min-h-screen bg-background-50">
      <TopBar />
      {/* Navbar */}
      <nav className="sticky top-0 z-40 bg-background-50/95 backdrop-blur-md border-b border-background-200/70 shadow-sm">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-4 md:px-6">
          <Link to="/" className="flex items-center cursor-pointer flex-shrink-0 active:opacity-70">
            <EditableImage
              contentKey="site_logo_nav"
              fallbackSrc="https://storage.readdy-site.link/project_files/6b577641-b4ea-4107-bb56-5f8fbbf97e07/319ec2ab-1af0-46ca-beed-0358e5e16485_sportowy_vibebez-sloganu2.svg"
              alt="Sportowy VIBE"
              className="h-10 w-auto max-w-[160px] object-contain"
            />
          </Link>
          <div className="hidden md:flex items-center gap-1">
            <Link to="/" className="cursor-pointer rounded-md px-3 py-2 text-sm font-medium text-foreground-600 transition-colors hover:bg-background-100 hover:text-primary-600 active:bg-primary-100/50">{t('nav.home')}</Link>
            <Link to="/aktualnosci" className="cursor-pointer rounded-md px-3 py-2 text-sm font-medium text-foreground-600 transition-colors hover:bg-background-100 hover:text-primary-600 active:bg-primary-100/50">{t('nav.news')}</Link>
            <span className="cursor-pointer rounded-md px-3 py-2 text-sm font-medium text-primary-600 bg-primary-50">{t('fan_zone.badge')}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleThemeToggle}
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-background-200/70 bg-background-50 text-foreground-600 transition-all hover:border-primary-300 hover:text-primary-600 hover:bg-primary-50/50"
              title={theme === 'dark' ? 'Jasny motyw' : 'Ciemny motyw'}
            >
              <i className={`${themeIcon} text-sm`}></i>
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 rounded-md bg-primary-500 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-primary-600 whitespace-nowrap cursor-pointer"
            >
              <i className="ri-arrow-left-line text-sm"></i>
              {t('nav.back')}
            </button>
          </div>
        </div>
      </nav>

      <Breadcrumbs sticky />

      <main>
        {/* Hero */}
        <section className="relative py-16 md:py-24 bg-background-100">
          <div className="mx-auto max-w-[900px] px-4 md:px-6 text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary-300/50 bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-600 mb-4">
              <i className="ri-football-line"></i>
              <EditableText contentKey="fan_zone_badge" fallback={t('fan_zone.badge')} />
            </span>
            <h1 className="font-heading text-3xl md:text-5xl font-bold text-foreground-950 tracking-tight">
              {t('topbar.greeting')}, {displayName}!
            </h1>
            <p className="mt-4 max-w-xl mx-auto text-base text-foreground-600">
              <EditableColor contentKey="color_fan_zone_hero_desc" fallbackColor="#475569">
                <EditableText contentKey="fan_zone_hero_desc" fallback={t('fan_zone.hero_desc')} as="span" />
              </EditableColor>
            </p>
          </div>
        </section>

        {/* Dashboard grid */}
        <section className="py-10 md:py-16">
          <div className="mx-auto max-w-[1280px] px-4 md:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Left column - Profile + Quick links */}
              <div className="lg:col-span-1 space-y-6">
                {/* Profile Card */}
                <div className="rounded-2xl border border-background-200/80 bg-background-50 p-6 md:p-8 text-center">
                  <div className="relative mx-auto mb-4 inline-block">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt="Awatar"
                        className="h-20 w-20 rounded-full object-cover border-2 border-primary-200"
                      />
                    ) : (
                      <span className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-primary-500 text-2xl font-bold text-white">
                        {initials}
                      </span>
                    )}
                    <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-[3px] border-white bg-accent-500">
                      <i className={`${providerIcon} text-[10px] text-white`}></i>
                    </span>
                  </div>
                  <h2 className="font-heading text-xl font-bold text-foreground-950">{displayName}</h2>
                  {user?.email && (
                    <p className="mt-1 text-sm text-foreground-500">{user.email}</p>
                  )}

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-background-50 border border-background-200/60 p-3">
                      <span className="flex h-7 w-7 mx-auto mb-1.5 items-center justify-center rounded-full bg-primary-50 text-primary-500">
                        <i className="ri-star-line text-xs"></i>
                      </span>
                      <p className="text-[11px] font-medium text-foreground-400">{t('fan_zone.status')}</p>
                      <p className="font-heading text-sm font-bold text-foreground-900">{t('fan_zone.fan')}</p>
                    </div>
                    <div className="rounded-lg bg-background-50 border border-background-200/60 p-3">
                      <span className="flex h-7 w-7 mx-auto mb-1.5 items-center justify-center rounded-full bg-accent-50 text-accent-500">
                        <i className="ri-calendar-line text-xs"></i>
                      </span>
                      <p className="text-[11px] font-medium text-foreground-400">{t('fan_zone.joined')}</p>
                      <p className="font-heading text-sm font-bold text-foreground-900">{createdAt ?? '—'}</p>
                    </div>
                  </div>
                </div>

                {/* Quick links */}
                <div className="rounded-2xl border border-background-200/80 bg-background-50 p-5 md:p-6">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground-400 mb-3 px-2">
                    {t('fan_zone.quick_actions')}
                  </h3>
                  <div className="space-y-0.5">
                    <Link
                      to="/ustawienia-konta"
                      className="flex items-center gap-3 py-3 px-3 rounded-lg hover:bg-background-50 transition-colors cursor-pointer group active:bg-primary-50/50"
                    >
                      <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-500">
                        <i className="ri-settings-3-line text-sm"></i>
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground-800">{t('settings.title')}</p>
                        <p className="text-xs text-foreground-400">{t('fan_zone.settings_desc')}</p>
                      </div>
                      <i className="ri-arrow-right-s-line text-foreground-300 flex-shrink-0 group-hover:text-primary-500 transition-colors"></i>
                    </Link>
                    <Link
                      to="/aktualnosci"
                      className="flex items-center gap-3 py-3 px-3 rounded-lg hover:bg-background-50 transition-colors cursor-pointer group active:bg-primary-50/50"
                    >
                      <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-accent-50 text-accent-500">
                        <i className="ri-newspaper-line text-sm"></i>
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground-800">{t('fan_zone.articles')}</p>
                        <p className="text-xs text-foreground-400">{t('fan_zone.articles_desc')}</p>
                      </div>
                      <i className="ri-arrow-right-s-line text-foreground-300 flex-shrink-0 group-hover:text-accent-500 transition-colors"></i>
                    </Link>
                    <Link
                      to="/nasze-filmy"
                      className="flex items-center gap-3 py-3 px-3 rounded-lg hover:bg-background-50 transition-colors cursor-pointer group active:bg-primary-50/50"
                    >
                      <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-secondary-50 text-secondary-500">
                        <i className="ri-youtube-line text-sm"></i>
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground-800">{t('fan_zone.videos')}</p>
                        <p className="text-xs text-foreground-400">{t('fan_zone.videos_desc')}</p>
                      </div>
                      <i className="ri-arrow-right-s-line text-foreground-300 flex-shrink-0 group-hover:text-secondary-500 transition-colors"></i>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Right column - Activity */}
              <div className="lg:col-span-2 space-y-6">
                {/* Comments */}
                <div className="rounded-2xl border border-background-200/80 bg-background-50 p-5 md:p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-500">
                        <i className="ri-chat-3-line text-lg"></i>
                      </span>
                      <div>
                        <h3 className="font-heading text-lg font-bold text-foreground-950">{t('fan_zone.my_comments')}</h3>
                        <p className="text-xs text-foreground-500">{t('fan_zone.my_comments_desc')}</p>
                      </div>
                    </div>
                  </div>
                  <UserCommentsList />
                </div>

                {/* Info box */}
                <div className="rounded-xl border border-primary-200/60 bg-primary-50/50 p-5 text-center">
                  <p className="text-sm leading-relaxed text-foreground-700">
                    <strong className="text-primary-600">{t('fan_zone.coming_soon')}</strong>
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