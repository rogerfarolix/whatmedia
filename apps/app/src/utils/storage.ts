import type { PresetId } from '@whatmedia/config';
import { presets } from '@whatmedia/config';

export type Language = 'fr' | 'en';

export const STORAGE_KEYS = {
  LANGUAGE: 'whatmedia:lang',
  LAST_PRESET: 'whatmedia:preset',
  INSTALL_BANNER_DISMISSED: 'whatmedia:install_dismissed',
} as const;

export function getStoredLanguage(): Language {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.LANGUAGE);
    if (stored === 'fr' || stored === 'en') return stored;
  } catch {
    // Storage blocked (private mode): fall through to the browser language
  }
  return detectBrowserLanguage();
}

/** FR by default; EN when the browser prefers English (PRD US-08) */
export function detectBrowserLanguage(): Language {
  try {
    const langs =
      typeof navigator !== 'undefined' ? (navigator.languages?.length ? navigator.languages : [navigator.language]) : [];
    for (const l of langs) {
      const code = l?.toLowerCase() ?? '';
      if (code.startsWith('fr')) return 'fr';
      if (code.startsWith('en')) return 'en';
    }
    return 'fr';
  } catch {
    return 'fr';
  }
}

export function setStoredLanguage(lang: Language): void {
  try {
    localStorage.setItem(STORAGE_KEYS.LANGUAGE, lang);
  } catch {
    // Ignore storage issues
  }
}

export function getStoredPreset(): PresetId {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.LAST_PRESET);
    if (stored && stored in presets && presets[stored]?.kind === 'video') {
      return stored as PresetId;
    }
    return 'status-hd';
  } catch {
    return 'status-hd';
  }
}

export function setStoredPreset(presetId: PresetId): void {
  try {
    localStorage.setItem(STORAGE_KEYS.LAST_PRESET, presetId);
  } catch {
    // Ignore storage issues
  }
}

export function getInstallBannerDismissedTimestamp(): number | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.INSTALL_BANNER_DISMISSED);
    return raw ? parseInt(raw, 10) : null;
  } catch {
    return null;
  }
}

export function setInstallBannerDismissed(): void {
  try {
    localStorage.setItem(STORAGE_KEYS.INSTALL_BANNER_DISMISSED, Date.now().toString());
  } catch {
    // Ignore storage issues
  }
}
