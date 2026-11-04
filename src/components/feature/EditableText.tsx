import { useState, useCallback, useEffect, useRef, useTransition } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getContentByKey, updateContent } from '@/data/siteContent';

interface EditableTextProps {
  /** Content key in site_content table */
  contentKey: string;
  /** Fallback text shown when DB value is empty */
  fallback: string;
  /** Additional CSS classes for the text wrapper */
  className?: string;
  /** Tag to use for the text element */
  as?: 'span' | 'p' | 'div' | 'h1' | 'h2' | 'h3' | 'h4';
  /** Whether to show a subtle hint for admins */
  showHint?: boolean;
  /**
   * OPTIONAL COLOR SUPPORT — when provided, the single unified editor also
   * exposes a color picker. This lets one hover button edit BOTH the text and
   * its color in one modal, so the text-edit button and color-edit dot never
   * overlap / fight for the same spot (the old broken behaviour).
   */
  colorKey?: string;
  colorFallback?: string;
  colorProperty?: 'color' | 'backgroundColor' | 'borderColor';
  /**
   * OPTIONAL SHADOW SUPPORT — when provided, the unified editor exposes a
   * text-shadow intensity control alongside the color picker.
   */
  shadowKey?: string;
  shadowFallback?: string;
}

const PRESET_COLORS = [
  '#14B8A6', '#10B981', '#3B82F6', '#6366F1', '#8B5CF6',
  '#EC4899', '#F43F5E', '#F97316', '#F59E0B', '#84CC16',
  '#06B6D4', '#0EA5E9', '#64748B', '#94A3B8', '#1E293B',
  '#FFFFFF', '#F8FAFC', '#FEF3C7', '#FEF2F2', '#0F172A',
];

const SHADOW_PRESETS = [
  { label: 'Brak', value: 'none' },
  { label: 'Lekki', value: '0 1px 3px rgba(0,0,0,0.25)' },
  { label: 'Średni', value: '0 2px 6px rgba(0,0,0,0.35), 0 1px 2px rgba(0,0,0,0.2)' },
  { label: 'Mocny', value: '0 3px 10px rgba(0,0,0,0.45), 0 1px 4px rgba(0,0,0,0.3)' },
  { label: 'Bardzo mocny', value: '0 4px 14px rgba(0,0,0,0.55), 0 2px 6px rgba(0,0,0,0.35)' },
];

function getShadowPresetIndex(shadow: string): number {
  if (!shadow || shadow === 'none') return 0;
  const idx = SHADOW_PRESETS.findIndex((p) => p.value === shadow);
  return idx >= 0 ? idx : -1;
}

// ═══════════════════════════════════════════════════
// Textarea formatting helpers (HTML tags)
// ═══════════════════════════════════════════════════
function getTextareaSelection(ta: HTMLTextAreaElement): { start: number; end: number; text: string } {
  return { start: ta.selectionStart, end: ta.selectionEnd, text: ta.value.substring(ta.selectionStart, ta.selectionEnd) };
}

function replaceSelection(ta: HTMLTextAreaElement, replacement: string) {
  const start = ta.selectionStart;
  const end = ta.selectionEnd;
  const before = ta.value.substring(0, start);
  const after = ta.value.substring(end);
  ta.value = before + replacement + after;
  ta.selectionStart = ta.selectionEnd = start + replacement.length;
  ta.focus();
}

function wrapSelection(ta: HTMLTextAreaElement, open: string, close: string) {
  const { start, end, text } = getTextareaSelection(ta);
  const before = ta.value.substring(0, start);
  const after = ta.value.substring(end);
  const replacement = open + text + close;
  ta.value = before + replacement + after;
  ta.selectionStart = start + open.length;
  ta.selectionEnd = start + open.length + text.length;
  ta.focus();
}

