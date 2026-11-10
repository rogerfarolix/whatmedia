import { describe, it, expect } from 'vitest';
import { formatBytes, getFileCategory, normalizeMediaFile } from '../src/utils/format';

describe('formatBytes', () => {
  it('formats zero bytes correctly', () => {
    expect(formatBytes(0, 'fr')).toBe('0 o');
    expect(formatBytes(0, 'en')).toBe('0 B');
  });

  it('formats kilobytes', () => {
    expect(formatBytes(1000, 'fr')).toBe('1 Ko');
    expect(formatBytes(2000, 'en')).toBe('2 KB');
  });

  it('formats megabytes with one decimal', () => {
    expect(formatBytes(15_000_000, 'fr')).toBe('15 Mo');
    expect(formatBytes(15_400_000, 'en')).toBe('15.4 MB');
    // French decimal comma
    expect(formatBytes(15_400_000, 'fr')).toBe('15,4 Mo');
  });
});

describe('getFileCategory', () => {
  it('detects video files from type or extension', () => {
    const file1 = new File([''], 'test.mp4', { type: 'video/mp4' });
    expect(getFileCategory(file1)).toBe('video');

    const file2 = new File([''], 'test.mov', { type: '' });
    expect(getFileCategory(file2)).toBe('video');
  });

  it('detects image files from type or extension', () => {
    const file1 = new File([''], 'photo.jpg', { type: 'image/jpeg' });
    expect(getFileCategory(file1)).toBe('image');

    const file2 = new File([''], 'photo.png', { type: '' });
    expect(getFileCategory(file2)).toBe('image');
  });
});

describe('normalizeMediaFile', () => {
  it('keeps files that already have a media type', () => {
    const f = new File([''], 'a.mp4', { type: 'video/mp4' });
    expect(normalizeMediaFile(f)).toBe(f);
  });

  it('fills an empty HEIC type from the extension', () => {
    const f = normalizeMediaFile(new File([''], 'IMG_1.HEIC', { type: '' }));
    expect(f?.type).toBe('image/heic');
  });

  it('rejects unsupported files', () => {
    expect(normalizeMediaFile(new File([''], 'doc.pdf', { type: 'application/pdf' }))).toBeNull();
  });
});
