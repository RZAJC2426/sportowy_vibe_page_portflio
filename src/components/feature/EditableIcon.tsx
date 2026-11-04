import { useState, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getContentByKey, updateContent } from '@/data/siteContent';

interface EditableIconProps {
  contentKey: string;
  fallbackIcon: string;
  className?: string;
  title?: string;
}

const ICON_PRESETS = [
  'ri-global-line',
  'ri-earth-line',
  'ri-funds-line',
  'ri-line-chart-line',
  'ri-verified-badge-line',
  'ri-shield-check-line',
  'ri-award-line',
  'ri-medal-line',
  'ri-star-line',
  'ri-heart-line',
  'ri-user-heart-line',
  'ri-group-line',
  'ri-team-line',
  'ri-run-line',
  'ri-football-line',
  'ri-basketball-line',
  'ri-trophy-line',
  'ri-flag-line',
  'ri-map-pin-line',
  'ri-eye-line',
  'ri-lightbulb-line',
  'ri-hand-heart-line',
  'ri-home-line',
  'ri-building-line',
  'ri-community-line',
  'ri-megaphone-line',
  'ri-calendar-line',
  'ri-time-line',
  'ri-check-double-line',
  'ri-checkbox-circle-line',
];

type EditState = 'idle' | 'editing' | 'saving' | 'saved' | 'error';

/** Detect when a stored value is an image URL (uploaded custom icon) instead of a Remix Icon class name. */
function isImageUrl(value: string): boolean {
  const v = value.trim();
  return /^(https?:\/\/|data:image\/)/i.test(v) || /\.(svg|png|jpe?g|webp|gif)(\+xml)?/i.test(v);
}

