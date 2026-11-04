import { useEffect, useRef, useState, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useWeather } from '@/hooks/useWeather';
import EditableImage from '@/components/feature/EditableImage';
import EditableColor from '@/components/feature/EditableColor';

const AuthModal = lazy(() => import('@/components/feature/AuthModal'));

export default function TopBar() {
  const { t } = useTranslation();
  const { user, profile, hardSignOut } = useAuth();
  const [now, setNow] = useState(new Date());
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const weather = useWeather();

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClick);
    }
    return () => document.removeEventListener('mousedown', handleClick);
  }, [userMenuOpen]);

  const days = [
    'Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota'
  ];
  const months = [
    'stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca',
    'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia'
  ];

  const dayName = days[now.getDay()];
  const dayNum = now.getDate();
  const monthName = months[now.getMonth()];
  const timeStr = now.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const displayName = profile?.display_name || profile?.username || user?.email?.split('@')[0] || t('topbar.greeting');
  const avatarUrl = profile?.avatar_url;
  const initial = (displayName || '?').charAt(0).toUpperCase();

  return (
    <div className="h-9 bg-background-100 border-b border-background-200/60">
      <div className="mx-auto flex h-full max-w-[1400px] items-center justify-center md:justify-between px-4 md:px-6">
        {/* Left spacer on desktop */}
        <div className="hidden md:block flex-1" />

        {/* Center: date / time / weather */}
        <div className="flex items-center gap-3 text-xs">
          <span className="text-primary-700 font-medium whitespace-nowrap">{dayName}, {dayNum} {monthName}</span>
          <span className="text-foreground-300 select-none">|</span>
          <span className="text-primary-700 font-medium whitespace-nowrap tabular-nums inline-flex items-center gap-1">
            <span className="flex h-4 w-4 items-center justify-center">
              <EditableImage
                contentKey="topbar_icon_time"
                fallbackSrc=""
                alt="Czas"
                loading="lazy"
                className="h-full w-full object-contain"
                containerClassName="flex items-center justify-center h-full w-full"
                width={16}
                height={16}
              >
                <EditableColor contentKey="topbar_color_time" fallbackColor="#14B8A6" property="color" className="inline-flex">
                  <i className="ri-time-line text-[11px]"></i>
                </EditableColor>
              </EditableImage>
            </span>
            {timeStr}
          </span>
          <span className="text-foreground-300 select-none">|</span>
          <span className="text-primary-700 font-medium whitespace-nowrap inline-flex items-center gap-1 min-w-[80px]">
            <span className="flex h-4 w-4 items-center justify-center">
              <EditableImage
                contentKey="topbar_icon_weather"
                fallbackSrc=""
                alt="Pogoda"
                loading="lazy"
                className="h-full w-full object-contain"
                containerClassName="flex items-center justify-center h-full w-full"
                width={16}
                height={16}
              >
                <EditableColor contentKey="topbar_color_weather" fallbackColor="#14B8A6" property="color" className="inline-flex">
                  <i className={`${weather.icon} text-xs`}></i>
                </EditableColor>
              </EditableImage>
            </span>
            {weather.loading ? '...' : weather.error ? `${weather.city} —°C` : `${weather.city} ${weather.temperature}°C`}
          </span>
        </div>

        {/* Right: desktop user section */}
        <div className="hidden md:flex flex-1 justify-end">
          {user ? (
            <div ref={menuRef} className="relative">
              <button
                type="button"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 cursor-pointer rounded-full border border-background-200/70 bg-background-50 pl-1.5 pr-2.5 py-0.5 text-xs font-medium text-foreground-700 transition-all hover:border-primary-300 hover:text-primary-600 hover:bg-primary-50/50 whitespace-nowrap active:scale-95"
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="h-5 w-5 rounded-full object-cover"
                    width={20}
                    height={20}
                  />
                ) : (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-100 text-primary-600 font-bold text-[10px]">
                    {initial}
                  </span>
                )}
                <span className="max-w-[120px] truncate">{displayName}</span>
                <i className={`ri-arrow-down-s-line text-xs transition-transform ${userMenuOpen ? 'rotate-180' : ''}`}></i>
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-48 rounded-xl border border-background-200/70 bg-background-50 shadow-lg shadow-black/5 py-1.5 z-50 origin-top">
                  <Link
                    to="/strefa-kibica"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-sm text-foreground-700 hover:bg-background-100 hover:text-primary-600 transition-colors cursor-pointer active:bg-primary-100/50"
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accent-50 text-accent-500">
                      <EditableImage
                        contentKey="topbar_icon_fan_zone"
                        fallbackSrc=""
                        alt={t('topbar.fan_zone')}
                        loading="lazy"
                        className="h-full w-full object-contain"
                        containerClassName="flex items-center justify-center h-full w-full"
                        width={16}
                        height={16}
                      >
                        <EditableColor contentKey="topbar_color_fan_zone" fallbackColor="#F59E0B" property="color" className="inline-flex">
                          <i className="ri-football-line text-xs"></i>
                        </EditableColor>
                      </EditableImage>
                    </span>
                    {t('topbar.fan_zone')}
                  </Link>
                  <Link
                    to="/ustawienia-konta"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-sm text-foreground-700 hover:bg-background-100 hover:text-primary-600 transition-colors cursor-pointer active:bg-primary-100/50"
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary-50 text-primary-500">
                      <EditableImage
                        contentKey="topbar_icon_settings"
                        fallbackSrc=""
                        alt={t('topbar.account_settings')}
                        loading="lazy"
                        className="h-full w-full object-contain"
                        containerClassName="flex items-center justify-center h-full w-full"
                        width={16}
                        height={16}
                      >
                        <EditableColor contentKey="topbar_color_settings" fallbackColor="#14B8A6" property="color" className="inline-flex">
                          <i className="ri-settings-3-line text-xs"></i>
                        </EditableColor>
                      </EditableImage>
                    </span>
                    {t('topbar.account_settings')}
                  </Link>
                  <div className="mx-3 my-1 border-t border-background-200/60"></div>
                  <button
                    type="button"
                    onClick={async () => {
                      await hardSignOut();
                      setUserMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors cursor-pointer active:bg-red-100 text-left"
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-red-50 text-red-500">
                      <EditableImage
                        contentKey="topbar_icon_logout"
                        fallbackSrc=""
                        alt={t('topbar.logout')}
                        loading="lazy"
                        className="h-full w-full object-contain"
                        containerClassName="flex items-center justify-center h-full w-full"
                        width={16}
                        height={16}
                      >
                        <EditableColor contentKey="topbar_color_logout" fallbackColor="#EF4444" property="color" className="inline-flex">
                          <i className="ri-logout-box-r-line text-xs"></i>
                        </EditableColor>
                      </EditableImage>
                    </span>
                    {t('topbar.logout')}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAuthModalOpen(true)}
              className="flex items-center gap-1.5 cursor-pointer rounded-full border border-background-200/70 bg-background-50 px-2.5 py-0.5 text-xs font-semibold text-foreground-600 transition-all hover:border-primary-300 hover:text-primary-600 hover:bg-primary-50/50 whitespace-nowrap active:scale-95"
            >
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary-50 text-primary-500">
                <EditableImage
                  contentKey="topbar_icon_login"
                  fallbackSrc=""
                  alt={t('topbar.login')}
                  loading="lazy"
                  className="h-full w-full object-contain"
                  containerClassName="flex items-center justify-center h-full w-full"
                  width={16}
                  height={16}
                >
                  <EditableColor contentKey="topbar_color_login" fallbackColor="#14B8A6" property="color" className="inline-flex">
                    <i className="ri-login-box-line text-[10px]"></i>
                  </EditableColor>
                </EditableImage>
              </span>
              {t('topbar.login')}
            </button>
          )}
        </div>
      </div>

      <Suspense fallback={null}>
        <AuthModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} />
      </Suspense>
    </div>
  );
}