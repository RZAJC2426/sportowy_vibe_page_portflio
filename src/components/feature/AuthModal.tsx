import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, supabaseUrl, supabaseAnonKey } from '@/lib/supabase';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

const REMEMBER_ME_KEY = 'sportowy-vibe-remembered-login';

declare global {
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement, options: Record<string, unknown>) => string;
      remove: (widgetId: string) => void;
      reset: (widgetId: string) => void;
    };
  }
}

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

export default function AuthModal({ open, onClose }: AuthModalProps) {
  const { t } = useTranslation('common');
  const {
    signInWithLogin, signUpWithEmail, signInWithGoogle,
    signInWithWebAuthn, resetPassword,
    sms2faEnabled, sendSmsLoginCode, verifySmsLoginCode,
  } = useAuth();

  const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'verify-email' | 'sms-verify'>('login');
  const [login, setLogin] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [newsletterConsent, setNewsletterConsent] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [webauthnLoading, setWebauthnLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileLoadFailed, setTurnstileLoadFailed] = useState(false);
  const [turnstileBypass, setTurnstileBypass] = useState(false);
  const [turnstileRetries, setTurnstileRetries] = useState(0);
  const [verifyEmailSent, setVerifyEmailSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [smsCode, setSmsCode] = useState('');
  const [smsCodeSent, setSmsCodeSent] = useState(false);
  const [smsPhoneMasked, setSmsPhoneMasked] = useState('');
  const [smsCooldown, setSmsCooldown] = useState(0);
  const turnstileWidgetId = useRef<string | null>(null);
  const turnstileContainerRef = useRef<HTMLDivElement | null>(null);
  const turnstileLoadTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (open && mode === 'login') {
      try {
        const remembered = localStorage.getItem(REMEMBER_ME_KEY);
        if (remembered && !login) {
          setLogin(remembered);
          setRememberMe(true);
        }
      } catch { /* noop */ }
    }
  }, [open, mode, login]);

  useEffect(() => {
    if (!open) {
      setLogin('');
      setEmail('');
      setPassword('');
      setError('');
      setSuccessMsg('');
      setShowPassword(false);
      setSubmitting(false);
      setPrivacyAccepted(false);
      setTermsAccepted(false);
      setNewsletterConsent(false);
      setForgotEmail('');
      setRememberMe(false);
      setTurnstileToken('');
      setMode('login');
      setTurnstileLoadFailed(false);
      setTurnstileBypass(false);
      setTurnstileRetries(0);
      setVerifyEmailSent(false);
      setResendCooldown(0);
      setSmsCode('');
      setSmsCodeSent(false);
      setSmsPhoneMasked('');
      setSmsCooldown(0);
      if (turnstileLoadTimer.current) {
        clearTimeout(turnstileLoadTimer.current);
        turnstileLoadTimer.current = null;
      }
      if (turnstileWidgetId.current && window.turnstile) {
        try { window.turnstile.remove(turnstileWidgetId.current); } catch { /* noop */ }
        turnstileWidgetId.current = null;
      }
    }
  }, [open]);

  // Load/render Turnstile widget for login and register modes
  useEffect(() => {
    if (!open || (mode !== 'login' && mode !== 'register')) return;

    const siteKey = import.meta.env.VITE_PUBLIC_TURNSTILE_SITE_KEY as string | undefined;
    if (!siteKey) {
      setTurnstileLoadFailed(true);
      return;
    }

    // Clear any previous load timer
    if (turnstileLoadTimer.current) {
      clearTimeout(turnstileLoadTimer.current);
      turnstileLoadTimer.current = null;
    }

    const renderWidget = () => {
      if (!turnstileContainerRef.current || !window.turnstile) return;
      // Remove previous if any
      if (turnstileWidgetId.current) {
        try { window.turnstile.remove(turnstileWidgetId.current); } catch { /* noop */ }
      }
      turnstileWidgetId.current = window.turnstile.render(turnstileContainerRef.current, {
        sitekey: siteKey,
        callback: (token: string) => {
          setTurnstileToken(token);
          setTurnstileLoadFailed(false);
        },
        'error-callback': () => {
          setTurnstileToken('');
          setTurnstileLoadFailed(true);
        },
        'expired-callback': () => setTurnstileToken(''),
      });
      // Widget rendered successfully — mark as loaded
      setTurnstileLoadFailed(false);
    };

    const scheduleLoadCheck = () => {
      // If widget doesn't load within 8 seconds, mark as failed
      turnstileLoadTimer.current = setTimeout(() => {
        if (!turnstileWidgetId.current) {
          setTurnstileLoadFailed(true);
        }
      }, 8000);
    };

    if (window.turnstile) {
      renderWidget();
      scheduleLoadCheck();
    } else {
      const existing = document.getElementById('turnstile-script') as HTMLScriptElement | null;
      if (!existing) {
        const script = document.createElement('script');
        script.id = 'turnstile-script';
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
        script.async = true;
        script.defer = true;
        script.onload = () => {
          renderWidget();
          scheduleLoadCheck();
        };
        script.onerror = () => {
          setTurnstileLoadFailed(true);
        };
        document.head.appendChild(script);
      } else {
        // Script already loading or loaded
        if (window.turnstile) {
          renderWidget();
          scheduleLoadCheck();
        } else {
          // Wait for script to finish loading
          const checkInterval = setInterval(() => {
            if (window.turnstile) {
              clearInterval(checkInterval);
              renderWidget();
              scheduleLoadCheck();
            }
          }, 300);
          const timeout = setTimeout(() => {
            clearInterval(checkInterval);
            if (!window.turnstile) {
              setTurnstileLoadFailed(true);
            }
          }, 8000);
          return () => {
            clearInterval(checkInterval);
            clearTimeout(timeout);
            if (turnstileLoadTimer.current) {
              clearTimeout(turnstileLoadTimer.current);
            }
          };
        }
      }
    }

    return () => {
      if (turnstileLoadTimer.current) {
        clearTimeout(turnstileLoadTimer.current);
        turnstileLoadTimer.current = null;
      }
      if (turnstileWidgetId.current && window.turnstile) {
        try { window.turnstile.remove(turnstileWidgetId.current); } catch { /* noop */ }
        turnstileWidgetId.current = null;
      }
    };
  }, [open, mode, turnstileRetries]);

  // Resend cooldown countdown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // SMS cooldown countdown
  useEffect(() => {
    if (smsCooldown <= 0) return;
    const timer = setInterval(() => {
      setSmsCooldown((prev) => {
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [smsCooldown]);

  if (!open) return null;

  const translateAuthError = (msg: string): string => {
    const lower = msg.toLowerCase();
    if (lower.includes('rate limit') || lower.includes('rate_limit')) {
      return t('auth.rate_limit_error') || 'Zbyt wiele prób. Poczekaj chwilę przed kolejną wysyłką e-maila.';
    }
    if (lower.includes('already registered') || lower.includes('already been registered')) {
      return t('auth.already_registered') || 'Ten adres e-mail jest już zarejestrowany. Zaloguj się lub użyj opcji resetowania hasła.';
    }
    return msg;
  };

  const handleClose = () => {
    onClose();
  };

  const handleModeSwitch = (newMode: 'login' | 'register' | 'forgot' | 'verify-email' | 'sms-verify') => {
    setMode(newMode);
    setError('');
    setSuccessMsg('');
    setShowPassword(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setSubmitting(true);

    if (mode === 'forgot') {
      const result = await resetPassword(forgotEmail);
      if (result.error) {
        setError(translateAuthError(result.error));
        setSubmitting(false);
      } else {
        setSuccessMsg(t('auth.forgot_success'));
        setSubmitting(false);
      }
      return;
    }

    // Require Turnstile token for login and register (unless bypassed)
    if ((mode === 'login' || mode === 'register') && !turnstileToken && !turnstileBypass) {
      setError(t('auth.captcha_required') || 'Potwierdź, że nie jesteś robotem.');
      setSubmitting(false);
      return;
    }

    if (mode === 'login') {
      const result = await signInWithLogin(login, password, turnstileToken);
      if (result.error) {
        setError(translateAuthError(result.error));
        setSubmitting(false);
        // Reset captcha on error
        if (window.turnstile && turnstileWidgetId.current) {
          try { window.turnstile.reset(turnstileWidgetId.current); } catch { /* noop */ }
        }
        setTurnstileToken('');
      } else {
        if (rememberMe && login) {
          try { localStorage.setItem(REMEMBER_ME_KEY, login); } catch { /* noop */ }
        } else {
          try { localStorage.removeItem(REMEMBER_ME_KEY); } catch { /* noop */ }
        }
        // Check if SMS 2FA is needed
        if (sms2faEnabled) {
          setMode('sms-verify');
          setSmsCodeSent(false);
          setSmsCode('');
          setSmsPhoneMasked('');
          setError('');
          setSubmitting(false);
        } else {
          handleClose();
        }
      }
    } else if (mode === 'register') {
      if (!privacyAccepted) {
        setError(t('auth.privacy_required'));
        setSubmitting(false);
        return;
      }
      if (!termsAccepted) {
        setError(t('auth.terms_required'));
        setSubmitting(false);
        return;
      }
      const result = await signUpWithEmail(email, password, newsletterConsent, turnstileToken);
      if (result.error) {
        setError(translateAuthError(result.error));
        setSubmitting(false);
        if (window.turnstile && turnstileWidgetId.current) {
          try { window.turnstile.reset(turnstileWidgetId.current); } catch { /* noop */ }
        }
        setTurnstileToken('');
      } else {
        // Show email verification view
        if (result.email_sent === false) {
          setError(translateAuthError(result.email_error || 'Nie udało się wysłać e-maila weryfikacyjnego. Spróbuj kliknąć "Wyślij ponownie" za chwilę.'));
        }
        setMode('verify-email');
        setSubmitting(false);
      }
    }
  };

  const handleWebAuthnLogin = async () => {
    setError('');
    setWebauthnLoading(true);

    const identifier = login.trim();

    if (!identifier) {
      setError(t('auth.webauthn_login_required') || 'Wpisz login lub e-mail przed użyciem Windows Hello.');
      setWebauthnLoading(false);
      return;
    }

    const result = await signInWithWebAuthn(identifier);
    setWebauthnLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      handleClose();
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    const result = await signInWithGoogle();
    if (result.error) setError(result.error);
  };

  const handleSendSmsCode = async () => {
    if (smsCooldown > 0) return;
    setError('');
    setSmsCodeSent(false);
    setSubmitting(true);
    const result = await sendSmsLoginCode();
    setSubmitting(false);
    if (result.error) {
      setError(result.error);
    } else {
      setSmsCodeSent(true);
      setSmsPhoneMasked(result.phone_masked || '');
      setSmsCooldown(60);
    }
  };

  const handleVerifySmsCode = async () => {
    if (smsCode.length !== 6) {
      setError('Wprowadź 6-cyfrowy kod SMS');
      return;
    }
    setError('');
    setSubmitting(true);
    const result = await verifySmsLoginCode(smsCode);
    setSubmitting(false);
    if (result.error) {
      setError(result.error);
    } else {
      handleClose();
    }
  };

  const handleResendVerification = async () => {
    if (resendCooldown > 0) return;
    setError('');
    setVerifyEmailSent(false);
    try {
      // Direct fetch to the function URL (same root fix as registration) so the
      // published site is not affected by invoke() transport quirks and we get
      // the real HTTP status/body instead of a vague "Method POST is not allowed".
      const fnUrl = `${supabaseUrl}/functions/v1/register-user`;
      const response = await fetch(fnUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'apikey': supabaseAnonKey,
        },
        body: JSON.stringify({ action: 'resend', email }),
      });
      const responseText = await response.text();
      let data: { error?: string; rate_limited?: boolean; email_sent?: boolean; email_error?: string } | null = null;
      try { data = responseText ? JSON.parse(responseText) : null; } catch { /* non-JSON */ }

      if (!response.ok && !data) {
        setError(`Serwer odrzucił żądanie (HTTP ${response.status}). Odśwież stronę i spróbuj ponownie.`);
      } else if (data?.error) {
        setError(translateAuthError(data.error));
      } else {
        // Success — no app error, but email might still have failed
        if (data?.email_sent === false) {
          setError(translateAuthError(data.email_error || 'Nie udało się wysłać e-maila. Spróbuj ponownie za chwilę.'));
        } else {
          setVerifyEmailSent(true);
          setResendCooldown(60);
          setTimeout(() => setVerifyEmailSent(false), 5000);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? translateAuthError(err.message) : 'Błąd wysyłania');
    }
  };

  const isForgotMode = mode === 'forgot';
  const isVerifyEmailMode = mode === 'verify-email';
  const isSmsVerifyMode = mode === 'sms-verify';
  const showSocialButtons = !isForgotMode && !isVerifyEmailMode && !isSmsVerifyMode;

  const titleText = isForgotMode
    ? t('auth.forgot_title')
    : mode === 'login'
      ? t('auth.title_login')
      : t('auth.title_register');

  const subtitleText = isForgotMode
    ? t('auth.forgot_subtitle')
    : mode === 'login'
      ? t('auth.subtitle_login')
      : t('auth.subtitle_register');

  const modalJSX = (
    <div className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-md transition-opacity duration-200"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Panel wrapper */}
      <div
        className="relative z-10 w-full md:w-auto md:max-w-[440px] bg-background-50 md:rounded-2xl rounded-t-2xl border border-background-200/70 shadow-2xl shadow-black/15 overflow-hidden"
        style={{ maxHeight: 'calc(100vh - 2rem)' }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
      >
        {/* Mobile drag handle */}
        <div className="md:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-background-300/60" />
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto px-5 py-4 md:p-8" style={{ maxHeight: 'calc(100vh - 5rem)' }}>
          {/* Close button */}
          <button
            type="button"
            onClick={handleClose}
            className="absolute top-3 right-3 md:top-4 md:right-4 flex h-8 w-8 items-center justify-center rounded-full text-foreground-400 hover:bg-background-100 hover:text-foreground-600 transition-colors cursor-pointer z-20"
            aria-label={t('auth.close') || 'Zamknij'}
          >
            <i className="ri-close-line text-lg" />
          </button>

          {/* Header */}
          <div className="text-center mb-5 pr-8">
            <div className="mx-auto mb-3 flex h-11 md:h-14 items-center justify-center">
              <img
                src="https://storage.readdy-site.link/project_files/6b577641-b4ea-4107-bb56-5f8fbbf97e07/319ec2ab-1af0-46ca-beed-0358e5e16485_sportowy_vibebez-sloganu2.svg"
                alt="Sportowy VIBE"
                className="h-full w-auto max-w-[160px] md:max-w-[180px] object-contain"
              />
            </div>
            <h2 id="auth-modal-title" className="font-heading text-lg md:text-xl font-bold text-foreground-950">
              {titleText}
            </h2>
            <p className="mt-1 text-xs md:text-sm text-foreground-500">
              {subtitleText}
            </p>
          </div>

          {/* Tab Switcher */}
          {!isForgotMode && mode !== 'verify-email' && mode !== 'sms-verify' && (
            <div className="flex bg-background-100 rounded-full p-1 mb-5">
              <button
                type="button"
                onClick={() => handleModeSwitch('login')}
                className={`flex-1 py-2 text-sm font-medium rounded-full transition-all cursor-pointer whitespace-nowrap ${
                  mode === 'login' ? 'bg-background-50 text-foreground-950 shadow-sm' : 'text-foreground-500 hover:text-foreground-700'
                }`}
              >
                {t('auth.tab_login')}
              </button>
              <button
                type="button"
                onClick={() => handleModeSwitch('register')}
                className={`flex-1 py-2 text-sm font-medium rounded-full transition-all cursor-pointer whitespace-nowrap ${
                  mode === 'register' ? 'bg-background-50 text-foreground-950 shadow-sm' : 'text-foreground-500 hover:text-foreground-700'
                }`}
              >
                {t('auth.tab_register')}
              </button>
            </div>
          )}

          {/* Email Verification View */}
          {mode === 'verify-email' && (
            <div className="text-center py-4">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-50">
                <i className="ri-mail-check-line text-3xl text-primary-500"></i>
              </div>
              <h3 className="font-heading text-lg font-bold text-foreground-950 mb-2">
                {t('auth.verify_email_title') || 'Sprawdź swoją skrzynkę e-mail'}
              </h3>
              <p className="text-sm text-foreground-500 mb-1">
                {t('auth.verify_email_sent_to') || 'Wysłaliśmy link weryfikacyjny na:'}
              </p>
              <p className="text-sm font-semibold text-foreground-800 mb-4">{email}</p>
              <p className="text-xs text-foreground-400 mb-6 leading-relaxed max-w-xs mx-auto">
                {t('auth.verify_email_desc') || 'Kliknij link w e-mailu, aby aktywować konto. Po weryfikacji będziesz mógł się zalogować.'}
              </p>
              {verifyEmailSent && (
                <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-xs font-medium text-green-600 flex items-center justify-center gap-2 mb-4">
                  <i className="ri-checkbox-circle-line text-sm flex-shrink-0"></i>
                  <span>{t('auth.verify_email_resent') || 'E-mail wysłany ponownie!'}</span>
                </div>
              )}
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={resendCooldown > 0}
                className={`inline-flex items-center gap-2 rounded-md border border-background-200 px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap mb-3 ${
                  resendCooldown > 0
                    ? 'bg-background-100 text-foreground-400 cursor-not-allowed'
                    : 'bg-background-50 text-foreground-700 hover:bg-background-100 cursor-pointer'
                }`}
              >
                <i className={resendCooldown > 0 ? 'ri-timer-line' : 'ri-refresh-line'}></i>
                {resendCooldown > 0
                  ? `${t('auth.verify_email_cooldown') || 'Poczekaj'} ${resendCooldown}s`
                  : t('auth.verify_email_resend') || 'Wyślij ponownie'}
              </button>
              <div>
                <button
                  type="button"
                  onClick={() => handleModeSwitch('login')}
                  className="text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors cursor-pointer"
                >
                  {t('auth.verify_email_login') || 'Przejdź do logowania'}
                </button>
              </div>
            </div>
          )}

          {/* SMS Verification View */}
          {mode === 'sms-verify' && (
            <div className="text-center py-4">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-50">
                <i className="ri-smartphone-line text-3xl text-primary-500"></i>
              </div>
              <h3 className="font-heading text-lg font-bold text-foreground-950 mb-2">
                Weryfikacja SMS
              </h3>
              <p className="text-sm text-foreground-500 mb-4">
                Dla bezpieczeństwa wymagany jest kod z SMS-a.
              </p>

              {!smsCodeSent ? (
                <button
                  type="button"
                  onClick={handleSendSmsCode}
                  disabled={submitting || smsCooldown > 0}
                  className={`inline-flex items-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold transition-colors whitespace-nowrap mb-3 ${
                    smsCooldown > 0
                      ? 'bg-background-200 text-foreground-400 cursor-not-allowed'
                      : 'bg-primary-500 text-white hover:bg-primary-600 cursor-pointer'
                  }`}
                >
                  {submitting ? (
                    <>
                      <i className="ri-loader-4-line animate-spin"></i>
                      Wysyłanie...
                    </>
                  ) : smsCooldown > 0 ? (
                    <>
                      <i className="ri-timer-line"></i>
                      Poczekaj {smsCooldown}s
                    </>
                  ) : (
                    <>
                      <i className="ri-chat-3-line"></i>
                      Wyślij kod SMS
                    </>
                  )}
                </button>
              ) : (
                <div>
                  <p className="text-xs text-foreground-500 mb-3">
                    Kod wysłany na {smsPhoneMasked}
                  </p>
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <input
                      type="text"
                      value={smsCode}
                      onChange={(e) => { setSmsCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }}
                      placeholder="000000"
                      maxLength={6}
                      autoFocus
                      className="w-32 rounded-md border border-background-200 bg-background-50 px-3 py-2 text-center text-lg font-mono font-bold text-foreground-900 tracking-[6px] placeholder-foreground-300 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20"
                    />
                    <button
                      type="button"
                      onClick={handleVerifySmsCode}
                      disabled={submitting || smsCode.length !== 6}
                      className="inline-flex items-center gap-1.5 rounded-md bg-primary-500 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
                    >
                      {submitting ? (
                        <i className="ri-loader-4-line animate-spin"></i>
                      ) : (
                        <i className="ri-check-line"></i>
                      )}
                      Zweryfikuj
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={handleSendSmsCode}
                    disabled={submitting || smsCooldown > 0}
                    className={`text-xs font-medium transition-colors ${
                      smsCooldown > 0
                        ? 'text-foreground-300 cursor-not-allowed'
                        : 'text-primary-600 hover:text-primary-700 cursor-pointer'
                    }`}
                  >
                    {smsCooldown > 0 ? `Wyślij ponownie (${smsCooldown}s)` : 'Wyślij ponownie'}
                  </button>
                </div>
              )}

              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => handleModeSwitch('login')}
                  className="text-sm font-semibold text-foreground-500 hover:text-foreground-700 transition-colors cursor-pointer"
                >
                  Anuluj
                </button>
              </div>
            </div>
          )}

          {/* Back button for forgot password */}
          {isForgotMode && (
            <button
              type="button"
              onClick={() => { setMode('login'); setError(''); setSuccessMsg(''); }}
              className="mb-4 flex items-center gap-1.5 text-xs font-medium text-foreground-500 hover:text-foreground-700 transition-colors cursor-pointer"
            >
              <i className="ri-arrow-left-line text-sm" />
              {t('auth.forgot_back')}
            </button>
          )}

          {/* Social login buttons */}
          {showSocialButtons && (
            <>
              <div className="space-y-2.5 mb-4">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="flex w-full items-center justify-center gap-3 rounded-lg border border-background-200 bg-background-50 px-4 py-2.5 md:py-3 text-sm font-medium text-foreground-800 transition-all hover:border-foreground-300 hover:bg-background-100 active:scale-[0.98] cursor-pointer whitespace-nowrap"
                >
                  <svg className="h-4 w-4 md:h-5 md:w-5 flex-shrink-0" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  <span className="text-sm">{t('auth.google')}</span>
                </button>
              </div>

              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-background-200" />
                <span className="text-xs text-foreground-400 font-medium whitespace-nowrap">{t('auth.or_continue')}</span>
                <div className="flex-1 h-px bg-background-200" />
              </div>
            </>
          )}

          {/* Error + Success messages */}
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-600 flex items-center gap-2 mb-3">
              <i className="ri-error-warning-line text-sm flex-shrink-0" />
              <span className="break-words">{error}</span>
            </div>
          )}
          {successMsg && (
            <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-xs font-medium text-green-600 flex items-center gap-2 mb-3">
              <i className="ri-checkbox-circle-line text-sm flex-shrink-0" />
              <span className="break-words">{successMsg}</span>
            </div>
          )}

          {/* Form */}
          {!isVerifyEmailMode && !isSmsVerifyMode && (
          <form onSubmit={handleSubmit} className="space-y-3">
            {isForgotMode && (
              <div>
                <label htmlFor="auth-forgot-email" className="block mb-1 text-xs font-semibold text-foreground-700">
                  {t('auth.email_label')}
                </label>
                <input
                  id="auth-forgot-email"
                  name="forgot-email"
                  type="email"
                  required
                  autoFocus
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder={t('auth.email_placeholder')}
                  autoComplete="email"
                  className="w-full rounded-md border border-background-200 bg-background-50 px-3 py-2.5 text-sm text-foreground-900 placeholder-foreground-400 outline-none transition-colors focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20"
                />
              </div>
            )}

            {mode === 'login' && !isForgotMode && (
              <>
                <div>
                  <label htmlFor="auth-login" className="block mb-1 text-xs font-semibold text-foreground-700">
                    {t('auth.login_label')}
                  </label>
                  <input
                    id="auth-login"
                    name="login"
                    type="text"
                    required
                    value={login}
                    onChange={(e) => setLogin(e.target.value)}
                    placeholder={t('auth.login_placeholder')}
                    autoComplete="username"
                    className="w-full rounded-md border border-background-200 bg-background-50 px-3 py-2.5 text-sm text-foreground-900 placeholder-foreground-400 outline-none transition-colors focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20"
                  />
                </div>
                <div>
                  <label htmlFor="auth-password" className="block mb-1 text-xs font-semibold text-foreground-700">
                    {t('auth.password_label')}
                  </label>
                  <div className="relative">
                    <input
                      id="auth-password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t('auth.password_placeholder')}
                      autoComplete="current-password"
                      className="w-full rounded-md border border-background-200 bg-background-50 px-3 py-2.5 pr-10 text-sm text-foreground-900 placeholder-foreground-400 outline-none transition-colors focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded text-foreground-400 hover:text-foreground-600 hover:bg-background-100 transition-colors cursor-pointer"
                      tabIndex={-1}
                      title={showPassword ? 'Ukryj hasło' : 'Pokaż hasło'}
                    >
                      <i className={showPassword ? 'ri-eye-off-line text-sm' : 'ri-eye-line text-sm'} />
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-3.5 w-3.5 flex-shrink-0 rounded border-background-300 text-primary-500 focus:ring-primary-400/20 cursor-pointer"
                    />
                    <span className="text-xs text-foreground-500 group-hover:text-foreground-700 transition-colors whitespace-nowrap">
                      {t('auth.remember_me')}
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={() => { setMode('forgot'); setError(''); setSuccessMsg(''); setForgotEmail(login.includes('@') ? login : ''); }}
                    className="text-xs font-medium text-foreground-500 hover:text-primary-600 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    {t('auth.forgot_link')}
                  </button>
                </div>
                {/* Windows Hello as alternative on login tab */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={handleWebAuthnLogin}
                    disabled={webauthnLoading}
                    className="w-full inline-flex items-center justify-center gap-2.5 rounded-md border border-background-200 bg-background-50 px-4 py-2.5 text-sm font-medium text-foreground-700 transition-all hover:border-primary-300 hover:bg-primary-50/50 hover:text-primary-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
                  >
                    {webauthnLoading ? (
                      <>
                        <i className="ri-loader-4-line animate-spin text-base" />
                        {t('auth.webauthn_loading')}
                      </>
                    ) : (
                      <>
                        <span className="flex h-6 w-6 items-center justify-center">
                          <i className="ri-fingerprint-line text-lg" />
                        </span>
                        {t('auth.webauthn_button')}
                      </>
                    )}
                  </button>
                  <p className="mt-1.5 text-[11px] text-foreground-400 text-center leading-relaxed">
                    {t('auth.webauthn_hint')}
                  </p>
                </div>
              </>
            )}

            {mode === 'register' && !isForgotMode && (
              <>
                <div>
                  <label htmlFor="auth-email" className="block mb-1 text-xs font-semibold text-foreground-700">
                    {t('auth.email_label')}
                  </label>
                  <input
                    id="auth-email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('auth.email_placeholder')}
                    autoComplete="email"
                    className="w-full rounded-md border border-background-200 bg-background-50 px-3 py-2.5 text-sm text-foreground-900 placeholder-foreground-400 outline-none transition-colors focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20"
                  />
                </div>
                <div>
                  <label htmlFor="auth-password" className="block mb-1 text-xs font-semibold text-foreground-700">
                    {t('auth.password_label')}
                  </label>
                  <div className="relative">
                    <input
                      id="auth-password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t('auth.password_placeholder')}
                      autoComplete="new-password"
                      className="w-full rounded-md border border-background-200 bg-background-50 px-3 py-2.5 pr-10 text-sm text-foreground-900 placeholder-foreground-400 outline-none transition-colors focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded text-foreground-400 hover:text-foreground-600 hover:bg-background-100 transition-colors cursor-pointer"
                      tabIndex={-1}
                      title={showPassword ? 'Ukryj hasło' : 'Pokaż hasło'}
                    >
                      <i className={showPassword ? 'ri-eye-off-line text-sm' : 'ri-eye-line text-sm'} />
                    </button>
                  </div>
                </div>
                <div className="space-y-2.5 pt-1">
                  <label className="flex items-start gap-2.5 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={privacyAccepted}
                      onChange={(e) => setPrivacyAccepted(e.target.checked)}
                      className="mt-0.5 h-4 w-4 flex-shrink-0 rounded border-background-300 text-primary-500 focus:ring-primary-400/20 cursor-pointer"
                    />
                    <span className="text-xs text-foreground-600 leading-relaxed group-hover:text-foreground-800 transition-colors">
                      {t('auth.privacy_accept')}{' '}
                      <Link
                        to="/polityka-prywatnosci"
                        target="_blank"
                        className="font-semibold text-primary-600 hover:text-primary-700 underline underline-offset-2 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {t('auth.privacy_policy')}
                      </Link>
                    </span>
                  </label>
                  <label className="flex items-start gap-2.5 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="mt-0.5 h-4 w-4 flex-shrink-0 rounded border-background-300 text-primary-500 focus:ring-primary-400/20 cursor-pointer"
                    />
                    <span className="text-xs text-foreground-600 leading-relaxed group-hover:text-foreground-800 transition-colors">
                      {t('auth.privacy_accept')}{' '}
                      <Link
                        to="/regulamin-serwisu"
                        target="_blank"
                        className="font-semibold text-primary-600 hover:text-primary-700 underline underline-offset-2 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {t('auth.terms_of_service')}
                      </Link>
                    </span>
                  </label>
                  <label className="flex items-start gap-2.5 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={newsletterConsent}
                      onChange={(e) => setNewsletterConsent(e.target.checked)}
                      className="mt-0.5 h-4 w-4 flex-shrink-0 rounded border-background-300 text-primary-500 focus:ring-primary-400/20 cursor-pointer"
                    />
                    <span className="text-xs text-foreground-600 leading-relaxed group-hover:text-foreground-800 transition-colors">
                      {t('auth.newsletter_consent')}
                    </span>
                  </label>
                </div>
              </>
            )}

            {!(!isForgotMode && mode === 'register' && successMsg) && (
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-md bg-primary-500 py-2.5 md:py-2.5 text-sm font-semibold text-background-50 dark:text-foreground-950 transition-all hover:bg-primary-600 hover:shadow-lg hover:shadow-primary-500/20 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
              >
                {submitting ? (
                  <span className="inline-flex items-center gap-2">
                    <i className="ri-loader-4-line animate-spin" />
                    {t('auth.processing')}
                  </span>
                ) : isForgotMode ? (
                  t('auth.forgot_button')
                ) : mode === 'login' ? (
                  t('auth.login_button')
                ) : (
                  t('auth.register_button')
                )}
              </button>
            )}

            {/* Turnstile widget container for login/register */}
            {(mode === 'login' || mode === 'register') && (
              <div className="mt-3">
                <div ref={turnstileContainerRef} className="flex justify-center min-h-[65px]" />
                {turnstileLoadFailed && (
                  <div className="mt-2 space-y-2">
                    <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-600 flex items-center gap-2">
                      <i className="ri-error-warning-line text-sm flex-shrink-0" />
                      <span>{t('auth.captcha_unavailable') || 'Weryfikacja captcha jest niedostępna. Możesz spróbować ponownie lub kontynuować bez niej.'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setTurnstileRetries(r => r + 1);
                          setTurnstileLoadFailed(false);
                          setTurnstileBypass(false);
                          setTurnstileToken('');
                        }}
                        className="flex-1 rounded-md border border-background-200 bg-background-50 px-3 py-2 text-xs font-medium text-foreground-700 transition-all hover:bg-background-100 cursor-pointer whitespace-nowrap"
                      >
                        <span className="inline-flex items-center gap-1.5">
                          <i className="ri-refresh-line text-sm" />
                          {t('auth.captcha_retry') || 'Spróbuj ponownie załadować captchę'}
                        </span>
                      </button>
                    </div>
                    <label className="flex items-start gap-2.5 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={turnstileBypass}
                        onChange={(e) => setTurnstileBypass(e.target.checked)}
                        className="mt-0.5 h-4 w-4 flex-shrink-0 rounded border-background-300 text-primary-500 focus:ring-primary-400/20 cursor-pointer"
                      />
                      <span className="text-xs text-foreground-600 leading-relaxed group-hover:text-foreground-800 transition-colors">
                        {t('auth.captcha_bypass') || 'Captcha niedostępna — kontynuuj bez weryfikacji'}
                      </span>
                    </label>
                    {turnstileBypass && (
                      <p className="text-[11px] text-foreground-400 leading-relaxed">
                        {t('auth.captcha_bypass_warning') || 'Logowanie bez captchy jest mniej bezpieczne. Używaj tylko gdy weryfikacja nie działa.'}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </form>
          )}

          {!isForgotMode && !isVerifyEmailMode && !isSmsVerifyMode && (
            <p className="mt-4 text-center text-xs text-foreground-500">
              {mode === 'login' ? (
                <>
                  {t('auth.no_account')}{' '}
                  <button
                    type="button"
                    onClick={() => handleModeSwitch('register')}
                    className="font-semibold text-primary-600 hover:text-primary-700 transition-colors cursor-pointer"
                  >
                    {t('auth.register_link')}
                  </button>
                </>
              ) : (
                <>
                  {t('auth.has_account')}{' '}
                  <button
                    type="button"
                    onClick={() => handleModeSwitch('login')}
                    className="font-semibold text-primary-600 hover:text-primary-700 transition-colors cursor-pointer"
                  >
                    {t('auth.login_link')}
                  </button>
                </>
              )}
            </p>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalJSX, document.body);
}