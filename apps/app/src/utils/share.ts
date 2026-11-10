/** Saves a file through a temporary download link (fallback when Web Share is unavailable). */
export function downloadFile(file: File): void {
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoking immediately can cancel the download on Safari: keep the URL alive for a while.
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/** Browsers block bursts of downloads: space them out. */
export async function downloadAll(files: File[]): Promise<void> {
  for (const f of files) {
    downloadFile(f);
    await new Promise((r) => setTimeout(r, 400));
  }
}

export function canShareFiles(files: File[]): boolean {
  if (files.length === 0) return false;
  try {
    return typeof navigator !== 'undefined' && !!navigator.canShare?.({ files });
  } catch {
    return false;
  }
}

/**
 * Opens the system share sheet with the files only: adding a title or text makes WhatsApp drop
 * the files on some platforms. Resolves to true when shared, false when the user closed the sheet.
 * Must be called from a user gesture (click).
 */
export async function shareFiles(files: File[]): Promise<boolean> {
  try {
    await navigator.share({ files });
    return true;
  } catch {
    return false;
  }
}
