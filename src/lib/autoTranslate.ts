import { baseEn } from '../locales/allLanguages';

const CACHE_PREFIX = 'mobcash_tr_v3_';

/**
 * Translates a batch of texts to the specified target language seamlessly using Google Translate API.
 */
export async function autoTranslateLanguage(targetLang: string): Promise<Record<string, string> | null> {
  if (!targetLang || targetLang === 'en') return null;

  // Check localStorage cache first
  const cacheKey = `${CACHE_PREFIX}${targetLang}`;
  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 10) {
        return parsed;
      }
    } catch {
      // Ignore cache parse error
    }
  }

  try {
    const keys = Object.keys(baseEn) as Array<keyof typeof baseEn>;
    const values = keys.map((k) => baseEn[k]);

    // Use a unique delimiter that Google Translate won't mangle
    const DELIMITER = ' ::: ';
    const textToTranslate = values.join(DELIMITER);

    const apiLang = targetLang === 'zh-CN' ? 'zh-CN' : targetLang === 'zh-TW' ? 'zh-TW' : targetLang.split('-')[0];
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${encodeURIComponent(apiLang)}&dt=t&q=${encodeURIComponent(textToTranslate)}`;

    const response = await fetch(url);
    if (!response.ok) return null;

    const data = await response.json();
    if (!data || !data[0]) return null;

    const fullText = data[0].map((item: any) => item[0]).join('');
    const parts = fullText.split(/\s*:::\s*/);

    const resultDict: Record<string, string> = {};
    keys.forEach((key, idx) => {
      const translated = parts[idx]?.trim();
      resultDict[key] = translated || baseEn[key];
    });

    // Save to cache
    localStorage.setItem(cacheKey, JSON.stringify(resultDict));
    return resultDict;
  } catch (err) {
    console.warn(`[AutoTranslate] Error translating to ${targetLang}:`, err);
    return null;
  }
}

/**
 * Ensures the target language has full translations loaded into i18n.
 */
export async function ensureLanguageTranslated(i18nInstance: any, lang: string) {
  if (!lang || lang === 'en' || !i18nInstance) return;

  try {
    const currentBundle = i18nInstance.getResourceBundle ? i18nInstance.getResourceBundle(lang, 'translation') || {} : {};
    const baseKeys = Object.keys(baseEn);

    // Determine if keys are missing or defaulted to English
    const missingCount = baseKeys.filter(
      (k) => !currentBundle[k] || (lang !== 'en' && currentBundle[k] === baseEn[k as keyof typeof baseEn])
    ).length;

    if (missingCount > 3) {
      const translatedDict = await autoTranslateLanguage(lang);
      if (translatedDict) {
        i18nInstance.addResourceBundle(lang, 'translation', translatedDict, true, true);
      }
    }
  } catch (e) {
    console.warn('[AutoTranslate] Failed to load translations:', e);
  }
}

/**
 * Single string translator helper for dynamic strings
 */
export async function translateSingleString(text: string, targetLang: string): Promise<string> {
  if (!text || !targetLang || targetLang === 'en') return text;

  const cacheKey = `${CACHE_PREFIX}single_${targetLang}_${text}`;
  const cached = localStorage.getItem(cacheKey);
  if (cached) return cached;

  try {
    const apiLang = targetLang === 'zh-CN' ? 'zh-CN' : targetLang === 'zh-TW' ? 'zh-TW' : targetLang.split('-')[0];
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(apiLang)}&dt=t&q=${encodeURIComponent(text)}`;
    const response = await fetch(url);
    if (!response.ok) return text;
    const data = await response.json();
    if (data && data[0]) {
      const translated = data[0].map((item: any) => item[0]).join('');
      if (translated) {
        localStorage.setItem(cacheKey, translated);
        return translated;
      }
    }
  } catch (err) {
    console.warn('Single string translation error:', err);
  }
  return text;
}
