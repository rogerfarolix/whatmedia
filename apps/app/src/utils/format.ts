export function formatBytes(bytes: number, lang: 'fr' | 'en' = 'fr'): string {
  if (bytes <= 0) return lang === 'fr' ? '0 o' : '0 B';
  const k = 1024;
  const sizes = lang === 'fr' ? ['o', 'Ko', 'Mo', 'Go'] : ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const safeI = Math.min(i, sizes.length - 1);
  const formatted = (bytes / Math.pow(k, safeI)).toFixed(1).replace('.0', '');
  return `${formatted} ${sizes[safeI]}`;
}

export function getFileCategory(file: File): 'video' | 'image' | 'other' {
  if (file.type.startsWith('video/')) return 'video';
  if (file.type.startsWith('image/')) return 'image';
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (['mp4', 'mov', 'webm', 'mkv'].includes(ext || '')) return 'video';
  if (['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'].includes(ext || '')) return 'image';
  return 'other';
}
