import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import messages from './local/index';

const STORAGE_KEY = 'sportowy-vibe-language';

function getSavedLanguage(): string {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && ['pl', 'en', 'de', 'es', 'fr'].includes(saved)) return saved;
  } catch { /* noop */ }
  return 'pl';
}

i18n
  .use(initReactI18next)
  .init({
    lng: getSavedLanguage(),
    fallbackLng: 'pl',
    debug: false,
    ns: ['common'],
    defaultNS: 'common',
    fallbackNS: 'common',
    resources: messages,
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export function changeAppLanguage(lang: string): void {
  i18n.changeLanguage(lang);
  document.documentElement.lang = lang;
  try { localStorage.setItem(STORAGE_KEY, lang); } catch { /* noop */ }
}

export function getCurrentLanguage(): string {
  return i18n.language || getSavedLanguage();
}

export default i18n;