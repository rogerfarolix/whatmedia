import type { Plan, OutputFile, Progress } from './types.js';

/**
 * Optimizes an image (JPEG, PNG, WebP, HEIC) for WhatsApp Status:
 * 1. Decodes via createImageBitmap
 * 2. Downscales in steps using OffscreenCanvas to prevent aliasing
 * 3. Strips all EXIF / metadata
 * 4. Encodes to calibrated JPEG (sRGB, quality ~0.9)
 */
export async function runImageOptimization(
  file: File | Blob,
  plan: Plan,
  onProgress?: (p: Progress) => void,
): Promise<OutputFile[]> {
  onProgress?.({
    phase: 'decode',
    segmentIndex: 1,
    segmentCount: 1,
    ratio: 0.2,
  });

  let bitmap: ImageBitmap;
  try {
    // Respect EXIF orientation (critical for iPhone portrait / landscape photos)
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    try {
      bitmap = await createImageBitmap(file);
    } catch {
      throw new Error('E_UNSUPPORTED_IMAGE: Could not decode image format in browser');
    }
  }

  onProgress?.({
    phase: 'transform',
    segmentIndex: 1,
    segmentCount: 1,
    ratio: 0.5,
  });

  const origW = bitmap.width;
  const origH = bitmap.height;
  const maxW = plan.image?.width ?? 1440;
  const maxH = plan.image?.height ?? 2560;
  const quality = plan.image?.quality ?? 0.9;

  // Never upscale; preserve exact aspect ratio without distortion
  const scale = Math.min(1, maxW / origW, maxH / origH);
  const targetW = Math.max(2, Math.round(origW * scale));
  const targetH = Math.max(2, Math.round(origH * scale));

  let curW = origW;
  let curH = origH;

  // Multi-step downscaling to preserve crisp details (anti-aliasing)
  let canvas: OffscreenCanvas | HTMLCanvasElement;
  let ctx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D | null = null;

  if (typeof OffscreenCanvas !== 'undefined') {
    canvas = new OffscreenCanvas(curW, curH);
    ctx = canvas.getContext('2d', { colorSpace: 'srgb' }) as OffscreenCanvasRenderingContext2D | null;
  } else {
    canvas = document.createElement('canvas');
    canvas.width = curW;
    canvas.height = curH;
    ctx = canvas.getContext('2d') as CanvasRenderingContext2D | null;
  }

  if (!ctx) {
    bitmap.close();
    throw new Error('E_CANVAS: Could not acquire 2D rendering context');
  }

  // Draw original
  (ctx as CanvasRenderingContext2D).drawImage(bitmap, 0, 0);
  bitmap.close();

  // Step down by half if significantly larger
  while (curW * 0.5 >= targetW && curH * 0.5 >= targetH) {
    const nextW = Math.round(curW * 0.5);
    const nextH = Math.round(curH * 0.5);

    let stepCanvas: OffscreenCanvas | HTMLCanvasElement;
    if (typeof OffscreenCanvas !== 'undefined') {
      stepCanvas = new OffscreenCanvas(nextW, nextH);
    } else {
      stepCanvas = document.createElement('canvas');
      stepCanvas.width = nextW;
      stepCanvas.height = nextH;
    }
    const stepCtx = (stepCanvas as HTMLCanvasElement).getContext('2d') as CanvasRenderingContext2D | null;
    if (stepCtx) {
      stepCtx.drawImage(canvas as CanvasImageSource, 0, 0, curW, curH, 0, 0, nextW, nextH);
      canvas = stepCanvas;
      curW = nextW;
      curH = nextH;
    } else {
      break;
    }
  }

  // Final draw to exact target dimensions
  let finalCanvas: OffscreenCanvas | HTMLCanvasElement;
  if (typeof OffscreenCanvas !== 'undefined') {
    finalCanvas = new OffscreenCanvas(targetW, targetH);
  } else {
    finalCanvas = document.createElement('canvas');
    finalCanvas.width = targetW;
    finalCanvas.height = targetH;
  }
  const finalCtx = (finalCanvas as HTMLCanvasElement).getContext('2d') as CanvasRenderingContext2D | null;
  if (!finalCtx) {
    throw new Error('E_CANVAS: Could not acquire final canvas context');
  }

  finalCtx.drawImage(canvas as CanvasImageSource, 0, 0, curW, curH, 0, 0, targetW, targetH);

  onProgress?.({
    phase: 'encode',
    segmentIndex: 1,
    segmentCount: 1,
    ratio: 0.8,
  });

  // Convert to clean JPEG Blob (EXIF stripped automatically by canvas conversion)
  let blob: Blob;
  if ('convertToBlob' in finalCanvas) {
    blob = await (finalCanvas as OffscreenCanvas).convertToBlob({
      type: 'image/jpeg',
      quality,
    });
  } else {
    blob = await new Promise<Blob>((resolve, reject) => {
      (finalCanvas as HTMLCanvasElement).toBlob(
        (b) => {
          if (b) resolve(b);
          else reject(new Error('Canvas toBlob conversion failed'));
        },
        'image/jpeg',
        quality,
      );
    });
  }

  const outFileName = 'whatmedia-photo.jpg';
  const outFile = new File([blob], outFileName, { type: 'image/jpeg' });

  onProgress?.({
    phase: 'mux',
    segmentIndex: 1,
    segmentCount: 1,
    ratio: 1.0,
  });

  return [
    {
      file: outFile,
      index: 1,
      totalSegments: 1,
      durationSec: 0,
      sizeBytes: outFile.size,
    },
  ];
}
