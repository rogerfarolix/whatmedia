export function formatBytes(bytes: number, langOrDecimals: 'fr' | 'en' | number = 'fr', decimals = 1): string {
  const lang: 'fr' | 'en' = typeof langOrDecimals === 'string' ? langOrDecimals : 'fr';
  const precision = typeof langOrDecimals === 'number' ? langOrDecimals : decimals;

  const sizes = lang === 'fr' ? ['o', 'Ko', 'Mo', 'Go'] : ['B', 'KB', 'MB', 'GB'];
  if (bytes === 0) return `0 ${sizes[0]}`;

  // Decimal units, like WhatsApp's 16 MB limit and the iOS/Android file browsers
  const k = 1000;
  const dm = precision < 0 ? 0 : precision;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const idx = Math.min(i, sizes.length - 1);
  const val = parseFloat((bytes / Math.pow(k, idx)).toFixed(dm));
  const num = val.toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-US', { maximumFractionDigits: dm });

  return `${num} ${sizes[idx]}`;
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

const MIME_BY_EXT: Record<string, string> = {
  mp4: 'video/mp4',
  m4v: 'video/mp4',
  mov: 'video/quicktime',
  webm: 'video/webm',
  mkv: 'video/x-matroska',
  '3gp': 'video/3gpp',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  heic: 'image/heic',
  heif: 'image/heif',
};

/**
 * Some browsers give HEIC/MOV files an empty MIME type: fill it in from the extension so the
 * rest of the pipeline can route photos and videos correctly. Returns null for unsupported files.
 */
export function normalizeMediaFile(file: File): File | null {
  if (file.type.startsWith('video/') || file.type.startsWith('image/')) return file;
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  const mime = MIME_BY_EXT[ext];
  if (!mime) return null;
  return new File([file], file.name, { type: mime, lastModified: file.lastModified });
}

/** Local processing ceiling (PRD US-01) */
export const MAX_LOCAL_BYTES = 2 * 1000 * 1000 * 1000;
/** Above this, warn that processing will be long (iOS memory) */
export const LARGE_FILE_BYTES = 500 * 1000 * 1000;

/** "1 min 05 s" / "45 s" style remaining-time label */
export function formatEta(ms: number, lang: 'fr' | 'en'): string {
  const total = Math.max(1, Math.round(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  if (m === 0) return `${s} s`;
  return lang === 'fr' ? `${m} min ${String(s).padStart(2, '0')} s` : `${m} min ${String(s).padStart(2, '0')} s`;
}
