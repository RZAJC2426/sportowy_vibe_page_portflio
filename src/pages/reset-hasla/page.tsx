import { useEffect, useState, useRef } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { supabaseUrl, supabaseAnonKey } from '@/lib/supabase';

type PageState = 'loading' | 'form' | 'success' | 'expired' | 'invalid' | 'error';

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

export default function ResetHaslaPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const [pageState, setPageState] = useState<PageState>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-dismiss error messages after 6 seconds
  useEffect(() => {
    if (errorMsg) {
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
      errorTimerRef.current = setTimeout(() => setErrorMsg(''), 6000);
    }
    return () => {
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    };
  }, [errorMsg]);

  // Verify token on mount using verify-only mode
  useEffect(() => {
    if (!token) {
      setPageState('invalid');
      setErrorMsg('Brak tokenu resetowania w adresie URL.');
      setTimeout(() => setShowContent(true), 200);
      return;
    }

    let cancelled = false;

    const verifyToken = async () => {
      try {
        const data = await callEdgeFunction('reset-password-confirm', {
          token,
          mode: 'verify',
        });

        if (cancelled) return;

        if (data?.status === 'valid') {
          setPageState('form');
        } else if (data?.status === 'expired') {
          setPageState('expired');
          setErrorMsg((data?.error as string) || 'Link do resetowania hasła wygasł.');
        } else if (data?.status === 'invalid_token') {
          setPageState('invalid');
          setErrorMsg((data?.error as string) || 'Nieprawidłowy link do resetowania hasła.');
        } else if (data?.success === false) {
          setPageState('error');
          setErrorMsg((data?.error as string) || 'Nie udało się zweryfikować linku.');
        } else {
          setPageState('error');
          setErrorMsg('Nieznany błąd weryfikacji.');
        }
      } catch (err) {
        if (!cancelled) {
          setPageState('error');
          setErrorMsg(err instanceof Error ? err.message : 'Wystąpił błąd podczas weryfikacji linku.');
        }
      }
      if (!cancelled) setTimeout(() => setShowContent(true), 200);
    };

    verifyToken();
    return () => { cancelled = true; };
  }, [token]);

  // Countdown for success auto-redirect
  useEffect(() => {
    if (pageState !== 'success') return;
    if (countdown <= 0) {
      navigate('/');
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [pageState, countdown, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (password.length < 6) {
      setErrorMsg('Hasło musi mieć minimum 6 znaków.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Hasła nie są identyczne.');
      return;
    }

    setSubmitting(true);

    try {
      const data = await callEdgeFunction('reset-password-confirm', {
        token,
        password,
      });

      if (data?.success) {
        setPageState('success');
      } else if (data?.status === 'expired') {
        setPageState('expired');
        setErrorMsg((data?.error as string) || 'Link do resetowania hasła wygasł.');
      } else if (data?.status === 'invalid_token') {
        setPageState('invalid');
        setErrorMsg((data?.error as string) || 'Nieprawidłowy link.');
      } else {
        setErrorMsg((data?.error as string) || 'Nie udało się zresetować hasła.');
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Błąd połączenia z serwerem.');
    }
    setSubmitting(false);
  };

  const renderIcon = () => {
    switch (pageState) {
      case 'loading':
        return (
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-background-100 flex items-center justify-center mx-auto">
            <i className="ri-loader-4-line animate-spin text-3xl md:text-4xl text-foreground-400"></i>
          </div>
        );
      case 'form':
        return (
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-sky-50 flex items-center justify-center mx-auto">
            <i className="ri-lock-password-line text-4xl md:text-5xl text-sky-500"></i>
          </div>
        );
      case 'success':
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
    switch (pageState) {
      case 'loading': return 'Weryfikacja linku...';
      case 'form': return 'Ustaw nowe hasło';
      case 'success': return 'Hasło zmienione!';
      case 'expired': return 'Link wygasł';
      case 'invalid': return 'Nieprawidłowy link';
      case 'error': return 'Coś poszło nie tak';
    }
  };

  const renderDescription = () => {
    switch (pageState) {
      case 'loading': return 'Sprawdzamy Twój link do resetowania hasła...';
      case 'form': return 'Wpisz nowe hasło (minimum 6 znaków).';
      case 'success': return `Twoje hasło zostało pomyślnie zmienione. Za ${countdown} sekund zostaniesz przekierowany na stronę główną.`;
      case 'expired': return errorMsg || 'Link do resetowania hasła stracił ważność. Poproś o nowy link.';
      case 'invalid': return errorMsg || 'Ten link jest nieprawidłowy lub został już wykorzystany.';
      case 'error': return errorMsg;
    }
  };

  return (
    <div className="min-h-screen bg-background-50 flex flex-col">
      <header className="h-14 flex items-center px-4 md:px-6 border-b border-background-200/70">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-foreground-500 hover:text-foreground-700 transition-colors cursor-pointer">
          <i className="ri-arrow-left-line text-base"></i>
          Strona główna
        </Link>
      </header>

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

          {/* Password form */}
          {pageState === 'form' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* New password */}
              <div className="text-left">
                <label htmlFor="reset-password" className="block mb-1 text-xs font-semibold text-foreground-700">
                  Nowe hasło
                </label>
                <div className="relative">
                  <input
                    id="reset-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 6 znaków"
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

              {/* Confirm password */}
              <div className="text-left">
                <label htmlFor="reset-confirm" className="block mb-1 text-xs font-semibold text-foreground-700">
                  Potwierdź hasło
                </label>
                <input
                  id="reset-confirm"
                  name="confirm"
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Wpisz hasło ponownie"
                  autoComplete="new-password"
                  className="w-full rounded-md border border-background-200 bg-background-50 px-3 py-2.5 text-sm text-foreground-900 placeholder-foreground-400 outline-none transition-colors focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20"
                />
              </div>

              {/* Error with auto-dismiss */}
              {errorMsg && (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-600 flex items-center gap-2 animate-in">
                  <i className="ri-error-warning-line text-sm flex-shrink-0"></i>
                  <span className="flex-1">{errorMsg}</span>
                  <button
                    type="button"
                    onClick={() => setErrorMsg('')}
                    className="flex-shrink-0 flex h-5 w-5 items-center justify-center rounded hover:bg-red-200 text-red-400 hover:text-red-600 transition-colors cursor-pointer"
                  >
                    <i className="ri-close-line text-xs"></i>
                  </button>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-md bg-primary-500 py-2.5 text-sm font-semibold text-background-50 dark:text-foreground-950 transition-all hover:bg-primary-600 hover:shadow-lg hover:shadow-primary-500/20 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
              >
                {submitting ? (
                  <span className="inline-flex items-center gap-2">
                    <i className="ri-loader-4-line animate-spin" />
                    Zapisywanie...
                  </span>
                ) : (
                  'Zmień hasło'
                )}
              </button>
            </form>
          )}

          {/* Success */}
          {pageState === 'success' && (
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-green-50 border border-green-200 px-4 py-2">
                <i className="ri-shield-check-line text-green-600 text-sm"></i>
                <span className="text-sm font-medium text-green-700">Hasło zostało zmienione</span>
              </div>
              <p className="text-xs text-foreground-400">Za chwilę nastąpi przekierowanie...</p>
              <Link
                to="/"
                className="inline-flex items-center gap-2 rounded-lg bg-primary-500 px-6 py-3 text-sm font-semibold text-background-50 dark:text-foreground-950 hover:bg-primary-600 transition-all hover:shadow-lg hover:shadow-primary-500/20 cursor-pointer whitespace-nowrap"
              >
                Przejdź do logowania
                <i className="ri-arrow-right-line"></i>
              </Link>
            </div>
          )}

          {/* Expired */}
          {pageState === 'expired' && (
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-lg bg-primary-500 px-6 py-3 text-sm font-semibold text-background-50 dark:text-foreground-950 hover:bg-primary-600 transition-all cursor-pointer whitespace-nowrap"
            >
              Wróć do strony głównej
            </Link>
          )}

          {/* Invalid / Error */}
          {(pageState === 'invalid' || pageState === 'error') && (
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-lg bg-primary-500 px-6 py-3 text-sm font-semibold text-background-50 dark:text-foreground-950 hover:bg-primary-600 transition-all cursor-pointer whitespace-nowrap"
            >
              Wróć do strony głównej
            </Link>
          )}

          {/* Loading */}
          {pageState === 'loading' && (
            <div className="flex items-center justify-center gap-2 text-sm text-foreground-400">
              <div className="w-4 h-4 border-2 border-background-300 border-t-foreground-400 rounded-full animate-spin"></div>
              <span>To potrwa chwilę...</span>
            </div>
          )}
        </div>
      </main>

      <footer className="py-4 text-center">
        <p className="text-xs text-foreground-400">
          &copy; 2025–2026 Sportowy Vibe. Wszelkie prawa zastrzeżone.
        </p>
      </footer>
    </div>
  );
}