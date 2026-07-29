import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Search, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface LanguageItem {
  code: string;
  nativeName: string;
  englishName: string;
}

export const ALL_LANGUAGES: LanguageItem[] = [
  { code: 'ar', nativeName: 'العربية', englishName: 'Arabic' },
  { code: 'en', nativeName: 'English', englishName: 'English' },
  { code: 'fr', nativeName: 'Français', englishName: 'French' },
  { code: 'es', nativeName: 'Español', englishName: 'Spanish' },
  { code: 'ru', nativeName: 'Русский', englishName: 'Russian' },
  { code: 'tr', nativeName: 'Türkçe', englishName: 'Turkish' },
  { code: 'de', nativeName: 'Deutsch', englishName: 'German' },
  { code: 'it', nativeName: 'Italiano', englishName: 'Italian' },
  { code: 'pt', nativeName: 'Português', englishName: 'Portuguese' },
  { code: 'zh-CN', nativeName: '简体中文', englishName: 'Chinese (Simplified)' },
  { code: 'zh-TW', nativeName: '繁體中文', englishName: 'Chinese (Traditional)' },
  { code: 'ja', nativeName: '日本語', englishName: 'Japanese' },
  { code: 'ko', nativeName: '한국어', englishName: 'Korean' },
  { code: 'hi', nativeName: 'हिन्दी', englishName: 'Hindi' },
  { code: 'bn', nativeName: 'বাংলা', englishName: 'Bengali' },
  { code: 'ur', nativeName: 'أُردُو', englishName: 'Urdu' },
  { code: 'fa', nativeName: 'فارسی', englishName: 'Persian' },
  { code: 'id', nativeName: 'Bahasa Indonesia', englishName: 'Indonesian' },
  { code: 'ms', nativeName: 'Bahasa Melayu', englishName: 'Malay' },
  { code: 'vi', nativeName: 'Tiếng Việt', englishName: 'Vietnamese' },
  { code: 'th', nativeName: 'ไทย', englishName: 'Thai' },
  { code: 'my', nativeName: 'မြန်မာစာ', englishName: 'Burmese' },
  { code: 'mn', nativeName: 'Монгол хэл', englishName: 'Mongolian' },
  { code: 'si', nativeName: 'සිංහල', englishName: 'Sinhala' },
  { code: 'uz', nativeName: "O'zbekcha", englishName: 'Uzbek' },
  { code: 'az', nativeName: 'Azərbaycan dili', englishName: 'Azerbaijani' },
  { code: 'so', nativeName: 'Soomaali', englishName: 'Somali' },
  { code: 'sw', nativeName: 'Kiswahili', englishName: 'Swahili' },
  { code: 'pl', nativeName: 'Polski', englishName: 'Polish' },
  { code: 'nl', nativeName: 'Nederlands', englishName: 'Dutch' },
  { code: 'uk', nativeName: 'Українська', englishName: 'Ukrainian' },
  { code: 'el', nativeName: 'Ελληνικά', englishName: 'Greek' },
  { code: 'cs', nativeName: 'Čeština', englishName: 'Czech' },
  { code: 'ro', nativeName: 'Română', englishName: 'Romanian' },
  { code: 'hu', nativeName: 'Magyar', englishName: 'Hungarian' },
  { code: 'sv', nativeName: 'Svenska', englishName: 'Swedish' },
  { code: 'am', nativeName: 'አማርኛ', englishName: 'Amharic' },
  { code: 'kk', nativeName: 'Қазақ тілі', englishName: 'Kazakh' },
  { code: 'ka', nativeName: 'ქართული', englishName: 'Georgian' },
  { code: 'he', nativeName: 'עברית', englishName: 'Hebrew' },
  { code: 'fil', nativeName: 'Filipino', englishName: 'Filipino / Tagalog' },
  { code: 'ha', nativeName: 'Hausa', englishName: 'Hausa' },
  { code: 'yo', nativeName: 'Yorùbá', englishName: 'Yoruba' },
];

interface LanguageSwitcherProps {
  variant?: 'light' | 'dark';
}

