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

/**
 * Re-encode schedule when a part overshoots the WhatsApp size limit. Browser encoders can ignore
 * the requested bitrate on very detailed footage (water, confetti, night grain): lowering the
 * bitrate alone is then not enough, so later attempts also reduce the picture size.
 */
const SIZE_ATTEMPTS: { scale: number }[] = [{ scale: 1 }, { scale: 1 }, { scale: 2 / 3 }, { scale: 1 / 2 }];
/** Extra safety factor applied on top of the measured overshoot when retrying */
const RETRY_SAFETY = 0.92;
/** Share of a part's progress bar given to each attempt, so the bar never goes backwards */
const ATTEMPT_PROGRESS = [0, 0.7, 0.85, 0.95, 1];

function even(n: number): number {
  const r = Math.floor(n);
  return Math.max(2, r - (r % 2));
}

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
  scale: number,
  signal: AbortSignal | undefined,
  onRatio: (r: number) => void,
): Promise<ArrayBuffer> {
  const input = new Input({ source: new BlobSource(file), formats: ALL_FORMATS });
  const target = new BufferTarget();
  const output = new Output({ format: new Mp4OutputFormat({ fastStart: 'in-memory' }), target });

  const v = plan.video;
  const width = even((v?.width ?? 1080) * scale);
  const height = even((v?.height ?? 1920) * scale);
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

/** A part shorter than this is never split further (it would make unusable statuses). */
const MIN_SPLIT_SEC = 6;

interface Job {
  seg: Plan['segments'][number];
  /** Index in SIZE_ATTEMPTS to start from (sub-parts of an oversized part start small) */
  firstAttempt: number;
  bitrate: number;
}

function wrapError(err: unknown, signal: AbortSignal | undefined, partials: OutputFile[]): MediaError {
  if (signal?.aborted) return abortError(partials);
  const e = err instanceof MediaError ? err : new MediaError('E_UNKNOWN', err instanceof Error ? err.message : String(err));
  e.partialOutputs = partials;
  return e;
}

/**
 * Executes the WebCodecs media conversion pipeline:
 * 1. Read input through Mediabunny
 * 2. Transcode / split per segment defined in Plan (H.264 + AAC, MP4 fast start)
 * 3. Verify each part fits the WhatsApp size limit: re-encode with a lower bitrate, then a smaller
 *    picture, and as a last resort split the part into shorter ones
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
  const totalDuration = Math.max(
    0.001,
    plan.segments.reduce((sum, s) => sum + Math.max(0, s.endSec - s.startSec), 0),
  );
  const queue: Job[] = plan.segments.map((seg) => ({ seg, firstAttempt: 0, bitrate: plan.video?.bitrate ?? 5_000_000 }));

  let doneDuration = 0;
  let globalReported = 0;
  const report = (segDuration: number, segRatio: number, retry: number) => {
    // Overall progress is measured in seconds of video, and never goes backwards.
    globalReported = Math.max(globalReported, Math.min(1, (doneDuration + segDuration * segRatio) / totalDuration));
    onProgress?.({
      phase: 'encode',
      segmentIndex: outputFiles.length + 1,
      segmentCount: outputFiles.length + queue.length + 1,
      ratio: globalReported,
      ...(retry > 0 ? { retry } : {}),
    });
  };

  while (queue.length > 0) {
    if (signal?.aborted) throw abortError(outputFiles);
    const job = queue.shift()!;
    const { seg } = job;
    const segDuration = Math.max(0, seg.endSec - seg.startSec);
    let bitrate = job.bitrate;
    let buffer: ArrayBuffer | undefined;
    let segRatio = 0;
    report(segDuration, 0, job.firstAttempt);

    for (let attempt = job.firstAttempt; attempt < SIZE_ATTEMPTS.length; attempt++) {
      const from = ATTEMPT_PROGRESS[attempt] ?? 0.95;
      const to = ATTEMPT_PROGRESS[attempt + 1] ?? 1;
      const { scale } = SIZE_ATTEMPTS[attempt] ?? { scale: 1 / 2 };
      const lower = attempt === job.firstAttempt ? 0 : from;
      try {
        buffer = await encodeSegment(file, plan, seg, bitrate, scale, signal, (r) => {
          segRatio = Math.max(segRatio, lower + (to - lower) * r);
          report(segDuration, segRatio, attempt);
        });
      } catch (err: unknown) {
        throw wrapError(err, signal, outputFiles);
      }
      if (buffer.byteLength <= whatsappLimits.maxMediaBytes) break;
      // Scale the bitrate down by the measured excess (the next attempt may also shrink the picture).
      bitrate = Math.max(150_000, Math.floor(bitrate * (seg.targetBytes / buffer.byteLength) * RETRY_SAFETY));
      report(segDuration, segRatio, attempt + 1);
    }

    if (!buffer) throw new MediaError('E_MUX', 'part produced no data');

    if (buffer.byteLength > whatsappLimits.maxMediaBytes) {
      // Last resort: the encoder ignores the bitrate on this footage. Size follows duration, so
      // shorter parts fit. Sub-parts start directly at the smallest settings that were tried.
      const pieces = Math.min(6, Math.ceil((buffer.byteLength / seg.targetBytes) * 1.15));
      if (segDuration / pieces < MIN_SPLIT_SEC) {
        const err = new MediaError('E_TOO_LARGE', `part of ${segDuration}s is ${buffer.byteLength} bytes`);
        err.partialOutputs = outputFiles;
        throw err;
      }
      const step = segDuration / pieces;
      const subJobs: Job[] = Array.from({ length: pieces }, (_, k) => ({
        seg: {
          startSec: Math.round((seg.startSec + k * step) * 1000) / 1000,
          endSec: k === pieces - 1 ? seg.endSec : Math.round((seg.startSec + (k + 1) * step) * 1000) / 1000,
          targetBytes: seg.targetBytes,
        },
        firstAttempt: SIZE_ATTEMPTS.length - 1,
        bitrate,
      }));
      queue.unshift(...subJobs);
      continue;
    }

    doneDuration += segDuration;
    const item: OutputFile = {
      file: new File([buffer], `${base}.mp4`, { type: 'video/mp4' }),
      index: outputFiles.length + 1,
      totalSegments: outputFiles.length + queue.length + 1,
      durationSec: Math.round(segDuration * 10) / 10,
      sizeBytes: buffer.byteLength,
    };
    outputFiles.push(item);
    options?.onSegmentComplete?.(item, item.index);
  }

  // Final names and numbering, now that the number of parts is known.
  const total = outputFiles.length;
  const named = outputFiles.map((o, k) => ({
    ...o,
    index: k + 1,
    totalSegments: total,
    file: new File([o.file], total > 1 ? `${base}-${k + 1}of${total}.mp4` : `${base}.mp4`, { type: 'video/mp4' }),
  }));

  onProgress?.({ phase: 'mux', segmentIndex: total, segmentCount: total, ratio: 1 });
  return named;
}
