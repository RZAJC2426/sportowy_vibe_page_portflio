import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

const HC_KEY = 'sportowy-vibe-hc';
const FS_KEY = 'sportowy-vibe-fs';

type FontSize = 'normal' | 'large' | 'xlarge';

interface AccessibilityState {
  highContrast: boolean;
  fontSize: FontSize;
  toggleHighContrast: () => void;
  setFontSize: (size: FontSize) => void;
  cycleFontSize: () => void;
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
}

const AccessibilityContext = createContext<AccessibilityState | undefined>(undefined);

const FONT_SIZES: FontSize[] = ['normal', 'large', 'xlarge'];

function getStoredHc(): boolean {
  try { return localStorage.getItem(HC_KEY) === 'true'; } catch { return false; }
}

function getStoredFs(): FontSize {
  try {
    const stored = localStorage.getItem(FS_KEY);
    if (stored === 'large' || stored === 'xlarge') return stored;
    return 'normal';
  } catch { return 'normal'; }
}

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [highContrast, setHighContrast] = useState(getStoredHc);
  const [fontSize, setFontSizeState] = useState<FontSize>(getStoredFs);
  const [menuOpen, setMenuOpen] = useState(false);

  // Apply high contrast class
  useEffect(() => {
    if (highContrast) {
      document.documentElement.classList.add('hc-mode');
    } else {
      document.documentElement.classList.remove('hc-mode');
    }
    try { localStorage.setItem(HC_KEY, String(highContrast)); } catch { /* noop */ }
  }, [highContrast]);

  // Apply font size class — unify to single approach
  useEffect(() => {
    document.documentElement.classList.remove('fs-large', 'fs-xlarge');
    if (fontSize !== 'normal') {
      document.documentElement.classList.add(`fs-${fontSize}`);
    }
    try { localStorage.setItem(FS_KEY, fontSize); } catch { /* noop */ }
  }, [fontSize]);

  // ─── Global keyboard safety net (no keyboard traps) ───
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Esc — safety escape from any element
      if (e.key === 'Escape') {
        // Close accessibility menu first
        setMenuOpen(false);

        // Try to close any open modal/dialog by looking for close buttons
        const activeEl = document.activeElement;
        if (activeEl && activeEl !== document.body) {
          // If we're inside a modal/dialog, try clicking its close button
          const dialog = (activeEl as HTMLElement).closest('[role="dialog"], [aria-modal="true"], .modal-overlay');
          if (dialog) {
            const closeBtn = dialog.querySelector('[data-close], [aria-label*="Zamknij" i], [aria-label*="Close" i], .modal-close');
            if (closeBtn instanceof HTMLElement) {
              closeBtn.click();
              return;
            }
          }
          // Fallback: blur to release focus trap
          (activeEl as HTMLElement).blur();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, []);

  const toggleHighContrast = useCallback(() => {
    setHighContrast((prev) => !prev);
  }, []);

  const setFontSize = useCallback((size: FontSize) => {
    setFontSizeState(size);
  }, []);

  const cycleFontSize = useCallback(() => {
    setFontSizeState((prev) => {
      const idx = FONT_SIZES.indexOf(prev);
      return FONT_SIZES[(idx + 1) % FONT_SIZES.length];
    });
  }, []);

  return (
    <AccessibilityContext.Provider
      value={{
        highContrast,
        fontSize,
        toggleHighContrast,
        setFontSize,
        cycleFontSize,
        menuOpen,
        setMenuOpen,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const ctx = useContext(AccessibilityContext);
  if (!ctx) throw new Error('useAccessibility must be used within AccessibilityProvider');
  return ctx;
}