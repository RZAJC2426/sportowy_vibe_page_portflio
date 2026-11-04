import { lazy, Component, useState, useEffect, useRef, Suspense } from 'react';
import type { ReactNode, ErrorInfo } from 'react';
import { BrowserRouter } from "react-router-dom";
import { AppRoutes } from "./router";
import { I18nextProvider } from "react-i18next";
import i18n from "./i18n";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AccessibilityProvider } from "@/contexts/AccessibilityContext";

const ChatbotHandlers = lazy(() => import('@/components/feature/ChatbotHandlers'));
const CookieBanner = lazy(() => import('@/components/feature/CookieBanner'));

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px 24px', fontFamily: 'Inter, sans-serif', background: '#fff', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <h1 style={{ fontSize: 24, color: '#1e293b', marginBottom: 12 }}>Coś poszło nie tak</h1>
          <p style={{ fontSize: 14, color: '#64748b', marginBottom: 24 }}>Spróbuj odświeżyć stronę (Ctrl+Shift+R)</p>
          <pre style={{ fontSize: 12, color: '#ef4444', background: '#fef2f2', padding: 16, borderRadius: 8, maxWidth: 600, overflow: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {this.state.error?.message}
          </pre>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{ marginTop: 24, padding: '10px 24px', background: '#14b8a6', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
          >
            Odśwież stronę
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 80);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <button
      type="button"
      onClick={scrollToTop}
      className={`fixed bottom-20 right-6 z-[60] flex h-11 w-11 items-center justify-center rounded-full bg-primary-500 text-white shadow-lg cursor-pointer hover:bg-primary-600 active:scale-90 transition-all duration-300 ${visible ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-5 pointer-events-none'}`}
      aria-label="Przewiń do góry"
      title="Przewiń do góry"
    >
      <i className="ri-arrow-up-line text-lg"></i>
    </button>
  );
}

function EmailVerificationBanner() {
  const { user, profile, sendVerificationCode } = useAuth();
  const [showVerified, setShowVerified] = useState(false);
  const [showUnverified, setShowUnverified] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState<string | null>(null);
  const unverifiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-dismiss banners after 8 seconds
  useEffect(() => {
    if (showVerified) {
      const timer = setTimeout(() => setShowVerified(false), 8000);
      return () => clearTimeout(timer);
    }
  }, [showVerified]);

  useEffect(() => {
    if (showUnverified) {
      if (unverifiedTimerRef.current) clearTimeout(unverifiedTimerRef.current);
      unverifiedTimerRef.current = setTimeout(() => setShowUnverified(false), 15000);
    }
    return () => {
      if (unverifiedTimerRef.current) clearTimeout(unverifiedTimerRef.current);
    };
  }, [showUnverified]);

  // Auto-dismiss resend message
  useEffect(() => {
    if (resendMsg) {
      const timer = setTimeout(() => setResendMsg(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [resendMsg]);

  // Check if email was just verified (URL hash or recently confirmed)
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('type=signup') || hash.includes('type=email_change')) {
      setShowVerified(true);
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }, []);

  useEffect(() => {
    if (user?.email_confirmed_at && !showVerified) {
      const confirmedAt = new Date(user.email_confirmed_at).getTime();
      if (Date.now() - confirmedAt < 120000) {
        setShowVerified(true);
      }
    }
  }, [user, showVerified]);

  // Show unverified banner when logged in but email not verified
  useEffect(() => {
    if (user && profile && profile.email_verified === false) {
      setShowUnverified(true);
    } else {
      setShowUnverified(false);
    }
  }, [user, profile]);

  const handleResendVerification = async () => {
    setResending(true);
    setResendMsg(null);
    try {
      const result = await sendVerificationCode();
      if (result.error) {
        setResendMsg(result.error);
      } else {
        setResendMsg('E-mail weryfikacyjny został wysłany ponownie. Sprawdź skrzynkę.');
      }
    } catch {
      setResendMsg('Nie udało się wysłać e-maila. Spróbuj ponownie później.');
    }
    setResending(false);
  };

  return (
    <>
      {/* Email Verified Success Banner */}
      {showVerified && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] rounded-xl bg-green-50 border-2 border-green-200 px-5 py-3 shadow-xl flex items-center gap-3 animate-in">
          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-green-100">
            <i className="ri-shield-check-line text-xl text-green-600"></i>
          </span>
          <div>
            <p className="text-sm font-bold text-green-800">E-mail zweryfikowany!</p>
            <p className="text-xs text-green-600">Twoje konto zostało pomyślnie aktywowane.</p>
          </div>
          <button
            type="button"
            onClick={() => setShowVerified(false)}
            className="ml-2 flex h-7 w-7 items-center justify-center rounded-full text-green-500 hover:text-green-700 hover:bg-green-200 transition-colors cursor-pointer"
          >
            <i className="ri-close-line"></i>
          </button>
        </div>
      )}

      {/* Email Not Verified Warning Banner */}
      {showUnverified && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9998] rounded-xl bg-amber-50 border-2 border-amber-200 px-5 py-3 shadow-xl flex flex-col sm:flex-row items-start sm:items-center gap-3 animate-in">
          <div className="flex items-center gap-3 w-full">
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-amber-100">
              <i className="ri-mail-unread-line text-xl text-amber-600"></i>
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-amber-800">E-mail niezweryfikowany</p>
              <p className="text-xs text-amber-600">
                Sprawdź swoją skrzynkę i kliknij link aktywacyjny, aby w pełni korzystać ze Sportowy VIBE.
              </p>
              {/* Resend verification button */}
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={resending}
                className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-900 underline hover:no-underline transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resending ? (
                  <>
                    <i className="ri-loader-4-line animate-spin"></i>
                    Wysyłanie...
                  </>
                ) : (
                  <>
                    <i className="ri-mail-send-line"></i>
                    Wyślij e-mail weryfikacyjny ponownie
                  </>
                )}
              </button>
              {/* Resend status message */}
              {resendMsg && (
                <p className={`mt-1 text-xs font-medium ${resendMsg.includes('Nie udało') ? 'text-red-600' : 'text-green-600'}`}>
                  {resendMsg}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowUnverified(false)}
              className="flex-shrink-0 flex h-7 w-7 items-center justify-center rounded-full text-amber-500 hover:text-amber-700 hover:bg-amber-200 transition-colors cursor-pointer"
            >
              <i className="ri-close-line"></i>
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function DelayedMount({ children, delayMs = 2000 }: { children: React.ReactNode; delayMs?: number }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const schedule = window.requestIdleCallback || ((cb) => setTimeout(cb, 1));
    const id = schedule(() => {
      setTimeout(() => setMounted(true), delayMs);
    });
    return () => {
      if (typeof id === 'number') cancelIdleCallback(id);
    };
  }, [delayMs]);
  return mounted ? <>{children}</> : null;
}

