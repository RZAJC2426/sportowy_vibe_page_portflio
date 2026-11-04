import { useState, useRef, useCallback, useEffect, lazy, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { updateContent } from '@/data/siteContent';

const StorageBrowser = lazy(() => import('@/components/feature/StorageBrowser'));

interface Props {
  open: boolean;
  onClose: () => void;
  displayUrl: string;
  displayIsVideo: boolean;
  bgUrl: string | null;
  onSaved: (url: string) => void;
  onReset: () => void;
}

type ModalTab = 'url' | 'upload' | 'browse';

export default function HeroAdminModal({ open, onClose, displayUrl, displayIsVideo, bgUrl, onSaved, onReset }: Props) {
  const [modalTab, setModalTab] = useState<ModalTab>('url');
  const [urlInput, setUrlInput] = useState(displayUrl);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setUrlInput(displayUrl);
  }, [displayUrl]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const handleBackdrop = useCallback(
    (e: React.MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    },
    [onClose],
  );

  const handleSave = useCallback(async () => {
    const trimmed = urlInput.trim();
    if (!trimmed) {
      setError('Podaj adres URL wideo lub obrazka');
      return;
    }
    setSaving(true);
    setError('');
    const ok = await updateContent('home_hero_background_video', trimmed);
    if (ok) {
      onSaved(trimmed);
      onClose();
    } else {
      setError('Nie udało się zapisać. Sprawdź uprawnienia i spróbuj ponownie.');
    }
    setSaving(false);
  }, [urlInput, onSaved, onClose]);

  const handleReset = useCallback(async () => {
    setSaving(true);
    const ok = await updateContent('home_hero_background_video', '');
    if (ok) {
      onReset();
      onClose();
    } else {
      setError('Nie udało się przywrócić domyślnego tła.');
    }
    setSaving(false);
  }, [onReset, onClose]);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('Plik jest za duży. Maksymalny rozmiar to 100MB.');
      return;
    }

    setUploading(true);
    setUploadProgress('Wczytywanie pliku...');
    setError('');

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Nie udało się odczytać pliku'));
        reader.readAsDataURL(file);
      });

      setUploadProgress('Przesyłanie na serwer...');

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      const existingUrl = (bgUrl && bgUrl.includes('/site-images/')) ? bgUrl : undefined;

      const resp = await fetch(
        `${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/functions/v1/site-image-upload`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
          body: JSON.stringify({
            imageBase64: base64,
            fileName: file.name,
            contentType: file.type,
            ...(existingUrl ? { existingUrl } : {}),
          }),
        }
      );

      const result = await resp.json();
      if (!resp.ok || result.error) throw new Error(result.error || 'Błąd przesyłania');

      const uploadedUrl = result.url as string;
      setUploadProgress('Zapisywanie...');

      const ok = await updateContent('home_hero_background_video', uploadedUrl);
      if (ok) {
        onSaved(uploadedUrl);
        onClose();
      } else {
        setError('Plik przesłany, ale nie udało się zapisać URL.');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Nieznany błąd';
      setError(msg);
    } finally {
      setUploading(false);
      setUploadProgress('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [bgUrl, onSaved, onClose]);

  const handleStorageSelect = useCallback(async (url: string) => {
    setSaving(true);
    setError('');
    const ok = await updateContent('home_hero_background_video', url);
    if (ok) {
      onSaved(url);
      onClose();
    } else {
      setError('Nie udało się zapisać. Sprawdź uprawnienia i spróbuj ponownie.');
    }
    setSaving(false);
  }, [onSaved, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={handleBackdrop}
    >
      <div
        ref={modalRef}
        className="w-full max-w-[620px] max-h-[90vh] rounded-xl border border-background-200/80 bg-background-50 shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="flex items-center border-b border-background-200/70 shrink-0">
          <button
            type="button"
            onClick={() => setModalTab('upload')}
            className={`flex-1 py-3 text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              modalTab === 'upload'
                ? 'text-accent-600 border-b-2 border-accent-500 bg-accent-50/50'
                : 'text-foreground-500 hover:text-foreground-700 hover:bg-background-100'
            }`}
          >
            <i className="ri-upload-cloud-line mr-1.5"></i>
            Prześlij z urządzenia
          </button>
          <button
            type="button"
            onClick={() => setModalTab('url')}
            className={`flex-1 py-3 text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              modalTab === 'url'
                ? 'text-accent-600 border-b-2 border-accent-500 bg-accent-50/50'
                : 'text-foreground-500 hover:text-foreground-700 hover:bg-background-100'
            }`}
          >
            <i className="ri-link mr-1.5"></i>
            URL
          </button>
          <button
            type="button"
            onClick={() => setModalTab('browse')}
            className={`flex-1 py-3 text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              modalTab === 'browse'
                ? 'text-accent-600 border-b-2 border-accent-500 bg-accent-50/50'
                : 'text-foreground-500 hover:text-foreground-700 hover:bg-background-100'
            }`}
          >
            <i className="ri-folder-open-line mr-1.5"></i>
            Przeglądaj
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 cursor-pointer items-center justify-center text-foreground-400 hover:text-foreground-600 hover:bg-background-100 transition-colors ml-auto mr-1 rounded-md shrink-0"
          >
            <i className="ri-close-line text-lg"></i>
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1">
          <div className="mb-4">
            <p className="text-xs font-semibold text-foreground-500 mb-2">
              {displayIsVideo ? 'Obecne wideo' : 'Obecny obrazek'}
            </p>
            <div className="relative h-32 w-full rounded-lg overflow-hidden bg-background-200/70">
              {displayIsVideo ? (
                <video autoPlay muted loop playsInline className="h-full w-full object-cover">
                  <source src={displayUrl} type="video/mp4" />
                </video>
              ) : (
                <img src={displayUrl} alt="Obecne tło" className="h-full w-full object-cover" />
              )}
            </div>
          </div>

          {modalTab === 'upload' && (
            <div>
              <div
                className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-background-300 bg-background-100/50 p-8 cursor-pointer hover:border-accent-400 hover:bg-accent-50/30 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {uploading ? (
                  <div className="text-center">
                    <span className="flex h-12 w-12 mx-auto items-center justify-center rounded-full bg-accent-100 text-accent-500 animate-spin mb-3">
                      <i className="ri-loader-4-line text-2xl"></i>
                    </span>
                    <p className="text-sm font-medium text-foreground-600">{uploadProgress}</p>
                  </div>
                ) : (
                  <>
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-background-200/70 text-foreground-400 mb-3">
                      <i className="ri-video-upload-line text-2xl"></i>
                    </span>
                    <p className="text-sm font-medium text-foreground-700">Kliknij, aby wybrać plik z komputera</p>
                    <p className="mt-1 text-xs text-foreground-400">MP4, WebM, OGG, WebP, JPEG, PNG — max 100MB</p>
                    {bgUrl && bgUrl.includes('/site-images/') && (
                      <p className="mt-2 text-[11px] font-medium text-accent-600 bg-accent-50 px-2 py-0.5 rounded-full">
                        <i className="ri-refresh-line mr-1"></i>
                        Plik zostanie nadpisany (URL pozostanie ten sam)
                      </p>
                    )}
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/mp4,video/webm,video/ogg,image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </div>
          )}

          {modalTab === 'url' && (
            <div>
              <label className="block mb-1.5 text-sm font-semibold text-foreground-800">
                Adres URL wideo lub obrazka
              </label>
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://storage.readdy-site.link/.../twoje-tlo.mp4"
                className="w-full rounded-md border border-background-200 bg-background-50 px-3.5 py-2.5 text-sm text-foreground-900 placeholder-foreground-400 outline-none transition-colors focus:border-accent-400 focus:ring-2 focus:ring-accent-400/20"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave();
                }}
              />
              <p className="mt-1.5 text-[11px] text-foreground-400">
                Wpisz <code className="text-accent-600 bg-accent-50 px-1 rounded">.mp4</code>, <code className="text-accent-600 bg-accent-50 px-1 rounded">.webm</code> dla wideo, lub <code className="text-accent-600 bg-accent-50 px-1 rounded">.webp</code>, <code className="text-accent-600 bg-accent-50 px-1 rounded">.jpg</code>, <code className="text-accent-600 bg-accent-50 px-1 rounded">.png</code> dla obrazka.
              </p>
            </div>
          )}

          {modalTab === 'browse' && (
            <Suspense fallback={<div className="p-4 text-center text-foreground-500">Ładowanie...</div>}>
              <StorageBrowser
                currentUrl={displayUrl}
                onSelect={handleStorageSelect}
                onCancel={onClose}
              />
            </Suspense>
          )}

          {error && (
            <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700 flex items-center gap-2">
              <i className="ri-error-warning-fill text-base shrink-0"></i>
              {error}
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-background-200/70 flex items-center justify-end gap-2 shrink-0">
          {bgUrl && (
            <button
              type="button"
              onClick={handleReset}
              disabled={saving}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100 transition-colors disabled:opacity-60 whitespace-nowrap"
            >
              <i className="ri-restart-line"></i>
              Przywróć domyślne
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 rounded-md border border-background-200 bg-background-50 px-4 py-2 text-sm font-medium text-foreground-600 hover:bg-background-100 transition-colors cursor-pointer whitespace-nowrap"
          >
            Anuluj
          </button>
          {modalTab === 'url' && (
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-md bg-accent-500 px-4 py-2 text-sm font-semibold text-white hover:bg-accent-600 transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
            >
              {saving ? (
                <>
                  <i className="ri-loader-4-line animate-spin"></i>
                  Zapisywanie...
                </>
              ) : (
                <>
                  <i className="ri-check-line"></i>
                  Zapisz
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}