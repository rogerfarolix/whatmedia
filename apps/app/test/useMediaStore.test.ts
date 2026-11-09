import { describe, it, expect, beforeEach } from 'vitest';
import { useMediaStore } from '../src/store/useMediaStore';

describe('useMediaStore', () => {
  beforeEach(() => {
    useMediaStore.getState().resetAll();
    useMediaStore.getState().setCurrentPresetId('status-hd');
    useMediaStore.getState().setLanguage('fr');
  });

  it('initializes with default values', () => {
    const state = useMediaStore.getState();
    expect(state.selectedFile).toBeNull();
    expect(state.currentPresetId).toBe('status-hd');
    expect(state.language).toBe('fr');
    expect(state.screen).toBe('home');
  });

  it('updates selected file and stores it', () => {
    const mockFile = new File(['dummy'], 'sample.mp4', { type: 'video/mp4' });
    useMediaStore.getState().setSelectedFile(mockFile);

    const state = useMediaStore.getState();
    expect(state.selectedFile).toBe(mockFile);
  });

  it('updates preset correctly', () => {
    useMediaStore.getState().setCurrentPresetId('status-light');
    expect(useMediaStore.getState().currentPresetId).toBe('status-light');
  });

  it('resets all state on resetAll', () => {
    const mockFile = new File(['dummy'], 'sample.mp4', { type: 'video/mp4' });
    useMediaStore.getState().setSelectedFile(mockFile);
    useMediaStore.getState().setScreen('results');

    useMediaStore.getState().resetAll();

    expect(useMediaStore.getState().selectedFile).toBeNull();
    expect(useMediaStore.getState().screen).toBe('home');
  });

  it('toggles language between fr and en', () => {
    useMediaStore.getState().setLanguage('en');
    expect(useMediaStore.getState().language).toBe('en');

    useMediaStore.getState().setLanguage('fr');
    expect(useMediaStore.getState().language).toBe('fr');
  });
});
