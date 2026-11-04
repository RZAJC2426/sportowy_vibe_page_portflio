import { useState } from 'react';
import EditableImage from '@/components/feature/EditableImage';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import ArticlesManager from './components/ArticlesManager';
import ChannelNewsManager from './components/ChannelNewsManager';
import UsersManager from './components/UsersManager';
import DisciplinesManager from './components/DisciplinesManager';
import ContentManager from './components/ContentManager';
import Dashboard from './components/Dashboard';
import TopBar from '@/pages/home/components/TopBar';
import Breadcrumbs from '@/components/feature/Breadcrumbs';
import ModeratorsManager from './components/ModeratorsManager';
import PartnersManager from './components/PartnersManager';
import ColorsManager from './components/ColorsManager';
import ImagesManager from './components/ImagesManager';
import EmailTemplatesManager from './components/EmailTemplatesManager';

type AdminTab = 'dashboard' | 'articles' | 'channel-news' | 'users' | 'disciplines' | 'content' | 'moderators' | 'partners' | 'colors' | 'images' | 'email-templates';

export default function AdminPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, profile, isAdmin, loading, sessionWarning, sessionExpired, refreshSession } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const themeIcon = theme === 'dark' ? 'ri-moon-line' : 'ri-sun-line';
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');

  const handleThemeToggle = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    try { localStorage.setItem('sportowy-vibe-theme', nextTheme); } catch { /* noop */ }
    toggleTheme();
  };

  // Still loading auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-50">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-background-100 text-primary-500 animate-spin">
          <i className="ri-loader-4-line text-2xl"></i>
        </span>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Not admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-50">
        <div className="text-center p-8">
          <span className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-red-50 text-red-500 mb-4">
            <i className="ri-shield-user-line text-3xl"></i>
          </span>
          <h2 className="font-heading text-xl font-bold text-foreground-950">{t('admin.access_denied')}</h2>
          <p className="mt-2 text-sm text-foreground-500 max-w-sm mx-auto">
            {t('admin.access_denied_desc')}
          </p>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="mt-6 inline-flex items-center gap-2 rounded-md bg-primary-500 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-primary-600 whitespace-nowrap cursor-pointer"
          >
            <i className="ri-arrow-left-line"></i>
            {t('nav.home')}
          </button>
        </div>
      </div>
    );
  }

  const TABS: { id: AdminTab; labelKey: string; icon: string }[] = [
    { id: 'dashboard', labelKey: 'admin.tab_dashboard', icon: 'ri-dashboard-line' },
    { id: 'articles', labelKey: 'admin.tab_articles', icon: 'ri-article-line' },
    { id: 'channel-news', labelKey: 'admin.tab_channel_news', icon: 'ri-megaphone-line' },
    { id: 'disciplines', labelKey: 'admin.tab_disciplines', icon: 'ri-image-edit-line' },
    { id: 'content', labelKey: 'admin.tab_content', icon: 'ri-file-text-line' },
    { id: 'moderators', labelKey: 'admin.tab_moderators', icon: 'ri-shield-star-line' },
    { id: 'partners', labelKey: 'admin.tab_partners', icon: 'ri-service-line' },
    { id: 'email-templates', labelKey: 'admin.tab_email_templates', icon: 'ri-mail-settings-line' },
    { id: 'colors', labelKey: 'admin.tab_colors', icon: 'ri-palette-line' },
    { id: 'users', labelKey: 'admin.tab_users', icon: 'ri-group-line' },
    { id: 'images', labelKey: 'admin.tab_images', icon: 'ri-image-line' },
  ];

  return (
    <div className="min-h-screen bg-background-50">
      <TopBar />
      {/* Admin Navbar */}
      <nav className="sticky top-0 z-40 bg-background-50/95 backdrop-blur-md border-b border-background-200/70 shadow-sm">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center cursor-pointer flex-shrink-0 active:opacity-70">
              <img
                src="https://storage.readdy-site.link/project_files/6b577641-b4ea-4107-bb56-5f8fbbf97e07/319ec2ab-1af0-46ca-beed-0358e5e16485_sportowy_vibebez-sloganu2.svg"
                alt="Sportowy VIBE"
                className="h-10 w-auto max-w-[160px] object-contain"
              />
            </Link>
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-red-700 border border-red-200">
              <i className="ri-shield-star-fill text-[10px]"></i>
              {t('admin.title')}
            </span>
          </div>
          <div className="hidden md:flex items-center gap-1">
            <Link to="/" className="cursor-pointer rounded-md px-3 py-2 text-sm font-medium text-foreground-600 transition-colors hover:bg-background-100 hover:text-primary-600 active:bg-primary-100/50">{t('nav.home')}</Link>
            <Link to="/aktualnosci" className="cursor-pointer rounded-md px-3 py-2 text-sm font-medium text-foreground-600 transition-colors hover:bg-background-100 hover:text-primary-600 active:bg-primary-100/50">{t('nav.news')}</Link>
            <Link to="/nasz-kanal" className="cursor-pointer rounded-md px-3 py-2 text-sm font-medium text-foreground-600 transition-colors hover:bg-background-100 hover:text-primary-600 active:bg-primary-100/50">{t('nasz_kanal.hero_title')}</Link>
            <Link to="/nasze-filmy" className="cursor-pointer rounded-md px-3 py-2 text-sm font-medium text-foreground-600 transition-colors hover:bg-background-100 hover:text-primary-600 active:bg-primary-100/50">{t('footer.movies')}</Link>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden md:inline-flex items-center gap-2 text-xs text-foreground-500">
              {profile?.display_name || profile?.username || user.email?.split('@')[0]}
            </span>
            {/* Session health indicator */}
            <span
              className={`hidden md:inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                sessionExpired
                  ? 'bg-red-100 text-red-700 border border-red-200'
                  : sessionWarning
                  ? 'bg-amber-100 text-amber-700 border border-amber-200'
                  : 'bg-green-100 text-green-700 border border-green-200'
              }`}
              title={
                sessionExpired
                  ? 'Sesja wygasła — zapisy blokowane'
                  : sessionWarning
                  ? 'Sesja wkrótce wygaśnie'
                  : 'Sesja aktywna'
              }
            >
              <span className={`h-1.5 w-1.5 rounded-full ${
                sessionExpired ? 'bg-red-500 animate-pulse' : sessionWarning ? 'bg-amber-500' : 'bg-green-500'
              }`}></span>
              {sessionExpired ? 'Wygasła' : sessionWarning ? 'Wygasa' : 'OK'}
            </span>
            <button
              type="button"
              onClick={handleThemeToggle}
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-background-200/70 bg-background-50 text-foreground-600 transition-all hover:border-primary-300 hover:text-primary-600 hover:bg-primary-50/50"
              title={theme === 'dark' ? 'Jasny motyw' : 'Ciemny motyw'}
            >
              <i className={`${themeIcon} text-sm`}></i>
            </button>
          </div>
        </div>
      </nav>

      <Breadcrumbs sticky />

      {/* Session expiry warning banner */}
      {sessionExpired && (
        <div className="mx-auto max-w-[1400px] px-4 md:px-6 mt-4">
          <div className="rounded-lg border-2 border-red-300 bg-red-50 px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
              <i className="ri-alert-fill text-xl"></i>
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-red-800">Sesja admina wygasła!</p>
              <p className="text-xs text-red-600 mt-0.5">
                Wszystkie zapisy (teksty, kolory, obrazki) są teraz BLOKOWANE przez serwer.
                Odśwież sesję lub przeładuj stronę, aby móc znów zapisywać zmiany.
              </p>
            </div>
            <button
              type="button"
              onClick={refreshSession}
              className="inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 transition-colors whitespace-nowrap"
            >
              <i className="ri-refresh-line text-sm"></i>
              Odśwież sesję
            </button>
          </div>
        </div>
      )}

      {!sessionExpired && sessionWarning && (
        <div className="mx-auto max-w-[1400px] px-4 md:px-6 mt-4">
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-5 py-3 flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
              <i className="ri-timer-line text-sm"></i>
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-amber-800">
                Sesja admina wygaśnie za mniej niż 5 minut. Aby uniknąć cichego blokowania zapisów, odśwież ją teraz.
              </p>
            </div>
            <button
              type="button"
              onClick={refreshSession}
              className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600 transition-colors whitespace-nowrap"
            >
              <i className="ri-refresh-line text-xs"></i>
              Odśwież
            </button>
          </div>
        </div>
      )}

      <main className="mx-auto max-w-[1400px] px-4 md:px-6 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground-950">
            {t('admin.title')}
          </h1>
          <p className="mt-1 text-sm text-foreground-500">
            {t('admin.subtitle')}
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-8 border-b border-background-200/70">
          <div className="flex flex-wrap gap-1 -mb-px">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 px-4 py-3 text-sm font-semibold whitespace-nowrap cursor-pointer transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-foreground-500 hover:text-foreground-700 hover:border-background-300'
                }`}
              >
                <i className={`${tab.icon} text-sm`}></i>
                {t(tab.labelKey)}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'articles' && <ArticlesManager />}
        {activeTab === 'channel-news' && <ChannelNewsManager />}
        {activeTab === 'disciplines' && <DisciplinesManager />}
        {activeTab === 'content' && <ContentManager />}
        {activeTab === 'moderators' && <ModeratorsManager />}
        {activeTab === 'partners' && <PartnersManager />}
        {activeTab === 'users' && <UsersManager />}
        {activeTab === 'colors' && <ColorsManager />}
        {activeTab === 'images' && <ImagesManager />}
        {activeTab === 'email-templates' && <EmailTemplatesManager />}
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