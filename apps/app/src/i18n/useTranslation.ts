import { useMediaStore } from '../store/useMediaStore';
import { fr, en, type TranslationKey } from './translations';
import { setStoredLanguage, type Language } from '../utils/storage';

export type { Language, TranslationKey };

export type TranslateVars = Record<string, string | number>;

export function translate(language: Language, key: TranslationKey, vars?: TranslateVars): string {
  const template = (language === 'en' ? en : fr)[key] ?? fr[key];
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  );
}

export function useTranslation() {
  const language = useMediaStore((s) => s.language);
  const setLanguage = useMediaStore((s) => s.setLanguage);

  const toggleLanguage = () => {
    const nextLang: Language = language === 'fr' ? 'en' : 'fr';
    setStoredLanguage(nextLang);
    setLanguage(nextLang);
  };

  const t = (key: TranslationKey, vars?: TranslateVars): string => translate(language, key, vars);

  return { language, toggleLanguage, t };
}
