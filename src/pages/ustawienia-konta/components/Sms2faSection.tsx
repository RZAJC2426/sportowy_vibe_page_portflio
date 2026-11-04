import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function Sms2faSection() {
  const {
    user, sms2faEnabled, phone: savedPhone, twilioConfigured,
    setupSms2fa, verifySms2faSetup, disableSms2fa,
  } = useAuth();

  const [phoneInput, setPhoneInput] = useState('');
  const [setupStep, setSetupStep] = useState<'idle' | 'enter_phone' | 'enter_code'>('idle');
  const [smsCode, setSmsCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [phoneMasked, setPhoneMasked] = useState('');
  const [showDisableConfirm, setShowDisableConfirm] = useState(false);
  const [disableLoading, setDisableLoading] = useState(false);

  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (success) {
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
      successTimerRef.current = setTimeout(() => setSuccess(''), 4000);
    }
    return () => { if (successTimerRef.current) clearTimeout(successTimerRef.current); };
  }, [success]);

  useEffect(() => {
    if (error) {
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
      errorTimerRef.current = setTimeout(() => setError(''), 6000);
    }
    return () => { if (errorTimerRef.current) clearTimeout(errorTimerRef.current); };
  }, [error]);

  if (!user) return null;

  const handleSendCode = async () => {
    setError('');
    const cleaned = phoneInput.replace(/[\s\-()]/g, '');
    if (!/^\+[1-9]\d{7,14}$/.test(cleaned)) {
      setError('Podaj numer w formacie międzynarodowym, np. +48123456789');
      return;
    }
    setLoading(true);
    const result = await setupSms2fa(cleaned);
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      setPhoneMasked(result.phone_masked || cleaned.slice(-4).padStart(cleaned.length, '*'));
      setSetupStep('enter_code');
      setSuccess('Kod wysłany na ' + (result.phone_masked || 'Twój numer'));
    }
  };

  const handleVerifyCode = async () => {
    if (smsCode.length !== 6) {
      setError('Wprowadź 6-cyfrowy kod');
      return;
    }
    setError('');
    setLoading(true);
    const result = await verifySms2faSetup(smsCode);
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      setSuccess('SMS 2FA włączone! Kod będzie wymagany przy każdym logowaniu.');
      setSetupStep('idle');
      setSmsCode('');
      setPhoneInput('');
    }
  };

  const handleDisable = async () => {
    setDisableLoading(true);
    const result = await disableSms2fa();
    setDisableLoading(false);
    setShowDisableConfirm(false);
    if (result.error) {
      setError(result.error);
    } else {
      setSuccess('SMS 2FA wyłączone.');
    }
  };

  const handleCancel = () => {
    setSetupStep('idle');
    setPhoneInput('');
    setSmsCode('');
    setError('');
  };

  return (
    <div className="mt-3">
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-600 flex items-center gap-2 mb-2">
          <i className="ri-error-warning-line text-sm flex-shrink-0"></i>
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-xs font-medium text-green-600 flex items-center gap-2 mb-2">
          <i className="ri-checkbox-circle-line text-sm flex-shrink-0"></i>
          <span>{success}</span>
        </div>
      )}

      {sms2faEnabled ? (
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-accent-200 bg-accent-50 px-3 py-1 text-xs font-semibold text-accent-700">
            <i className="ri-shield-check-line text-xs"></i>
            SMS 2FA aktywne
          </span>
          {savedPhone && (
            <p className="text-xs text-foreground-400 mt-1">Numer: {savedPhone}</p>
          )}
          {!showDisableConfirm ? (
            <button
              type="button"
              onClick={() => setShowDisableConfirm(true)}
              className="mt-2 block text-xs font-medium text-red-500 hover:text-red-600 cursor-pointer"
            >
              Wyłącz SMS 2FA
            </button>
          ) : (
            <div className="mt-2 rounded-lg border border-red-200 bg-red-50 p-3">
              <p className="text-xs font-medium text-red-700 mb-2">
                Czy na pewno chcesz wyłączyć weryfikację SMS? Twoje konto będzie mniej bezpieczne.
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDisable}
                  disabled={disableLoading}
                  className="inline-flex items-center gap-1.5 rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
                >
                  {disableLoading ? <i className="ri-loader-4-line animate-spin text-xs"></i> : <i className="ri-delete-bin-6-line text-xs"></i>}
                  Tak, wyłącz
                </button>
                <button
                  type="button"
                  onClick={() => setShowDisableConfirm(false)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-background-200 px-3 py-1.5 text-xs font-medium text-foreground-600 hover:bg-background-50 cursor-pointer whitespace-nowrap"
                >
                  Anuluj
                </button>
              </div>
            </div>
          )}
        </div>
      ) : setupStep === 'idle' ? (
        <button
          type="button"
          onClick={() => setSetupStep('enter_phone')}
          disabled={!twilioConfigured}
          className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-xs font-semibold transition-colors whitespace-nowrap ${
            twilioConfigured
              ? 'bg-accent-500 text-white hover:bg-accent-600 cursor-pointer'
              : 'bg-background-300 text-foreground-400 cursor-not-allowed'
          }`}
        >
          <i className="ri-smartphone-line text-sm"></i>
          Skonfiguruj SMS 2FA
        </button>
      ) : (
        <div className="rounded-lg border border-background-200 bg-background-50 p-4">
          {setupStep === 'enter_phone' && (
            <>
              <p className="text-xs font-medium text-foreground-700 mb-2">
                Podaj numer telefonu w formacie międzynarodowym:
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="tel"
                  value={phoneInput}
                  onChange={(e) => { setPhoneInput(e.target.value); setError(''); }}
                  placeholder="+48123456789"
                  autoFocus
                  className="flex-1 rounded-md border border-background-200 bg-background-50 px-3 py-2 text-sm text-foreground-900 placeholder-foreground-300 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20"
                />
                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={loading || !phoneInput.trim()}
                  className="inline-flex items-center gap-1.5 rounded-md bg-primary-500 px-3 py-2 text-xs font-semibold text-white hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
                >
                  {loading ? <i className="ri-loader-4-line animate-spin text-xs"></i> : <i className="ri-send-plane-line text-xs"></i>}
                  Wyślij kod
                </button>
              </div>
              <button
                type="button"
                onClick={handleCancel}
                className="mt-2 text-xs font-medium text-foreground-400 hover:text-foreground-600 cursor-pointer"
              >
                Anuluj
              </button>
            </>
          )}
          {setupStep === 'enter_code' && (
            <>
              <p className="text-xs font-medium text-foreground-700 mb-2">
                Wprowadź 6-cyfrowy kod wysłany na {phoneMasked}:
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={smsCode}
                  onChange={(e) => { setSmsCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }}
                  placeholder="000000"
                  maxLength={6}
                  autoFocus
                  className="w-28 rounded-md border border-background-200 bg-background-50 px-3 py-2 text-center text-lg font-mono font-bold text-foreground-900 tracking-[6px] placeholder-foreground-300 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20"
                />
                <button
                  type="button"
                  onClick={handleVerifyCode}
                  disabled={loading || smsCode.length !== 6}
                  className="inline-flex items-center gap-1.5 rounded-md bg-primary-500 px-3 py-2 text-xs font-semibold text-white hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
                >
                  {loading ? <i className="ri-loader-4-line animate-spin text-xs"></i> : <i className="ri-check-line text-xs"></i>}
                  Zweryfikuj
                </button>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={loading}
                  className="text-xs font-medium text-foreground-500 hover:text-primary-600 cursor-pointer"
                >
                  Wyślij ponownie
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="text-xs font-medium text-foreground-400 hover:text-foreground-600 cursor-pointer"
                >
                  Anuluj
                </button>
              </div>
            </>
          )}
        </div>
      )}

      <p className="text-[11px] text-foreground-400 mt-3 leading-relaxed">
        <i className="ri-information-line text-xs mr-1"></i>
        Numer telefonu jest przechowywany bezpiecznie i używany wyłącznie do wysyłania kodów weryfikacyjnych. Standardowe opłaty za SMS mogą obowiązywać.
      </p>
    </div>
  );
}