import { useMediaStore } from '../store/useMediaStore';
import { translations, type Language, type AppTranslations } from './translations';

export function useTranslation(): {
  t: AppTranslations;
  lang: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
} {
  const lang = useMediaStore((s) => s.language);
  const setLanguage = useMediaStore((s) => s.setLanguage);
  const toggleLanguage = useMediaStore((s) => s.toggleLanguage);

  return {
    t: translations[lang] || translations.fr,
    lang,
    setLanguage,
    toggleLanguage,
  };
}
