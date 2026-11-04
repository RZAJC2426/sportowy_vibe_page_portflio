import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { changeAppLanguage } from '@/i18n';
import { supabase } from '@/lib/supabase';
import TopBar from '@/pages/home/components/TopBar';
import Breadcrumbs from '@/components/feature/Breadcrumbs';
import EditableImage from '@/components/feature/EditableImage';
import EditableText from '@/components/feature/EditableText';
import EditableColor from '@/components/feature/EditableColor';
import Sms2faSection from './components/Sms2faSection';

const LANGUAGES: { value: string; label: string; flag: string }[] = [
  { value: 'pl', label: 'Polski', flag: '🇵🇱' },
  { value: 'en', label: 'English', flag: '🇬🇧' },
  { value: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { value: 'es', label: 'Español', flag: '🇪🇸' },
  { value: 'fr', label: 'Français', flag: '🇫🇷' },
];

/** Crop image to center square and resize to targetSize x targetSize */
function resizeAndCropToSquare(file: File, targetSize = 256): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      canvas.width = targetSize;
      canvas.height = targetSize;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }
      const minDim = Math.min(img.naturalWidth, img.naturalHeight);
      const sx = (img.naturalWidth - minDim) / 2;
      const sy = (img.naturalHeight - minDim) / 2;
      ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, targetSize, targetSize);
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Canvas toBlob failed'));
        },
        'image/jpeg',
        0.7
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    img.src = url;
  });
}

/** Convert Blob to full data URL string (with data: prefix) */
function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result);
    };
    reader.onerror = () => reject(new Error('FileReader failed'));
    reader.readAsDataURL(blob);
  });
}