/* Dynamically inject Readdy AI Assistant widget script after a long delay
   so it never blocks initial paint or LCP */
function ReaddyWidgetLoader() {
  useEffect(() => {
    const timer = setTimeout(() => {
      if (document.querySelector('script[data-readdy-widget]')) return;
      const s = document.createElement('script');
      s.src = 'https://readdy.ai/api/public/assistant/widget?projectId=6b577641-b4ea-4107-bb56-5f8fbbf97e07';
      s.defer = true;
      s.setAttribute('data-readdy-widget', 'true');
      s.setAttribute('mode', 'hybrid');
      s.setAttribute('voice-show-transcript', 'true');
      s.setAttribute('theme', 'light');
      s.setAttribute('position', 'bottom-right');
      s.setAttribute('size', 'compact');
      s.setAttribute('accent-color', '#14B8A6');
      s.setAttribute('button-base-color', '#1F2937');
      s.setAttribute('button-accent-color', '#FFFFFF');
      s.setAttribute('main-label', 'Asystent Sportowy VIBE');
      s.setAttribute('start-button-text', 'Rozpocznij rozmowę');
      s.setAttribute('end-button-text', 'Zakończ rozmowę');
      s.setAttribute('empty-chat-message', 'Cześć! Jestem asystentem Sportowy VIBE. W czym mogę Ci pomóc? Opowiem o kanale, naszych formatach, partnerach lub pomogę się z nami skontaktować.');
      s.setAttribute('empty-voice-message', 'Powiedz cześć, aby rozpocząć rozmowę głosową');
      document.body.appendChild(s);
    }, 6000);
    return () => clearTimeout(timer);
  }, []);
  return null;
}

function App() {
  return (
    <ErrorBoundary>
    <I18nextProvider i18n={i18n}>
      <AuthProvider>
        <AccessibilityProvider>
          <BrowserRouter basename={__BASE_PATH__}>
            <AppRoutes />
            <ScrollToTop />
            <EmailVerificationBanner />
            <ReaddyWidgetLoader />
            <Suspense fallback={null}>
              <ChatbotHandlers />
            </Suspense>
            <DelayedMount delayMs={3000}>
              <Suspense fallback={null}>
                <CookieBanner />
              </Suspense>
            </DelayedMount>
          </BrowserRouter>
        </AccessibilityProvider>
      </AuthProvider>
    </I18nextProvider>
    </ErrorBoundary>
  );
}

export default App;