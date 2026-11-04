import { useState, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getContentByKey, updateContent } from '@/data/siteContent';

interface EditableHTMLProps {
  contentKey: string;
  fallback: string;
  className?: string;
  as?: 'div' | 'article' | 'section' | 'span';
}

// ─── Tiny HTML helpers for the textarea toolbar ───
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

export default function EditableHTML({
  contentKey,
  fallback,
  className = '',
  as: Tag = 'div',
}: EditableHTMLProps) {
  const { isAdmin } = useAuth();
  const [dbHtml, setDbHtml] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [editState, setEditState] = useState<EditState>('idle');
  const [editValue, setEditValue] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [savedFlash, setSavedFlash] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    let cancelled = false;
    getContentByKey(contentKey)
      .then((text) => {
        if (!cancelled) setDbHtml(text);
      })
      .catch((err) => {
        console.error(`[EditableHTML] load error for "${contentKey}":`, err);
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [contentKey]);

  const displayHtml = dbHtml !== null ? dbHtml : fallback;

  const handleStartEdit = useCallback(() => {
    setEditValue(displayHtml);
    setEditState('editing');
    setErrorMsg('');
  }, [displayHtml]);

  const handleCancel = useCallback(() => {
    setEditState('idle');
    setEditValue('');
    setErrorMsg('');
  }, []);

  const handleSave = useCallback(async () => {
    const trimmed = editValue.trim();
    if (!trimmed) {
      setEditState('error');
      setErrorMsg('Treść nie może być pusta.');
      return;
    }

    setEditState('saving');
    setErrorMsg('');

    const ok = await updateContent(contentKey, trimmed);

    if (ok) {
      setDbHtml(trimmed);
      setEditState('saved');
      setSavedFlash(true);
      setTimeout(() => {
        setEditState('idle');
        setSavedFlash(false);
      }, 1600);
    } else {
      setEditState('error');
      setErrorMsg('Błąd zapisu — sprawdź uprawnienia admina.');
    }
  }, [editValue, contentKey]);

  // Toolbar actions
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
      case 'tasklist':
        wrapLines(ta, '<li>', '</li>', '<ul class="checklist">', '</ul>');
        break;
      case 'br':
        insertAtCursor(ta, '<br />');
        break;
      default:
        break;
    }
    setEditValue(ta.value);
  }, []);

  // Escape key for modal
  useEffect(() => {
    if (editState !== 'editing') return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleCancel();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [editState, handleCancel]);

  if (!loaded) {
    return <Tag className={className} dangerouslySetInnerHTML={{ __html: fallback }} />;
  }

  if (!isAdmin) {
    return <Tag className={className} dangerouslySetInnerHTML={{ __html: displayHtml }} />;
  }

  return (
    <>
      <div ref={containerRef} className="relative group">
        <Tag className={className} dangerouslySetInnerHTML={{ __html: displayHtml }} />
        <button
          type="button"
          onClick={handleStartEdit}
          className={`absolute -right-3 -top-3 z-10 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-accent-500 text-white opacity-0 transition-all duration-150 group-hover:opacity-100 hover:scale-110 hover:bg-accent-600 ${
            savedFlash ? '!opacity-100 scale-110 !bg-green-500' : ''
          }`}
          title="Edytuj treść HTML"
        >
          {savedFlash ? (
            <i className="ri-check-line text-xs"></i>
          ) : (
            <i className="ri-code-box-line text-xs"></i>
          )}
        </button>
        {savedFlash && (
          <span className="absolute -top-8 left-1/2 -translate-x-1/2 rounded-full bg-green-500 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-md whitespace-nowrap animate-pulse pointer-events-none z-10">
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
            className="w-full max-w-[720px] max-h-[88vh] overflow-y-auto rounded-xl border border-background-200/80 bg-background-50 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-background-200/70">
              <h4 className="text-sm font-bold text-foreground-800">
                <i className="ri-code-box-line mr-1.5 text-accent-500"></i>
                Edytuj treść HTML
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
              {/* Formatting toolbar */}
              <div className="mb-2 flex flex-wrap items-center gap-1 rounded-md border border-background-200 bg-background-100 px-2 py-1.5">
                <span className="mr-1 text-[10px] font-bold uppercase tracking-wider text-foreground-400">Formatowanie:</span>
                <button
                  type="button"
                  onClick={() => toolbarAction('bold')}
                  className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded text-foreground-600 hover:bg-background-200 hover:text-foreground-900 transition-colors"
                  title="Pogrubienie <strong>"
                >
                  <i className="ri-bold text-sm"></i>
                </button>
                <button
                  type="button"
                  onClick={() => toolbarAction('italic')}
                  className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded text-foreground-600 hover:bg-background-200 hover:text-foreground-900 transition-colors"
                  title="Kursywa <em>"
                >
                  <i className="ri-italic text-sm"></i>
                </button>
                <span className="mx-1 h-4 w-px bg-background-300/60" />
                <button
                  type="button"
                  onClick={() => toolbarAction('ul')}
                  className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded text-foreground-600 hover:bg-background-200 hover:text-foreground-900 transition-colors"
                  title="Lista nieuporządkowana <ul>"
                >
                  <i className="ri-list-unordered text-sm"></i>
                </button>
                <button
                  type="button"
                  onClick={() => toolbarAction('ol')}
                  className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded text-foreground-600 hover:bg-background-200 hover:text-foreground-900 transition-colors"
                  title="Lista uporządkowana <ol>"
                >
                  <i className="ri-list-ordered text-sm"></i>
                </button>
                <button
                  type="button"
                  onClick={() => toolbarAction('tasklist')}
                  className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded text-foreground-600 hover:bg-background-200 hover:text-foreground-900 transition-colors"
                  title="Checklista (lista z checkboxami)"
                >
                  <i className="ri-list-check-2 text-sm"></i>
                </button>
                <span className="mx-1 h-4 w-px bg-background-300/60" />
                <button
                  type="button"
                  onClick={() => toolbarAction('link')}
                  className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded text-foreground-600 hover:bg-background-200 hover:text-foreground-900 transition-colors"
                  title="Link <a>"
                >
                  <i className="ri-link text-sm"></i>
                </button>
                <button
                  type="button"
                  onClick={() => toolbarAction('p')}
                  className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded text-foreground-600 hover:bg-background-200 hover:text-foreground-900 transition-colors"
                  title="Akapit <p>"
                >
                  <i className="ri-paragraph text-sm"></i>
                </button>
                <button
                  type="button"
                  onClick={() => toolbarAction('br')}
                  className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded text-foreground-600 hover:bg-background-200 hover:text-foreground-900 transition-colors"
                  title="Nowa linia <br />"
                >
                  <i className="ri-text-wrap text-sm"></i>
                </button>
              </div>

              <label className="block mb-1.5 text-xs font-semibold text-foreground-700">
                Treść HTML (obsługuje znaczniki: &lt;p&gt;, &lt;ul&gt;, &lt;li&gt;, &lt;a&gt;, &lt;strong&gt;, itp.)
              </label>
              <textarea
                ref={textareaRef}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                autoFocus
                className="w-full rounded-md border border-background-200 bg-background-50 px-3 py-2 text-xs font-mono text-foreground-900 outline-none resize-y focus:border-accent-400 focus:ring-2 focus:ring-accent-300/30"
                rows={16}
                spellCheck={false}
              />

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