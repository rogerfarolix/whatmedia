export function formatBytes(bytes: number, langOrDecimals: 'fr' | 'en' | number = 'fr', decimals = 1): string {
  const lang: 'fr' | 'en' = typeof langOrDecimals === 'string' ? langOrDecimals : 'fr';
  const precision = typeof langOrDecimals === 'number' ? langOrDecimals : decimals;

  const sizes = lang === 'fr' ? ['o', 'Ko', 'Mo', 'Go'] : ['B', 'KB', 'MB', 'GB'];
  if (bytes === 0) return `0 ${sizes[0]}`;

  const k = 1024;
  const dm = precision < 0 ? 0 : precision;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const val = parseFloat((bytes / Math.pow(k, i)).toFixed(dm));

  return `${val} ${sizes[i]}`;
}

export function formatDuration(seconds: number): string {
  if (seconds <= 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function getFileCategory(file: File): 'video' | 'image' | 'unknown' {
  if (file.type.startsWith('video/')) return 'video';
  if (file.type.startsWith('image/')) return 'image';

  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext && ['mp4', 'mov', 'webm', 'mkv', 'avi', 'm4v'].includes(ext)) {
    return 'video';
  }
  if (ext && ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'].includes(ext)) {
    return 'image';
  }

  return 'unknown';
}
