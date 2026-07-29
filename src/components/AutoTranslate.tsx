import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { translateSingleString } from '../lib/autoTranslate';

export default function AutoTranslate({ children, fallback }: { children: string, fallback?: string }) {
  const { i18n } = useTranslation();
  const [translatedText, setTranslatedText] = useState(children);

  useEffect(() => {
    let isMounted = true;
    const translate = async () => {
      const currentLang = i18n.language || 'en';
      // If language is Arabic (original text language), just return
      if (currentLang.startsWith('ar')) {
        if (isMounted) setTranslatedText(children);
        return;
      }
      
      const result = await translateSingleString(children, currentLang);
      if (isMounted) {
        setTranslatedText(result);
      }
    };
    
    translate();
    return () => { isMounted = false; };
  }, [children, i18n.language]);

  return <>{translatedText}</>;
}
