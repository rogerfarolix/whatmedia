import { create } from 'zustand';
import type { PresetId } from '@whatmedia/config';
import type { MediaInfo, Plan, OutputFile, Progress } from '@whatmedia/core';
import { getStoredLanguage, getStoredPreset, setStoredPreset } from '../utils/storage';

export type AppScreen = 'home' | 'analysis' | 'processing' | 'results';

interface MediaState {
  screen: AppScreen;
  selectedFile: File | null;
  mediaInfo: MediaInfo | null;
  plan: Plan | null;
  currentPresetId: PresetId;
  progress: Progress | null;
  outputFiles: OutputFile[];
  isAnalyzing: boolean;
  language: 'fr' | 'en';
  isInstallBannerVisible: boolean;

  setScreen: (screen: AppScreen) => void;
  setSelectedFile: (file: File | null) => void;
  setMediaInfo: (info: MediaInfo | null) => void;
  setPlan: (plan: Plan | null) => void;
  setCurrentPresetId: (presetId: PresetId) => void;
  setProgress: (p: Progress | null) => void;
  setOutputFiles: (files: OutputFile[]) => void;
  setIsAnalyzing: (analyzing: boolean) => void;
  setLanguage: (lang: 'fr' | 'en') => void;
  setInstallBannerVisible: (visible: boolean) => void;
  resetAll: () => void;
}

export const useMediaStore = create<MediaState>((set) => ({
  screen: 'home',
  selectedFile: null,
  mediaInfo: null,
  plan: null,
  currentPresetId: getStoredPreset(),
  progress: null,
  outputFiles: [],
  isAnalyzing: false,
  language: getStoredLanguage(),
  isInstallBannerVisible: true,

  setScreen: (screen) => set({ screen }),
  setSelectedFile: (file) => set({ selectedFile: file }),
  setMediaInfo: (info) => set({ mediaInfo: info }),
  setPlan: (plan) => set({ plan }),
  setCurrentPresetId: (presetId) => {
    setStoredPreset(presetId);
    set({ currentPresetId: presetId });
  },
  setProgress: (progress) => set({ progress }),
  setOutputFiles: (outputFiles) => set({ outputFiles }),
  setIsAnalyzing: (isAnalyzing) => set({ isAnalyzing }),
  setLanguage: (language) => set({ language }),
  setInstallBannerVisible: (visible) => set({ isInstallBannerVisible: visible }),
  resetAll: () =>
    set({
      screen: 'home',
      selectedFile: null,
      mediaInfo: null,
      plan: null,
      progress: null,
      outputFiles: [],
      isAnalyzing: false,
    }),
}));
