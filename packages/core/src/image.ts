import type { Plan, OutputFile, Progress } from './types.js';
import { MediaError, outputBaseName } from './types.js';
import { fitInBox } from './plan.js';

type AnyCanvas = OffscreenCanvas | HTMLCanvasElement;
type Any2D = OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D;

function makeCanvas(w: number, h: number): { canvas: AnyCanvas; ctx: Any2D } {
  let canvas: AnyCanvas;
  if (typeof OffscreenCanvas !== 'undefined') {
    canvas = new OffscreenCanvas(w, h);
  } else {
    canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
  }
  const ctx = canvas.getContext('2d', { colorSpace: 'srgb', alpha: false }) as Any2D | null;
  if (!ctx) throw new MediaError('E_CANVAS', 'could not acquire a 2D rendering context');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  // JPEG has no alpha: paint white first so transparent PNG/WebP areas don't turn black.
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);
  return { canvas, ctx };
}

/**
 * Optimizes an image (JPEG, PNG, WebP, HEIC) for WhatsApp Status:
 * 1. Decodes via createImageBitmap (EXIF orientation applied)
 * 2. Downscales in steps to prevent aliasing, never upscaling, aspect ratio preserved
 * 3. Strips all EXIF / metadata (canvas re-encode)
 * 4. Encodes to sRGB JPEG
 */
export async function runImageOptimization(
  file: File | Blob,
  plan: Plan,
  onProgress?: (p: Progress) => void,
  fileNameBase?: string,
): Promise<OutputFile[]> {
  const report = (phase: Progress['phase'], ratio: number) =>
    onProgress?.({ phase, segmentIndex: 1, segmentCount: 1, ratio });

  report('decode', 0.2);

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    try {
      bitmap = await createImageBitmap(file);
    } catch {
      throw new MediaError('E_UNSUPPORTED_IMAGE', 'could not decode this image format in the browser');
    }
  }

  report('transform', 0.5);

  const origW = bitmap.width;
  const origH = bitmap.height;
  const quality = plan.image?.quality ?? 0.9;
  // Re-fit on the decoded size: EXIF orientation may have swapped width and height.
  const { width: targetW, height: targetH } = fitInBox(
    origW,
    origH,
    plan.image?.width ?? 1440,
    plan.image?.height ?? 2560,
  );

  let curW = origW;
  let curH = origH;
  let current: AnyCanvas | ImageBitmap = bitmap;

  try {
    // Halve repeatedly while still at least twice the target: avoids aliasing on big reductions.
    while (curW * 0.5 >= targetW && curH * 0.5 >= targetH) {
      const nextW = Math.round(curW * 0.5);
      const nextH = Math.round(curH * 0.5);
      const step = makeCanvas(nextW, nextH);
      (step.ctx as CanvasRenderingContext2D).drawImage(current as CanvasImageSource, 0, 0, curW, curH, 0, 0, nextW, nextH);
      current = step.canvas;
      curW = nextW;
      curH = nextH;
    }

    const final = makeCanvas(targetW, targetH);
    (final.ctx as CanvasRenderingContext2D).drawImage(current as CanvasImageSource, 0, 0, curW, curH, 0, 0, targetW, targetH);

    report('encode', 0.8);

    let blob: Blob;
    if ('convertToBlob' in final.canvas) {
      blob = await final.canvas.convertToBlob({ type: 'image/jpeg', quality });
    } else {
      const htmlCanvas = final.canvas;
      blob = await new Promise<Blob>((resolve, reject) => {
        htmlCanvas.toBlob(
          (b) => (b ? resolve(b) : reject(new MediaError('E_CANVAS', 'toBlob failed'))),
          'image/jpeg',
          quality,
        );
      });
    }

    const base = fileNameBase ?? outputBaseName('name' in file ? file.name : undefined);
    const outFile = new File([blob], `${base}.jpg`, { type: 'image/jpeg' });

    report('mux', 1);

    return [{ file: outFile, index: 1, totalSegments: 1, durationSec: 0, sizeBytes: outFile.size }];
  } finally {
    bitmap.close();
  }
}