export default function EditableIcon({
  contentKey,
  fallbackIcon,
  className = '',
  title,
}: EditableIconProps) {
  const { isAdmin } = useAuth();
  const [dbIcon, setDbIcon] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [editState, setEditState] = useState<EditState>('idle');
  const [editValue, setEditValue] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [savedFlash, setSavedFlash] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    getContentByKey(contentKey)
      .then((val) => {
        if (!cancelled) setDbIcon(val);
        setLoaded(true);
      })
      .catch((err) => {
        console.error(`[EditableIcon] load error for "${contentKey}":`, err);
        if (!cancelled) setLoaded(true);
      });
    return () => { cancelled = true; };
  }, [contentKey]);

  const displayIcon = dbIcon !== null ? dbIcon : fallbackIcon;
  const isImg = isImageUrl(displayIcon);

  const handleStartEdit = useCallback(() => {
    setEditValue(displayIcon);
    setModalOpen(true);
    setEditState('editing');
    setErrorMsg('');
    setSearch('');
  }, [displayIcon]);

  const handleCancel = useCallback(() => {
    setModalOpen(false);
    setEditState('idle');
    setEditValue('');
    setErrorMsg('');
    setSearch('');
  }, []);

  const handleSave = useCallback(async () => {
    const trimmed = editValue.trim();
    if (!trimmed) {
      setEditState('error');
      setErrorMsg('Nazwa ikony nie może być pusta.');
      return;
    }
    setEditState('saving');
    setErrorMsg('');
    const ok = await updateContent(contentKey, trimmed);
    if (ok) {
      setDbIcon(trimmed);
      setSavedFlash(true);
      setTimeout(() => {
        setEditState('idle');
        setModalOpen(false);
        setSavedFlash(false);
      }, 1200);
    } else {
      setEditState('error');
      setErrorMsg('Błąd zapisu — sprawdź uprawnienia.');
    }
  }, [editValue, contentKey]);

  useEffect(() => {
    if (!modalOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleCancel();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [modalOpen, handleCancel]);

  if (!loaded) {
    return <i className={`${fallbackIcon} ${className}`} title={title}></i>;
  }

  if (!isAdmin) {
    return isImg ? (
      <img
        src={displayIcon}
        alt={title || 'ikona'}
        className={`${className} h-[1.2em] w-[1.2em] max-w-none object-contain`}
      />
    ) : (
      <i className={`${displayIcon} ${className}`} title={title}></i>
    );
  }

  const filtered = search.trim()
    ? ICON_PRESETS.filter((ic) => ic.toLowerCase().includes(search.toLowerCase()))
    : ICON_PRESETS;

  return (
    <>
      <div ref={containerRef} className="relative inline-flex group">
        {isImg ? (
          <img
            src={displayIcon}
            alt={title || 'ikona'}
            className={`${className} h-[1.2em] w-[1.2em] max-w-none object-contain`}
          />
        ) : (
          <i className={`${displayIcon} ${className}`} title={title}></i>
        )}
        <button
          type="button"
          onClick={handleStartEdit}
          className={`absolute -right-5 -top-3 z-10 flex h-5 w-5 cursor-pointer items-center justify-center rounded-full bg-accent-500 text-white opacity-0 transition-all duration-150 group-hover:opacity-100 hover:scale-110 hover:bg-accent-600 ${
            savedFlash ? '!opacity-100 scale-110 !bg-green-500' : ''
          }`}
          title="Zmień ikonę"
        >
          {savedFlash ? (
            <i className="ri-check-line text-[9px]"></i>
          ) : (
            <i className="ri-image-line text-[9px]"></i>
          )}
        </button>
        {savedFlash && (
          <span className="absolute -top-6 left-1/2 -translate-x-1/2 rounded-full bg-green-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-md whitespace-nowrap animate-pulse pointer-events-none z-10">
            Zapisano!
          </span>
        )}
      </div>

      {modalOpen && createPortal(
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={(e) => {
            if (modalRef.current && !modalRef.current.contains(e.target as Node)) handleCancel();
          }}
        >
          <div
            ref={modalRef}
            className="w-full max-w-[440px] max-h-[80vh] overflow-hidden rounded-xl border border-background-200/80 bg-background-50 shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-background-200/70 shrink-0">
              <h4 className="text-sm font-bold text-foreground-800">
                <i className="ri-image-line mr-1.5 text-primary-500"></i>
                Wybierz ikonę
              </h4>
              <button
                type="button"
                onClick={handleCancel}
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-foreground-400 hover:text-foreground-600 hover:bg-background-100 transition-colors"
              >
                <i className="ri-close-line text-lg"></i>
              </button>
            </div>

            <div className="p-5 overflow-y-auto">
              {/* Current icon preview */}
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-background-200 bg-background-100">
                  <i className={`${editValue || fallbackIcon} text-xl text-foreground-700`}></i>
                </div>
                <div className="flex-1 min-w-0">
                  <label className="block text-xs font-semibold text-foreground-700 mb-1">Nazwa klasy ikony</label>
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    placeholder="np. ri-global-line"
                    className="w-full rounded-md border border-background-200 bg-background-50 px-3 py-1.5 text-sm text-foreground-900 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20"
                  />
                </div>
              </div>

              {/* Search */}
              <div className="mb-3 relative">
                <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-foreground-400 text-xs"></i>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Szukaj ikony..."
                  className="w-full rounded-md border border-background-200 bg-background-50 pl-8 pr-3 py-1.5 text-sm text-foreground-900 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20"
                />
              </div>

              {/* Preset grid */}
              <p className="text-xs font-semibold text-foreground-600 mb-2">Szybki wybór</p>
              <div className="grid grid-cols-6 gap-2">
                {filtered.map((ic) => (
                  <button
                    key={ic}
                    type="button"
                    onClick={() => setEditValue(ic)}
                    className={`flex flex-col items-center justify-center gap-1 rounded-md border p-2 transition-all cursor-pointer hover:scale-105 ${
                      editValue === ic
                        ? 'border-primary-500 bg-primary-500/10'
                        : 'border-background-200 bg-background-50 hover:bg-background-100'
                    }`}
                    title={ic}
                  >
                    <i className={`${ic} text-lg text-foreground-700`}></i>
                    <span className="text-[9px] text-foreground-400 truncate w-full text-center leading-none">{ic.replace('ri-', '').replace('-line', '').replace('-fill', '')}</span>
                  </button>
                ))}
              </div>

              {filtered.length === 0 && (
                <p className="text-center text-xs text-foreground-400 py-4">Brak wyników dla „{search}”</p>
              )}

              {errorMsg && (
                <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 flex items-center gap-2">
                  <i className="ri-error-warning-fill text-sm shrink-0"></i>
                  {errorMsg}
                </div>
              )}
            </div>

            <div className="shrink-0 px-5 py-3 border-t border-background-200/70 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={async () => {
                  setEditValue(fallbackIcon);
                  await handleSave();
                }}
                disabled={editState === 'saving'}
                className="inline-flex items-center gap-1.5 rounded-md border border-background-200 bg-background-50 px-3 py-2 text-xs font-medium text-foreground-600 transition-colors hover:bg-background-100 cursor-pointer whitespace-nowrap"
              >
                <i className="ri-restart-line text-xs"></i>
                Domyślna
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="inline-flex items-center gap-1.5 rounded-md border border-background-200 bg-background-50 px-3 py-2 text-xs font-medium text-foreground-600 transition-colors hover:bg-background-100 cursor-pointer whitespace-nowrap"
              >
                Anuluj
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={editState === 'saving'}
                className="inline-flex items-center gap-1.5 rounded-md bg-primary-500 px-3 py-2 text-xs font-semibold text-white transition-all hover:bg-primary-600 disabled:opacity-60 cursor-pointer whitespace-nowrap"
              >
                {editState === 'saving' ? (
                  <>
                    <i className="ri-loader-4-line animate-spin text-xs"></i>
                    Zapisywanie...
                  </>
                ) : (
                  <>
                    <i className="ri-check-line text-xs"></i>
                    Zapisz
                  </>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}