import { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabaseUrl, supabaseAnonKey } from '@/lib/supabase';

type VerifyState = 'loading' | 'success' | 'already_verified' | 'expired' | 'invalid' | 'error';

async function callEdgeFunction(name: string, body: Record<string, unknown>) {
  const response = await fetch(`${supabaseUrl}/functions/v1/${name}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`,
    },
    body: JSON.stringify(body),
  });

  const responseText = await response.text();
  let data: Record<string, unknown> | null = null;
  try {
    data = JSON.parse(responseText);
  } catch {
    throw new Error(`HTTP ${response.status}: ${responseText}`);
  }

  if (!response.ok) {
    throw new Error(
      (data?.error as string) ||
      (data?.message as string) ||
      `Błąd HTTP ${response.status}`
    );
  }

  return data;
}

export default function WeryfikacjaEmailPage() {
  const { t } = useTranslation('common');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const [state, setState] = useState<VerifyState>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [showContent, setShowContent] = useState(false);
  const [successDismissed, setSuccessDismissed] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(0);

  // Auto-dismiss success banner after 5 seconds
  useEffect(() => {
    if ((state !== 'success' && state !== 'already_verified') || successDismissed) return;
    const timer = setTimeout(() => {
      setSuccessDismissed(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, [state, successDismissed]);

  // Auto-redirect countdown for success states (separate from banner dismiss)
  useEffect(() => {
    if (redirectCountdown <= 0) return;
    const timer = setInterval(() => {
      setRedirectCountdown((prev) => {
        if (prev <= 1) {
          navigate('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [redirectCountdown, navigate]);

  useEffect(() => {
    if (!token) {
      setState('invalid');
      setErrorMsg(t('verify.invalid_token') || 'Brak tokenu weryfikacyjnego w adresie URL.');
      setTimeout(() => setShowContent(true), 200);
      return;
    }

    let cancelled = false;

    const verifyToken = async () => {
      try {
        const data = await callEdgeFunction('verify-email-token', { token });

        if (cancelled) return;

        if (data?.success) {
          if (data?.already_verified) {
            setState('already_verified');
          } else {
            setState('success');
          }
          setUserEmail((data.email as string) || '');
          if (!cancelled) setRedirectCountdown(5);
        } else if (data?.status === 'expired') {
          setState('expired');
          setErrorMsg((data.error as string) || t('verify.expired') || 'Token weryfikacyjny wygasł.');
        } else if (data?.status === 'invalid_token') {
          setState('invalid');
          setErrorMsg((data.error as string) || t('verify.invalid_token') || 'Token weryfikacyjny jest nieprawidłowy.');
        } else {
          setState('error');
          setErrorMsg((data?.error as string) || t('verify.error') || 'Wystąpił nieznany błąd.');
        }
      } catch (err) {
        if (!cancelled) {
          setState('error');
          setErrorMsg(err instanceof Error ? err.message : t('verify.error') || 'Wystąpił błąd podczas weryfikacji.');
        }
      }
      if (!cancelled) setTimeout(() => setShowContent(true), 200);
    };

    verifyToken();
    return () => { cancelled = true; };
  }, [token, t]);

  const renderIcon = () => {
    switch (state) {
      case 'loading':
        return (
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-background-100 flex items-center justify-center mx-auto">
            <i className="ri-loader-4-line animate-spin text-3xl md:text-4xl text-foreground-400"></i>
          </div>
        );
      case 'success':
      case 'already_verified':
        return (
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-green-50 flex items-center justify-center mx-auto">
            <i className="ri-checkbox-circle-fill text-4xl md:text-5xl text-green-500"></i>
          </div>
        );
      case 'expired':
        return (
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-amber-50 flex items-center justify-center mx-auto">
            <i className="ri-time-line text-4xl md:text-5xl text-amber-500"></i>
          </div>
        );
      case 'invalid':
      case 'error':
        return (
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-red-50 flex items-center justify-center mx-auto">
            <i className="ri-close-circle-fill text-4xl md:text-5xl text-red-500"></i>
          </div>
        );
    }
  };

  const renderTitle = () => {
    switch (state) {
      case 'loading':
        return t('verify.loading_title') || 'Weryfikacja adresu e-mail...';
      case 'success':
        return t('verify.success_title') || 'E-mail zweryfikowany!';
      case 'already_verified':
        return t('verify.already_title') || 'E-mail już zweryfikowany';
      case 'expired':
        return t('verify.expired_title') || 'Link wygasł';
      case 'invalid':
        return t('verify.invalid_title') || 'Nieprawidłowy link';
      case 'error':
        return t('verify.error_title') || 'Coś poszło nie tak';
    }
  };

  const renderDescription = () => {
    switch (state) {
      case 'loading':
        return t('verify.loading_desc') || 'Sprawdzamy Twój link weryfikacyjny...';
      case 'success':
      case 'already_verified':
        return (
          <>
            <span>
              {t('verify.success_desc') || 'Twoje konto zostało pomyślnie aktywowane! Możesz się teraz zalogować i korzystać ze wszystkich funkcji Sportowy VIBE.'}
            </span>
            {redirectCountdown > 0 && (
              <span className="block mt-2 text-xs text-foreground-400">
                Za {redirectCountdown} {redirectCountdown === 1 ? 'sekundę' : redirectCountdown < 5 ? 'sekundy' : 'sekund'} nastąpi przekierowanie na stronę główną...
              </span>
            )}
          </>
        );
      case 'expired':
        return errorMsg || (t('verify.expired_desc') || 'Link weryfikacyjny stracił ważność. Zarejestruj się ponownie, aby otrzymać nowy link.');
      case 'invalid':
        return errorMsg || (t('verify.invalid_desc') || 'Ten link weryfikacyjny jest nieprawidłowy lub został już użyty.');
      case 'error':
        return errorMsg;
    }
  };

  return (
    <div className="min-h-screen bg-background-50 flex flex-col">
      {/* Subtle top bar */}
      <header className="h-14 flex items-center px-4 md:px-6 border-b border-background-200/70">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-foreground-500 hover:text-foreground-700 transition-colors cursor-pointer">
          <i className="ri-arrow-left-line text-base"></i>
          {t('verify.back_home') || 'Strona główna'}
        </Link>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div
          className={`w-full max-w-md text-center transition-all duration-500 ${
            showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          {/* Logo */}
          <div className="mb-8">
            <img
              src="https://storage.readdy-site.link/project_files/6b577641-b4ea-4107-bb56-5f8fbbf97e07/319ec2ab-1af0-46ca-beed-0358e5e16485_sportowy_vibebez-sloganu2.svg"
              alt="Sportowy VIBE"
              className="h-10 md:h-12 mx-auto object-contain"
            />
          </div>

          {/* Icon */}
          <div className="mb-6 transition-all duration-500 delay-100">
            {renderIcon()}
          </div>

          {/* Title */}
          <h1 className="font-heading text-xl md:text-2xl font-bold text-foreground-950 mb-3">
            {renderTitle()}
          </h1>

          {/* Description */}
          <p className="text-sm md:text-base text-foreground-500 mb-8 leading-relaxed max-w-sm mx-auto">
            {renderDescription()}
          </p>

          {/* Verified email badge — closable + auto-dismiss */}
          {(state === 'success' || state === 'already_verified') && userEmail && !successDismissed && (
            <div className="inline-flex items-center gap-2 rounded-full bg-green-50 border border-green-200 px-4 py-2 mb-8 animate-in fade-in zoom-in duration-300">
              <i className="ri-mail-check-line text-green-600 text-sm"></i>
              <span className="text-sm font-medium text-green-700">{userEmail}</span>
              <button
                onClick={() => setSuccessDismissed(true)}
                className="ml-1 flex h-5 w-5 items-center justify-center rounded-full hover:bg-green-100 text-green-600 transition-colors cursor-pointer"
                title="Zamknij"
              >
                <i className="ri-close-line text-xs"></i>
              </button>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col items-center gap-3">
            {(state === 'success' || state === 'already_verified') && (
              <Link
                to="/"
                className="inline-flex items-center gap-2 rounded-lg bg-primary-500 px-6 py-3 text-sm font-semibold text-background-50 dark:text-foreground-950 hover:bg-primary-600 transition-all hover:shadow-lg hover:shadow-primary-500/20 cursor-pointer whitespace-nowrap"
              >
                {t('verify.go_to_login') || 'Przejdź do logowania'}
                <i className="ri-arrow-right-line"></i>
              </Link>
            )}
            {state === 'expired' && (
              <Link
                to="/"
                className="inline-flex items-center gap-2 rounded-lg bg-primary-500 px-6 py-3 text-sm font-semibold text-background-50 dark:text-foreground-950 hover:bg-primary-600 transition-all cursor-pointer whitespace-nowrap"
              >
                {t('verify.register_again') || 'Zarejestruj się ponownie'}
              </Link>
            )}
            {(state === 'invalid' || state === 'error') && (
              <Link
                to="/"
                className="inline-flex items-center gap-2 rounded-lg bg-primary-500 px-6 py-3 text-sm font-semibold text-background-50 dark:text-foreground-950 hover:bg-primary-600 transition-all cursor-pointer whitespace-nowrap"
              >
                {t('verify.go_home') || 'Wróć do strony głównej'}
              </Link>
            )}
            {state === 'loading' && (
              <div className="flex items-center gap-2 text-sm text-foreground-400">
                <div className="w-4 h-4 border-2 border-background-300 border-t-foreground-400 rounded-full animate-spin"></div>
                <span>{t('verify.wait') || 'To potrwa chwilę...'}</span>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center">
        <p className="text-xs text-foreground-400">
          &copy; 2025–2026 Sportowy Vibe. Wszelkie prawa zastrzeżone.
        </p>
      </footer>
    </div>
  );
}