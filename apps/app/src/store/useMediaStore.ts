import { create } from 'zustand';
import type { PresetId } from '@whatmedia/config';
import { presets } from '@whatmedia/config';
import type { MediaInfo, Plan, OutputFile, Progress } from '@whatmedia/core';
import { getStoredLanguage, getStoredPreset, setStoredPreset } from '../utils/storage';

export type AppScreen = 'home' | 'analysis' | 'batch' | 'processing' | 'results' | 'batchResults';
export type ProcessingLane = 'local' | 'server';

export type BatchStatus = 'analyzing' | 'pending' | 'processing' | 'done' | 'error' | 'skipped';

/** One file of a multi-file selection, processed automatically one after another */
export interface BatchItem {
  id: string;
  file: File;
  info: MediaInfo | null;
  status: BatchStatus;
  outputs: OutputFile[];
  /** Translation key of the error, when status is 'error' */
  errorKey?: string;
}

interface MediaState {
  screen: AppScreen;
  selectedFile: File | null;
  fileQueue: File[];
  currentFileIndex: number;
  mediaInfo: MediaInfo | null;
  plan: Plan | null;
  currentPresetId: PresetId;
  /** Last video preset chosen, restored when a video follows a photo in a batch */
  lastVideoPresetId: PresetId;
  /** Status segment length chosen by the user (undefined = config default) */
  segmentSec: number | undefined;
  crop916: boolean;
  lane: ProcessingLane;
  progress: Progress | null;
  outputFiles: OutputFile[];
  isAnalyzing: boolean;
  language: 'fr' | 'en';
  isInstallBannerVisible: boolean;
  batch: BatchItem[];

  setScreen: (screen: AppScreen) => void;
  setSelectedFile: (file: File | null) => void;
  setFileQueue: (files: File[]) => void;
  setCurrentFileIndex: (index: number) => void;
  setMediaInfo: (info: MediaInfo | null) => void;
  setPlan: (plan: Plan | null) => void;
  setCurrentPresetId: (presetId: PresetId) => void;
  setSegmentSec: (s: number | undefined) => void;
  setCrop916: (v: boolean) => void;
  setLane: (lane: ProcessingLane) => void;
  setProgress: (p: Progress | null) => void;
  setOutputFiles: (files: OutputFile[]) => void;
  setIsAnalyzing: (analyzing: boolean) => void;
  setLanguage: (lang: 'fr' | 'en') => void;
  setInstallBannerVisible: (visible: boolean) => void;
  setBatch: (items: BatchItem[]) => void;
  updateBatchItem: (id: string, patch: Partial<BatchItem>) => void;
  resetAll: () => void;
}

const initialPreset = getStoredPreset();

export const useMediaStore = create<MediaState>((set) => ({
  screen: 'home',
  selectedFile: null,
  fileQueue: [],
  currentFileIndex: 0,
  mediaInfo: null,
  plan: null,
  currentPresetId: initialPreset,
  lastVideoPresetId: initialPreset,
  segmentSec: undefined,
  crop916: false,
  lane: 'local',
  progress: null,
  outputFiles: [],
  isAnalyzing: false,
  language: getStoredLanguage(),
  isInstallBannerVisible: true,
  batch: [],

  setScreen: (screen) => set({ screen }),
  setSelectedFile: (file) => set({ selectedFile: file }),
  setFileQueue: (fileQueue) => set({ fileQueue }),
  setCurrentFileIndex: (currentFileIndex) => set({ currentFileIndex }),
  setMediaInfo: (info) => set({ mediaInfo: info }),
  setPlan: (plan) => set({ plan }),
  setCurrentPresetId: (presetId) => {
    if (presets[presetId]?.kind === 'video') {
      setStoredPreset(presetId);
      set({ currentPresetId: presetId, lastVideoPresetId: presetId });
    } else {
      set({ currentPresetId: presetId });
    }
  },
  setSegmentSec: (segmentSec) => set({ segmentSec }),
  setCrop916: (crop916) => set({ crop916 }),
  setLane: (lane) => set({ lane }),
  setProgress: (progress) => set({ progress }),
  setOutputFiles: (outputFiles) => set({ outputFiles }),
  setIsAnalyzing: (isAnalyzing) => set({ isAnalyzing }),
  setLanguage: (language) => set({ language }),
  setInstallBannerVisible: (visible) => set({ isInstallBannerVisible: visible }),
  setBatch: (batch) => set({ batch }),
  updateBatchItem: (id, patch) =>
    set((state) => ({ batch: state.batch.map((b) => (b.id === id ? { ...b, ...patch } : b)) })),
  resetAll: () =>
    set({
      screen: 'home',
      selectedFile: null,
      fileQueue: [],
      currentFileIndex: 0,
      mediaInfo: null,
      plan: null,
      progress: null,
      outputFiles: [],
      isAnalyzing: false,
      crop916: false,
      batch: [],
    }),
}));
