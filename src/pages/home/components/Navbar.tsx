import { useEffect, useMemo, useRef, useState, lazy, Suspense } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import i18n, { changeAppLanguage } from '@/i18n';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { useDropdown } from '@/hooks/useDropdown';
import { useAccessibility } from '@/contexts/AccessibilityContext';
const AuthModal = lazy(() => import('@/components/feature/AuthModal'));
import EditableImage from '@/components/feature/EditableImage';
import EditableColor from '@/components/feature/EditableColor';

export default function Navbar({ showBackButton }: { showBackButton?: boolean }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation('common');
  const { updateUserProfile } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState(i18n.language?.startsWith('en') ? 'en' : 'pl');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [themeAnimating, setThemeAnimating] = useState(false);
  const [langAnimating, setLangAnimating] = useState(false);
  const { user, profile, isAdmin, hardSignOut } = useAuth();

  // Mobile accordion states — NIEPOŁĄCZONE z desktopowymi useDropdown
  const [mobileAktualOpen, setMobileAktualOpen] = useState(false);
  const [mobileOnasOpen, setMobileOnasOpen] = useState(false);
  const [mobileRegulaminyOpen, setMobileRegulaminyOpen] = useState(false);

  // Desktop dropdown hooks
  const aktualDropdown = useDropdown({ closeDelay: 200 });
  const onasDropdown = useDropdown({ closeDelay: 200 });
  const regulaminyDropdown = useDropdown({ closeDelay: 200 });

  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const prevUserRef = useRef<typeof user>(user);
  const backdropRef = useRef<HTMLDivElement>(null);

  // Sync lang state when i18n changes externally (e.g. from settings page)
  useEffect(() => {
    const handleLangChange = (lng: string) => {
      setCurrentLang(lng?.startsWith('en') ? 'en' : 'pl');
    };
    i18n.on('languageChanged', handleLangChange);
    return () => { i18n.off('languageChanged', handleLangChange); };
  }, []);

  const toggleLanguage = () => {
    const newLang = currentLang === 'pl' ? 'en' : 'pl';
    changeAppLanguage(newLang);
    updateUserProfile({ language: newLang }).catch(() => {});
    setLangAnimating(true);
    setTimeout(() => setLangAnimating(false), 500);
  };

  const { theme, toggleTheme } = useTheme();
  const themeIcon = theme === 'dark' ? 'ri-moon-line' : 'ri-sun-line';
  const { highContrast, toggleHighContrast, fontSize, setFontSize, menuOpen: a11yMenuOpen, setMenuOpen: setA11yMenuOpen } = useAccessibility();
  const a11yBtnRef = useRef<HTMLButtonElement>(null);
  const a11yPanelRef = useRef<HTMLDivElement>(null);

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
    setThemeAnimating(true);
    setTimeout(() => setThemeAnimating(false), 500);
  };

  const DYSCYPLINY = useMemo(() => [
    { label: t('disciplines.tennis'), href: '/dyscyplina/tenis', imgSrc: 'https://storage.readdy-site.link/project_files/6b577641-b4ea-4107-bb56-5f8fbbf97e07/ccb0fd5b-5782-49b3-8ca8-adb4a831211d_tennis_racquet_icon_126044.svg', contentKey: 'nav_icon_tennis', iconColorKey: 'nav_color_tennis' },
    { label: t('disciplines.volleyball'), href: '/dyscyplina/siatkowka', imgSrc: 'https://storage.readdy-site.link/project_files/6b577641-b4ea-4107-bb56-5f8fbbf97e07/6f58c12e-6b36-4c6d-a0d3-83fa6ad87017_volleyball-2.svg', contentKey: 'nav_icon_volleyball', iconColorKey: 'nav_color_volleyball' },
    { label: t('disciplines.football'), href: '/dyscyplina/pilka-nozna', imgSrc: 'https://storage.readdy-site.link/project_files/6b577641-b4ea-4107-bb56-5f8fbbf97e07/d756def3-a061-4b62-a00c-2fec9ef47c2f_football.svg', contentKey: 'nav_icon_football', iconColorKey: 'nav_color_football' },
    { label: t('disciplines.basketball'), href: '/dyscyplina/koszykowka', imgSrc: 'https://storage.readdy-site.link/project_files/6b577641-b4ea-4107-bb56-5f8fbbf97e07/fb9e341c-57b4-4dd3-9010-e638ee9af8be_basketball.svg', contentKey: 'nav_icon_basketball', iconColorKey: 'nav_color_basketball' },
    { label: t('disciplines.hockey'), href: '/dyscyplina/hokej', imgSrc: 'https://storage.readdy-site.link/project_files/6b577641-b4ea-4107-bb56-5f8fbbf97e07/e7782d89-a2ea-4c35-a175-56026cb0f6d5_hockey.svg', contentKey: 'nav_icon_hockey', iconColorKey: 'nav_color_hockey' },
    { label: t('disciplines.ski_jumping'), href: '/dyscyplina/skoki-narciarskie', imgSrc: 'https://storage.readdy-site.link/project_files/6b577641-b4ea-4107-bb56-5f8fbbf97e07/1db633d3-afda-4235-9391-71404d847f06_ski_jumper.svg', contentKey: 'nav_icon_ski_jumping', iconColorKey: 'nav_color_ski_jumping' },
    { label: t('disciplines.other'), href: '/dyscyplina/inne', imgSrc: null, icon: 'ri-more-2-line', contentKey: 'nav_icon_other', iconColorKey: 'nav_color_other' },
    { label: t('disciplines.our_channel'), href: '/nasz-kanal', imgSrc: null, icon: 'ri-youtube-line', contentKey: 'nav_icon_our_channel', iconColorKey: 'nav_color_our_channel' },
  ], [t]);

  const REGULAMINY = useMemo(() => [
    { label: t('nav.privacy'), href: '/polityka-prywatnosci', icon: 'ri-shield-check-line', contentKey: 'nav_icon_privacy', iconColorKey: 'nav_color_privacy' },
    { label: t('nav.terms'), href: '/regulamin-serwisu', icon: 'ri-file-text-line', contentKey: 'nav_icon_terms', iconColorKey: 'nav_color_terms' },
    { label: 'RODO', href: '/rodo', icon: 'ri-shield-user-line', contentKey: 'nav_icon_rodo', iconColorKey: 'nav_color_rodo' },
  ], [t]);

  const O_NAS = useMemo(() => [
    { label: t('nav.creators'), href: '/o-nas/tworcy', icon: 'ri-team-line', contentKey: 'nav_icon_creators', iconColorKey: 'nav_color_creators' },
    { label: t('nav.history'), href: '/o-nas/historia', icon: 'ri-history-line', contentKey: 'nav_icon_history', iconColorKey: 'nav_color_history' },
    { label: t('nav.moderators'), href: '/o-nas/moderatorzy', icon: 'ri-shield-star-line', contentKey: 'nav_icon_moderators', iconColorKey: 'nav_color_moderators' },
    { label: t('nav.stats'), href: '/#stats', icon: 'ri-bar-chart-2-line', contentKey: 'nav_icon_stats', iconColorKey: 'nav_color_stats' },
    { label: t('nav.cooperation'), href: '/o-nas/wspolpraca', icon: 'ri-links-line', contentKey: 'nav_icon_cooperation', iconColorKey: 'nav_color_cooperation' },
    { label: t('nav.booking'), href: '/o-nas/wspolpraca#rezerwacja', icon: 'ri-calendar-event-line', contentKey: 'nav_icon_booking', iconColorKey: 'nav_color_booking' },
  ], [t]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile menu ONLY when user transitions from not-logged-in to logged-in
  useEffect(() => {
    if (user && !prevUserRef.current) {
      setMobileOpen(false);
    }
    prevUserRef.current = user;
  }, [user]);

  // Body scroll lock when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  // Close a11y panel on outside click
  useEffect(() => {
    if (!a11yMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (a11yBtnRef.current?.contains(e.target as Node)) return;
      if (a11yPanelRef.current?.contains(e.target as Node)) return;
      setA11yMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [a11yMenuOpen, setA11yMenuOpen]);

  const closeAllMenus = () => {
    setMobileOpen(false);
    setMobileAktualOpen(false);
    setMobileOnasOpen(false);
    setMobileRegulaminyOpen(false);
    aktualDropdown.closeImmediate();
    onasDropdown.closeImmediate();
    regulaminyDropdown.closeImmediate();
  };

  const closeAllMenusDeferred = () => {
    setTimeout(() => closeAllMenus(), 60);
  };

  const handleBookingNav = () => {
    if (location.pathname === '/o-nas/wspolpraca') {
      closeAllMenus();
      setTimeout(() => {
        document.getElementById('rezerwacja')?.scrollIntoView({ behavior: 'smooth' });
      }, 60);
    } else {
      navigate('/o-nas/wspolpraca');
      setTimeout(() => {
        document.getElementById('rezerwacja')?.scrollIntoView({ behavior: 'smooth' });
      }, 400);
    }
  };

  const handleSectionLink = (id: string) => {
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
        closeAllMenus();
      }, 350);
    } else {
      closeAllMenus();
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
      }, 60);
    }
  };

  const handleMobileSubNav = (href: string) => {
    navigate(href);
    closeAllMenus();
  };

  const handleMobileSectionNav = (id: string) => {
    if (location.pathname !== '/') {
      navigate('/');
      closeAllMenus();
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
      }, 350);
    } else {
      closeAllMenus();
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  const openAktual = () => {
    onasDropdown.closeImmediate();
    regulaminyDropdown.closeImmediate();
    aktualDropdown.open();
  };

  const closeAktual = () => {
    aktualDropdown.close();
  };

  const openOnas = () => {
    aktualDropdown.closeImmediate();
    regulaminyDropdown.closeImmediate();
    onasDropdown.open();
  };

  const closeOnas = () => {
    onasDropdown.close();
  };

  const openRegulaminy = () => {
    aktualDropdown.closeImmediate();
    onasDropdown.closeImmediate();
    regulaminyDropdown.open();
  };

  const closeRegulaminy = () => {
    regulaminyDropdown.close();
  };

  return (
    <nav
      className={`sticky top-0 z-40 transition-all duration-300 border-b ${
        scrolled
          ? 'bg-background-50/98 border-background-200/70 shadow-sm'
          : 'bg-transparent border-transparent'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-4 md:px-6">
        {/* Logo */}
        {showBackButton && (
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-background-200/70 bg-background-50 text-foreground-600 transition-all hover:border-primary-300 hover:text-primary-600 hover:bg-primary-50/50 mr-2"
            title="Powrót"
            aria-label="Powrót"
          >
            <i className="ri-arrow-left-line text-lg"></i>
          </button>
        )}
        <Link
          to="/"
          onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          className="flex items-center cursor-pointer flex-shrink-0 active:opacity-70"
        >
          <EditableImage
            contentKey="site_logo_nav"
            fallbackSrc="https://storage.readdy-site.link/project_files/6b577641-b4ea-4107-bb56-5f8fbbf97e07/319ec2ab-1af0-46ca-beed-0358e5e16485_sportowy_vibebez-sloganu2.svg"
            alt="Sportowy VIBE"
            className="h-11 w-[180px] object-contain nav-logo-img"
            width={180}
            height={44}
          />
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {/* Strona główna */}
          <Link
            to="/"
            onClick={() => {
              if (location.pathname === '/') {
                closeAllMenus();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            className="cursor-pointer rounded-md px-3 py-2 text-sm font-medium text-foreground-600 transition-colors hover:bg-background-100 hover:text-primary-600 whitespace-nowrap active:bg-primary-100/50"
          >
            {t('nav.home')}
          </Link>

          {/* Aktualności — hover dropdown */}
          <div
            ref={aktualDropdown.ref}
            className="relative"
            onMouseEnter={openAktual}
            onMouseLeave={closeAktual}
          >
            <button
              type="button"
              className="flex items-center gap-1 cursor-pointer rounded-md px-3 py-2 text-sm font-medium text-foreground-600 transition-colors hover:bg-background-100 hover:text-primary-600 whitespace-nowrap active:bg-primary-100/50"
            >
              {t('nav.news')}
              <i className={`ri-arrow-down-s-line text-sm transition-transform duration-300 ${aktualDropdown.isOpen ? 'rotate-180' : ''}`}></i>
            </button>
            <div
              className={`absolute top-full left-0 z-50 pt-1 ${
                aktualDropdown.isOpen
                  ? 'opacity-100 visible translate-y-0'
                  : 'opacity-0 invisible -translate-y-1 pointer-events-none'
              } transition-all duration-200 ease-out`}
            >
              <div className="w-52 rounded-xl border border-background-200/70 bg-background-50 shadow-lg shadow-black/5 py-1.5">
              <Link
                to="/aktualnosci"
                onClick={closeAllMenusDeferred}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-foreground-800 hover:bg-background-100 hover:text-primary-600 transition-colors cursor-pointer active:bg-primary-100/50"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary-50 text-primary-500">
                  <EditableImage
                    contentKey="nav_icon_all_news"
                    fallbackSrc=""
                    alt={t('nav.all_news')}
                    loading="lazy"
                    className="h-full w-full object-contain"
                    containerClassName="flex items-center justify-center h-full w-full"
                  >
                    <EditableColor contentKey="nav_color_all_news" fallbackColor="#14B8A6" property="color" className="inline-flex">
                      <i className="ri-newspaper-line text-xs"></i>
                    </EditableColor>
                  </EditableImage>
                </span>
                {t('nav.all_news')}
              </Link>
              <div className="mx-3 my-1 border-t border-background-200/60"></div>
              <p className="px-4 py-1 text-[10px] font-semibold uppercase tracking-wider text-foreground-400">
                {t('nav.disciplines')}
              </p>
              {DYSCYPLINY.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={closeAllMenusDeferred}
                  className="flex items-center gap-2.5 px-4 py-2 text-sm text-foreground-600 hover:bg-background-100 hover:text-primary-600 transition-colors cursor-pointer active:bg-primary-100/50"
                >
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-background-100 dark:bg-background-200">
                  <EditableImage
                    contentKey={item.contentKey}
                    fallbackSrc={item.imgSrc || ''}
                    alt={item.label}
                    loading="lazy"
                    className="h-full w-full object-contain"
                    containerClassName="flex items-center justify-center h-full w-full"
                  >
                    {item.icon ? (
                      <EditableColor contentKey={item.iconColorKey} fallbackColor="#94A3B8" property="color" className="inline-flex">
                        <i className={`${item.icon} text-[10px]`}></i>
                      </EditableColor>
                    ) : null}
                  </EditableImage>
                </span>
                  {item.label}
                </Link>
              ))}
              </div>
            </div>
          </div>

          {/* O nas — hover dropdown */}
          <div
            ref={onasDropdown.ref}
            className="relative"
            onMouseEnter={openOnas}
            onMouseLeave={closeOnas}
          >
            <button
              type="button"
              className="flex items-center gap-1 cursor-pointer rounded-md px-3 py-2 text-sm font-medium text-foreground-600 transition-colors hover:bg-background-100 hover:text-primary-600 whitespace-nowrap active:bg-primary-100/50"
            >
              {t('nav.about')}
              <i className={`ri-arrow-down-s-line text-sm transition-transform duration-300 ${onasDropdown.isOpen ? 'rotate-180' : ''}`}></i>
            </button>
            <div
              className={`absolute top-full left-0 z-50 pt-1 ${
                onasDropdown.isOpen
                  ? 'opacity-100 visible translate-y-0'
                  : 'opacity-0 invisible -translate-y-1 pointer-events-none'
              } transition-all duration-200 ease-out`}
            >
              <div className="w-48 rounded-xl border border-background-200/70 bg-background-50 shadow-lg shadow-black/5 py-1.5">
              {O_NAS.map((item) => (
                item.href.startsWith('/#')
                  ? (
                    <button
                      key={item.href}
                      type="button"
                      onClick={() => handleSectionLink(item.href.slice(2))}
                      className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-foreground-600 hover:bg-background-100 hover:text-primary-600 transition-colors cursor-pointer active:bg-primary-100/50 text-left"
                    >
                      <span className="flex h-5 w-5 items-center justify-center rounded-md bg-background-100 dark:bg-background-200">
                        <EditableImage
                          contentKey={item.contentKey}
                          fallbackSrc=""
                          alt={item.label}
                          loading="lazy"
                          className="h-full w-full object-contain"
                          containerClassName="flex items-center justify-center h-full w-full"
                        >
                          <EditableColor contentKey={item.iconColorKey} fallbackColor="#94A3B8" property="color" className="inline-flex">
                            <i className={`${item.icon} text-[10px]`}></i>
                          </EditableColor>
                        </EditableImage>
                      </span>
                      {item.label}
                    </button>
                  )
                  : item.href.includes('#rezerwacja')
                    ? (
                      <button
                        key={item.href}
                        type="button"
                        onClick={handleBookingNav}
                        className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-foreground-600 hover:bg-background-100 hover:text-primary-600 transition-colors cursor-pointer active:bg-primary-100/50 text-left"
                      >
                        <span className="flex h-5 w-5 items-center justify-center rounded-md bg-background-100 dark:bg-background-200">
                          <EditableImage
                            contentKey={item.contentKey}
                            fallbackSrc=""
                            alt={item.label}
                            loading="lazy"
                            className="h-full w-full object-contain"
                            containerClassName="flex items-center justify-center h-full w-full"
                          >
                            <EditableColor contentKey={item.iconColorKey} fallbackColor="#94A3B8" property="color" className="inline-flex">
                              <i className={`${item.icon} text-[10px]`}></i>
                            </EditableColor>
                          </EditableImage>
                        </span>
                        {item.label}
                      </button>
                    )
                    : (
                      <Link
                        key={item.href}
                        to={item.href}
                        onClick={closeAllMenusDeferred}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground-600 hover:bg-background-100 hover:text-primary-600 transition-colors cursor-pointer active:bg-primary-100/50"
                      >
                        <span className="flex h-5 w-5 items-center justify-center rounded-md bg-background-100 dark:bg-background-200">
                          <EditableImage
                            contentKey={item.contentKey}
                            fallbackSrc=""
                            alt={item.label}
                            loading="lazy"
                            className="h-full w-full object-contain"
                            containerClassName="flex items-center justify-center h-full w-full"
                          >
                            <EditableColor contentKey={item.iconColorKey} fallbackColor="#94A3B8" property="color" className="inline-flex">
                              <i className={`${item.icon} text-xs`}></i>
                            </EditableColor>
                          </EditableImage>
                        </span>
                        {item.label}
                      </Link>
                    )
              ))}
              </div>
            </div>
          </div>

          {/* Certyfikacja */}
          <Link
            to="/certyfikacja"
            onClick={closeAllMenusDeferred}
            className="cursor-pointer rounded-md px-3 py-2 text-sm font-medium text-foreground-600 transition-colors hover:bg-background-100 hover:text-primary-600 whitespace-nowrap active:bg-primary-100/50"
          >
            {t('nav.certification')}
          </Link>

          {/* Kontakt */}
          <a
            href="/#kontakt"
            onClick={(e) => { e.preventDefault(); handleSectionLink('kontakt'); }}
            className="cursor-pointer rounded-md px-3 py-2 text-sm font-medium text-foreground-600 transition-colors hover:bg-background-100 hover:text-primary-600 whitespace-nowrap active:bg-primary-100/50"
          >
            {t('nav.contact')}
          </a>

        </div>

        <div className="flex items-center gap-2 md:gap-3">
          {/* Language switcher */}
          <button
            type="button"
            onClick={toggleLanguage}
            className={`hidden md:flex items-center gap-1.5 cursor-pointer rounded-full border border-background-200/70 bg-background-50 px-2.5 py-1.5 text-xs font-semibold text-foreground-600 transition-all hover:border-primary-300 hover:text-primary-600 hover:bg-primary-50/50 whitespace-nowrap active:scale-95 active:bg-primary-100/50 ${langAnimating ? 'scale-95' : ''}`}
            title={currentLang === 'pl' ? 'Switch to English' : 'Przełącz na polski'}
          >
            <span className={`flex h-4 w-4 items-center justify-center rounded-full bg-background-100 text-[10px] font-bold leading-none transition-transform duration-500 ${langAnimating ? 'rotate-[360deg]' : ''}`}>
              {currentLang === 'pl' ? 'PL' : 'EN'}
            </span>
            <i className={`ri-arrow-left-right-line text-xs transition-transform duration-500 ${langAnimating ? 'scale-125 text-primary-500' : ''}`}></i>
          </button>

          {/* Theme toggle */}
          <button
            type="button"
            onClick={handleThemeToggle}
            className="hidden md:flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-background-200/70 bg-background-50 text-foreground-600 transition-all hover:border-primary-300 hover:text-primary-600 hover:bg-primary-50/50 active:scale-90 active:bg-primary-100/50"
            title={theme === 'dark' ? 'Jasny motyw' : 'Ciemny motyw'}
          >
            <i className={`${themeIcon} text-sm transition-all duration-500 ${themeAnimating ? 'rotate-[360deg] scale-125' : ''}`}></i>
          </button>

          {/* Accessibility "A" button */}
          <div className="hidden md:block relative">
            <button
              ref={a11yBtnRef}
              type="button"
              onClick={() => setA11yMenuOpen(!a11yMenuOpen)}
              className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-2 text-base font-black leading-none transition-all active:scale-90 whitespace-nowrap shadow-sm ${
                highContrast
                  ? 'bg-[#FFD700] text-black border-[#FFD700] shadow-none'
                  : scrolled
                    ? 'border-primary-300 bg-background-50 text-primary-600 hover:bg-primary-50 hover:border-primary-400'
                    : 'border-white/60 bg-black/30 text-white hover:bg-black/50 hover:border-white/80'
              }`}
              title="Ułatwienia dostępu"
              aria-label="Ułatwienia dostępu — wysoki kontrast i rozmiar czcionki"
              aria-expanded={a11yMenuOpen}
            >
              A
            </button>

            {/* Accessibility popover */}
            <div
              ref={a11yPanelRef}
              className={`absolute right-0 top-full mt-2 z-50 w-60 rounded-xl border-2 bg-background-50 shadow-lg transition-all duration-200 ease-out ${
                a11yMenuOpen
                  ? 'opacity-100 visible translate-y-0'
                  : 'opacity-0 invisible -translate-y-1 pointer-events-none'
              } ${
                highContrast
                  ? 'border-[#FFD700] bg-black'
                  : 'border-background-200/70'
              }`}
            >
              <div className="p-4 space-y-4">
                {/* High contrast toggle */}
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-semibold whitespace-nowrap ${highContrast ? 'text-[#FFD700]' : 'text-foreground-800'}`}>
                    <i className={`${highContrast ? 'ri-contrast-2-fill text-[#FFD700]' : 'ri-contrast-2-line text-foreground-500'} mr-1.5`}></i>
                    Wysoki kontrast
                  </span>
                  <button
                    type="button"
                    onClick={toggleHighContrast}
                    role="switch"
                    aria-checked={highContrast}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-200 ${
                      highContrast
                        ? 'bg-[#FFD700] border-[#FFD700]'
                        : 'bg-background-200 border-background-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 rounded-full transition-transform duration-200 ${
                        highContrast ? 'translate-x-5 bg-black' : 'translate-x-0.5 bg-white'
                      }`}
                    />
                  </button>
                </div>

                {/* Separator */}
                <div className={`border-t ${highContrast ? 'border-[#FFD700]/40' : 'border-background-200/70'}`}></div>

                {/* Font size */}
                <div>
                  <p className={`text-xs font-semibold mb-2 whitespace-nowrap ${highContrast ? 'text-[#FFD700]/70' : 'text-foreground-500'}`}>
                    <i className={`${highContrast ? 'ri-font-size text-[#FFD700]' : 'ri-font-size text-foreground-400'} mr-1`}></i>
                    Rozmiar czcionki
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setFontSize('normal')}
                      className={`flex-1 py-1.5 rounded-md text-xs font-bold cursor-pointer transition-all whitespace-nowrap ${
                        fontSize === 'normal'
                          ? highContrast ? 'bg-[#FFD700] text-black' : 'bg-primary-500 text-white'
                          : highContrast ? 'text-[#FFD700] border border-[#FFD700]/40' : 'text-foreground-600 border border-background-200 bg-background-50 hover:bg-background-100'
                      }`}
                      title="Normalny rozmiar"
                    >
                      A
                    </button>
                    <button
                      type="button"
                      onClick={() => setFontSize('large')}
                      className={`flex-1 py-1.5 rounded-md text-sm font-bold cursor-pointer transition-all whitespace-nowrap ${
                        fontSize === 'large'
                          ? highContrast ? 'bg-[#FFD700] text-black' : 'bg-primary-500 text-white'
                          : highContrast ? 'text-[#FFD700] border border-[#FFD700]/40' : 'text-foreground-600 border border-background-200 bg-background-50 hover:bg-background-100'
                      }`}
                      title="Większy rozmiar"
                    >
                      A
                    </button>
                    <button
                      type="button"
                      onClick={() => setFontSize('xlarge')}
                      className={`flex-1 py-1.5 rounded-md text-base font-bold cursor-pointer transition-all whitespace-nowrap ${
                        fontSize === 'xlarge'
                          ? highContrast ? 'bg-[#FFD700] text-black' : 'bg-primary-500 text-white'
                          : highContrast ? 'text-[#FFD700] border border-[#FFD700]/40' : 'text-foreground-600 border border-background-200 bg-background-50 hover:bg-background-100'
                      }`}
                      title="Największy rozmiar"
                    >
                      A
                    </button>
                  </div>
                </div>

                {/* Keyboard hint */}
                <p className={`text-[10px] leading-relaxed ${highContrast ? 'text-[#FFD700]/50' : 'text-foreground-400'}`}>
                  <i className="ri-keyboard-line mr-1"></i>
                  Sterowanie: <strong>Tab</strong> nawigacja, <strong>Shift+Tab</strong> wstecz, <strong>Esc</strong> zamyka okna
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => { navigate('/certyfikacja'); closeAllMenus(); }}
            className="inline-flex items-center gap-1.5 md:gap-2 rounded-md bg-primary-500 px-2.5 py-1.5 md:px-4 md:py-2 text-xs md:text-sm font-semibold text-white transition-all hover:bg-primary-600 whitespace-nowrap cursor-pointer active:scale-95"
          >
            <EditableImage
              contentKey="home_icon_navbar_cta"
              fallbackSrc=""
              alt="Certyfikacja"
              loading="lazy"
              className="h-3.5 w-3.5 object-contain"
              containerClassName="inline-flex items-center"
            >
              <EditableColor contentKey="home_color_icon_navbar_cta" fallbackColor="#FFFFFF" property="color" className="inline-flex">
                <i className="ri-building-line text-sm"></i>
              </EditableColor>
            </EditableImage>
            {t('nav.write_to_us')}
          </button>
          <a
            href="https://www.youtube.com/@sportowy_vibe"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:inline-flex items-center gap-1.5 rounded-md bg-red-600 px-3 py-2 text-xs font-semibold text-white transition-all hover:bg-red-700 whitespace-nowrap cursor-pointer active:scale-95"
          >
            <i className="ri-youtube-fill text-sm"></i>
            {t('nav.subscribe')}
          </a>
          {isAdmin && (
            <Link
              to="/admin"
              className="hidden md:inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 transition-all hover:bg-red-100 hover:border-red-300 whitespace-nowrap cursor-pointer active:scale-95"
            >
              <EditableImage
                contentKey="home_icon_navbar_admin"
                fallbackSrc=""
                alt="Admin"
                loading="lazy"
                className="h-3.5 w-3.5 object-contain"
                containerClassName="inline-flex items-center"
              >
                <EditableColor contentKey="home_color_icon_navbar_admin" fallbackColor="#DC2626" property="color" className="inline-flex">
                  <i className="ri-shield-star-line text-sm"></i>
                </EditableColor>
              </EditableImage>
              Admin
            </Link>
          )}
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex md:hidden h-9 w-9 cursor-pointer items-center justify-center rounded-md text-foreground-600 hover:bg-background-100 hover:text-primary-600 transition-colors active:bg-primary-100/50"
            aria-label={t('nav.menu')}
          >
            <i className={`text-lg transition-transform duration-300 ${mobileOpen ? 'ri-close-line rotate-90' : 'ri-menu-line rotate-0'}`}></i>
          </button>
        </div>
      </div>

      {/* Mobile menu backdrop */}
      <div
        ref={backdropRef}
        className={`fixed inset-0 z-30 bg-black/40 transition-opacity duration-300 md:hidden ${
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setMobileOpen(false)}
      />

      {/* Mobile menu */}
      <div
        ref={mobileMenuRef}
        className={`md:hidden bg-background-50 px-4 overflow-hidden transition-all duration-300 ease-out relative z-30 ${
          mobileOpen
            ? 'max-h-[2000px] opacity-100 pt-4 pb-4 border-t border-background-200/70'
            : 'max-h-0 opacity-0 pt-0 pb-0 border-t-0'
        }`}
      >
          <div className="flex flex-col gap-1">

            {/* ── Mobile: Login / User section ── */}
            {user ? (
              <>
                <div className="mb-2 rounded-lg border border-background-200/60 bg-background-100/50 p-3">
                  <div className="flex items-center gap-3">
                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={profile?.display_name || 'Avatar'}
                        className="h-9 w-9 rounded-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-primary-600 font-bold text-sm">
                        {(profile?.display_name || profile?.username || user.email || '?').charAt(0).toUpperCase()}
                      </span>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground-800 truncate">
                        Witaj, {profile?.display_name || profile?.username || user.email?.split('@')[0] || 'Użytkownik'}
                      </p>
                      <p className="text-xs text-foreground-500 truncate">{user.email}</p>
                    </div>
                    <button
                      type="button"
                      onClick={async () => { await hardSignOut(); closeAllMenus(); }}
                      className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-foreground-400 hover:bg-red-50 hover:text-red-500 transition-colors active:bg-red-100"
                      title="Wyloguj się"
                    >
                      <i className="ri-logout-box-line text-sm"></i>
                    </button>
                  </div>
                </div>

                {/* Zalogowane: Strefa Kibica + Ustawienia + Admin */}
                <div className="mb-2 space-y-0.5">
                  <button
                    type="button"
                    onClick={() => handleMobileSubNav('/strefa-kibica')}
                    className="flex w-full items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium text-foreground-700 hover:bg-primary-50 hover:text-primary-600 transition-colors cursor-pointer active:bg-primary-100/50 text-left"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent-50 text-accent-500">
                      <EditableImage
                        contentKey="nav_icon_fan_zone"
                        fallbackSrc=""
                        alt={t('fan_zone.badge')}
                        loading="lazy"
                        className="h-full w-full object-contain"
                        containerClassName="flex items-center justify-center h-full w-full"
                      >
                        <EditableColor contentKey="nav_color_fan_zone" fallbackColor="#F59E0B" property="color" className="inline-flex">
                          <i className="ri-football-line text-sm"></i>
                        </EditableColor>
                      </EditableImage>
                    </span>
                    {t('fan_zone.badge')}
                    <i className="ri-arrow-right-s-line text-xs ml-auto text-foreground-300"></i>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMobileSubNav('/ustawienia-konta')}
                    className="flex w-full items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium text-foreground-700 hover:bg-primary-50 hover:text-primary-600 transition-colors cursor-pointer active:bg-primary-100/50 text-left"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary-50 text-primary-500">
                      <EditableImage
                        contentKey="nav_icon_settings"
                        fallbackSrc=""
                        alt={t('settings.title')}
                        loading="lazy"
                        className="h-full w-full object-contain"
                        containerClassName="flex items-center justify-center h-full w-full"
                      >
                        <EditableColor contentKey="nav_color_settings" fallbackColor="#14B8A6" property="color" className="inline-flex">
                          <i className="ri-settings-3-line text-sm"></i>
                        </EditableColor>
                      </EditableImage>
                    </span>
                    {t('settings.title')}
                    <i className="ri-arrow-right-s-line text-xs ml-auto text-foreground-300"></i>
                  </button>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => handleMobileSubNav('/admin')}
                      className="flex w-full items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors cursor-pointer active:bg-red-100 text-left"
                    >
                      <span className="flex h-7 w-7 items-center justify-center rounded-md bg-red-50 text-red-500">
                        <i className="ri-shield-star-line text-sm"></i>
                      </span>
                      Panel Admina
                      <i className="ri-arrow-right-s-line text-xs ml-auto text-red-400"></i>
                    </button>
                  )}
                </div>
              </>
            ) : (
              <button
                type="button"
                onClick={() => { setAuthModalOpen(true); }}
                className="flex w-full items-center gap-3 cursor-pointer rounded-md px-3 py-2.5 text-sm font-semibold text-primary-600 hover:bg-primary-50 transition-colors active:bg-primary-100/50 mb-1"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-50 text-primary-500">
                  <EditableImage
                    contentKey="nav_icon_login"
                    fallbackSrc=""
                    alt="Zaloguj się"
                    loading="lazy"
                    className="h-full w-full object-contain"
                    containerClassName="flex items-center justify-center h-full w-full"
                  >
                    <EditableColor contentKey="nav_color_login" fallbackColor="#14B8A6" property="color" className="inline-flex">
                      <i className="ri-login-box-line text-sm"></i>
                    </EditableColor>
                  </EditableImage>
                </span>
                Zaloguj się
                <i className="ri-arrow-right-line text-xs ml-auto text-primary-400"></i>
              </button>
            )}

            {/* Separator after login section */}
            <div className="border-t border-background-200/60 my-1"></div>

            <button
              type="button"
              onClick={() => {
                if (location.pathname === '/') {
                  closeAllMenus();
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                } else {
                  navigate('/');
                  closeAllMenus();
                }
              }}
              className="flex w-full items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium text-foreground-600 transition-colors hover:bg-background-100 hover:text-primary-600 cursor-pointer active:bg-primary-100/50 text-left"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-background-100 text-foreground-400">
                <EditableImage
                  contentKey="nav_icon_home"
                  fallbackSrc=""
                  alt={t('nav.home')}
                  loading="lazy"
                  className="h-full w-full object-contain"
                  containerClassName="flex items-center justify-center h-full w-full"
                >
                  <EditableColor contentKey="nav_color_home" fallbackColor="#94A3B8" property="color" className="inline-flex">
                    <i className="ri-home-4-line text-[10px]"></i>
                  </EditableColor>
                </EditableImage>
              </span>
              {t('nav.home')}
            </button>

            {/* Mobile Aktualności */}
            <div>
              <button
                type="button"
                onClick={() => setMobileAktualOpen(!mobileAktualOpen)}
                className="flex w-full items-center justify-between rounded-md px-3 py-2.5 text-sm font-medium text-foreground-600 hover:bg-background-100 hover:text-primary-600 cursor-pointer active:bg-primary-100/50"
              >
                <span className="flex items-center gap-2.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-background-100 text-foreground-400">
                    <EditableImage
                      contentKey="nav_icon_news_section"
                      fallbackSrc=""
                      alt={t('nav.news')}
                      loading="lazy"
                      className="h-full w-full object-contain"
                      containerClassName="flex items-center justify-center h-full w-full"
                    >
                      <EditableColor contentKey="nav_color_news_section" fallbackColor="#94A3B8" property="color" className="inline-flex">
                        <i className="ri-newspaper-line text-[10px]"></i>
                      </EditableColor>
                    </EditableImage>
                  </span>
                  {t('nav.news')}
                </span>
                <i className={`ri-arrow-down-s-line transition-transform duration-300 text-sm ${mobileAktualOpen ? 'rotate-180' : ''}`}></i>
              </button>
              <div className={`ml-4 border-l-2 border-background-200/50 pl-3 overflow-hidden transition-all duration-300 ease-out ${mobileAktualOpen ? 'max-h-[600px] opacity-100 mt-1' : 'max-h-0 opacity-0 mt-0'}`}>
                <div className="space-y-0.5">
                  <button
                    type="button"
                    onClick={() => handleMobileSubNav('/aktualnosci')}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-foreground-700 hover:bg-background-100 cursor-pointer active:bg-primary-100/50 text-left"
                  >
                    <EditableImage
                      contentKey="nav_icon_all_news"
                      fallbackSrc=""
                      alt={t('nav.all_news')}
                      loading="lazy"
                      className="h-3.5 w-3.5 object-contain inline-block"
                      containerClassName="inline-flex items-center"
                    >
                      <EditableColor contentKey="nav_color_all_news" fallbackColor="#14B8A6" property="color" className="inline-flex">
                        <i className="ri-newspaper-line text-xs"></i>
                      </EditableColor>
                    </EditableImage>
                    {t('nav.all_news')}
                  </button>
                  {DYSCYPLINY.map((item) => (
                    <button
                      key={item.href}
                      type="button"
                      onClick={() => handleMobileSubNav(item.href)}
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground-500 hover:bg-background-100 hover:text-foreground-700 cursor-pointer active:bg-primary-100/50 text-left"
                    >
                      <span className="flex h-5 w-5 items-center justify-center rounded bg-background-100 dark:bg-background-200">
                        <EditableImage
                          contentKey={item.contentKey}
                          fallbackSrc={item.imgSrc || ''}
                          alt={item.label}
                          loading="lazy"
                          className="h-full w-full object-contain"
                          containerClassName="flex items-center justify-center h-full w-full"
                        >
                          {item.icon ? (
                            <EditableColor contentKey={item.iconColorKey} fallbackColor="#94A3B8" property="color" className="inline-flex">
                              <i className={`${item.icon} text-[10px]`}></i>
                            </EditableColor>
                          ) : null}
                        </EditableImage>
                      </span>
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Mobile O nas */}
            <div>
              <button
                type="button"
                onClick={() => setMobileOnasOpen(!mobileOnasOpen)}
                className="flex w-full items-center justify-between rounded-md px-3 py-2.5 text-sm font-medium text-foreground-600 hover:bg-background-100 hover:text-primary-600 cursor-pointer active:bg-primary-100/50"
              >
                <span className="flex items-center gap-2.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-background-100 text-foreground-400">
                    <EditableImage
                      contentKey="nav_icon_about_section"
                      fallbackSrc=""
                      alt={t('nav.about')}
                      loading="lazy"
                      className="h-full w-full object-contain"
                      containerClassName="flex items-center justify-center h-full w-full"
                    >
                      <EditableColor contentKey="nav_color_about_section" fallbackColor="#94A3B8" property="color" className="inline-flex">
                        <i className="ri-team-line text-[10px]"></i>
                      </EditableColor>
                    </EditableImage>
                  </span>
                  {t('nav.about')}
                </span>
                <i className={`ri-arrow-down-s-line transition-transform duration-300 text-sm ${mobileOnasOpen ? 'rotate-180' : ''}`}></i>
              </button>
              <div className={`ml-4 border-l-2 border-background-200/50 pl-3 overflow-hidden transition-all duration-300 ease-out ${mobileOnasOpen ? 'max-h-[600px] opacity-100 mt-1' : 'max-h-0 opacity-0 mt-0'}`}>
                <div className="space-y-0.5">
                  {O_NAS.map((item) => (
                    item.href.startsWith('/#')
                      ? (
                        <button
                          key={item.href}
                          type="button"
                          onClick={() => handleMobileSectionNav(item.href.slice(2))}
                          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground-500 hover:bg-background-100 hover:text-foreground-700 cursor-pointer active:bg-primary-100/50 text-left"
                        >
                          <span className="flex h-5 w-5 items-center justify-center rounded bg-background-100 dark:bg-background-200">
                            <EditableImage
                              contentKey={item.contentKey}
                              fallbackSrc=""
                              alt={item.label}
                              loading="lazy"
                              className="h-full w-full object-contain"
                              containerClassName="flex items-center justify-center h-full w-full"
                            >
                              <EditableColor contentKey={item.iconColorKey} fallbackColor="#94A3B8" property="color" className="inline-flex">
                                <i className={`${item.icon} text-[10px]`}></i>
                              </EditableColor>
                            </EditableImage>
                          </span>
                          {item.label}
                        </button>
                      )
                      : item.href.includes('#rezerwacja')
                        ? (
                          <button
                            key={item.href}
                            type="button"
                            onClick={handleBookingNav}
                            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground-500 hover:bg-background-100 hover:text-foreground-700 cursor-pointer active:bg-primary-100/50 text-left"
                          >
                            <span className="flex h-5 w-5 items-center justify-center rounded bg-background-100 dark:bg-background-200">
                              <EditableImage
                                contentKey={item.contentKey}
                                fallbackSrc=""
                                alt={item.label}
                                loading="lazy"
                                className="h-full w-full object-contain"
                                containerClassName="flex items-center justify-center h-full w-full"
                              >
                                <EditableColor contentKey={item.iconColorKey} fallbackColor="#94A3B8" property="color" className="inline-flex">
                                  <i className={`${item.icon} text-[10px]`}></i>
                                </EditableColor>
                              </EditableImage>
                            </span>
                            {item.label}
                          </button>
                        )
                        : (
                          <button
                            key={item.href}
                            type="button"
                            onClick={() => handleMobileSubNav(item.href)}
                            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground-500 hover:bg-background-100 hover:text-foreground-700 cursor-pointer active:bg-primary-100/50 text-left"
                          >
                            <span className="flex h-5 w-5 items-center justify-center rounded bg-background-100 dark:bg-background-200">
                              <EditableImage
                                contentKey={item.contentKey}
                                fallbackSrc=""
                                alt={item.label}
                                loading="lazy"
                                className="h-full w-full object-contain"
                                containerClassName="flex items-center justify-center h-full w-full"
                              >
                                <EditableColor contentKey={item.iconColorKey} fallbackColor="#94A3B8" property="color" className="inline-flex">
                                  <i className={`${item.icon} text-xs`}></i>
                                </EditableColor>
                              </EditableImage>
                            </span>
                            {item.label}
                          </button>
                        )
                  ))}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleMobileSubNav('/certyfikacja')}
              className="flex w-full items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium text-foreground-600 transition-colors hover:bg-background-100 hover:text-primary-600 cursor-pointer active:bg-primary-100/50 text-left"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-background-100 text-foreground-400">
                <EditableImage
                  contentKey="nav_icon_certification"
                  fallbackSrc=""
                  alt={t('nav.certification')}
                  loading="lazy"
                  className="h-full w-full object-contain"
                  containerClassName="flex items-center justify-center h-full w-full"
                >
                  <EditableColor contentKey="nav_color_certification" fallbackColor="#94A3B8" property="color" className="inline-flex">
                    <i className="ri-verified-badge-line text-[10px]"></i>
                  </EditableColor>
                </EditableImage>
              </span>
              {t('nav.certification')}
            </button>

            <button
              type="button"
              onClick={() => handleMobileSectionNav('kontakt')}
              className="flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium text-foreground-600 transition-colors hover:bg-background-100 hover:text-primary-600 cursor-pointer w-full text-left active:bg-primary-100/50"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-background-100 text-foreground-400">
                <EditableImage
                  contentKey="nav_icon_contact"
                  fallbackSrc=""
                  alt={t('nav.contact')}
                  loading="lazy"
                  className="h-full w-full object-contain"
                  containerClassName="flex items-center justify-center h-full w-full"
                >
                  <EditableColor contentKey="nav_color_contact" fallbackColor="#94A3B8" property="color" className="inline-flex">
                    <i className="ri-mail-send-line text-[10px]"></i>
                  </EditableColor>
                </EditableImage>
              </span>
              {t('nav.contact')}
            </button>

            {/* Mobile Regulaminy */}
            <div>
              <button
                type="button"
                onClick={() => setMobileRegulaminyOpen(!mobileRegulaminyOpen)}
                className="flex w-full items-center justify-between rounded-md px-3 py-2.5 text-sm font-medium text-foreground-500 transition-colors hover:bg-background-100 hover:text-primary-600 cursor-pointer active:bg-primary-100/50"
              >
                <span className="flex items-center gap-2.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-background-100 text-foreground-400">
                    <EditableImage
                      contentKey="nav_icon_regulations_section"
                      fallbackSrc=""
                      alt={t('nav.regulations')}
                      loading="lazy"
                      className="h-full w-full object-contain"
                      containerClassName="flex items-center justify-center h-full w-full"
                    >
                      <EditableColor contentKey="nav_color_regulations_section" fallbackColor="#94A3B8" property="color" className="inline-flex">
                        <i className="ri-file-list-3-line text-[10px]"></i>
                      </EditableColor>
                    </EditableImage>
                  </span>
                  {t('nav.regulations')}
                </span>
                <i className={`ri-arrow-down-s-line transition-transform duration-300 text-sm ${mobileRegulaminyOpen ? 'rotate-180' : ''}`}></i>
              </button>
              <div className={`ml-4 border-l-2 border-background-200/50 pl-3 overflow-hidden transition-all duration-300 ease-out ${mobileRegulaminyOpen ? 'max-h-[600px] opacity-100 mt-1' : 'max-h-0 opacity-0 mt-0'}`}>
                <div className="space-y-0.5">
                  {REGULAMINY.map((item) => (
                    <button
                      key={item.href}
                      type="button"
                      onClick={() => handleMobileSubNav(item.href)}
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground-500 hover:bg-background-100 hover:text-foreground-700 cursor-pointer active:bg-primary-100/50 text-left"
                    >
                      <span className="flex h-5 w-5 items-center justify-center rounded bg-background-100 dark:bg-background-200">
                        <EditableImage
                          contentKey={item.contentKey}
                          fallbackSrc=""
                          alt={item.label}
                          loading="lazy"
                          className="h-full w-full object-contain"
                          containerClassName="flex items-center justify-center h-full w-full"
                        >
                          <EditableColor contentKey={item.iconColorKey} fallbackColor="#94A3B8" property="color" className="inline-flex">
                            <i className={`${item.icon} text-[10px]`}></i>
                          </EditableColor>
                        </EditableImage>
                      </span>
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Mobile settings row: accessibility + theme + language */}
            <div className="mt-2 pt-2 border-t border-background-200/60">
              {/* Accessibility */}
              <div className="mb-1">
                <button
                  type="button"
                  onClick={() => {
                    setA11yMenuOpen(!a11yMenuOpen);
                  }}
                  className={`flex w-full items-center gap-3 cursor-pointer rounded-md px-3 py-2.5 text-sm font-medium transition-colors active:bg-primary-100/50 ${
                    highContrast
                      ? 'text-[#FFD700] hover:bg-[#FFD700]/10'
                      : 'text-foreground-600 hover:bg-background-100 hover:text-primary-600'
                  }`}
                >
                  <span className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-black ${
                    highContrast ? 'bg-[#FFD700] text-black' : 'bg-background-100 text-foreground-700'
                  }`}>
                    A
                  </span>
                  <span>Ułatwienia dostępu</span>
                  <span className={`ml-auto text-xs font-semibold ${highContrast ? 'text-[#FFD700]' : 'text-foreground-400'}`}>
                    {highContrast ? 'WL.' : 'WYŁ.'}
                  </span>
                </button>

                {/* Mobile a11y sub-panel */}
                <div className={`ml-4 border-l-2 ${highContrast ? 'border-[#FFD700]/40' : 'border-background-200/50'} pl-3 overflow-hidden transition-all duration-300 ease-out ${
                  a11yMenuOpen ? 'max-h-[300px] opacity-100 mt-1' : 'max-h-0 opacity-0 mt-0'
                }`}>
                  <div className="space-y-2 pb-1">
                    {/* High contrast mobile toggle */}
                    <button
                      type="button"
                      onClick={toggleHighContrast}
                      className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm cursor-pointer transition-colors text-left whitespace-nowrap ${
                        highContrast
                          ? 'text-[#FFD700] bg-[#FFD700]/10'
                          : 'text-foreground-600 hover:bg-background-100'
                      }`}
                    >
                      <i className={`text-xs ${highContrast ? 'ri-contrast-2-fill text-[#FFD700]' : 'ri-contrast-2-line'}`}></i>
                      <span>Wysoki kontrast</span>
                      <span className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded ${highContrast ? 'bg-[#FFD700] text-black' : 'bg-background-200 text-foreground-500'}`}>
                        {highContrast ? 'WL.' : 'WYŁ.'}
                      </span>
                    </button>

                    {/* Font size mobile */}
                    <p className="px-3 pt-1 text-[10px] font-semibold uppercase tracking-wider text-foreground-400">Rozmiar czcionki</p>
                    <div className="flex gap-1 px-3">
                      {(['normal', 'large', 'xlarge'] as const).map((size) => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => setFontSize(size)}
                          className={`flex-1 py-1.5 rounded-md text-xs font-bold cursor-pointer transition-all whitespace-nowrap ${
                            fontSize === size
                              ? highContrast ? 'bg-[#FFD700] text-black' : 'bg-primary-500 text-white'
                              : highContrast ? 'text-[#FFD700] border border-[#FFD700]/40' : 'text-foreground-600 border border-background-200 bg-background-50'
                          }`}
                        >
                          {size === 'normal' ? 'A' : size === 'large' ? 'A+' : 'A++'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  handleThemeToggle();
                  setMobileOpen(false);
                }}
                className="flex w-full items-center gap-3 cursor-pointer rounded-md px-3 py-2.5 text-sm font-medium text-foreground-600 hover:bg-background-100 hover:text-primary-600 transition-colors active:bg-primary-100/50"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-background-100 text-foreground-700">
                  <i className={`${themeIcon} text-sm`}></i>
                </span>
                <span>{theme === 'dark' ? 'Jasny motyw' : 'Ciemny motyw'}</span>
                <i className="ri-contrast-2-line text-xs ml-auto text-foreground-400"></i>
              </button>
              <button
                type="button"
                onClick={() => {
                  toggleLanguage();
                  setMobileOpen(false);
                }}
                className="flex w-full items-center gap-3 cursor-pointer rounded-md px-3 py-2.5 text-sm font-medium text-foreground-600 hover:bg-background-100 hover:text-primary-600 transition-colors active:bg-primary-100/50"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-background-100 text-xs font-bold text-foreground-700">
                  {currentLang === 'pl' ? 'EN' : 'PL'}
                </span>
                <span>{currentLang === 'pl' ? 'English' : 'Polski'}</span>
                <i className="ri-arrow-left-right-line text-xs ml-auto text-foreground-400"></i>
              </button>
            </div>
          </div>
      </div>
      {/* Auth Modal */}
      <Suspense fallback={null}>
        <AuthModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} />
      </Suspense>
    </nav>
  );
}