function wrapLines(ta: HTMLTextAreaElement, lineOpen: string, lineClose: string, listOpen: string, listClose: string) {
  const { start, end, text } = getTextareaSelection(ta);
  const before = ta.value.substring(0, start);
  const after = ta.value.substring(end);
  const lines = text.split('\n').filter((l) => l.trim() !== '');
  const wrapped = lines.length > 0
    ? lines.map((l) => lineOpen + l.trim() + lineClose).join('\n')
    : lineOpen + lineClose;
  const replacement = listOpen + '\n' + wrapped + '\n' + listClose;
  ta.value = before + replacement + after;
  ta.selectionStart = start + replacement.length;
  ta.selectionEnd = start + replacement.length;
  ta.focus();
}

function insertAtCursor(ta: HTMLTextAreaElement, snippet: string) {
  const { start } = getTextareaSelection(ta);
  const before = ta.value.substring(0, start);
  const after = ta.value.substring(ta.selectionEnd);
  ta.value = before + snippet + after;
  const cursorPos = start + snippet.indexOf('<>') >= 0 ? start + snippet.indexOf('<>') : start + snippet.length;
  ta.selectionStart = ta.selectionEnd = cursorPos;
  ta.focus();
}

type EditState = 'idle' | 'editing' | 'saving' | 'saved' | 'error';

