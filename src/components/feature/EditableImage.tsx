import { useState, useEffect, useRef, useCallback, useTransition, lazy, Suspense } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getContentByKey, updateContent } from '@/data/siteContent';
import { supabase } from '@/lib/supabase';

const StorageBrowser = lazy(() => import('./StorageBrowser'));

interface EditableImageProps {
  /** Content key in site_content table for storing the image URL */
  contentKey: string;
  /** Fallback image URL when no DB value exists */
  fallbackSrc: string;
  /** Alt text */
  alt: string;
  /** Additional classes for the img element */
  className?: string;
  /** Container classes */
  containerClassName?: string;
  /** img style object */
  style?: React.CSSProperties;
  /** Loading strategy */
  loading?: 'lazy' | 'eager';
  /** Fetch priority hint */
  fetchPriority?: 'high' | 'low' | 'auto';
  /** Data attribute for shop products */
  'data-product-shop'?: string;
  /** Fallback children shown when no custom image is available (e.g. Remix icon) */
  children?: React.ReactNode;
  /** Explicit width for the image element (reduces CLS) */
  width?: number;
  /** Explicit height for the image element (reduces CLS) */
  height?: number;
}

type ModalTab = 'url' | 'upload' | 'browse';

// Detect whether the caller already positions the container (absolute/fixed/
// relative/sticky). If so, we MUST NOT add our own `relative`, otherwise the
// two position utilities collide and Tailwind's `.relative` overrides
// `.absolute`, breaking `absolute inset-0` layouts (article & discipline hero).
function hasPositionClass(cls: string): boolean {
  return /(^|\s)(absolute|fixed|relative|sticky)(\s|$)/.test(cls);
}

