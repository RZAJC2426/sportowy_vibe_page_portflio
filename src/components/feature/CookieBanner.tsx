import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import EditableImage from '@/components/feature/EditableImage';
import EditableText from '@/components/feature/EditableText';

interface CookiePrefs {
  analytics: boolean;
  marketing: boolean;
}

const LOGO_URL = 'https://storage.helloreaddy.io/project_files/6b577641-b4ea-4107-bb56-5f8fbbf97e07/687e25f1-60ff-44dc-93cf-e610e507823b_compressed_logo-bez-sloganu_blue.webp';

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [hasConsent, setHasConsent] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  const [prefs, setPrefs] = useState<CookiePrefs>({ analytics: false, marketing: false });

  useEffect(() => {
    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }

    const consent = localStorage.getItem('cookie_consent');
    if (!consent) {
      gtag('consent', 'default', {
        analytics_storage: 'denied',
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
      });
      setIsVisible(true);
    } else {
      setHasConsent(true);
    }
  }, []);

  const closeBanner = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      setIsExiting(false);
      setShowCustomize(false);
    }, 300);
  };

  const handleConsent = async (type: 'necessary' | 'all') => {
    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }

    const consentUpdate =
      type === 'all'
        ? {
            analytics_storage: 'granted',
            ad_storage: 'granted',
            ad_user_data: 'granted',
            ad_personalization: 'granted',
          }
        : {
            analytics_storage: 'denied',
            ad_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalization: 'denied',
          };

    gtag('consent', 'update', consentUpdate);
    window.dataLayer.push({ event: 'cookie_consent_update', consent_type: type });

    try {
      await supabase.from('cookie_consents').insert([{ consent_type: type }]);
    } catch {
      // ciche niepowodzenie
    }

    localStorage.setItem('cookie_consent', type);
    localStorage.removeItem('cookie_prefs');
    setHasConsent(true);
    closeBanner();
  };

  const openCustomize = () => {
    const consent = localStorage.getItem('cookie_consent');
    const savedPrefs = localStorage.getItem('cookie_prefs');

    if (savedPrefs) {
      try {
        const parsed = JSON.parse(savedPrefs);
        setPrefs({
          analytics: !!parsed.analytics,
          marketing: !!parsed.marketing,
        });
      } catch {
        setPrefs({ analytics: false, marketing: false });
      }
    } else if (consent === 'all') {
      setPrefs({ analytics: true, marketing: true });
    } else if (consent === 'necessary') {
      setPrefs({ analytics: false, marketing: false });
    } else {
      setPrefs({ analytics: false, marketing: false });
    }

    setShowCustomize(true);
  };

  const handleSaveCustom = async () => {
    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }

    const consentUpdate = {
      analytics_storage: prefs.analytics ? 'granted' : 'denied',
      ad_storage: prefs.marketing ? 'granted' : 'denied',
      ad_user_data: prefs.marketing ? 'granted' : 'denied',
      ad_personalization: prefs.marketing ? 'granted' : 'denied',
    };

    gtag('consent', 'update', consentUpdate);
    window.dataLayer.push({ event: 'cookie_consent_update', consent_type: 'custom' });

    let consentType: 'necessary' | 'all' | 'custom';
    if (prefs.analytics && prefs.marketing) {
      consentType = 'all';
    } else if (!prefs.analytics && !prefs.marketing) {
      consentType = 'necessary';
    } else {
      consentType = 'custom';
    }

    try {
      await supabase.from('cookie_consents').insert([{ consent_type: consentType }]);
    } catch {
      // ciche niepowodzenie
    }

    localStorage.setItem('cookie_consent', consentType);
    if (consentType === 'custom') {
      localStorage.setItem('cookie_prefs', JSON.stringify(prefs));
    } else {
      localStorage.removeItem('cookie_prefs');
    }

    setHasConsent(true);
    closeBanner();
  };

  const reopenBanner = () => {
    setShowCustomize(false);
    setIsVisible(true);
  };

  return (
    <>
      {/* Overlay + Modal */}
      {isVisible && (
        <div
          className={`fixed inset-0 z-[99999] bg-black/70 flex items-center justify-center p-4 transition-opacity duration-300 ${
            isExiting ? 'opacity-0' : 'opacity-100'
          }`}
          aria-modal="true"
          role="dialog"
          aria-label="Ustawienia plików cookie"
        >
          <div
            className={`w-full max-w-lg bg-background-50 rounded-2xl border border-background-200 overflow-hidden transition-all duration-300 ${
              isExiting ? 'opacity-0 scale-95 translate-y-4' : 'opacity-100 scale-100 translate-y-0'
            }`}
          >
            {/* Górny pasek z logo i badge */}
            <div className="flex items-center justify-between px-6 pt-6 pb-3">
              <img
                src={LOGO_URL}
                alt="Sportowy Vibe"
                className="h-8 w-auto object-contain"
                width={160}
                height={36}
                loading="eager"
                decoding="async"
              />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-primary-700 bg-primary-100 px-2.5 py-1 rounded-full">
                RODO &amp; Cookies
              </span>
            </div>

            {/* Treść */}
            <div className="px-6 pb-2">
              <h3 className="text-lg font-bold text-foreground-950 mb-2">
                <EditableText
                  contentKey="cookie_banner_title"
                  fallback="Dbamy o Twój sportowy vibe!"
                  as="span"
                />
              </h3>
              <p className="text-sm leading-relaxed text-foreground-600">
                <EditableText
                  contentKey="cookie_banner_desc"
                  fallback={'Portal sportowyvibe.pl korzysta z plików cookie oraz narzędzi analitycznych Google w celu mierzenia ruchu i ulepszania treści. Klikając „Akceptuję wszystkie", zgadzasz się na wykorzystanie wszystkich plików cookie. Możesz też wybrać tylko niezbędne — strona będzie działać, ale bez pomiarów analitycznych.'}
                  as="span"
                />
              </p>
              <p className="text-xs leading-relaxed text-foreground-500 mt-2">
                <EditableText
                  contentKey="cookie_banner_legal_note"
                  fallback="Szczegóły znajdziesz w dokumentach prawnych poniżej. W każdej chwili możesz zmienić swoją decyzję klikając ikonę ciasteczka w rogu ekranu."
                  as="span"
                />
              </p>
            </div>

            {/* Linki do dokumentów — otwierane w nowej karcie */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-6 py-3 border-t border-b border-background-200 text-[11px] text-foreground-500">
              <Link
                to="/polityka-prywatnosci"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary-600 hover:underline transition-colors whitespace-nowrap"
              >
                Polityka prywatności
              </Link>
              <span className="text-background-300 select-none">|</span>
              <Link
                to="/regulamin-serwisu"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary-600 hover:underline transition-colors whitespace-nowrap"
              >
                Regulamin serwisu
              </Link>
              <span className="text-background-300 select-none">|</span>
              <Link
                to="/rodo"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary-600 hover:underline transition-colors whitespace-nowrap"
              >
                RODO
              </Link>
            </div>

            {showCustomize ? (
              <>
                {/* Panel dostosowania — checkboxy */}
                <div className="px-6 py-4 space-y-3">
                  {/* Niezbędne — zawsze włączone */}
                  <label className="flex items-start gap-3 cursor-not-allowed select-none">
                    <input
                      type="checkbox"
                      checked
                      disabled
                      className="mt-0.5 h-4 w-4 rounded border-background-300 accent-primary-500 cursor-not-allowed opacity-60 shrink-0"
                    />
                    <div>
                      <span className="text-sm font-medium text-foreground-700 opacity-60">
                        <EditableText
                          contentKey="cookie_necessary_label"
                          fallback="Niezbędne"
                          as="span"
                        />
                      </span>
                      <p className="text-xs text-foreground-500 mt-0.5">
                        <EditableText
                          contentKey="cookie_necessary_desc"
                          fallback="Wymagane do prawidłowego działania strony. Nie mogą być wyłączone."
                          as="span"
                        />
                      </p>
                    </div>
                  </label>

                  {/* Analityczne */}
                  <label className="flex items-start gap-3 cursor-pointer select-none group">
                    <input
                      type="checkbox"
                      checked={prefs.analytics}
                      onChange={(e) => setPrefs(p => ({ ...p, analytics: e.target.checked }))}
                      className="mt-0.5 h-4 w-4 rounded border-background-300 accent-primary-500 cursor-pointer shrink-0 transition-colors"
                    />
                    <div>
                      <span className="text-sm font-medium text-foreground-800">
                        <EditableText
                          contentKey="cookie_analytics_label"
                          fallback="Analityczne"
                          as="span"
                        />
                      </span>
                      <p className="text-xs text-foreground-500 mt-0.5">
                        <EditableText
                          contentKey="cookie_analytics_desc"
                          fallback="Google Analytics — pomaga nam mierzyć ruch na stronie i ulepszać treści."
                          as="span"
                        />
                      </p>
                    </div>
                  </label>

                  {/* Marketingowe */}
                  <label className="flex items-start gap-3 cursor-pointer select-none group">
                    <input
                      type="checkbox"
                      checked={prefs.marketing}
                      onChange={(e) => setPrefs(p => ({ ...p, marketing: e.target.checked }))}
                      className="mt-0.5 h-4 w-4 rounded border-background-300 accent-primary-500 cursor-pointer shrink-0 transition-colors"
                    />
                    <div>
                      <span className="text-sm font-medium text-foreground-800">
                        <EditableText
                          contentKey="cookie_marketing_label"
                          fallback="Marketingowe"
                          as="span"
                        />
                      </span>
                      <p className="text-xs text-foreground-500 mt-0.5">
                        <EditableText
                          contentKey="cookie_marketing_desc"
                          fallback="Reklamy, personalizacja treści i remarketing."
                          as="span"
                        />
                      </p>
                    </div>
                  </label>
                </div>

                {/* Przyciski panelu dostosowania */}
                <div className="flex flex-col sm:flex-row gap-2 px-6 py-4 border-t border-background-200">
                  <button
                    type="button"
                    onClick={() => setShowCustomize(false)}
                    className="w-full sm:w-auto px-4 py-2.5 text-sm font-medium text-foreground-700 hover:text-foreground-950 bg-background-100 hover:bg-background-200 rounded-xl transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <EditableText
                      contentKey="cookie_btn_back"
                      fallback="Wróć"
                      as="span"
                    />
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveCustom}
                    className="w-full sm:flex-1 px-4 py-2.5 text-sm font-semibold text-background-50 bg-primary-500 hover:bg-primary-600 rounded-xl transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <EditableText
                      contentKey="cookie_btn_save_prefs"
                      fallback="Zapisz preferencje"
                      as="span"
                    />
                  </button>
                </div>
              </>
            ) : (
              /* Przyciski akcji — widok prosty */
              <div className="flex flex-col sm:flex-row gap-2 px-6 py-5">
                <button
                  type="button"
                  onClick={() => handleConsent('necessary')}
                  className="w-full sm:w-auto px-4 py-2.5 text-sm font-medium text-foreground-700 hover:text-foreground-950 bg-background-100 hover:bg-background-200 rounded-xl transition-colors cursor-pointer whitespace-nowrap"
                >
                  <EditableText
                    contentKey="cookie_btn_necessary"
                    fallback="Tylko niezbędne"
                    as="span"
                  />
                </button>
                <button
                  type="button"
                  onClick={openCustomize}
                  className="w-full sm:w-auto px-4 py-2.5 text-sm font-medium text-foreground-700 hover:text-foreground-950 bg-background-100 hover:bg-background-200 rounded-xl transition-colors cursor-pointer whitespace-nowrap"
                >
                  <EditableText
                    contentKey="cookie_btn_customize"
                    fallback="Dostosuj"
                    as="span"
                  />
                </button>
                <button
                  type="button"
                  onClick={() => handleConsent('all')}
                  className="w-full sm:flex-1 px-4 py-2.5 text-sm font-semibold text-background-50 bg-primary-500 hover:bg-primary-600 rounded-xl transition-colors cursor-pointer whitespace-nowrap"
                >
                  <EditableText
                    contentKey="cookie_btn_accept_all"
                    fallback="Akceptuję wszystkie"
                    as="span"
                  />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pływająca ikonka ciasteczka — widoczna dopiero po dokonaniu wyboru */}
      {hasConsent && !isVisible && (
        <button
          type="button"
          onClick={reopenBanner}
          className="fixed bottom-6 left-6 z-[9999] w-12 h-12 rounded-full bg-background-50 border border-background-200 shadow-lg hover:shadow-xl transition-all hover:scale-110 flex items-center justify-center cursor-pointer"
          title="Ustawienia plików cookie"
          aria-label="Otwórz ustawienia plików cookie"
        >
          <img
            src={LOGO_URL}
            alt="Ustawienia ciasteczek"
            className="w-7 h-7 object-contain"
            width={28}
            height={28}
            loading="eager"
            decoding="async"
          />
        </button>
      )}
    </>
  );
}