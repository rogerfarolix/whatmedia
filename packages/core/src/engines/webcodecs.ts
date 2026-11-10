import {
  Input,
  Output,
  BlobSource,
  BufferTarget,
  Mp4OutputFormat,
  Conversion,
  ALL_FORMATS,
  type VideoSample,
} from 'mediabunny';
import { whatsappLimits } from '@whatmedia/config';
import type { Plan, OutputFile, Progress } from '../types.js';
import { MediaError, outputBaseName } from '../types.js';

export interface RunOptions {
  signal?: AbortSignal;
  onProgress?: (p: Progress) => void;
  onSegmentComplete?: (output: OutputFile, segmentIndex: number) => void;
  /** Base for output names; defaults to one derived from the source file name */
  fileNameBase?: string;
}

/** Re-encode attempts when a segment overshoots the WhatsApp size limit */
const MAX_SIZE_RETRIES = 2;
/** Extra safety factor applied on top of the measured overshoot when retrying */
const RETRY_SAFETY = 0.92;

type Canvas2D = OffscreenCanvasRenderingContext2D;

/**
 * HDR → SDR (spike S2, option A): drawing each frame into an sRGB 2D canvas lets the browser's
 * colour management convert HLG/PQ BT.2020 to SDR. The server path (ffmpeg tonemap=hable) stays
 * the reference for the most faithful rendering.
 */
function createToneMapper(width: number, height: number) {
  if (typeof OffscreenCanvas === 'undefined') return undefined;
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d', { colorSpace: 'srgb', alpha: false }) as Canvas2D | null;
  if (!ctx) return undefined;
  return (sample: VideoSample) => {
    ctx.drawImage(sample.toCanvasImageSource(), 0, 0, width, height);
    return canvas;
  };
}

function abortError(partials: OutputFile[]): MediaError {
  const err = new MediaError('E_ABORTED', 'Processing aborted by user');
  err.partialOutputs = partials;
  return err;
}

async function encodeSegment(
  file: File | Blob,
  plan: Plan,
  seg: Plan['segments'][number],
  videoBitrate: number,
  signal: AbortSignal | undefined,
  onRatio: (r: number) => void,
): Promise<ArrayBuffer> {
  const input = new Input({ source: new BlobSource(file), formats: ALL_FORMATS });
  const target = new BufferTarget();
  const output = new Output({ format: new Mp4OutputFormat({ fastStart: 'in-memory' }), target });

  const v = plan.video;
  const width = v?.width ?? 1080;
  const height = v?.height ?? 1920;
  const toneMapper = v?.toneMap ? createToneMapper(width, height) : undefined;

  try {
    const conversion = await Conversion.init({
      input,
      output,
      video: {
        codec: 'avc',
        width,
        height,
        // plan() computes aspect-correct dimensions, so 'contain' never letterboxes;
        // 'cover' is used for the opt-in 9:16 crop.
        fit: v?.fit ?? 'contain',
        bitrate: Math.max(1, Math.round(videoBitrate)),
        frameRate: v?.fps ?? 30,
        keyFrameInterval: v?.keyframeIntervalSec ?? 2,
        forceTranscode: true,
        ...(toneMapper ? { process: toneMapper, processedWidth: width, processedHeight: height } : {}),
      },
      trim: { start: seg.startSec, end: seg.endSec },
      showWarnings: false,
    });

    // A file whose video track cannot be decoded here (e.g. HEVC on a browser without HEVC)
    // would otherwise silently produce an audio-only MP4.
    const droppedVideo = conversion.discardedTracks.find((d) => d.track.isVideoTrack());
    if (droppedVideo || !conversion.isValid) {
      throw new MediaError(
        'E_UNSUPPORTED_CODEC',
        droppedVideo ? `video track discarded (${droppedVideo.reason})` : 'conversion is not valid',
      );
    }

    conversion.onProgress = (r: number) => onRatio(r);

    const onAbort = () => {
      void conversion.cancel();
    };
    signal?.addEventListener('abort', onAbort, { once: true });
    try {
      await conversion.execute();
    } finally {
      signal?.removeEventListener('abort', onAbort);
    }
  } finally {
    input.dispose();
  }

  if (!target.buffer) {
    throw new MediaError('E_MUX', 'segment produced no data');
  }
  return target.buffer;
}

/**
 * Executes the WebCodecs media conversion pipeline:
 * 1. Read input through Mediabunny
 * 2. Transcode / split per segment defined in Plan (H.264 + AAC, MP4 fast start)
 * 3. Verify each part fits the WhatsApp size limit, re-encoding at a lower bitrate if needed
 * 4. Yield resulting OutputFile array
 */
export async function runWebCodecs(
  file: File | Blob,
  plan: Plan,
  options?: RunOptions,
): Promise<OutputFile[]> {
  const { signal, onProgress } = options ?? {};
  const outputFiles: OutputFile[] = [];
  const base = options?.fileNameBase ?? outputBaseName('name' in file ? file.name : undefined);
  const segmentCount = plan.segments.length;

  for (let i = 0; i < segmentCount; i++) {
    if (signal?.aborted) throw abortError(outputFiles);

    const seg = plan.segments[i];
    if (!seg) continue;

    const report = (r: number) =>
      onProgress?.({
        phase: 'encode',
        segmentIndex: i + 1,
        segmentCount,
        ratio: Math.min(1, (i + r) / segmentCount),
      });
    report(0);

    let bitrate = plan.video?.bitrate ?? 5_000_000;
    let buffer: ArrayBuffer | undefined;

    for (let attempt = 0; attempt <= MAX_SIZE_RETRIES; attempt++) {
      try {
        buffer = await encodeSegment(file, plan, seg, bitrate, signal, report);
      } catch (err: unknown) {
        if (signal?.aborted) throw abortError(outputFiles);
        if (err instanceof MediaError) {
          err.partialOutputs = outputFiles;
          throw err;
        }
        const wrapped = new MediaError('E_UNKNOWN', err instanceof Error ? err.message : String(err));
        wrapped.partialOutputs = outputFiles;
        throw wrapped;
      }

      if (buffer.byteLength <= whatsappLimits.maxMediaBytes) break;

      if (attempt === MAX_SIZE_RETRIES) {
        const err = new MediaError(
          'E_TOO_LARGE',
          `segment ${i + 1} is ${buffer.byteLength} bytes after ${attempt + 1} attempts`,
        );
        err.partialOutputs = outputFiles;
        throw err;
      }
      // Hardware encoders can overshoot the requested bitrate: scale down by the measured excess.
      bitrate = Math.floor(bitrate * (seg.targetBytes / buffer.byteLength) * RETRY_SAFETY);
      report(0);
    }

    if (!buffer) throw new MediaError('E_MUX', `segment ${i + 1} produced no data`);

    const durationSec = Math.round((seg.endSec - seg.startSec) * 10) / 10;
    const name =
      segmentCount > 1 ? `${base}-${i + 1}of${segmentCount}.mp4` : `${base}.mp4`;
    const outFile = new File([buffer], name, { type: 'video/mp4' });

    const item: OutputFile = {
      file: outFile,
      index: i + 1,
      totalSegments: segmentCount,
      durationSec,
      sizeBytes: outFile.size,
    };

    outputFiles.push(item);
    options?.onSegmentComplete?.(item, i + 1);
  }

  onProgress?.({ phase: 'mux', segmentIndex: segmentCount, segmentCount, ratio: 1 });

  return outputFiles;
}
