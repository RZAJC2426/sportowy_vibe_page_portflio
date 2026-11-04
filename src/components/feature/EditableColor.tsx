import { useState, useCallback, useEffect, useRef, isValidElement, cloneElement, Children } from 'react';
import type { ReactElement } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getContentByKey, updateContent } from '@/data/siteContent';
import EditableText from './EditableText';

interface EditableColorProps {
  /** Content key in site_content table for storing the hex color */
  contentKey: string;
  /** Fallback color when no DB value exists */
  fallbackColor?: string;
  /** Target CSS property to apply the color to */
  property?: 'color' | 'backgroundColor' | 'borderColor';
  /** Additional classes */
  className?: string;
  /** Children to render */
  children: React.ReactNode;
  /** Tag to render */
  as?: 'span' | 'div' | 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  /** Show admin hint dot */
  showHint?: boolean;
}

const PRESET_COLORS = [
  '#14B8A6', '#10B981', '#3B82F6', '#6366F1', '#8B5CF6',
  '#EC4899', '#F43F5E', '#F97316', '#F59E0B', '#84CC16',
  '#06B6D4', '#0EA5E9', '#64748B', '#94A3B8', '#1E293B',
  '#FFFFFF', '#F8FAFC', '#FEF3C7', '#FEF2F2', '#0F172A',
];

type EditState = 'idle' | 'editing' | 'saving' | 'saved' | 'error';

