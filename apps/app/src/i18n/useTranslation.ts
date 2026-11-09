import { useMediaStore } from '../store/useMediaStore';
import { fr, en } from './translations';
import { setStoredLanguage, type Language } from '../utils/storage';

export type { Language };

export function useTranslation() {
  const { language, setLanguage } = useMediaStore();

  const toggleLanguage = () => {
    const nextLang: Language = language === 'fr' ? 'en' : 'fr';
    setStoredLanguage(nextLang);
    setLanguage(nextLang);
  };

  const currentTranslations = language === 'en' ? en : fr;

  const t = (key: keyof typeof fr): string => {
    const val = currentTranslations[key] ?? fr[key];
    if (typeof val === 'string') return val;
    return '';
  };

  return {
    language,
    toggleLanguage,
    t,
  };
}