export default function EditableText({
  contentKey,
  fallback,
  className = '',
  as: Tag = 'span',
  showHint = true,
  colorKey,
  colorFallback,
  colorProperty = 'color',
  shadowKey,
  shadowFallback,
}: EditableTextProps) {
  const { isAdmin } = useAuth();
  const [, startTransition] = useTransition();
  const [dbText, setDbText] = useState<string | null>(null);
  const [dbColor, setDbColor] = useState<string | null>(null);
  const [dbShadow, setDbShadow] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [editState, setEditState] = useState<EditState>('idle');
  const [editValue, setEditValue] = useState('');
  const [colorValue, setColorValue] = useState('');
  const [shadowValue, setShadowValue] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [savedFlash, setSavedFlash] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const hasColor = !!colorKey;
  const hasShadow = !!shadowKey;
  const hasUnified = hasColor || hasShadow;

  useEffect(() => {
    let cancelled = false;
    const jobs: Promise<void>[] = [
      getContentByKey(contentKey)
        .then((text) => {
          if (!cancelled) setDbText(text);
        })
        .catch((err) => {
          console.error(`[EditableText] load error for "${contentKey}":`, err);
        }),
    ];
    if (colorKey) {
      jobs.push(
        getContentByKey(colorKey)
          .then((val) => {
            if (!cancelled) setDbColor(val);
          })
          .catch((err) => {
            console.error(`[EditableText] color load error for "${colorKey}":`, err);
          })
      );
    }
    if (shadowKey) {
      jobs.push(
        getContentByKey(shadowKey)
          .then((val) => {
            if (!cancelled) setDbShadow(val);
          })
          .catch((err) => {
            console.error(`[EditableText] shadow load error for "${shadowKey}":`, err);
          })
      );
    }
    Promise.all(jobs).finally(() => {
      if (!cancelled) setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [contentKey, colorKey, shadowKey]);

  // BEFORE loaded: inherit from CSS classes (no flash).
  // AFTER loaded: use db value if exists, else fallback.
  const displayText = dbText !== null ? dbText : (loaded ? fallback : fallback);
  const displayColor = dbColor !== null ? dbColor : (loaded ? (colorFallback || 'inherit') : 'inherit');
  const displayShadow = dbShadow !== null ? dbShadow : (loaded ? (shadowFallback || 'none') : 'none');

  const styleProp: React.CSSProperties = {};
  if (hasColor && displayColor && displayColor !== 'inherit') {
    styleProp[colorProperty] = displayColor;
  }
  if (hasShadow && displayShadow && displayShadow !== 'none') {
    styleProp.textShadow = displayShadow;
  }

  // Toolbar actions for rich text formatting
  const toolbarAction = useCallback((action: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    switch (action) {
      case 'bold':
        wrapSelection(ta, '<strong>', '</strong>');
        break;
      case 'italic':
        wrapSelection(ta, '<em>', '</em>');
        break;
      case 'ul':
        wrapLines(ta, '<li>', '</li>', '<ul>', '</ul>');
        break;
      case 'ol':
        wrapLines(ta, '<li>', '</li>', '<ol>', '</ol>');
        break;
      case 'link': {
        const url = window.prompt('Wklej adres URL (np. https://example.com):', 'https://');
        if (url && url !== 'https://') {
          const { text } = getTextareaSelection(ta);
          const label = text || 'Link';
          replaceSelection(ta, `<a href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`);
        }
        break;
      }
      case 'p':
        wrapSelection(ta, '<p>', '</p>');
        break;
      case 'blockquote':
        wrapSelection(ta, '<blockquote>', '</blockquote>');
        break;
      case 'br':
        insertAtCursor(ta, '<br />');
        break;
      default:
        break;
    }
    setEditValue(ta.value);
  }, []);

  const handleStartEdit = useCallback(() => {
    setEditValue(displayText);
    setColorValue(displayColor === 'inherit' ? '' : displayColor);
    setShadowValue(displayShadow === 'none' ? '' : displayShadow);
    setErrorMsg('');
    startTransition(() => {
      setEditState('editing');
    });
    if (!hasUnified) {
      requestAnimationFrame(() => {
        const ta = textareaRef.current;
        if (ta) {
          ta.focus();
          ta.setSelectionRange(ta.value.length, ta.value.length);
        }
      });
    }
  }, [displayText, displayColor, displayShadow, hasUnified, startTransition]);

  const handleCancel = useCallback(() => {
    setEditState('idle');
    setEditValue('');
    setColorValue('');
    setShadowValue('');
    setErrorMsg('');
  }, []);

  const handleSave = useCallback(async () => {
    const trimmed = editValue.trim();
    if (!trimmed) {
      setEditState('error');
      setErrorMsg('Tekst nie może być pusty.');
      return;
    }
    // Validate color when provided & non-empty
    const trimmedColor = colorValue.trim();
    if (hasColor && trimmedColor && !/^#[0-9A-Fa-f]{6}$/.test(trimmedColor)) {
      setEditState('error');
      setErrorMsg('Nieprawidłowy kod HEX (np. #14B8A6)');
      return;
    }

    setEditState('saving');
    setErrorMsg('');

    // Save text first
    const okText = await updateContent(contentKey, trimmed);
    let okColor = true;
    let okShadow = true;
    if (hasColor && colorKey) {
      okColor = await updateContent(colorKey, trimmedColor);
    }
    if (hasShadow && shadowKey) {
      okShadow = await updateContent(shadowKey, shadowValue.trim());
    }

    if (okText && okColor && okShadow) {
      setDbText(trimmed);
      if (hasColor) setDbColor(trimmedColor || null);
      if (hasShadow) setDbShadow(shadowValue.trim() || null);
      setEditState('saved');
      setSavedFlash(true);
      setTimeout(() => {
        setEditState('idle');
        setSavedFlash(false);
      }, 1600);
    } else {
      setEditState('error');
      setErrorMsg('Błąd zapisu — sprawdź uprawnienia admina.');
      console.error(`[EditableText] save failed key="${contentKey}" color="${colorKey}" shadow="${shadowKey}"`);
    }
  }, [editValue, colorValue, shadowValue, contentKey, colorKey, shadowKey, hasColor, hasShadow]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') handleCancel();
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleSave();
      }
    },
    [handleCancel, handleSave]
  );

  // Close inline editor on outside click (only for the non-unified inline mode)
  useEffect(() => {
    if (editState !== 'editing' || hasUnified) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        handleCancel();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [editState, handleCancel, hasUnified]);

  // Escape key for modal mode
  useEffect(() => {
    if (editState !== 'editing' || !hasUnified) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleCancel();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [editState, handleCancel, hasUnified]);

  // Non-admin: hide content until DB responds, then show the real text.
  // This eliminates the "flash" where fallback text renders first.
  if (!isAdmin) {
    return (
      <Tag
        className={`${className} transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        style={styleProp}
        dangerouslySetInnerHTML={{ __html: displayText }}
      />
    );
  }

  // ─── COMBINED TEXT + COLOR + SHADOW MODE (single unified editor) ───
  if (hasUnified) {
    return (
      <>
        <div ref={containerRef} className="relative inline-block group max-w-full">
          <Tag className={`${className} transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`} style={styleProp} dangerouslySetInnerHTML={{ __html: displayText }} />
          <button
            type="button"
            onClick={handleStartEdit}
            className={`absolute -right-7 top-1/2 -translate-y-1/2 z-10 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-accent-500 text-white opacity-0 transition-all duration-150 group-hover:opacity-100 hover:scale-110 hover:bg-accent-600 ${
              savedFlash ? '!opacity-100 scale-110 !bg-green-500' : ''
            }`}
            title="Edytuj tekst i styl"
          >
            {savedFlash ? (
              <i className="ri-check-line text-xs"></i>
            ) : (
              <i className="ri-edit-2-line text-xs"></i>
            )}
          </button>
          {savedFlash && (
            <span className="absolute -top-7 left-1/2 -translate-x-1/2 rounded-full bg-green-500 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-md whitespace-nowrap animate-pulse pointer-events-none z-10">
              Zapisano!
            </span>
          )}
        </div>

        {editState !== 'idle' && editState !== 'saved' && createPortal(
          <div
            className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/40 p-4"
            onClick={(e) => {
              if (modalRef.current && !modalRef.current.contains(e.target as Node)) handleCancel();
            }}
          >
            <div
              ref={modalRef}
              className="w-full max-w-[480px] max-h-[88vh] overflow-y-auto rounded-xl border border-background-200/80 bg-background-50 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-5 py-3 border-b border-background-200/70">
                <h4 className="text-sm font-bold text-foreground-800">
                  <i className="ri-edit-2-line mr-1.5 text-accent-500"></i>
                  Edytuj tekst i styl
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
                {/* Text field */}
                <label className="block mb-1.5 text-xs font-semibold text-foreground-700">Treść tekstu</label>

                {/* Formatting toolbar */}
                <div className="mb-2 flex flex-wrap items-center gap-1 rounded-md border border-background-200 bg-background-100 px-2 py-1.5">
                  <span className="mr-1 text-[10px] font-bold uppercase tracking-wider text-foreground-400">Tekst:</span>
                  <button
                    type="button"
                    onClick={() => toolbarAction('bold')}
                    className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded text-foreground-600 hover:bg-background-200 hover:text-foreground-900 transition-colors"
                    title="Pogrubienie &lt;strong&gt;"
                  >
                    <i className="ri-bold text-sm"></i>
                  </button>
                  <button
                    type="button"
                    onClick={() => toolbarAction('italic')}
                    className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded text-foreground-600 hover:bg-background-200 hover:text-foreground-900 transition-colors"
                    title="Kursywa &lt;em&gt;"
                  >
                    <i className="ri-italic text-sm"></i>
                  </button>
                  <span className="mx-1 h-4 w-px bg-background-300/60" />
                  <button
                    type="button"
                    onClick={() => toolbarAction('p')}
                    className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded text-foreground-600 hover:bg-background-200 hover:text-foreground-900 transition-colors"
                    title="Akapit &lt;p&gt;"
                  >
                    <i className="ri-paragraph text-sm"></i>
                  </button>
                  <button
                    type="button"
                    onClick={() => toolbarAction('blockquote')}
                    className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded text-foreground-600 hover:bg-background-200 hover:text-foreground-900 transition-colors"
                    title="Wcięcie / cytat &lt;blockquote&gt;"
                  >
                    <i className="ri-indent-increase text-sm"></i>
                  </button>
                  <button
                    type="button"
                    onClick={() => toolbarAction('br')}
                    className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded text-foreground-600 hover:bg-background-200 hover:text-foreground-900 transition-colors"
                    title="Nowa linia &lt;br /&gt;"
                  >
                    <i className="ri-text-wrap text-sm"></i>
                  </button>
                  <span className="mx-1 h-4 w-px bg-background-300/60" />
                  <button
                    type="button"
                    onClick={() => toolbarAction('ul')}
                    className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded text-foreground-600 hover:bg-background-200 hover:text-foreground-900 transition-colors"
                    title="Lista punktowana &lt;ul&gt;"
                  >
                    <i className="ri-list-unordered text-sm"></i>
                  </button>
                  <button
                    type="button"
                    onClick={() => toolbarAction('ol')}
                    className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded text-foreground-600 hover:bg-background-200 hover:text-foreground-900 transition-colors"
                    title="Lista numerowana &lt;ol&gt;"
                  >
                    <i className="ri-list-ordered text-sm"></i>
                  </button>
                  <span className="mx-1 h-4 w-px bg-background-300/60" />
                  <button
                    type="button"
                    onClick={() => toolbarAction('link')}
                    className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded text-foreground-600 hover:bg-background-200 hover:text-foreground-900 transition-colors"
                    title="Link &lt;a&gt;"
                  >
                    <i className="ri-link text-sm"></i>
                  </button>
                </div>

                <textarea
                  ref={textareaRef}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoFocus
                  className="w-full rounded-md border border-background-200 bg-background-50 px-3 py-2 text-sm text-foreground-900 outline-none resize-y focus:border-accent-400 focus:ring-2 focus:ring-accent-300/30"
                  rows={Math.min(Math.max(editValue.split('\n').length + 2, 3), 12)}
                />

                {/* Color section */}
                {hasColor && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-semibold text-foreground-700">
                        <i className="ri-palette-line mr-1 text-primary-500"></i>
                        Kolor tekstu
                      </label>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-6 w-6 rounded-md border border-background-200 shadow-sm"
                          style={{ backgroundColor: colorValue || '#94a3b8' }}
                        />
                        <div className="flex">
                          <span className="flex h-8 items-center px-2 rounded-l-md border border-r-0 border-background-200 bg-background-100 text-xs text-foreground-500">#</span>
                          <input
                            type="text"
                            value={colorValue.replace(/^#/, '')}
                            onChange={(e) => setColorValue('#' + e.target.value.replace(/[^0-9A-Fa-f]/g, '').slice(0, 6))}
                            placeholder="14B8A6"
                            maxLength={6}
                            className="w-20 rounded-r-md border border-background-200 bg-background-50 px-2 py-1.5 text-xs text-foreground-900 outline-none focus:border-primary-400 uppercase"
                          />
                        </div>
                        <input
                          type="color"
                          value={/^#[0-9A-Fa-f]{6}$/.test(colorValue) ? colorValue : '#94a3b8'}
                          onChange={(e) => setColorValue(e.target.value)}
                          className="h-8 w-10 cursor-pointer rounded-md border border-background-200 bg-transparent p-0.5"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-10 gap-1.5">
                      {PRESET_COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setColorValue(c)}
                          className={`h-5 w-full rounded border transition-all cursor-pointer hover:scale-110 ${
                            colorValue.toUpperCase() === c.toUpperCase() ? 'border-primary-500 scale-110' : 'border-background-200/60'
                          }`}
                          style={{ backgroundColor: c }}
                          title={c}
                        />
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => setColorValue('')}
                      className="mt-2 inline-flex items-center gap-1 text-[11px] text-foreground-400 hover:text-foreground-600 cursor-pointer transition-colors"
                    >
                      <i className="ri-restart-line text-xs"></i>
                      Przywróć domyślny kolor
                    </button>
                  </div>
                )}

                {/* Shadow section */}
                {hasShadow && (
                  <div className="mt-4">
                    <label className="block mb-2 text-xs font-semibold text-foreground-700">
                      <i className="ri-contrast-drop-line mr-1 text-primary-500"></i>
                      Intensywność cienia pod tekstem
                    </label>
                    <div className="grid grid-cols-5 gap-2">
                      {SHADOW_PRESETS.map((p, i) => {
                        const active =
                          shadowValue === p.value ||
                          (getShadowPresetIndex(shadowValue) === i);
                        return (
                          <button
                            key={p.label}
                            type="button"
                            onClick={() => setShadowValue(p.value)}
                            className={`rounded-md border px-2 py-2 text-[11px] font-medium text-center transition-all cursor-pointer ${
                              active
                                ? 'border-primary-500 bg-primary-500/10 text-primary-700'
                                : 'border-background-200 bg-background-50 text-foreground-500 hover:bg-background-100'
                            }`}
                          >
                            <span className="block text-xs mb-0.5">
                              {p.label}
                            </span>
                            <span
                              className="inline-block text-lg leading-none"
                              style={{
                                textShadow: p.value === 'none' ? 'none' : p.value,
                                color: '#334155',
                              }}
                            >
                              Ag
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    <div className="mt-2">
                      <label className="text-[11px] text-foreground-500">Własna wartość CSS (opcjonalnie)</label>
                      <input
                        type="text"
                        value={shadowValue}
                        onChange={(e) => setShadowValue(e.target.value)}
                        placeholder="0 2px 8px rgba(0,0,0,0.4)"
                        className="mt-1 w-full rounded-md border border-background-200 bg-background-50 px-3 py-1.5 text-xs text-foreground-900 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setShadowValue('')}
                      className="mt-2 inline-flex items-center gap-1 text-[11px] text-foreground-400 hover:text-foreground-600 cursor-pointer transition-colors"
                    >
                      <i className="ri-restart-line text-xs"></i>
                      Przywróć domyślny cień
                    </button>
                  </div>
                )}

                {errorMsg && (
                  <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 flex items-center gap-2">
                    <i className="ri-error-warning-fill text-sm shrink-0"></i>
                    {errorMsg}
                  </div>
                )}

                <div className="mt-5 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="inline-flex items-center gap-1.5 rounded-md border border-background-200 bg-background-50 px-4 py-2 text-xs font-medium text-foreground-600 transition-colors hover:bg-background-100 cursor-pointer whitespace-nowrap"
                  >
                    Anuluj
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={editState === 'saving'}
                    className="inline-flex items-center gap-1.5 rounded-md bg-accent-500 px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-accent-600 disabled:opacity-60 cursor-pointer whitespace-nowrap"
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

  // ─── TEXT-ONLY INLINE MODE (unchanged behaviour) ─────────────────
  if (editState === 'editing') {
    return (
      <div ref={containerRef} className="relative inline-block max-w-full min-w-[280px]">
        {/* Compact formatting toolbar */}
        <div className="mb-1.5 flex flex-wrap items-center gap-0.5 rounded-md border border-background-200 bg-background-100 px-1.5 py-1">
          <button type="button" onClick={() => toolbarAction('bold')} className="inline-flex h-6 w-6 cursor-pointer items-center justify-center rounded text-foreground-500 hover:bg-background-200 hover:text-foreground-900 transition-colors" title="Pogrubienie"><i className="ri-bold text-xs"></i></button>
          <button type="button" onClick={() => toolbarAction('italic')} className="inline-flex h-6 w-6 cursor-pointer items-center justify-center rounded text-foreground-500 hover:bg-background-200 hover:text-foreground-900 transition-colors" title="Kursywa"><i className="ri-italic text-xs"></i></button>
          <span className="mx-0.5 h-3 w-px bg-background-300/60" />
          <button type="button" onClick={() => toolbarAction('p')} className="inline-flex h-6 w-6 cursor-pointer items-center justify-center rounded text-foreground-500 hover:bg-background-200 hover:text-foreground-900 transition-colors" title="Akapit"><i className="ri-paragraph text-xs"></i></button>
          <button type="button" onClick={() => toolbarAction('blockquote')} className="inline-flex h-6 w-6 cursor-pointer items-center justify-center rounded text-foreground-500 hover:bg-background-200 hover:text-foreground-900 transition-colors" title="Wcięcie"><i className="ri-indent-increase text-xs"></i></button>
          <button type="button" onClick={() => toolbarAction('br')} className="inline-flex h-6 w-6 cursor-pointer items-center justify-center rounded text-foreground-500 hover:bg-background-200 hover:text-foreground-900 transition-colors" title="Nowa linia"><i className="ri-text-wrap text-xs"></i></button>
          <span className="mx-0.5 h-3 w-px bg-background-300/60" />
          <button type="button" onClick={() => toolbarAction('ul')} className="inline-flex h-6 w-6 cursor-pointer items-center justify-center rounded text-foreground-500 hover:bg-background-200 hover:text-foreground-900 transition-colors" title="Lista punktowana"><i className="ri-list-unordered text-xs"></i></button>
          <button type="button" onClick={() => toolbarAction('ol')} className="inline-flex h-6 w-6 cursor-pointer items-center justify-center rounded text-foreground-500 hover:bg-background-200 hover:text-foreground-900 transition-colors" title="Lista numerowana"><i className="ri-list-ordered text-xs"></i></button>
          <button type="button" onClick={() => toolbarAction('link')} className="inline-flex h-6 w-6 cursor-pointer items-center justify-center rounded text-foreground-500 hover:bg-background-200 hover:text-foreground-900 transition-colors" title="Link"><i className="ri-link text-xs"></i></button>
        </div>
        <textarea
          ref={textareaRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className={`w-full min-w-[280px] rounded-md border-2 border-accent-400 bg-background-50 px-3 py-2 text-sm text-foreground-950 outline-none resize-y focus:border-accent-500 focus:ring-2 focus:ring-accent-300/40 ${className}`}
          rows={Math.min(Math.max(editValue.split('\n').length + 1, 2), 12)}
        />
        <div className="mt-1.5 flex items-center gap-2">
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex cursor-pointer items-center gap-1 rounded-md bg-accent-500 px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-accent-600 whitespace-nowrap"
          >
            <i className="ri-check-line text-xs"></i>
            Zapisz
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="inline-flex cursor-pointer items-center gap-1 rounded-md bg-background-100 px-3 py-1 text-xs font-medium text-foreground-600 transition-colors hover:bg-background-200 whitespace-nowrap"
          >
            Anuluj
          </button>
          <span className="text-[10px] text-foreground-400">Ctrl+Enter aby zapisać</span>
        </div>
        {errorMsg && <p className="mt-1 text-[11px] text-red-600 font-medium">{errorMsg}</p>}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative inline-block group max-w-full">
      <Tag className={`${className} transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`} dangerouslySetInnerHTML={{ __html: displayText }} />
      {showHint && (
        <button
          type="button"
          onClick={handleStartEdit}
          className={`absolute -right-7 top-1/2 -translate-y-1/2 z-10 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-accent-500 text-white opacity-0 transition-all duration-150 group-hover:opacity-100 hover:scale-110 hover:bg-accent-600 ${
            savedFlash ? '!opacity-100 scale-110 !bg-green-500' : ''
          }`}
          title="Edytuj tekst"
        >
          {savedFlash ? (
            <i className="ri-check-line text-xs"></i>
          ) : editState === 'error' ? (
            <i className="ri-error-warning-line text-xs"></i>
          ) : (
            <i className="ri-pencil-line text-xs"></i>
          )}
        </button>
      )}
      {savedFlash && (
        <span className="absolute -top-7 left-1/2 -translate-x-1/2 rounded-full bg-green-500 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-md whitespace-nowrap animate-pulse pointer-events-none z-10">
          Zapisano!
        </span>
      )}
      {editState === 'error' && !savedFlash && (
        <span className="absolute -bottom-5 left-0 text-[10px] text-red-500 whitespace-nowrap">
          {errorMsg || 'Nie udało się zapisać'}
        </span>
      )}
    </div>
  );
}