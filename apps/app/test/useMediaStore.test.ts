import { describe, it, expect, beforeEach } from 'vitest';
import { useMediaStore } from '../src/store/useMediaStore';

describe('useMediaStore', () => {
  beforeEach(() => {
    useMediaStore.getState().clearFiles();
    useMediaStore.getState().setPreset('status-hd');
    useMediaStore.getState().setLanguage('fr');
  });

  it('initializes with default values', () => {
    const state = useMediaStore.getState();
    expect(state.selectedFiles).toEqual([]);
    expect(state.currentPresetId).toBe('status-hd');
    expect(state.processingState).toBe('idle');
  });

  it('updates selected files and auto-selects photo preset if image is selected', () => {
    const photo = new File(['fake-image'], 'photo.jpg', { type: 'image/jpeg' });
    useMediaStore.getState().setSelectedFiles([photo]);

    const state = useMediaStore.getState();
    expect(state.selectedFiles.length).toBe(1);
    expect(state.currentPresetId).toBe('status-photo');
  });

  it('switches back to status-hd if video is selected', () => {
    const photo = new File(['fake-image'], 'photo.jpg', { type: 'image/jpeg' });
    useMediaStore.getState().setSelectedFiles([photo]);
    expect(useMediaStore.getState().currentPresetId).toBe('status-photo');

    const video = new File(['fake-video'], 'clip.mp4', { type: 'video/mp4' });
    useMediaStore.getState().setSelectedFiles([video]);
    expect(useMediaStore.getState().currentPresetId).toBe('status-hd');
  });

  it('can add and remove individual files', () => {
    const fileA = new File(['a'], 'a.mp4', { type: 'video/mp4' });
    const fileB = new File(['b'], 'b.mp4', { type: 'video/mp4' });

    useMediaStore.getState().setSelectedFiles([fileA]);
    useMediaStore.getState().addSelectedFiles([fileB]);
    expect(useMediaStore.getState().selectedFiles.length).toBe(2);

    useMediaStore.getState().removeFile(0);
    expect(useMediaStore.getState().selectedFiles.length).toBe(1);
    expect(useMediaStore.getState().selectedFiles[0]?.name).toBe('b.mp4');
  });

  it('toggles language between fr and en', () => {
    useMediaStore.getState().setLanguage('fr');
    useMediaStore.getState().toggleLanguage();
    expect(useMediaStore.getState().language).toBe('en');

    useMediaStore.getState().toggleLanguage();
    expect(useMediaStore.getState().language).toBe('fr');
  });
});
