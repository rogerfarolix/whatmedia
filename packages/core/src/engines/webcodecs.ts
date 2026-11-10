import { Input, Output, BlobSource, BufferTarget, Mp4OutputFormat, Conversion, ALL_FORMATS } from 'mediabunny';
import type { Plan, OutputFile, Progress } from '../types.js';

export interface RunOptions {
  signal?: AbortSignal;
  onProgress?: (p: Progress) => void;
  onSegmentComplete?: (output: OutputFile, segmentIndex: number) => void;
}

/**
 * Executes the WebCodecs media conversion pipeline:
 * 1. Read input through Mediabunny stream
 * 2. Transcode / split per segment defined in Plan
 * 3. Encode video to H.264 (AVC) and mux into MP4
 * 4. Yield resulting OutputFile array
 */
export async function runWebCodecs(
  file: File | Blob,
  plan: Plan,
  options?: RunOptions,
): Promise<OutputFile[]> {
  const { signal, onProgress } = options ?? {};
  const outputFiles: OutputFile[] = [];

  if (signal?.aborted) {
    throw new Error('E_ABORTED: Processing aborted by user');
  }

  const segmentCount = plan.segments.length;

  for (let i = 0; i < segmentCount; i++) {
    if (signal?.aborted) {
      const abortErr = new Error('E_ABORTED: Processing aborted by user');
      (abortErr as Error & { partialOutputs?: OutputFile[] }).partialOutputs = outputFiles;
      throw abortErr;
    }

    const seg = plan.segments[i];
    if (!seg) continue;

    onProgress?.({
      phase: 'encode',
      segmentIndex: i + 1,
      segmentCount,
      ratio: i / segmentCount,
    });

    const source = new BlobSource(file);
    const input = new Input({ source, formats: ALL_FORMATS });

    const target = new BufferTarget();
    const outputFormat = new Mp4OutputFormat({ fastStart: 'in-memory' });
    const output = new Output({
      format: outputFormat,
      target,
    });

    const width = plan.video?.width ?? 1080;
    const height = plan.video?.height ?? 1920;
    const bitrate = plan.video?.bitrate ?? 5_000_000;
    const fps = plan.video?.fps ?? 30;

    const conversion = await Conversion.init({
      input,
      output,
      video: {
        codec: 'avc',
        width,
        height,
        bitrate,
        frameRate: fps,
      },
      trim: {
        start: seg.startSec,
        end: seg.endSec,
      },
    });

    conversion.onProgress = (progressRatio: number) => {
      onProgress?.({
        phase: 'encode',
        segmentIndex: i + 1,
        segmentCount,
        ratio: (i + progressRatio) / segmentCount,
      });
    };

    if (signal) {
      signal.addEventListener(
        'abort',
        () => {
          conversion.cancel();
        },
        { once: true },
      );
    }

    try {
      await conversion.execute();
    } catch (err: unknown) {
      if (signal?.aborted) {
        const abortErr = new Error('E_ABORTED: Processing aborted by user');
        (abortErr as Error & { partialOutputs?: OutputFile[] }).partialOutputs = outputFiles;
        throw abortErr;
      }
      throw err;
    }

    const buffer = target.buffer;
    if (!buffer) {
      throw new Error(`E_MUX: Segment ${i + 1} produced no data`);
    }

    const durationSec = Math.round((seg.endSec - seg.startSec) * 10) / 10;
    const segNum = String(i + 1).padStart(2, '0');
    const segTotal = String(segmentCount).padStart(2, '0');
    const outFileName = `whatmedia-${segNum}of${segTotal}.mp4`;

    const outBlob = new Blob([buffer], { type: 'video/mp4' });
    const outFile = new File([outBlob], outFileName, { type: 'video/mp4' });

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

  onProgress?.({
    phase: 'mux',
    segmentIndex: segmentCount,
    segmentCount,
    ratio: 1,
  });

  return outputFiles;
}
