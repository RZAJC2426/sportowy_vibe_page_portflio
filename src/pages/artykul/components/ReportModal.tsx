import { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface ReportModalProps {
  open: boolean;
  onClose: () => void;
  reportType: 'article' | 'comment';
  reportTarget: string;
  reportLabel: string;
}

const REPORT_REASONS = [
  'Spam lub reklama',
  'Mowa nienawiści',
  'Nękanie lub zastraszanie',
  'Dezinformacja / fake news',
  'Nieodpowiednie treści',
  'Naruszenie praw autorskich',
  'Inny powód',
];

export default function ReportModal({ open, onClose, reportType, reportTarget, reportLabel }: ReportModalProps) {
  const [email, setEmail] = useState('');
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !reason) return;

    setSending(true);
    setError('');

    try {
      const { error: fnError } = await supabase.functions.invoke('send-report', {
        body: {
          reportType,
          reportTarget,
          reportLabel,
          reporterEmail: email.trim(),
          reason,
          details: details.trim(),
        },
      });

      if (fnError) {
        setError('Nie udało się wysłać zgłoszenia. Spróbuj ponownie później.');
      } else {
        setSent(true);
      }
    } catch {
      setError('Wystąpił błąd. Spróbuj ponownie później.');
    } finally {
      setSending(false);
    }
  };

  const handleBackdrop = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).id === 'report-modal-backdrop') {
      onClose();
    }
  };

  return (
    <div
      id="report-modal-backdrop"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 md:p-4"
      onClick={handleBackdrop}
    >
      <div className="w-full max-w-[480px] max-h-[calc(100vh-2rem)] md:max-h-[85vh] rounded-xl border border-background-200/80 bg-background-50 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 md:px-5 py-3 md:py-4 border-b border-background-200/70 shrink-0">
          <div className="flex items-center gap-2 md:gap-2.5">
            <span className="flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-lg bg-red-50 text-red-500">
              <i className="ri-flag-line text-base md:text-lg"></i>
            </span>
            <div>
              <h3 className="font-heading text-sm md:text-base font-bold text-foreground-950">
                Zgłoś {reportType === 'article' ? 'artykuł' : 'komentarz'}
              </h3>
              <p className="text-[11px] md:text-xs text-foreground-500 truncate max-w-[200px] md:max-w-[260px]">{reportLabel}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 md:h-9 md:w-9 cursor-pointer items-center justify-center rounded-md text-foreground-400 hover:text-foreground-600 hover:bg-background-100 transition-colors shrink-0"
          >
            <i className="ri-close-line text-base md:text-lg"></i>
          </button>
        </div>

        {/* Body */}
        <div className="p-4 md:p-5 overflow-y-auto flex-1">
          {sent ? (
            <div className="text-center py-6 md:py-8">
              <span className="flex h-14 w-14 md:h-16 md:w-16 mx-auto mb-3 md:mb-4 items-center justify-center rounded-full bg-green-100 text-green-500">
                <i className="ri-check-line text-2xl md:text-3xl"></i>
              </span>
              <h4 className="font-heading text-base md:text-lg font-bold text-foreground-950 mb-2">Zgłoszenie wysłane!</h4>
              <p className="text-xs md:text-sm text-foreground-600 max-w-sm mx-auto">
                Dziękujemy za zgłoszenie. Nasz zespół przeanalizuje je jak najszybciej. Na podany adres e-mail otrzymasz potwierdzenie.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-5 md:mt-6 inline-flex items-center gap-2 rounded-md bg-primary-500 px-4 md:px-5 py-2 md:py-2.5 text-xs md:text-sm font-semibold text-white hover:bg-primary-600 transition-all cursor-pointer whitespace-nowrap"
              >
                Zamknij
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
              <div>
                <label className="block mb-1 md:mb-1.5 text-xs md:text-sm font-semibold text-foreground-800">
                  Twój adres e-mail <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="twoj@email.com"
                  required
                  className="w-full rounded-md border border-background-200 bg-background-50 px-3 md:px-3.5 py-2 md:py-2.5 text-sm text-foreground-900 placeholder-foreground-400 outline-none transition-colors focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20"
                />
                <p className="mt-1 text-[11px] md:text-xs text-foreground-400">
                  Na ten adres wyślemy potwierdzenie przyjęcia zgłoszenia.
                </p>
              </div>

              <div>
                <label className="block mb-1 md:mb-1.5 text-xs md:text-sm font-semibold text-foreground-800">
                  Powód zgłoszenia <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-1.5 md:gap-2">
                  {REPORT_REASONS.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setReason(r === reason ? '' : r)}
                      className={`inline-flex items-center gap-1 md:gap-1.5 rounded-full border px-2.5 md:px-3 py-1 md:py-1.5 text-[11px] md:text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                        reason === r
                          ? 'border-red-400 bg-red-50 text-red-700'
                          : 'border-background-200 bg-background-50 text-foreground-600 hover:border-red-300 hover:bg-red-50/50'
                      }`}
                    >
                      {reason === r && <i className="ri-check-line text-[9px] md:text-[10px]"></i>}
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block mb-1 md:mb-1.5 text-xs md:text-sm font-semibold text-foreground-800">
                  Dodatkowe informacje
                </label>
                <textarea
                  name="details"
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Opisz dokładniej, dlaczego zgłaszasz tę treść..."
                  maxLength={500}
                  rows={2}
                  className="w-full rounded-md border border-background-200 bg-background-50 px-3 md:px-3.5 py-2 md:py-2.5 text-sm text-foreground-900 placeholder-foreground-400 outline-none transition-colors focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20 resize-none"
                />
                <p className="mt-1 text-[11px] md:text-xs text-foreground-400 text-right">{details.length}/500</p>
              </div>

              {/* Honeypot */}
              <div style={{ position: 'absolute', left: '-9999px', opacity: 0 }}>
                <input type="text" name="website_alt" tabIndex={-1} autoComplete="off" aria-hidden="true" readOnly />
              </div>

              {error && (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm font-medium text-red-700 flex items-center gap-2">
                  <i className="ri-error-warning-fill text-sm md:text-base shrink-0"></i>
                  {error}
                </div>
              )}

              <div className="flex items-center gap-2 md:gap-3 pt-1 md:pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex items-center gap-1.5 rounded-md border border-background-200 bg-background-50 px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm font-medium text-foreground-600 transition-colors hover:bg-background-100 cursor-pointer whitespace-nowrap"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  disabled={!email.trim() || !reason || sending}
                  className="inline-flex items-center gap-2 rounded-md bg-red-600 px-4 md:px-5 py-2 md:py-2.5 text-xs md:text-sm font-semibold text-white transition-all hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
                >
                  {sending ? (
                    <>
                      <i className="ri-loader-4-line animate-spin text-xs md:text-sm"></i>
                      Wysyłanie...
                    </>
                  ) : (
                    <>
                      <i className="ri-send-plane-line text-xs md:text-sm"></i>
                      Wyślij zgłoszenie
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}