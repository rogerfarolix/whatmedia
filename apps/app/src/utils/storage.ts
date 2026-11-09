/**
 * Safe wrapper around localStorage adhering to project rules:
 * - Only used for: language, last preset, install banner dismissed.
 * - Always enclosed in try/catch (private browsing / quota / disabled storage).
 */

const STORAGE_KEYS = {
  LANGUAGE: 'whatmedia_lang',
  LAST_PRESET: 'whatmedia_last_preset',
  INSTALL_BANNER_DISMISSED: 'whatmedia_install_dismissed_at',
} as const;

export function safeGetStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const value = window.localStorage.getItem(key);
    if (value === null) return fallback;
    return value as unknown as T;
  } catch {
    return fallback;
  }
}

export function safeSetStorage(key: string, value: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Gracefully ignore storage failures (private mode, quota exceeded)
  }
}

export function safeRemoveStorage(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Gracefully ignore
  }
}

export const appStorage = {
  getLanguage: (fallback: 'fr' | 'en' = 'fr'): 'fr' | 'en' => {
    const val = safeGetStorage<string>(STORAGE_KEYS.LANGUAGE, '');
    if (val === 'fr' || val === 'en') return val;
    // Autodetect if first visit
    if (typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('en')) {
      return 'en';
    }
    return fallback;
  },

  setLanguage: (lang: 'fr' | 'en') => {
    safeSetStorage(STORAGE_KEYS.LANGUAGE, lang);
  },

  getLastPreset: (fallback: string = 'status-hd'): string => {
    return safeGetStorage<string>(STORAGE_KEYS.LAST_PRESET, fallback);
  },

  setLastPreset: (presetId: string) => {
    safeSetStorage(STORAGE_KEYS.LAST_PRESET, presetId);
  },

  getInstallBannerDismissedAt: (): number | null => {
    const val = safeGetStorage<string>(STORAGE_KEYS.INSTALL_BANNER_DISMISSED, '');
    const timestamp = parseInt(val, 10);
    return isNaN(timestamp) ? null : timestamp;
  },

  setInstallBannerDismissed: () => {
    safeSetStorage(STORAGE_KEYS.INSTALL_BANNER_DISMISSED, Date.now().toString());
  },
};