export default function EditableImage({
  contentKey,
  fallbackSrc,
  alt,
  className = '',
  containerClassName = '',
  style,
  loading,
  fetchPriority,
  children,
  width,
  height,
  ...rest
}: EditableImageProps) {
  const { isAdmin } = useAuth();
  const [, startTransition] = useTransition();
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [imgPosX, setImgPosX] = useState(50);
  const [imgPosY, setImgPosY] = useState(50);
  const [modalTab, setModalTab] = useState<ModalTab>('upload');
  const [modalOpen, setModalOpen] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [savedFlash, setSavedFlash] = useState(false);
  const [posXInput, setPosXInput] = useState(50);
  const [posYInput, setPosYInput] = useState(50);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const erroredRef = useRef(false);

  // Fetch stored URL & position
  useEffect(() => {
    let cancelled = false;
    getContentByKey(contentKey).then((url) => {
      if (cancelled) return;
      if (url && url.length > 0) {
        // Reject relative paths and invalid URLs to avoid 400 errors from Supabase
        const isValidUrl = /^https?:\/\//.test(url) || url.startsWith('data:');
        if (isValidUrl) {
          setImgUrl(url);
        }
      }
    });
    getContentByKey(`${contentKey}_pos`).then((pos) => {
      if (cancelled) return;
      if (pos && pos.length > 0) {
        const parts = pos.split(' ');
        const x = parseFloat(parts[0]);
        const y = parseFloat(parts[1]);
        if (!isNaN(x) && !isNaN(y)) {
          setImgPosX(x);
          setImgPosY(y);
        }
      }
    });
    return () => { cancelled = true; };
  }, [contentKey]);

  const displaySrc = imgUrl || fallbackSrc;
  const objectPosition = `${imgPosX}% ${imgPosY}%`;

  // Reset the error guard whenever the shown src changes.
  useEffect(() => {
    erroredRef.current = false;
  }, [displaySrc]);

  const handleImgError = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      if (erroredRef.current) return;
      erroredRef.current = true;
      const el = e.currentTarget;
      // If a custom/stored URL failed, gracefully fall back to the default.
      if (fallbackSrc && el.src !== fallbackSrc) {
        el.src = fallbackSrc;
      }
    },
    [fallbackSrc]
  );

  const openModal = useCallback(
    (tab: ModalTab) => {
      setUrlInput(displaySrc);
      setPosXInput(imgPosX);
      setPosYInput(imgPosY);
      setError('');
      setModalTab(tab);
      startTransition(() => {
        setModalOpen(true);
      });
    },
    [displaySrc, imgPosX, imgPosY, startTransition]
  );

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setError('');
    setUploading(false);
    setUploadProgress('');
  }, []);

  const flashSaved = useCallback(() => {
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2000);
  }, []);

  // Close on Escape
  useEffect(() => {
    if (!modalOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [modalOpen, closeModal]);

  // Close on backdrop click
  const handleBackdrop = useCallback(
    (e: React.MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        closeModal();
      }
    },
    [closeModal]
  );

  const handleSaveUrl = useCallback(async () => {
    const trimmed = urlInput.trim();
    if (!trimmed) {
      setError('Podaj adres URL obrazka');
      return;
    }
    setSaving(true);
    setError('');
    const ok = await updateContent(contentKey, trimmed);
    if (ok) {
      setImgUrl(trimmed);
      setImgPosX(posXInput);
      setImgPosY(posYInput);
      await updateContent(`${contentKey}_pos`, `${posXInput} ${posYInput}`);
      closeModal();
      flashSaved();
    } else {
      setError('Nie udało się zapisać. Sprawdź uprawnienia i spróbuj ponownie.');
    }
    setSaving(false);
  }, [urlInput, contentKey, posXInput, posYInput, closeModal, flashSaved]);

  const handleStorageSelect = useCallback(
    async (url: string) => {
      setSaving(true);
      setError('');
      const ok = await updateContent(contentKey, url);
      if (ok) {
        setImgUrl(url);
        setImgPosX(posXInput);
        setImgPosY(posYInput);
        await updateContent(`${contentKey}_pos`, `${posXInput} ${posYInput}`);
        closeModal();
        flashSaved();
      } else {
        setError('Nie udało się zapisać. Sprawdź uprawnienia i spróbuj ponownie.');
      }
      setSaving(false);
    },
    [contentKey, posXInput, posYInput, closeModal, flashSaved]
  );

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (file.size > 10 * 1024 * 1024) {
        setError('Plik jest za duży. Maksymalny rozmiar to 10MB.');
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
            }),
          }
        );

        const result = await resp.json();
        if (!resp.ok || result.error) {
          throw new Error(result.error || 'Błąd przesyłania');
        }

        const uploadedUrl = result.url as string;
        setUploadProgress('Zapisywanie...');

        const ok = await updateContent(contentKey, uploadedUrl);
        if (ok) {
          setImgUrl(uploadedUrl);
          setImgPosX(posXInput);
          setImgPosY(posYInput);
          await updateContent(`${contentKey}_pos`, `${posXInput} ${posYInput}`);
          closeModal();
          flashSaved();
        } else {
          setError('Plik przesłany, ale nie udało się zapisać URL. Spróbuj ponownie.');
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Nieznany błąd';
        setError(msg);
      } finally {
        setUploading(false);
        setUploadProgress('');
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    },
    [contentKey, posXInput, posYInput, closeModal, flashSaved]
  );

  const handleSavePosition = useCallback(async () => {
    setSaving(true);
    setError('');
    const ok = await updateContent(`${contentKey}_pos`, `${posXInput} ${posYInput}`);
    if (ok) {
      setImgPosX(posXInput);
      setImgPosY(posYInput);
      closeModal();
      flashSaved();
    } else {
      setError('Nie udało się zapisać pozycji.');
    }
    setSaving(false);
  }, [contentKey, posXInput, posYInput, closeModal, flashSaved]);

  // Shared <img> element — identical for admin & non-admin so layout never
  // changes based on auth state.
  const combinedStyle: React.CSSProperties = {
    ...style,
    objectPosition,
  };

  const imgEl = (
    <img
      src={displaySrc}
      alt={alt}
      className={className}
      style={combinedStyle}
      loading={loading}
      fetchPriority={fetchPriority}
      decoding="async"
      onError={handleImgError}
      width={width}
      height={height}
      {...rest}
    />
  );

  // Non-admin: plain image or children fallback.
  if (!isAdmin) {
    if (!displaySrc) return children ? <div className={containerClassName}>{children}</div> : null;
    return <div className={containerClassName}>{imgEl}</div>;
  }

  // Admin: when no image source exists, show children + add button overlay
  const wrapperPos = hasPositionClass(containerClassName) ? '' : 'relative';

  if (!displaySrc) {
    return (
      <div className={`group ${wrapperPos} ${containerClassName}`.trim()} style={style}>
        {children || <span className="inline-block h-full w-full" />}
        <button
          type="button"
          className="absolute inset-0 z-30 flex items-center justify-center rounded bg-transparent opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          onClick={(ev) => {
            ev.stopPropagation();
            ev.preventDefault();
            openModal('upload');
          }}
          title="Kliknij, aby dodać ikonę"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black/40 text-white">
            <i className="ri-add-line text-xs"></i>
          </span>
        </button>
        {savedFlash && (
          <div className="absolute top-1/2 left-1/2 z-40 -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5 rounded-full bg-green-500 px-3 py-1.5 text-xs font-bold text-white shadow-lg animate-pulse pointer-events-none whitespace-nowrap">
            <i className="ri-check-line text-xs"></i>
            Zapisano!
          </div>
        )}
      </div>
    );
  }

  // Admin: has image — render editable overlay ABOVE any sibling
  // gradients/badges via z-index. Only add `relative` when the caller hasn't
  // already positioned the container.
  return (
    <>
      <div className={`group ${wrapperPos} ${containerClassName}`.trim()}>
        {imgEl}
        {/* Hover reveal overlay — sits above the img but uses pointer-events-none
            so it never blocks clicks to underlying buttons/links. The img inside
            the same wrapper still triggers group-hover, which reveals the
            clickable edit icons (those have pointer-events-auto). */}
        <div
          className="absolute inset-0 z-30 flex items-center justify-center gap-2 bg-black/0 group-hover:bg-black/40 transition-all duration-200 pointer-events-none"
        >
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-foreground-900 shadow-lg opacity-0 scale-90 transition-all duration-200 group-hover:opacity-100 group-hover:scale-100 hover:!scale-110 pointer-events-auto cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
            onClick={(ev) => {
              ev.stopPropagation();
              ev.preventDefault();
              openModal('upload');
            }}
            title="Kliknij, aby zmienić zdjęcie"
          >
            <i className="ri-image-edit-line text-lg"></i>
          </button>
          {imgUrl && (
            <button
              type="button"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-red-500 shadow-lg opacity-0 scale-90 transition-all duration-200 group-hover:opacity-100 group-hover:scale-100 hover:!scale-110 pointer-events-auto cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
              onClick={(ev) => {
                ev.stopPropagation();
                ev.preventDefault();
                setImgUrl(null);
                updateContent(contentKey, '').catch(() => {});
              }}
              title="Przywróć domyślne zdjęcie"
            >
              <i className="ri-restart-line text-lg"></i>
            </button>
          )}
        </div>
        {/* Admin indicator dot */}
        <div className="absolute top-1.5 right-1.5 z-30 flex h-5 w-5 items-center justify-center rounded-full bg-accent-500/90 text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <i className="ri-pencil-line text-[10px]"></i>
        </div>
        {/* Saved flash */}
        {savedFlash && (
          <div className="absolute top-1/2 left-1/2 z-40 -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5 rounded-full bg-green-500 px-3 py-1.5 text-xs font-bold text-white shadow-lg animate-pulse pointer-events-none whitespace-nowrap">
            <i className="ri-check-line text-xs"></i>
            Zapisano!
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
          onClick={handleBackdrop}
        >
          <div
            ref={modalRef}
            className="w-full max-w-[620px] max-h-[90vh] rounded-xl border border-background-200/80 bg-background-50 shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header with tabs */}
            <div className="flex items-center border-b border-background-200/70 shrink-0">
              <button
                type="button"
                onClick={() => setModalTab('upload')}
                className={`flex-1 py-3 text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  modalTab === 'upload'
                    ? 'text-primary-600 border-b-2 border-primary-500 bg-primary-50/50'
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
                    ? 'text-primary-600 border-b-2 border-primary-500 bg-primary-50/50'
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
                    ? 'text-primary-600 border-b-2 border-primary-500 bg-primary-50/50'
                    : 'text-foreground-500 hover:text-foreground-700 hover:bg-background-100'
                }`}
              >
                <i className="ri-folder-open-line mr-1.5"></i>
                Przeglądaj
              </button>
              <button
                type="button"
                onClick={closeModal}
                className="flex h-10 w-10 cursor-pointer items-center justify-center text-foreground-400 hover:text-foreground-600 hover:bg-background-100 transition-colors ml-auto mr-1 rounded-md shrink-0"
              >
                <i className="ri-close-line text-lg"></i>
              </button>
            </div>

            {/* Body - scrollable */}
            <div className="p-5 overflow-y-auto flex-1">
              {/* Preview with crop position */}
              <div className="mb-4">
                <p className="text-xs font-semibold text-foreground-500 mb-2">Podgląd kadrowania</p>
                <div className="relative h-40 w-full rounded-lg overflow-hidden bg-background-200/70">
                  <img
                    src={displaySrc}
                    alt="Podgląd"
                    className="h-full w-full object-cover"
                    style={{ objectPosition: `${posXInput}% ${posYInput}%` }}
                  />
                  {/* Crop crosshair lines */}
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-0 bottom-0 w-px bg-white/60" style={{ left: `${posXInput}%` }}></div>
                    <div className="absolute left-0 right-0 h-px bg-white/60" style={{ top: `${posYInput}%` }}></div>
                  </div>
                  {/* Center dot */}
                  <div className="absolute pointer-events-none flex items-center justify-center" style={{ left: `${posXInput}%`, top: `${posYInput}%` }}>
                    <span className="flex h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-md border-2 border-primary-500"></span>
                  </div>
                </div>
                {/* Position sliders */}
                <div className="mt-3 space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-foreground-500 w-4 shrink-0">X</span>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={posXInput}
                      onChange={(e) => setPosXInput(Number(e.target.value))}
                      className="flex-1 h-1.5 rounded-full appearance-none bg-background-200 cursor-pointer accent-primary-500"
                    />
                    <span className="text-xs font-mono text-foreground-500 w-8 text-right shrink-0">{posXInput}%</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-foreground-500 w-4 shrink-0">Y</span>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={posYInput}
                      onChange={(e) => setPosYInput(Number(e.target.value))}
                      className="flex-1 h-1.5 rounded-full appearance-none bg-background-200 cursor-pointer accent-primary-500"
                    />
                    <span className="text-xs font-mono text-foreground-500 w-8 text-right shrink-0">{posYInput}%</span>
                  </div>
                </div>
              </div>

              {modalTab === 'upload' && (
                <div>
                  <div
                    className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-background-300 bg-background-100/50 p-8 cursor-pointer hover:border-primary-400 hover:bg-primary-50/30 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {uploading ? (
                      <div className="text-center">
                        <span className="flex h-12 w-12 mx-auto items-center justify-center rounded-full bg-primary-100 text-primary-500 animate-spin mb-3">
                          <i className="ri-loader-4-line text-2xl"></i>
                        </span>
                        <p className="text-sm font-medium text-foreground-600">{uploadProgress}</p>
                      </div>
                    ) : (
                      <>
                        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-background-200/70 text-foreground-400 mb-3">
                          <i className="ri-image-add-line text-2xl"></i>
                        </span>
                        <p className="text-sm font-medium text-foreground-700">Kliknij, aby wybrać plik z komputera</p>
                        <p className="mt-1 text-xs text-foreground-400">PNG, JPEG, WebP, GIF, SVG — max 10MB</p>
                      </>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>
                </div>
              )}

              {modalTab === 'url' && (
                <div>
                  <label className="block mb-1.5 text-sm font-semibold text-foreground-800">
                    Adres URL obrazka
                  </label>
                  <input
                    type="text"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://..."
                    className="w-full rounded-md border border-background-200 bg-background-50 px-3.5 py-2.5 text-sm text-foreground-900 placeholder-foreground-400 outline-none transition-colors focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveUrl();
                    }}
                  />
                </div>
              )}

              {modalTab === 'browse' && (
                <Suspense fallback={<div className="p-4 text-center text-foreground-500 text-sm">Ładowanie...</div>}>
                  <StorageBrowser
                    currentUrl={displaySrc}
                    onSelect={handleStorageSelect}
                    onCancel={closeModal}
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

            {/* Footer actions */}
            <div className="px-5 py-3 border-t border-background-200/70 flex items-center justify-between gap-2 shrink-0">
              <div className="text-xs text-foreground-400">
                Kadrowanie: {posXInput}%, {posYInput}%
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="inline-flex items-center gap-1.5 rounded-md border border-background-200 bg-background-50 px-4 py-2 text-sm font-medium text-foreground-600 transition-colors hover:bg-background-100 cursor-pointer whitespace-nowrap"
                >
                  Anuluj
                </button>
                {modalTab === 'url' ? (
                  <button
                    type="button"
                    onClick={handleSaveUrl}
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 rounded-md bg-primary-500 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-primary-600 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
                  >
                    {saving ? (
                      <>
                        <i className="ri-loader-4-line animate-spin text-sm"></i>
                        Zapisywanie...
                      </>
                    ) : (
                      <>
                        <i className="ri-check-line text-sm"></i>
                        Zapisz obrazek
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSavePosition}
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 rounded-md bg-primary-500 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-primary-600 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
                  >
                    {saving ? (
                      <>
                        <i className="ri-loader-4-line animate-spin text-sm"></i>
                        Zapisywanie...
                      </>
                    ) : (
                      <>
                        <i className="ri-check-line text-sm"></i>
                        Zapisz kadrowanie
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}