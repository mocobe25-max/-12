import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { translations, baseEn } from './locales/allLanguages';
import { ensureLanguageTranslated } from './lib/autoTranslate';

const resources: Record<string, { translation: any }> = {};

// Register pre-defined language resources
Object.keys(translations).forEach((langKey) => {
  resources[langKey] = {
    translation: translations[langKey],
  };
});

const ALL_LANG_CODES = [
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

const applyLanguageDirection = (lng: string) => {
  if (!lng) return;
  const langCode = lng.split('-')[0].toLowerCase();
  const isRtl = RTL_LANGUAGES.includes(langCode);
  document.documentElement.setAttribute('dir', isRtl ? 'rtl' : 'ltr');
  document.documentElement.setAttribute('lang', lng);
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

const currentLang = i18n.language || 'en';
applyLanguageDirection(currentLang);
ensureLanguageTranslated(i18n, currentLang);

i18n.on('languageChanged', (lng) => {
  applyLanguageDirection(lng);
  ensureLanguageTranslated(i18n, lng);
});

export default i18n;