export default function UstawieniaKontaPage() {
  const { t } = useTranslation('common');
  const { user, profile, signOut, hardSignOut, updateUserProfile, deleteAccount, changePassword, changeUsername, hasWebAuthn, registerWebAuthn, removeWebAuthn, sendVerificationCode, verifyCode, verifyCodeAndChangePassword, totpEnabled, setupTOTP, verifyTOTPSetup, disableTOTP, twilioConfigured } = useAuth();
  const navigate = useNavigate();

  const avatarUrl = profile?.avatar_url ?? user?.user_metadata?.avatar_url ?? user?.user_metadata?.picture ?? null;

  // Merge localStorage avatar fallback
  const effectiveAvatarUrl = avatarUrl ?? (() => {
    try {
      return user ? localStorage.getItem('sportowy-vibe-avatar-' + user.id) : null;
    } catch { return null; }
  })();

  const fullName = user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? null;
  const rawDisplayName = profile?.display_name ?? profile?.username ?? fullName ?? user?.email?.split('@')[0] ?? 'Kibicu';
  const currentUsername = profile?.username ?? null;
  const initials = rawDisplayName
    .split(' ')
    .map((w: string) => w.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
  const provider = user?.app_metadata?.provider ?? 'email';
  const providerLabel = provider === 'google' ? 'Google' : 'E-mail';
  const providerIcon = provider === 'google' ? 'ri-google-fill' : 'ri-mail-fill';
  const emailVerified = user?.user_metadata?.email_verified === true || user?.email_confirmed_at != null;
  const createdAt = user?.created_at ? new Date(user.created_at).toLocaleDateString('pl-PL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }) : null;
  const lastSignIn = user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString('pl-PL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }) : null;
  const passwordLastSet = profile?.password_updated_at ? new Date(profile.password_updated_at).toLocaleDateString('pl-PL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }) : null;

  // Editable fields
  const [displayName, setDisplayName] = useState(rawDisplayName);
  const [editingName, setEditingName] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(profile?.notifications_enabled ?? true);
  const [newsletterConsent, setNewsletterConsent] = useState(profile?.newsletter_consent ?? false);
  const [currentTheme, setCurrentTheme] = useState(profile?.theme ?? 'light');
  const [currentLanguage, setCurrentLanguage] = useState(profile?.language ?? 'pl');
  const [savedMsg, setSavedMsg] = useState('');
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [showThemeDropdown, setShowThemeDropdown] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  // Username state
  const [username, setUsername] = useState(currentUsername ?? '');
  const [editingUsername, setEditingUsername] = useState(false);
  const [savingUsername, setSavingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState('');

  // Password state
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // WebAuthn state
  const [webauthnLoading, setWebauthnLoading] = useState(false);
  const [webauthnError, setWebauthnError] = useState('');
  const [webauthnSuccess, setWebauthnSuccess] = useState('');
  const [showWebauthnRemoveConfirm, setShowWebauthnRemoveConfirm] = useState(false);

  // Email verification for password change
  const [verificationStep, setVerificationStep] = useState<'idle' | 'send' | 'verify'>('idle');
  const [verificationCode, setVerificationCode] = useState('');
  const [sendingCode, setSendingCode] = useState(false);
  const [codeSent, setCodeSent] = useState(false);

  // TOTP 2FA
  const [showTotpSetup, setShowTotpSetup] = useState(false);
  const [totpSecret, setTotpSecret] = useState('');
  const [totpQrUrl, setTotpQrUrl] = useState('');
  const [totpSetupCode, setTotpSetupCode] = useState('');
  const [totpSetupLoading, setTotpSetupLoading] = useState(false);
  const [totpSetupError, setTotpSetupError] = useState('');
  const [totpSetupSuccess, setTotpSetupSuccess] = useState('');
  const [showTotpDisableConfirm, setShowTotpDisableConfirm] = useState(false);
  const [totpDisableLoading, setTotpDisableLoading] = useState(false);

  // Avatar upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [localAvatar, setLocalAvatar] = useState<string | null>(effectiveAvatarUrl);

  // Recovery mode (from forgot password email link)
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [recoverySuccess, setRecoverySuccess] = useState('');
  const [emailVerifiedBanner, setEmailVerifiedBanner] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name ?? rawDisplayName);
      setUsername(profile.username ?? '');
      setNotificationsEnabled(profile.notifications_enabled);
      setNewsletterConsent(profile.newsletter_consent ?? false);
      setCurrentTheme(profile.theme);
      setCurrentLanguage(profile.language);
      setLocalAvatar(profile.avatar_url ?? effectiveAvatarUrl);
    }
  }, [profile]);

  // Detect recovery / verification flows from URL hash
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('type=recovery')) {
      setRecoveryMode(true);
      setShowPasswordSection(true);
      // Clean URL
      window.history.replaceState(null, '', window.location.pathname);
    } else if (hash.includes('type=signup') || hash.includes('type=email_change')) {
      setEmailVerifiedBanner(true);
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  // Also check if email was just confirmed (for verification link redirects without hash)
  useEffect(() => {
    if (user?.email_confirmed_at && !emailVerifiedBanner) {
      // Check if confirmed recently (within last 60 seconds)
      const confirmedAt = new Date(user.email_confirmed_at).getTime();
      const now = Date.now();
      if (now - confirmedAt < 120000) {
        setEmailVerifiedBanner(true);
      }
    }
  }, [user]);

  const handleSaveName = async () => {
    if (!displayName.trim() || displayName.trim() === rawDisplayName) {
      setEditingName(false);
      return;
    }
    setSavingName(true);
    await updateUserProfile({ display_name: displayName.trim() });
    setSavingName(false);
    setEditingName(false);
    showSaved(t('settings.name_updated'));
  };

  const handleToggleNotifications = async () => {
    const next = !notificationsEnabled;
    setNotificationsEnabled(next);
    await updateUserProfile({ notifications_enabled: next });
    showSaved(next ? t('settings.notif_on') : t('settings.notif_off'));
  };

  const handleThemeChange = async (theme: string) => {
    setCurrentTheme(theme);
    setShowThemeDropdown(false);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    try { localStorage.setItem('sportowy-vibe-theme', theme); } catch { /* noop */ }
    await updateUserProfile({ theme });
    showSaved(`${t('settings.theme_changed')}: ${theme === 'dark' ? t('settings.theme_dark') : t('settings.theme_light')}`);
  };

  const handleLanguageChange = async (lang: string) => {
    setCurrentLanguage(lang);
    setShowLangDropdown(false);
    await updateUserProfile({ language: lang });
    changeAppLanguage(lang);
    showSaved(t('settings.lang_changed'));
  };

  const handleAvatarClick = () => {
    if (!uploadingAvatar) {
      fileInputRef.current?.click();
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(file.type)) {
      showSaved(t('settings.invalid_format'));
      return;
    }

    setUploadingAvatar(true);
    let dataUrl: string | null = null;

    try {
      // 1. Crop to center square and resize to 256x256
      const croppedBlob = await resizeAndCropToSquare(file, 256);

      // 2. Validate final size
      if (croppedBlob.size > 5 * 1024 * 1024) {
        showSaved(t('settings.file_too_big'));
        setUploadingAvatar(false);
        return;
      }

      // 3. Convert to data URL (base64 with prefix)
      dataUrl = await blobToDataUrl(croppedBlob);
      console.log('[avatar] data URL length:', dataUrl.length, 'first 60 chars:', dataUrl.slice(0, 60));

      // 4. Save to database
      console.log('[avatar] calling updateUserProfile with avatar_url...');
      await updateUserProfile({ avatar_url: dataUrl });
      console.log('[avatar] updateUserProfile returned successfully');
      setLocalAvatar(dataUrl);
      showSaved(t('settings.avatar_updated'));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Nieznany błąd';
      console.error('[avatar] upload error:', msg);
      // Fallback: still show avatar locally even if DB failed
      if (dataUrl) {
        try {
          localStorage.setItem('sportowy-vibe-avatar-' + user.id, dataUrl);
        } catch { /* noop */ }
        setLocalAvatar(dataUrl);
        showSaved('Avatar zapisany lokalnie (błąd synchronizacji z bazą)');
      } else {
        showSaved(`Błąd: ${msg}`);
      }
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const showSaved = (msg: string) => {
    setSavedMsg(msg);
    setTimeout(() => setSavedMsg(''), 3000);
  };

  const handleSaveUsername = async () => {
    setUsernameError('');
    const trimmed = username.trim().toLowerCase();

    if (!trimmed) {
      setUsernameError(t('settings.username_required'));
      return;
    }

    if (trimmed === currentUsername) {
      setEditingUsername(false);
      setUsername(currentUsername ?? '');
      return;
    }

    if (trimmed.length < 3 || trimmed.length > 30) {
      setUsernameError(t('settings.username_length'));
      return;
    }

    if (!/^[a-z0-9_-]+$/.test(trimmed)) {
      setUsernameError(t('settings.username_format'));
      return;
    }

    setSavingUsername(true);
    const result = await changeUsername(trimmed);
    setSavingUsername(false);

    if (result.error) {
      setUsernameError(result.error);
    } else {
      setEditingUsername(false);
      showSaved(t('settings.username_updated'));
    }
  };

  const handleSavePassword = async () => {
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword.length < 6) {
      setPasswordError(t('settings.password_length'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError(t('settings.password_mismatch'));
      return;
    }

    setSavingPassword(true);

    // Recovery mode: user is already authenticated via recovery token, just update password
    if (recoveryMode) {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      setSavingPassword(false);

      if (error) {
        setPasswordError(error.message);
      } else {
        setRecoverySuccess(t('auth.recovery_success'));
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          setRecoverySuccess('');
          setRecoveryMode(false);
          navigate('/');
        }, 2000);
      }
      return;
    }

    // Normal flow: verify code first
    const result = await verifyCodeAndChangePassword(verificationCode, newPassword);
    setSavingPassword(false);

    if (result.error) {
      setPasswordError(result.error);
    } else {
      setPasswordSuccess(t('settings.password_updated'));
      setNewPassword('');
      setConfirmPassword('');
      setVerificationCode('');
      setVerificationStep('idle');
      setCodeSent(false);
      setTimeout(() => {
        setPasswordSuccess('');
        setShowPasswordSection(false);
      }, 2000);
    }
  };

  const handleSendVerificationCode = async () => {
    setPasswordError('');
    setSendingCode(true);
    const result = await sendVerificationCode();
    setSendingCode(false);

    if (result.error) {
      setPasswordError(result.error);
    } else {
      setCodeSent(true);
      setVerificationStep('verify');
    }
  };

  // TOTP handlers
  const handleSetupTOTP = async () => {
    setTotpSetupError('');
    setTotpSetupSuccess('');
    setTotpSetupLoading(true);
    setShowTotpSetup(true);

    const result = await setupTOTP();
    setTotpSetupLoading(false);

    if (result.error) {
      setTotpSetupError(result.error);
      setShowTotpSetup(false);
    } else {
      setTotpSecret(result.secret || '');
      setTotpQrUrl(result.otpauthUrl || '');
    }
  };

  const handleVerifyTOTPSetup = async () => {
    if (totpSetupCode.length !== 6) {
      setTotpSetupError('Wprowadź 6-cyfrowy kod');
      return;
    }

    setTotpSetupError('');
    setTotpSetupLoading(true);
    const result = await verifyTOTPSetup(totpSetupCode);
    setTotpSetupLoading(false);

    if (result.error) {
      setTotpSetupError(result.error);
    } else {
      setTotpSetupSuccess('2FA włączone pomyślnie!');
      setTotpSetupCode('');
      setShowTotpSetup(false);
      setTimeout(() => setTotpSetupSuccess(''), 3000);
    }
  };

  const handleDisableTOTP = async () => {
    setTotpDisableLoading(true);
    const result = await disableTOTP();
    setTotpDisableLoading(false);
    setShowTotpDisableConfirm(false);

    if (result.error) {
      setTotpSetupError(result.error);
    } else {
      setTotpSetupSuccess('2FA wyłączone');
      setTimeout(() => setTotpSetupSuccess(''), 3000);
    }
  };



  const handleRegisterWebAuthn = async () => {
    setWebauthnError('');
    setWebauthnSuccess('');
    setWebauthnLoading(true);
    const result = await registerWebAuthn();
    setWebauthnLoading(false);

    if (result.error) {
      setWebauthnError(result.error);
    } else {
      setWebauthnSuccess(t('settings.webauthn_registered'));
      setTimeout(() => setWebauthnSuccess(''), 3000);
    }
  };

  const handleRemoveWebAuthn = async () => {
    setWebauthnError('');
    setWebauthnSuccess('');
    setWebauthnLoading(true);
    const result = await removeWebAuthn();
    setWebauthnLoading(false);
    setShowWebauthnRemoveConfirm(false);

    if (result.error) {
      setWebauthnError(result.error);
    } else {
      setWebauthnSuccess(t('settings.webauthn_removed'));
      setTimeout(() => setWebauthnSuccess(''), 3000);
    }
  };

  const handleDeleteAccount = async () => {
    setDeletingAccount(true);
    const result = await deleteAccount();
    if (result.error) {
      showSaved(`Błąd: ${result.error}`);
      setDeletingAccount(false);
      setShowDeleteConfirm(false);
    } else {
      navigate('/');
    }
  };

  const handleSignOut = async () => {
    await hardSignOut();
    navigate('/');
  };

  const handleToggleNewsletter = async () => {
    const next = !newsletterConsent;
    setNewsletterConsent(next);
    await updateUserProfile({ newsletter_consent: next });
    showSaved(t('settings.newsletter_updated'));
  };

  const currentLangLabel = LANGUAGES.find((l) => l.value === currentLanguage);
  const themeLabel = currentTheme === 'dark' ? t('settings.theme_dark') : t('settings.theme_light');
  const themeIcon = currentTheme === 'dark' ? 'ri-moon-line' : 'ri-sun-line';

  return (
    <div className="min-h-screen bg-background-50">
      <TopBar />
      {/* Saved toast */}
      {savedMsg && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 rounded-full bg-accent-500 px-5 py-2.5 text-sm font-medium text-white shadow-lg animate-in">
          <span className="flex items-center gap-2">
            <i className="ri-check-line"></i>
            {savedMsg}
          </span>
        </div>
      )}

      {/* Email Verified Banner */}
      {emailVerifiedBanner && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 rounded-full bg-green-100 border border-green-200 px-5 py-2.5 text-sm font-medium text-green-700 shadow-lg flex items-center gap-2 animate-in">
          <i className="ri-shield-check-line text-lg"></i>
          {t('auth.email_verified_title')}
          <button
            type="button"
            onClick={() => setEmailVerifiedBanner(false)}
            className="ml-2 flex h-5 w-5 items-center justify-center rounded-full text-green-500 hover:text-green-700 hover:bg-green-200 transition-colors cursor-pointer"
          >
            <i className="ri-close-line text-xs"></i>
          </button>
        </div>
      )}

      {/* Recovery Success Banner */}
      {recoverySuccess && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 rounded-full bg-green-100 border border-green-200 px-5 py-2.5 text-sm font-medium text-green-700 shadow-lg flex items-center gap-2 animate-in">
          <i className="ri-check-line"></i>
          {recoverySuccess}
        </div>
      )}

      {/* Navbar */}
      <nav className="sticky top-0 z-40 bg-background-50/95 backdrop-blur-md border-b border-background-200/70 shadow-sm">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-4 md:px-6">
          <Link to="/" className="flex items-center cursor-pointer flex-shrink-0 active:opacity-70">
            <EditableImage
              contentKey="site_logo_nav"
              fallbackSrc="https://storage.readdy-site.link/project_files/6b577641-b4ea-4107-bb56-5f8fbbf97e07/319ec2ab-1af0-46ca-beed-0358e5e16485_sportowy_vibebez-sloganu2.svg"
              alt="Sportowy VIBE"
              className="h-10 w-auto max-w-[160px] object-contain"
            />
          </Link>
          <div className="hidden md:flex items-center gap-1">
            <Link to="/" className="cursor-pointer rounded-md px-3 py-2 text-sm font-medium text-foreground-600 transition-colors hover:bg-background-100 hover:text-primary-600 active:bg-primary-100/50">{t('nav.home')}</Link>
            <Link to="/aktualnosci" className="cursor-pointer rounded-md px-3 py-2 text-sm font-medium text-foreground-600 transition-colors hover:bg-background-100 hover:text-primary-600 active:bg-primary-100/50">{t('nav.news')}</Link>
            <span className="cursor-pointer rounded-md px-3 py-2 text-sm font-medium text-primary-600 bg-primary-50">{t('nav.settings')}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleThemeChange(currentTheme === 'dark' ? 'light' : 'dark')}
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-background-200/70 bg-background-50 text-foreground-600 transition-all hover:border-primary-300 hover:text-primary-600 hover:bg-primary-50/50"
              title={currentTheme === 'dark' ? 'Jasny motyw' : 'Ciemny motyw'}
            >
              <i className={`${themeIcon} text-sm`}></i>
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 rounded-md bg-primary-500 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-primary-600 whitespace-nowrap cursor-pointer"
            >
              <i className="ri-arrow-left-line text-sm"></i>
              {t('nav.back')}
            </button>
          </div>
        </div>
      </nav>

      <Breadcrumbs sticky />

      <main>
        {/* Hero */}
        <section className="relative py-16 md:py-24 bg-background-100">
          <div className="mx-auto max-w-[900px] px-4 md:px-6 text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary-300/50 bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-600 mb-4">
              <i className="ri-settings-3-line"></i>
              {t('settings.badge')}
            </span>
            <h1 className="font-heading text-3xl md:text-5xl font-bold text-foreground-950 tracking-tight">
              <EditableColor contentKey="color_ustawienia_hero_title" fallbackColor="#0F172A">
                <EditableText contentKey="ustawienia_hero_title" fallback={t('settings.subtitle')} />
              </EditableColor>
            </h1>
            <p className="mt-4 max-w-xl mx-auto text-base text-foreground-600">
              <EditableColor contentKey="color_ustawienia_hero_desc" fallbackColor="#475569">
                <EditableText contentKey="ustawienia_hero_desc" fallback={t('settings.description')} as="span" />
              </EditableColor>
            </p>
          </div>
        </section>

        {/* Settings */}
        <section className="py-14 md:py-20">
          <div className="mx-auto max-w-[700px] px-4 md:px-6">

            {/* Profile Card */}
            <div className="rounded-2xl border border-background-200/80 bg-background-100 p-8 md:p-10 mb-6">
              <div className="flex flex-col items-center text-center">
                {/* Avatar */}
                <div className="relative mb-5 group">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={handleAvatarClick}
                    disabled={uploadingAvatar}
                    className="relative cursor-pointer disabled:cursor-wait"
                    title={t('settings.change_avatar')}
                  >
                    {localAvatar ? (
                      <img
                        src={localAvatar}
                        alt={displayName}
                        className="h-24 w-24 md:h-28 md:w-28 rounded-full object-cover border-[3px] border-primary-200 shadow-sm transition-opacity group-hover:opacity-80"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <span className="inline-flex h-24 w-24 md:h-28 md:w-28 items-center justify-center rounded-full bg-primary-500 text-3xl font-bold text-white transition-opacity group-hover:opacity-80">
                        {initials}
                      </span>
                    )}
                    {/* Hover overlay */}
                    <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                      {uploadingAvatar ? (
                        <i className="ri-loader-4-line animate-spin text-white text-xl"></i>
                      ) : (
                        <i className="ri-camera-line text-white text-xl"></i>
                      )}
                    </span>
                  </button>
                  <span className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-[3px] border-white bg-accent-500">
                    <i className={`${providerIcon} text-xs text-white`}></i>
                  </span>
                </div>

                {/* Name - editable */}
                {editingName ? (
                  <div className="w-full max-w-xs mx-auto">
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      maxLength={50}
                      autoFocus
                      className="w-full rounded-md border border-primary-400 bg-background-50 px-3 py-2 text-center text-lg font-bold text-foreground-950 outline-none focus:ring-2 focus:ring-primary-400/20"
                      onKeyDown={(e) => { if (e.key === 'Enter') handleSaveName(); if (e.key === 'Escape') { setEditingName(false); setDisplayName(rawDisplayName); } }}
                    />
                    <div className="flex items-center justify-center gap-2 mt-2">
                      <button
                        type="button"
                        onClick={handleSaveName}
                        disabled={savingName || !displayName.trim()}
                        className="inline-flex items-center gap-1.5 rounded-md bg-primary-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
                      >
                        {savingName ? (
                          <i className="ri-loader-4-line animate-spin text-xs"></i>
                        ) : (
                          <i className="ri-check-line text-xs"></i>
                        )}
                        {t('settings.save')}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setEditingName(false); setDisplayName(rawDisplayName); }}
                        className="inline-flex items-center gap-1.5 rounded-md border border-background-200 px-3 py-1.5 text-xs font-medium text-foreground-600 hover:bg-background-50 cursor-pointer whitespace-nowrap"
                      >
                        {t('settings.cancel')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="group">
                    <h2 className="font-heading text-xl md:text-2xl font-bold text-foreground-950 inline-flex items-center gap-2">
                      {displayName}
                      {provider !== 'google' && (
                        <button
                          type="button"
                          onClick={() => setEditingName(true)}
                          className="flex h-7 w-7 items-center justify-center rounded-md text-foreground-300 opacity-0 group-hover:opacity-100 hover:text-primary-500 hover:bg-primary-50 transition-all cursor-pointer"
                          title={t('settings.edit_name')}
                        >
                          <i className="ri-pencil-line text-sm"></i>
                        </button>
                      )}
                    </h2>
                  </div>
                )}

                {/* Email */}
                {user?.email && (
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <p className="text-sm text-foreground-500">{user.email}</p>
                    {emailVerified ? (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-accent-50 px-2 py-0.5 text-[11px] font-medium text-accent-600">
                        <i className="ri-shield-check-line text-[10px]"></i>
                        {t('settings.verified')}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-secondary-50 px-2 py-0.5 text-[11px] font-medium text-secondary-600">
                        <i className="ri-error-warning-line text-[10px]"></i>
                        {t('settings.unverified')}
                      </span>
                    )}
                  </div>
                )}

                {/* Provider badge */}
                <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-background-200 bg-background-50 px-3 py-1 text-xs font-medium text-foreground-500">
                  <i className={`${providerIcon} text-xs`}></i>
                  {t('settings.logged_in_as')} {providerLabel}
                </span>

                {/* Username / Login */}
                <div className="mt-5 w-full max-w-xs mx-auto">
                  {editingUsername ? (
                    <div>
                      <label className="block mb-1 text-[11px] font-semibold uppercase tracking-wide text-foreground-400 text-left">
                        {t('settings.username_label')}
                      </label>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => { setUsername(e.target.value); setUsernameError(''); }}
                        maxLength={30}
                        autoFocus
                        placeholder={t('settings.username_placeholder')}
                        className="w-full rounded-md border border-primary-400 bg-background-50 px-3 py-2 text-sm text-foreground-900 outline-none focus:ring-2 focus:ring-primary-400/20 placeholder-foreground-300"
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSaveUsername(); if (e.key === 'Escape') { setEditingUsername(false); setUsername(currentUsername ?? ''); setUsernameError(''); } }}
                      />
                      {usernameError && (
                        <p className="mt-1 text-left text-[11px] font-medium text-red-500">{usernameError}</p>
                      )}
                      {!usernameError && (
                        <p className="mt-1 text-left text-[11px] text-foreground-400">{t('settings.username_hint')}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          type="button"
                          onClick={handleSaveUsername}
                          disabled={savingUsername || !username.trim()}
                          className="inline-flex items-center gap-1.5 rounded-md bg-primary-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
                        >
                          {savingUsername ? (
                            <i className="ri-loader-4-line animate-spin text-xs"></i>
                          ) : (
                            <i className="ri-check-line text-xs"></i>
                          )}
                          {t('settings.save')}
                        </button>
                        <button
                          type="button"
                          onClick={() => { setEditingUsername(false); setUsername(currentUsername ?? ''); setUsernameError(''); }}
                          className="inline-flex items-center gap-1.5 rounded-md border border-background-200 px-3 py-1.5 text-xs font-medium text-foreground-600 hover:bg-background-50 cursor-pointer whitespace-nowrap"
                        >
                          {t('settings.cancel')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="group text-center">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-foreground-400 mb-0.5">
                        {t('settings.username_label')}
                      </p>
                      {currentUsername ? (
                        <p className="text-sm font-mono font-medium text-foreground-800 inline-flex items-center gap-2">
                          @{currentUsername}
                          <button
                            type="button"
                            onClick={() => { setUsername(currentUsername); setEditingUsername(true); }}
                            className="flex h-6 w-6 items-center justify-center rounded-md text-foreground-300 opacity-0 group-hover:opacity-100 hover:text-primary-500 hover:bg-primary-50 transition-all cursor-pointer"
                            title={t('settings.edit_username')}
                          >
                            <i className="ri-pencil-line text-xs"></i>
                          </button>
                        </p>
                      ) : (
                        <button
                          type="button"
                          onClick={() => { setUsername(''); setEditingUsername(true); }}
                          className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-background-300 px-3 py-1 text-xs font-medium text-foreground-400 hover:text-primary-500 hover:border-primary-300 hover:bg-primary-50/50 cursor-pointer whitespace-nowrap transition-colors"
                        >
                          <i className="ri-add-line text-xs"></i>
                          {t('settings.username_set')}
                        </button>
                      )}
                      <p className="mt-0.5 text-[11px] text-foreground-400">{t('settings.username_desc')}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Meta info grid */}
              <div className="mt-8 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-background-200/70 bg-background-50/70 p-4 text-center">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-foreground-400 mb-1">{t('settings.created_at')}</p>
                  <p className="text-sm font-semibold text-foreground-800">{createdAt ?? '—'}</p>
                </div>
                <div className="rounded-xl border border-background-200/70 bg-background-50/70 p-4 text-center">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-foreground-400 mb-1">{t('settings.last_login')}</p>
                  <p className="text-sm font-semibold text-foreground-800">{lastSignIn ?? '—'}</p>
                </div>
              </div>

              {/* Sign out */}
              <button
                type="button"
                onClick={handleSignOut}
                className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-lg border border-secondary-300/70 bg-background-100 px-4 py-2.5 text-sm font-medium text-secondary-700 transition-all hover:bg-secondary-50 hover:border-secondary-400 cursor-pointer whitespace-nowrap"
              >
                <i className="ri-logout-box-r-line text-sm"></i>
                {t('nav.sign_out')}
              </button>
            </div>

            {/* Settings list */}
            <div className="rounded-2xl border border-background-200/80 bg-background-100 p-5 md:p-6">
              <h3 className="px-3 mb-1 text-xs font-semibold uppercase tracking-wider text-foreground-400">
                {t('settings.preferences')}
              </h3>

              <div className="space-y-0.5">

                {/* Notifications */}
                <div className="flex items-center justify-between py-3 px-3 rounded-lg hover:bg-background-50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-background-100 text-foreground-500">
                      <i className="ri-notification-3-line text-sm"></i>
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground-800">{t('settings.notifications')}</p>
                      <p className="text-xs text-foreground-400">{notificationsEnabled ? t('settings.notifications_on') : t('settings.notifications_off')}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleNotifications}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors cursor-pointer ${notificationsEnabled ? 'bg-primary-500' : 'bg-background-300'}`}
                    role="switch"
                    aria-checked={notificationsEnabled}
                  >
                    <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${notificationsEnabled ? 'translate-x-6' : 'translate-x-1'}`}></span>
                  </button>
                </div>

                {/* Newsletter consent */}
                <div className="flex items-center justify-between py-3 px-3 rounded-lg hover:bg-background-50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-background-100 text-foreground-500">
                      <i className="ri-mail-send-line text-sm"></i>
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground-800">{t('settings.newsletter_consent')}</p>
                      <p className="text-xs text-foreground-400">{newsletterConsent ? t('settings.newsletter_consent_on') : t('settings.newsletter_consent_off')}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleNewsletter}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors cursor-pointer ${newsletterConsent ? 'bg-primary-500' : 'bg-background-300'}`}
                    role="switch"
                    aria-checked={newsletterConsent}
                  >
                    <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${newsletterConsent ? 'translate-x-6' : 'translate-x-1'}`}></span>
                  </button>
                </div>

                {/* Theme */}
                <div className="relative">
                  <div className="flex items-center justify-between py-3 px-3 rounded-lg hover:bg-background-50 transition-colors cursor-pointer" onClick={() => setShowThemeDropdown(!showThemeDropdown)}>
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-background-100 text-foreground-500">
                        <i className={`${themeIcon} text-sm`}></i>
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground-800">{t('settings.theme')}</p>
                        <p className="text-xs text-foreground-400">{themeLabel}</p>
                      </div>
                    </div>
                    <i className="ri-arrow-right-s-line text-foreground-300 flex-shrink-0"></i>
                  </div>
                  {showThemeDropdown && (
                    <div className="ml-14 mt-0.5 mb-1 rounded-lg border border-background-200 bg-background-100 shadow-sm overflow-hidden">
                      <button
                        type="button"
                        onClick={() => handleThemeChange('light')}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer transition-colors ${currentTheme === 'light' ? 'bg-primary-50 text-primary-700 font-semibold' : 'text-foreground-600 hover:bg-background-200'}`}
                      >
                        <i className="ri-sun-line text-sm"></i> {t('settings.theme_light')}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleThemeChange('dark')}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer transition-colors ${currentTheme === 'dark' ? 'bg-primary-50 text-primary-700 font-semibold' : 'text-foreground-600 hover:bg-background-200'}`}
                      >
                        <i className="ri-moon-line text-sm"></i> {t('settings.theme_dark')}
                      </button>
                    </div>
                  )}
                </div>

                {/* Language */}
                <div className="relative">
                  <div className="flex items-center justify-between py-3 px-3 rounded-lg hover:bg-background-50 transition-colors cursor-pointer" onClick={() => setShowLangDropdown(!showLangDropdown)}>
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-background-100 text-foreground-500">
                        <i className="ri-translate-2 text-sm"></i>
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground-800">{t('settings.language')}</p>
                        <p className="text-xs text-foreground-400">{currentLangLabel ? `${currentLangLabel.flag} ${currentLangLabel.label}` : currentLanguage}</p>
                      </div>
                    </div>
                    <i className="ri-arrow-right-s-line text-foreground-300 flex-shrink-0"></i>
                  </div>
                  {showLangDropdown && (
                    <div className="ml-14 mt-0.5 mb-1 rounded-lg border border-background-200 bg-background-100 shadow-sm overflow-hidden">
                      {LANGUAGES.map((l) => (
                        <button
                          key={l.value}
                          type="button"
                          onClick={() => handleLanguageChange(l.value)}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer transition-colors ${currentLanguage === l.value ? 'bg-primary-50 text-primary-700 font-semibold' : 'text-foreground-600 hover:bg-background-200'}`}
                        >
                          <span>{l.flag}</span> {l.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Password */}
            <div className="rounded-2xl border border-background-200/80 bg-background-100 p-5 md:p-6 mt-6">
              <h3 className="px-3 mb-1 text-xs font-semibold uppercase tracking-wider text-foreground-400">
                {t('settings.security')}
              </h3>

              <div className="py-3 px-3">
                {!showPasswordSection ? (
                  <button
                    type="button"
                    onClick={() => { setShowPasswordSection(true); setPasswordError(''); setPasswordSuccess(''); }}
                    className="flex w-full items-center justify-between rounded-lg hover:bg-background-50 transition-colors cursor-pointer py-2"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-background-100 text-foreground-500">
                        <i className="ri-lock-password-line text-sm"></i>
                      </span>
                      <div className="text-left">
                        <p className="text-sm font-medium text-foreground-800">
                          {recoveryMode
                            ? t('auth.recovery_title')
                            : provider === 'google'
                              ? t('settings.password_set_title')
                              : t('settings.password_change_title')}
                        </p>
                        <p className="text-xs text-foreground-400">
                          {recoveryMode
                            ? t('auth.recovery_subtitle')
                            : passwordLastSet
                              ? `${t('settings.password_last_set')}: ${passwordLastSet}`
                              : provider === 'google'
                                ? t('settings.password_set_desc')
                                : t('settings.password_change_desc')}
                        </p>
                      </div>
                    </div>
                    <i className="ri-arrow-right-s-line text-foreground-300 flex-shrink-0"></i>
                  </button>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-background-100 text-foreground-500">
                          <i className="ri-lock-password-line text-sm"></i>
                        </span>
                        <div>
                          <p className="text-sm font-medium text-foreground-800">
                            {recoveryMode
                              ? t('auth.recovery_title')
                              : provider === 'google'
                                ? t('settings.password_set_title')
                                : t('settings.password_change_title')}
                          </p>
                          {!recoveryMode && passwordLastSet && (
                            <p className="text-xs text-accent-600 font-medium mt-0.5">
                              {t('settings.password_last_set')}: {passwordLastSet}
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (recoveryMode) {
                            navigate('/');
                          } else {
                            setShowPasswordSection(false); setPasswordError(''); setPasswordSuccess(''); setNewPassword(''); setConfirmPassword(''); setShowNewPassword(false); setShowConfirmPassword(false); setVerificationStep('idle'); setVerificationCode(''); setCodeSent(false);
                          }
                        }}
                        className="text-xs text-foreground-400 hover:text-foreground-600 cursor-pointer"
                      >
                        {t('settings.cancel')}
                      </button>
                    </div>

                    {!recoveryMode && provider === 'google' ? (
                      <p className="text-xs text-foreground-500 mb-3 ml-12">
                        {t('settings.password_set_info')}
                      </p>
                    ) : null}

                    <div className="ml-12 space-y-3">
                      {/* Recovery mode: no verification needed, user already authenticated via recovery token */}
                      {recoveryMode ? (
                        <div className="rounded-lg border border-accent-200 bg-accent-50 p-3 mb-2">
                          <p className="text-xs font-medium text-accent-700">
                            <i className="ri-information-line mr-1"></i>
                            {t('auth.recovery_subtitle')}
                          </p>
                        </div>
                      ) : (
                        <>
                          {/* Email verification step */}
                          {!codeSent && (
                            <div className="rounded-lg border border-background-200 bg-background-50 p-3 mb-2">
                              <p className="text-xs text-foreground-600 mb-2">
                                <i className="ri-shield-check-line mr-1"></i>
                                Dla bezpieczeństwa wymagana jest weryfikacja e-mail przed zmianą hasła.
                              </p>
                              <button
                                type="button"
                                onClick={handleSendVerificationCode}
                                disabled={sendingCode}
                                className="inline-flex items-center gap-2 rounded-md bg-accent-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-600 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap transition-colors"
                              >
                                {sendingCode ? (
                                  <>
                                    <i className="ri-loader-4-line animate-spin text-sm"></i>
                                    Wysyłanie...
                                  </>
                                ) : (
                                  <>
                                    <i className="ri-mail-send-line text-sm"></i>
                                    Wyślij kod na e-mail
                                  </>
                                )}
                              </button>
                            </div>
                          )}

                          {codeSent && (
                            <div className="rounded-lg border border-accent-200 bg-accent-50 p-3 mb-2">
                              <p className="text-xs font-medium text-accent-700 mb-2">
                                <i className="ri-check-line mr-1"></i>
                                Kod wysłany na {user?.email}. Ważny 10 minut.
                              </p>
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={verificationCode}
                                  onChange={(e) => { setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setPasswordError(''); }}
                                  placeholder="000000"
                                  maxLength={6}
                                  autoFocus
                                  className="w-28 rounded-md border border-background-200 bg-background-50 px-3 py-2 text-center text-lg font-mono font-bold text-foreground-900 tracking-[6px] placeholder-foreground-300 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20"
                                />
                                <button
                                  type="button"
                                  onClick={handleSendVerificationCode}
                                  disabled={sendingCode}
                                  className="text-xs font-medium text-foreground-500 hover:text-primary-600 cursor-pointer whitespace-nowrap"
                                >
                                  {sendingCode ? 'Wysyłanie...' : 'Wyślij ponownie'}
                                </button>
                              </div>
                            </div>
                          )}
                        </>
                      )}

                      <div>
                        <label htmlFor="settings-new-password" className="block mb-1 text-xs font-semibold text-foreground-700">
                          {t('settings.new_password')}
                        </label>
                        <div className="relative">
                          <input
                            id="settings-new-password"
                            type={showNewPassword ? 'text' : 'password'}
                            value={newPassword}
                            onChange={(e) => { setNewPassword(e.target.value); setPasswordError(''); setPasswordSuccess(''); }}
                            minLength={6}
                            placeholder="••••••••"
                            autoComplete="new-password"
                            disabled={!codeSent && !recoveryMode}
                            className="w-full rounded-md border border-background-200 bg-background-50 px-3 py-2 pr-10 text-sm text-foreground-900 placeholder-foreground-300 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20 disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded text-foreground-400 hover:text-foreground-600 hover:bg-background-100 transition-colors cursor-pointer"
                            tabIndex={-1}
                            title={showNewPassword ? 'Ukryj hasło' : 'Pokaż hasło'}
                          >
                            <i className={showNewPassword ? 'ri-eye-off-line text-sm' : 'ri-eye-line text-sm'}></i>
                          </button>
                        </div>
                      </div>
                      <div>
                        <label htmlFor="settings-confirm-password" className="block mb-1 text-xs font-semibold text-foreground-700">
                          {t('settings.confirm_password')}
                        </label>
                        <div className="relative">
                          <input
                            id="settings-confirm-password"
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError(''); setPasswordSuccess(''); }}
                            minLength={6}
                            placeholder="••••••••"
                            autoComplete="new-password"
                            disabled={!codeSent && !recoveryMode}
                            className="w-full rounded-md border border-background-200 bg-background-50 px-3 py-2 pr-10 text-sm text-foreground-900 placeholder-foreground-300 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20 disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded text-foreground-400 hover:text-foreground-600 hover:bg-background-100 transition-colors cursor-pointer"
                            tabIndex={-1}
                            title={showConfirmPassword ? 'Ukryj hasło' : 'Pokaż hasło'}
                          >
                            <i className={showConfirmPassword ? 'ri-eye-off-line text-sm' : 'ri-eye-line text-sm'}></i>
                          </button>
                        </div>
                      </div>

                      {passwordError && (
                        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-600 flex items-center gap-2">
                          <i className="ri-error-warning-line text-sm flex-shrink-0"></i>
                          <span>{passwordError}</span>
                        </div>
                      )}

                      {passwordSuccess && (
                        <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-xs font-medium text-green-600 flex items-center gap-2">
                          <i className="ri-checkbox-circle-line text-sm flex-shrink-0"></i>
                          <span>{passwordSuccess}</span>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={handleSavePassword}
                        disabled={savingPassword || (!recoveryMode && (!codeSent || !verificationCode)) || newPassword.length < 6 || newPassword !== confirmPassword}
                        className="inline-flex items-center gap-2 rounded-md bg-primary-500 px-4 py-2 text-xs font-semibold text-white dark:text-foreground-950 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap transition-colors"
                      >
                        {savingPassword ? (
                          <>
                            <i className="ri-loader-4-line animate-spin text-sm"></i>
                            {t('settings.saving')}
                          </>
                        ) : (
                          <>
                            <i className="ri-check-line text-sm"></i>
                            {provider === 'google'
                              ? t('settings.password_set_button')
                              : t('settings.password_change_button')}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>



            {/* Session Security */}
            <div className="rounded-2xl border border-background-200/80 bg-background-100 p-5 md:p-6 mt-6">
              <h3 className="px-3 mb-1 text-xs font-semibold uppercase tracking-wider text-foreground-400">
                {t('settings.session_security')}
              </h3>
              <div className="py-3 px-3">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-background-100 text-foreground-500 mt-1">
                    <i className="ri-shield-keyhole-line text-sm"></i>
                  </span>
                  <div>
                    <p className="text-sm font-medium text-foreground-800">{t('settings.hard_signout_title')}</p>
                    <p className="text-xs text-foreground-500 mt-1 max-w-lg leading-relaxed">
                      {t('settings.hard_signout_desc')}
                    </p>
                    <button
                      type="button"
                      onClick={async () => { await hardSignOut(); navigate('/'); }}
                      className="mt-3 inline-flex items-center gap-2 rounded-md border border-secondary-300 bg-background-100 px-4 py-2 text-xs font-semibold text-secondary-700 hover:bg-secondary-50 hover:border-secondary-400 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <i className="ri-logout-box-r-line text-sm"></i>
                      {t('settings.hard_signout_button')}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Windows Hello / WebAuthn */}
            <div className="rounded-2xl border border-background-200/80 bg-background-100 p-5 md:p-6 mt-6">
              <h3 className="px-3 mb-1 text-xs font-semibold uppercase tracking-wider text-foreground-400">
                {t('settings.webauthn_title')}
              </h3>
              <div className="py-3 px-3">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-background-100 text-foreground-500 mt-1">
                    <i className="ri-fingerprint-line text-sm"></i>
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground-800">{t('settings.webauthn_heading')}</p>
                    <p className="text-xs text-foreground-500 mt-1 max-w-lg leading-relaxed">
                      {t('settings.webauthn_desc')}
                    </p>

                    {/* WebAuthn status & actions */}
                    <div className="mt-3">
                      {webauthnError && (
                        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-600 flex items-center gap-2 mb-2">
                          <i className="ri-error-warning-line text-sm flex-shrink-0"></i>
                          <span>{webauthnError}</span>
                        </div>
                      )}
                      {webauthnSuccess && (
                        <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-xs font-medium text-green-600 flex items-center gap-2 mb-2">
                          <i className="ri-checkbox-circle-line text-sm flex-shrink-0"></i>
                          <span>{webauthnSuccess}</span>
                        </div>
                      )}

                      {hasWebAuthn ? (
                        <div>
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-accent-200 bg-accent-50 px-3 py-1 text-xs font-semibold text-accent-700">
                            <i className="ri-shield-check-line text-xs"></i>
                            {t('settings.webauthn_active')}
                          </span>
                          {!showWebauthnRemoveConfirm ? (
                            <button
                              type="button"
                              onClick={() => setShowWebauthnRemoveConfirm(true)}
                              className="mt-2 block text-xs font-medium text-red-500 hover:text-red-600 cursor-pointer"
                            >
                              {t('settings.webauthn_remove_button')}
                            </button>
                          ) : (
                            <div className="mt-2 rounded-lg border border-red-200 bg-red-50 p-3">
                              <p className="text-xs font-medium text-red-700 mb-2">
                                {t('settings.webauthn_remove_confirm')}
                              </p>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={handleRemoveWebAuthn}
                                  disabled={webauthnLoading}
                                  className="inline-flex items-center gap-1.5 rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
                                >
                                  {webauthnLoading ? (
                                    <i className="ri-loader-4-line animate-spin text-xs"></i>
                                  ) : (
                                    <i className="ri-delete-bin-6-line text-xs"></i>
                                  )}
                                  {t('settings.webauthn_remove_yes')}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setShowWebauthnRemoveConfirm(false)}
                                  disabled={webauthnLoading}
                                  className="inline-flex items-center gap-1.5 rounded-md border border-background-200 px-3 py-1.5 text-xs font-medium text-foreground-600 hover:bg-background-50 cursor-pointer whitespace-nowrap"
                                >
                                  {t('settings.cancel')}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={handleRegisterWebAuthn}
                          disabled={webauthnLoading}
                          className="inline-flex items-center gap-2 rounded-md bg-accent-500 px-4 py-2 text-xs font-semibold text-white hover:bg-accent-600 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap transition-colors"
                        >
                          {webauthnLoading ? (
                            <>
                              <i className="ri-loader-4-line animate-spin text-sm"></i>
                              {t('settings.webauthn_registering')}
                            </>
                          ) : (
                            <>
                              <span className="flex h-4 w-4 items-center justify-center">
                                <i className="ri-fingerprint-line text-sm"></i>
                              </span>
                              {t('settings.webauthn_register_button')}
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    <p className="text-[11px] text-foreground-400 mt-3 leading-relaxed">
                      <i className="ri-information-line text-xs mr-1"></i>
                      {t('settings.webauthn_info')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* TOTP 2FA (Google Authenticator) */}
            <div className="rounded-2xl border border-background-200/80 bg-background-100 p-5 md:p-6 mt-6">
              <h3 className="px-3 mb-1 text-xs font-semibold uppercase tracking-wider text-foreground-400">
                Weryfikacja dwuetapowa (2FA)
              </h3>
              <div className="py-3 px-3">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-background-100 text-foreground-500 mt-1">
                    <i className="ri-smartphone-line text-sm"></i>
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground-800">Google Authenticator (TOTP)</p>
                    <p className="text-xs text-foreground-500 mt-1 max-w-lg leading-relaxed">
                      Dodaj dodatkową warstwę zabezpieczeń. Po włączeniu, przy logowaniu będziesz musiał podać 6-cyfrowy kod z aplikacji Google Authenticator (lub innej kompatybilnej: Authy, Microsoft Authenticator).
                    </p>

                    {totpSetupError && (
                      <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-600 flex items-center gap-2 mt-3 mb-2">
                        <i className="ri-error-warning-line text-sm flex-shrink-0"></i>
                        <span>{totpSetupError}</span>
                      </div>
                    )}
                    {totpSetupSuccess && (
                      <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-xs font-medium text-green-600 flex items-center gap-2 mt-3 mb-2">
                        <i className="ri-checkbox-circle-line text-sm flex-shrink-0"></i>
                        <span>{totpSetupSuccess}</span>
                      </div>
                    )}

                    {totpEnabled ? (
                      <div className="mt-3">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-accent-200 bg-accent-50 px-3 py-1 text-xs font-semibold text-accent-700">
                          <i className="ri-shield-check-line text-xs"></i>
                          2FA aktywne
                        </span>
                        {!showTotpDisableConfirm ? (
                          <button
                            type="button"
                            onClick={() => setShowTotpDisableConfirm(true)}
                            className="mt-2 block text-xs font-medium text-red-500 hover:text-red-600 cursor-pointer"
                          >
                            Wyłącz 2FA
                          </button>
                        ) : (
                          <div className="mt-2 rounded-lg border border-red-200 bg-red-50 p-3">
                            <p className="text-xs font-medium text-red-700 mb-2">
                              Czy na pewno chcesz wyłączyć weryfikację dwuetapową? Twoje konto będzie mniej bezpieczne.
                            </p>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={handleDisableTOTP}
                                disabled={totpDisableLoading}
                                className="inline-flex items-center gap-1.5 rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
                              >
                                {totpDisableLoading ? (
                                  <i className="ri-loader-4-line animate-spin text-xs"></i>
                                ) : (
                                  <i className="ri-delete-bin-6-line text-xs"></i>
                                )}
                                Tak, wyłącz
                              </button>
                              <button
                                type="button"
                                onClick={() => setShowTotpDisableConfirm(false)}
                                className="inline-flex items-center gap-1.5 rounded-md border border-background-200 px-3 py-1.5 text-xs font-medium text-foreground-600 hover:bg-background-50 cursor-pointer whitespace-nowrap"
                              >
                                Anuluj
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="mt-3">
                        {!showTotpSetup ? (
                          <button
                            type="button"
                            onClick={handleSetupTOTP}
                            disabled={totpSetupLoading}
                            className="inline-flex items-center gap-2 rounded-md bg-accent-500 px-4 py-2 text-xs font-semibold text-white hover:bg-accent-600 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap transition-colors"
                          >
                            {totpSetupLoading ? (
                              <>
                                <i className="ri-loader-4-line animate-spin text-sm"></i>
                                Generowanie...
                              </>
                            ) : (
                              <>
                                <i className="ri-qr-code-line text-sm"></i>
                                Skonfiguruj 2FA
                              </>
                            )}
                          </button>
                        ) : (
                          <div className="mt-3 rounded-lg border border-background-200 bg-background-50 p-4">
                            <p className="text-xs font-medium text-foreground-700 mb-3">
                              1. Zeskanuj kod QR w aplikacji Google Authenticator (lub Authy, Microsoft Authenticator):
                            </p>
                            <div className="flex justify-center mb-3">
                              <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(totpQrUrl)}`}
                                alt="TOTP QR Code"
                                className="w-40 h-40 rounded-lg border border-background-200"
                              />
                            </div>
                            <p className="text-xs text-foreground-500 mb-1">
                              Lub wpisz ręcznie ten klucz:
                            </p>
                            <p className="text-xs font-mono font-bold text-foreground-800 bg-background-100 rounded-md px-3 py-2 mb-3 break-all select-all">
                              {totpSecret}
                            </p>
                            <p className="text-xs font-medium text-foreground-700 mb-2">
                              2. Wprowadź 6-cyfrowy kod z aplikacji, aby potwierdzić:
                            </p>
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={totpSetupCode}
                                onChange={(e) => { setTotpSetupCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setTotpSetupError(''); }}
                                placeholder="000000"
                                maxLength={6}
                                autoFocus
                                className="w-28 rounded-md border border-background-200 bg-background-50 px-3 py-2 text-center text-lg font-mono font-bold text-foreground-900 tracking-[6px] placeholder-foreground-300 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20"
                              />
                              <button
                                type="button"
                                onClick={handleVerifyTOTPSetup}
                                disabled={totpSetupLoading || totpSetupCode.length !== 6}
                                className="inline-flex items-center gap-1.5 rounded-md bg-primary-500 px-3 py-2 text-xs font-semibold text-white hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
                              >
                                {totpSetupLoading ? (
                                  <i className="ri-loader-4-line animate-spin text-sm"></i>
                                ) : (
                                  <i className="ri-check-line text-sm"></i>
                                )}
                                Zweryfikuj
                              </button>
                            </div>
                            <button
                              type="button"
                              onClick={() => { setShowTotpSetup(false); setTotpSetupError(''); setTotpSetupCode(''); }}
                              className="mt-3 text-xs font-medium text-foreground-400 hover:text-foreground-600 cursor-pointer"
                            >
                              Anuluj
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    <p className="text-[11px] text-foreground-400 mt-3 leading-relaxed">
                      <i className="ri-information-line text-xs mr-1"></i>
                      Po włączeniu 2FA, przy każdym logowaniu będziesz musiał podać kod z aplikacji. Zachowaj klucz zapasowy w bezpiecznym miejscu.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* SMS 2FA */}
            <div className="rounded-2xl border border-background-200/80 bg-background-100 p-5 md:p-6 mt-6">
              <h3 className="px-3 mb-1 text-xs font-semibold uppercase tracking-wider text-foreground-400">
                Weryfikacja SMS (2FA)
              </h3>
              <div className="py-3 px-3">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-background-100 text-foreground-500 mt-1">
                    <i className="ri-chat-3-line text-sm"></i>
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground-800">Kod SMS na telefon</p>
                    <p className="text-xs text-foreground-500 mt-1 max-w-lg leading-relaxed">
                      Otrzymuj kod weryfikacyjny przez SMS na swój numer telefonu. Po włączeniu, przy logowaniu będziesz musiał podać kod z SMS-a.
                      {!twilioConfigured && (
                        <span className="block mt-1 text-amber-600 font-medium">
                          <i className="ri-error-warning-line text-xs mr-1"></i>
                          Administrator musi najpierw skonfigurować bramkę SMS (Twilio) w Supabase Dashboard.
                        </span>
                      )}
                    </p>
                    <Sms2faSection />
                  </div>
                </div>
              </div>
            </div>

            {/* Danger zone */}
            <div className="mt-6 rounded-2xl border border-red-200/70 bg-background-100 p-5 md:p-6">
              <h3 className="px-3 mb-1 text-xs font-semibold uppercase tracking-wider text-red-500">
                {t('settings.danger_zone')}
              </h3>
              <div className="py-3 px-3">
                <p className="text-xs text-foreground-500 mb-3">
                  {t('settings.delete_warning')}
                </p>
                {showDeleteConfirm ? (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                    <p className="text-sm font-semibold text-red-700 mb-3">
                      {t('settings.delete_confirm')}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleDeleteAccount}
                        disabled={deletingAccount}
                        className="inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
                      >
                        {deletingAccount ? (
                          <i className="ri-loader-4-line animate-spin text-sm"></i>
                        ) : (
                          <i className="ri-delete-bin-6-line text-sm"></i>
                        )}
                        {deletingAccount ? t('settings.deleting') : t('settings.delete_yes')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(false)}
                        disabled={deletingAccount}
                        className="inline-flex items-center gap-2 rounded-md border border-background-300 px-4 py-2 text-xs font-medium text-foreground-600 hover:bg-background-50 cursor-pointer whitespace-nowrap"
                      >
                        {t('settings.cancel')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="inline-flex items-center gap-2 rounded-md border border-red-300 bg-background-100 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 hover:border-red-400 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <i className="ri-delete-bin-6-line text-sm"></i>
                    {t('settings.delete_account')}
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>
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
              <span className="text-foreground-300 text-xs select-none">|</span>
              <Link to="/regulamin-serwisu" className="text-xs font-medium text-foreground-500 hover:text-primary-600 transition-colors whitespace-nowrap">
                Regulamin Serwisu
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