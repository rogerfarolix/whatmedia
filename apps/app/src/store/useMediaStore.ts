import { create } from 'zustand';
import type { PresetId } from '@whatmedia/config';
import { presets } from '@whatmedia/config';
import { appStorage } from '../utils/storage';
import type { Language } from '../i18n/translations';

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function checkShouldShowInstallBanner(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;

  // Check if already in standalone PWA mode
  const isStandalone =
    window.matchMedia?.('(display-mode: standalone)').matches ||
    Boolean((navigator as unknown as { standalone?: boolean }).standalone);
  if (isStandalone) return false;

  // Check if iOS
  const userAgent = navigator.userAgent || '';
  const isIos = /iPhone|iPad|iPod/i.test(userAgent) ||
    // iPadOS on newer Safari reports as MacIntel with touch points
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (!isIos) return false;

  // Check if dismissed within the last week
  const dismissedAt = appStorage.getInstallBannerDismissedAt();
  if (dismissedAt && Date.now() - dismissedAt < ONE_WEEK_MS) {
    return false;
  }

  return true;
}

export type ProcessingState = 'idle' | 'analyzing' | 'processing' | 'done' | 'error';

export interface MediaStoreState {
  // State
  language: Language;
  selectedFiles: File[];
  currentPresetId: PresetId;
  processingState: ProcessingState;
  isInstallBannerVisible: boolean;

  // Actions
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  setSelectedFiles: (files: File[]) => void;
  addSelectedFiles: (files: File[]) => void;
  removeFile: (index: number) => void;
  clearFiles: () => void;
  setPreset: (presetId: PresetId) => void;
  setProcessingState: (state: ProcessingState) => void;
  dismissInstallBanner: () => void;
}

// Initial values loaded safely from storage
const initialLanguage = appStorage.getLanguage('fr');
const storedPreset = appStorage.getLastPreset('status-hd');
const initialPresetId: PresetId = (storedPreset in presets)
  ? (storedPreset as PresetId)
  : 'status-hd';

export const useMediaStore = create<MediaStoreState>((set) => ({
  language: initialLanguage,
  selectedFiles: [],
  currentPresetId: initialPresetId,
  processingState: 'idle',
  isInstallBannerVisible: checkShouldShowInstallBanner(),

  setLanguage: (lang: Language) => {
    appStorage.setLanguage(lang);
    set({ language: lang });
  },

  toggleLanguage: () => {
    set((state) => {
      const next: Language = state.language === 'fr' ? 'en' : 'fr';
      appStorage.setLanguage(next);
      return { language: next };
    });
  },

  setSelectedFiles: (files: File[]) => {
    // Automatically switch to photo preset if single image selected and current preset is video
    set((state) => {
      let nextPreset = state.currentPresetId;
      if (files.length === 1 && files[0]?.type.startsWith('image/') && nextPreset !== 'status-photo') {
        nextPreset = 'status-photo';
        appStorage.setLastPreset(nextPreset);
      } else if (files.length > 0 && files.some(f => f.type.startsWith('video/')) && nextPreset === 'status-photo') {
        nextPreset = 'status-hd';
        appStorage.setLastPreset(nextPreset);
      }

      return {
        selectedFiles: files,
        currentPresetId: nextPreset,
        processingState: 'idle',
      };
    });
  },

  addSelectedFiles: (files: File[]) => {
    set((state) => ({
      selectedFiles: [...state.selectedFiles, ...files],
    }));
  },

  removeFile: (index: number) => {
    set((state) => {
      const updated = state.selectedFiles.filter((_, i) => i !== index);
      return {
        selectedFiles: updated,
        processingState: updated.length === 0 ? 'idle' : state.processingState,
      };
    });
  },

  clearFiles: () => {
    set({
      selectedFiles: [],
      processingState: 'idle',
    });
  },

  setPreset: (presetId: PresetId) => {
    appStorage.setLastPreset(presetId);
    set({ currentPresetId: presetId });
  },

  setProcessingState: (state: ProcessingState) => {
    set({ processingState: state });
  },

  dismissInstallBanner: () => {
    appStorage.setInstallBannerDismissed();
    set({ isInstallBannerVisible: false });
  },
}));