export default function EditableColor({
  contentKey,
  fallbackColor = 'inherit',
  property = 'color',
  className = '',
  children,
  as: Tag = 'span',
  showHint = true,
}: EditableColorProps) {
  const { isAdmin } = useAuth();
  const [dbColor, setDbColor] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [editState, setEditState] = useState<EditState>('idle');
  const [editValue, setEditValue] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [savedFlash, setSavedFlash] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // ─── UNIFIED EDITOR: if the only child is an <EditableText>, merge the
  // color editing INTO that text editor (single hover button, single modal).
  // This eliminates the old overlap where the text pencil and the color dot
  // fought for the same spot and the color dot was unclickable.
  const childArray = Children.toArray(children);
  const singleChild = childArray.length === 1 ? childArray[0] : null;
  const childIsEditableText =
    isValidElement(singleChild) && singleChild.type === EditableText;

  // All hooks must run unconditionally (before any early return).
  useEffect(() => {
    // Skip standalone color loading when we delegate to EditableText.
    if (childIsEditableText) return;
    let cancelled = false;
    getContentByKey(contentKey)
      .then((val) => {
        if (cancelled) return;
        setDbColor(val);
        setLoaded(true);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error(`[EditableColor] load error for "${contentKey}":`, err);
        setLoaded(true);
      });
    return () => { cancelled = true; };
  }, [contentKey, childIsEditableText]);

  // BEFORE loaded: inherit from CSS classes (no color flash).
  // AFTER loaded: use db value if exists, else fallbackColor.
  const displayColor = dbColor !== null ? dbColor : (loaded ? fallbackColor : 'inherit');

  const handleStartEdit = useCallback(() => {
    setEditValue(displayColor === 'inherit' ? '' : displayColor);
    setModalOpen(true);
    setEditState('editing');
    setErrorMsg('');
  }, [displayColor]);

  const handleCancel = useCallback(() => {
    setModalOpen(false);
    setEditState('idle');
    setEditValue('');
    setErrorMsg('');
  }, []);

  const handleSave = useCallback(async () => {
    const trimmed = editValue.trim();
    if (!trimmed) {
      setEditState('saving');
      setErrorMsg('');
      const ok = await updateContent(contentKey, '');
      if (ok) {
        setDbColor(null);
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
      return;
    }
    if (!/^#[0-9A-Fa-f]{6}$/.test(trimmed)) {
      setEditState('error');
      setErrorMsg('Nieprawidłowy kod HEX (np. #14B8A6)');
      return;
    }
    setEditState('saving');
    setErrorMsg('');
    const ok = await updateContent(contentKey, trimmed);
    if (ok) {
      setDbColor(trimmed);
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

  // ─── DELEGATE TO EDITABLETEXT (unified single editor) ─────────────
  if (childIsEditableText) {
    const el = singleChild as ReactElement<Record<string, unknown>>;
    return cloneElement(el, {
      colorKey: contentKey,
      colorFallback: fallbackColor,
      colorProperty: property,
    });
  }

  // ─── STANDALONE COLOR MODE (child is plain text / not EditableText) ─
  const styleProp: React.CSSProperties = {};
  if (displayColor && displayColor !== 'inherit') {
    styleProp[property] = displayColor;
  }

  // Non-admin: hide until loaded, then show with correct color.
  // Eliminates the "green-then-blue" flash.
  if (!isAdmin) {
    return (
      <Tag
        className={`${className} transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        style={styleProp}
      >
        {children}
      </Tag>
    );
  }

  if (!loaded) {
    return <Tag className={className} style={styleProp}>{children}</Tag>;
  }

  return (
    <>
      <div ref={containerRef} className="relative inline-block group max-w-full">
        <Tag className={className} style={styleProp}>{children}</Tag>
        {showHint && (
          <button
            type="button"
            onClick={handleStartEdit}
            className={`absolute -right-6 top-1/2 -translate-y-1/2 z-10 flex h-5 w-5 cursor-pointer items-center justify-center rounded-full border border-white/80 shadow-sm transition-all duration-150 opacity-0 group-hover:opacity-100 hover:scale-125 ${
              savedFlash ? '!opacity-100 scale-125' : ''
            }`}
            style={{ backgroundColor: displayColor === 'inherit' ? '#94a3b8' : displayColor }}
            title="Zmień kolor"
          >
            <i className={`${savedFlash ? 'ri-check-line' : 'ri-palette-line'} text-[9px] text-white mix-blend-difference`}></i>
          </button>
        )}
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
            className="w-full max-w-[440px] rounded-xl border border-background-200/80 bg-background-50 shadow-2xl overflow-visible"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-background-200/70">
              <h4 className="text-sm font-bold text-foreground-800">
                <i className="ri-palette-line mr-1.5 text-primary-500"></i>
                Wybierz kolor
              </h4>
              <button
                type="button"
                onClick={handleCancel}
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-foreground-400 hover:text-foreground-600 hover:bg-background-100 transition-colors"
              >
                <i className="ri-close-line text-lg"></i>
              </button>
            </div>

            <div className="p-5">
              <div className="mb-4 flex items-center gap-3">
                <div
                  className="h-10 w-10 shrink-0 rounded-lg border border-background-200 shadow-sm"
                  style={{ backgroundColor: editValue || '#94a3b8' }}
                />
                <div className="flex-1 min-w-0">
                  <label className="block text-xs font-semibold text-foreground-700 mb-1">Kod HEX</label>
                  <div className="flex">
                    <span className="flex h-9 items-center px-2 rounded-l-md border border-r-0 border-background-200 bg-background-100 text-sm text-foreground-500">#</span>
                    <input
                      type="text"
                      value={editValue.replace(/^#/, '')}
                      onChange={(e) => setEditValue('#' + e.target.value.replace(/[^0-9A-Fa-f]/g, '').slice(0, 6))}
                      placeholder="14B8A6"
                      maxLength={7}
                      className="flex-1 min-w-0 rounded-r-md border border-background-200 bg-background-50 px-3 py-1.5 text-sm text-foreground-900 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20 uppercase"
                    />
                  </div>
                </div>
              </div>

              <p className="text-xs font-semibold text-foreground-600 mb-2">Szybki wybór</p>
              <div className="grid grid-cols-5 gap-2 mb-4">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setEditValue(c)}
                    className={`h-8 w-full rounded-md border-2 transition-all cursor-pointer hover:scale-110 ${
                      editValue.toUpperCase() === c.toUpperCase() ? 'border-primary-500 scale-105' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: c }}
                    title={c}
                  />
                ))}
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={/^#[0-9A-Fa-f]{6}$/.test(editValue) ? editValue : '#94a3b8'}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="h-9 w-14 cursor-pointer rounded-md border border-background-200 bg-transparent p-0.5"
                />
                <span className="text-xs text-foreground-400">Lub wybierz z natywnego pickera</span>
              </div>

              {errorMsg && (
                <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 flex items-center gap-2">
                  <i className="ri-error-warning-fill text-sm shrink-0"></i>
                  {errorMsg}
                </div>
              )}

              <div className="mt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    setEditValue('');
                    await handleSave();
                  }}
                  disabled={editState === 'saving'}
                  className="inline-flex items-center gap-1.5 rounded-md border border-background-200 bg-background-50 px-3 py-2 text-xs font-medium text-foreground-600 transition-colors hover:bg-background-100 cursor-pointer whitespace-nowrap"
                >
                  <i className="ri-restart-line text-xs"></i>
                  Domyślny
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
          </div>
        </div>,
        document.body
      )}
    </>
  );
}