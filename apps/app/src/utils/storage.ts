import type { PresetId } from '@whatmedia/config';

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
    if (typeof navigator !== 'undefined' && navigator.language?.startsWith('fr')) {
      return 'fr';
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
    if (stored === 'status-hd' || stored === 'status-light' || stored === 'chat-hd' || stored === 'status-photo') {
      return stored;
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
