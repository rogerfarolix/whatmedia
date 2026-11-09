import { describe, it, expect } from 'vitest';
import { formatBytes, getFileCategory } from '../src/utils/format';

describe('formatBytes', () => {
  it('formats zero bytes correctly', () => {
    expect(formatBytes(0, 'fr')).toBe('0 o');
    expect(formatBytes(0, 'en')).toBe('0 B');
  });

  it('formats kilobytes', () => {
    expect(formatBytes(1024, 'fr')).toBe('1 Ko');
    expect(formatBytes(2048, 'en')).toBe('2 KB');
  });

  it('formats megabytes with one decimal', () => {
    expect(formatBytes(15 * 1024 * 1024, 'fr')).toBe('15 Mo');
    expect(formatBytes(15.4 * 1024 * 1024, 'en')).toBe('15.4 MB');
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
