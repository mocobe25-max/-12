import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { translations, baseEn, baseAr } from './locales/allLanguages';
import { ensureLanguageTranslated } from './lib/autoTranslate';

const resources: Record<string, { translation: any }> = {};

// Register pre-defined language resources
Object.keys(translations).forEach((langKey) => {
  resources[langKey] = {
    translation: translations[langKey],
  };
});

export const ALL_LANG_CODES = [
  'ar', 'en', 'fr', 'es', 'ru', 'tr', 'de', 'it', 'pt', 'zh-CN', 'zh-TW',
  'ja', 'ko', 'hi', 'bn', 'ur', 'fa', 'id', 'ms', 'vi', 'th', 'my', 'mn',
  'si', 'uz', 'az', 'so', 'sw', 'pl', 'nl', 'uk', 'el', 'cs', 'ro', 'hu',
  'sv', 'am', 'kk', 'ka', 'he', 'fil', 'ha', 'yo'
];

// Ensure all language codes have a valid resource bundle to prevent raw fallback
ALL_LANG_CODES.forEach((lang) => {
  if (!resources[lang]) {
    resources[lang] = {
      translation: translations[lang] || { ...baseEn },
    };
  }
});

const RTL_LANGUAGES = ['ar', 'ur', 'fa', 'he'];

export const applyLanguageDirection = (lng: string) => {
  if (!lng) return;
  const langCode = lng.split('-')[0].toLowerCase();
  const isRtl = RTL_LANGUAGES.includes(langCode);
  document.documentElement.setAttribute('dir', isRtl ? 'rtl' : 'ltr');
  document.documentElement.setAttribute('lang', lng);
};

// Map browser device language to our supported codes
export const resolveDeviceLanguage = (lng?: string | null): string => {
  if (!lng) return 'ar';
  const clean = lng.trim();
  if (clean === 'zh-TW' || clean === 'zh-HK' || clean === 'zh-Hant') return 'zh-TW';
  if (clean.startsWith('zh')) return 'zh-CN';
  const prefix = clean.split('-')[0].toLowerCase();
  
  const exactMatch = ALL_LANG_CODES.find(code => code.toLowerCase() === clean.toLowerCase());
  if (exactMatch) return exactMatch;

  const prefixMatch = ALL_LANG_CODES.find(code => code.toLowerCase() === prefix);
  if (prefixMatch) return prefixMatch;

  return 'ar';
};

// Determine initial language: localStorage choice first, then default to 'ar'
const getInitialLanguage = (): string => {
  try {
    const saved = localStorage.getItem('i18nextLng');
    if (saved) {
      return resolveDeviceLanguage(saved);
    }
    return 'ar';
  } catch {
    return 'ar';
  }
};

const initialLang = getInitialLanguage();

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: initialLang,
    fallbackLng: 'ar',
    interpolation: {
      escapeValue: false,
    },
  });

const currentLang = i18n.language || initialLang;
applyLanguageDirection(currentLang);
ensureLanguageTranslated(i18n, currentLang);

i18n.on('languageChanged', (lng) => {
  const resolved = resolveDeviceLanguage(lng);
  localStorage.setItem('i18nextLng', resolved);
  applyLanguageDirection(resolved);
  ensureLanguageTranslated(i18n, resolved);
});


export default i18n;