export function LanguageSwitcher({ variant = 'dark' }: LanguageSwitcherProps) {
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const currentLangCode = i18n.language || 'en';

  const currentLang = useMemo(() => {
    return (
      ALL_LANGUAGES.find(
        (l) =>
          l.code.toLowerCase() === currentLangCode.toLowerCase() ||
          currentLangCode.toLowerCase().startsWith(l.code.toLowerCase())
      ) || ALL_LANGUAGES[0]
    );
  }, [currentLangCode]);

  const filteredLanguages = useMemo(() => {
    if (!searchQuery.trim()) return ALL_LANGUAGES;
    const q = searchQuery.toLowerCase().trim();
    return ALL_LANGUAGES.filter(
      (lang) =>
        lang.nativeName.toLowerCase().includes(q) ||
        lang.englishName.toLowerCase().includes(q) ||
        lang.code.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const handleSelectLanguage = (code: string) => {
    i18n.changeLanguage(code);
    const rtlCodes = ['ar', 'ur', 'fa'];
    const isRtl = rtlCodes.includes(code.split('-')[0]);
    document.documentElement.setAttribute('dir', isRtl ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', code);

    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <>
      {/* TRIGGER BUTTON */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={
          variant === 'dark'
            ? 'bg-[#1C2333] hover:bg-[#263045] text-gray-200 border border-[#2B364E] px-6 py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md active:scale-95'
            : 'flex items-center gap-2 text-gray-700 hover:text-blue-600 bg-white/80 border border-gray-200 px-4 py-2 rounded-xl text-sm font-medium shadow-sm transition-all cursor-pointer'
        }
      >
        <Globe className="w-4 h-4 text-blue-400" />
        <span>{currentLang.nativeName}</span>
      </button>

      {/* BOTTOM SHEET MODAL */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => {
                setIsOpen(false);
                setSearchQuery('');
              }}
            />

            {/* Bottom Sheet Drawer */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="relative w-full max-w-lg bg-[#0F141F] text-white rounded-t-3xl sm:rounded-3xl border-t sm:border border-[#232D42] shadow-2xl overflow-hidden z-10 flex flex-col max-h-[85vh] bottom-0"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Drag Handle Top Bar */}
              <div className="pt-3 pb-1 flex justify-center">
                <div className="w-12 h-1.5 bg-gray-600/70 rounded-full" />
              </div>

              {/* Title Header */}
              <div className="px-6 py-2 flex items-center justify-between">
                <h3 className="text-xl sm:text-2xl font-bold text-center w-full text-white tracking-tight">
                  {t('select_language', 'اختر اللغة / Select language')}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    setSearchQuery('');
                  }}
                  className="absolute end-4 top-4 text-gray-400 hover:text-white p-1.5 rounded-full hover:bg-gray-800/60 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search Bar Input */}
              <div className="px-6 py-3">
                <div className="relative flex items-center border-b border-[#2A354B] focus-within:border-blue-500 transition-colors pb-1">
                  <Search className="w-5 h-5 text-gray-400 shrink-0 me-3" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('enter_language', 'أدخل اللغة / Enter language...')}
                    className="w-full bg-transparent text-white placeholder-gray-500 text-base py-1 outline-none font-normal"
                    autoFocus
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="text-gray-400 hover:text-white p-1 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Languages Scrollable List */}
              <div className="flex-1 overflow-y-auto px-4 pt-2 pb-24 sm:pb-6 space-y-1 divide-y divide-transparent overscroll-contain">
                {filteredLanguages.length === 0 ? (
                  <div className="py-12 text-center text-gray-400 text-sm">
                    {t('no_languages_found', 'لم يتم العثور على نتائج')}
                  </div>
                ) : (
                  filteredLanguages.map((lang) => {
                    const isSelected =
                      currentLang.code.toLowerCase() === lang.code.toLowerCase() ||
                      (lang.code === 'en' && currentLang.code === 'en');

                    return (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => handleSelectLanguage(lang.code)}
                        className={`w-full text-start px-5 py-3 rounded-2xl flex items-center justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#1D2638] border border-blue-500/30 text-white'
                            : 'hover:bg-[#161C2A] text-gray-200'
                        }`}
                      >
                        <div>
                          <div className="text-lg font-semibold tracking-wide text-white">
                            {lang.nativeName}
                          </div>
                          <div className="text-xs sm:text-sm text-gray-400 font-medium">
                            {lang.englishName}
                          </div>
                        </div>

                        {isSelected && (
                          <div className="w-6 h-6 rounded-full bg-blue-600/30 border border-blue-400 flex items-center justify-center text-blue-400">
                            <Check className="w-4 h-4" />
                          </div>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
