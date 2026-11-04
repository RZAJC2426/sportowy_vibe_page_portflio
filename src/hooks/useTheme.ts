import { useState, useEffect, useCallback } from 'react';

const THEME_KEY = 'sportowy-vibe-theme';

function getStoredTheme(): 'light' | 'dark' {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === 'dark') return 'dark';
    return 'light';
  } catch {
    return 'light';
  }
}

function applyThemeClass(theme: 'light' | 'dark') {
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

export function useTheme() {
  const [theme, setThemeState] = useState<'light' | 'dark'>(getStoredTheme);

  // Apply class whenever theme state changes
  useEffect(() => {
    applyThemeClass(theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      try { localStorage.setItem(THEME_KEY, next); } catch { /* noop */ }
      return next;
    });
  }, []);

  const setTheme = useCallback((newTheme: 'light' | 'dark') => {
    setThemeState(newTheme);
    try { localStorage.setItem(THEME_KEY, newTheme); } catch { /* noop */ }
  }, []);

  return { theme, toggleTheme, setTheme };
}