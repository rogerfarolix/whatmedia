import type { PresetId, Preset, VideoPreset, ImagePreset } from '@whatmedia/config';
import { presets, whatsappLimits } from '@whatmedia/config';
import type { MediaInfo, Capabilities, Plan, PlanNote } from './types.js';

export interface PlanOverrides {
  segmentDurationSec?: number;
  targetBps?: number;
  width?: number;
  height?: number;
  crop916?: boolean;
}

/** Container/muxing overhead reserved in the bitrate budget (bits/s) */
const OVERHEAD_BPS = 100_000;
/** Absolute floor so a pathological budget never produces a 0 or negative bitrate */
const ABSOLUTE_MIN_VIDEO_BPS = 200_000;
/** Cap for audio passthrough budgeting (a source above this is unusual for phone video) */
const MAX_PASSTHROUGH_AUDIO_BPS = 320_000;

/** Rounds down to the nearest even integer, minimum 2 (H.264 4:2:0 needs even dimensions) */
function even(n: number): number {
  const r = Math.floor(n);
  return Math.max(2, r - (r % 2));
}

/**
 * Fits a source into a bounding box while preserving aspect ratio, never upscaling.
 * The box is orientation-aware: its long side is matched to the source's long side, so a
 * landscape video keeps its full width (1920×1080) instead of being squeezed into a portrait box.
 */
export function fitInBox(
  srcW: number,
  srcH: number,
  boxW: number,
  boxH: number,
): { width: number; height: number } {
  const boxLong = Math.max(boxW, boxH);
  const boxShort = Math.min(boxW, boxH);

  if (!(srcW > 0) || !(srcH > 0)) {
    return { width: even(boxShort), height: even(boxLong) };
  }

  const landscape = srcW > srcH;
  const bw = landscape ? boxLong : boxShort;
  const bh = landscape ? boxShort : boxLong;
  const scale = Math.min(1, bw / srcW, bh / srcH);

  return { width: even(srcW * scale), height: even(srcH * scale) };
}

/**
 * Pure calculation function that determines the processing plan
 * based on input media analysis, target preset, and client device capabilities.
 */
export function plan(
  info: MediaInfo,
  presetId: PresetId = 'status-hd',
  caps: Capabilities,
  overrides?: Partial<PlanOverrides>,
): Plan {
  const selectedPreset: Preset = presets[presetId] ?? (presets['status-hd'] as Preset);
  const budgetBytes = whatsappLimits.maxMediaBytes - whatsappLimits.safetyMarginBytes;

  // ---------------------------------------------------------------- Photos
  if (info.kind === 'image' || selectedPreset.kind === 'image') {
    const imgPreset: ImagePreset =
      selectedPreset.kind === 'image' ? selectedPreset : (presets['status-photo'] as ImagePreset);

    const { width, height } =
      info.width > 0 && info.height > 0
        ? fitInBox(info.width, info.height, imgPreset.image.width, imgPreset.image.height)
        : { width: imgPreset.image.width, height: imgPreset.image.height };

    return {
      preset: imgPreset.id,
      engine: 'webcodecs', // performed with (Offscreen)Canvas
      segments: [{ startSec: 0, endSec: 0, targetBytes: budgetBytes }],
      image: { width, height, quality: imgPreset.image.quality },
      notes: [],
    };
  }

  // ---------------------------------------------------------------- Videos
  const vidPreset: VideoPreset =
    selectedPreset.kind === 'video' ? selectedPreset : (presets['status-hd'] as VideoPreset);
  const lightPreset = presets['status-light'] as VideoPreset;
  const notes: PlanNote[] = [];
  const duration = Math.max(0, info.durationSec ?? 0);

  // 1. Engine — ffmpeg.wasm was rejected by spike S3, so no WebCodecs means server fallback.
  const canEncodeLocally = caps.webcodecs && (caps.avcEncode || caps.avcEncode720);
  const engine: Plan['engine'] = canEncodeLocally ? 'webcodecs' : 'server';
  const only720 = canEncodeLocally && !caps.avcEncode;

  // 2. Audio budget: passthrough keeps the source bitrate, so reserve whichever is higher.
  const audioBps = Math.max(
    vidPreset.audio.bitrate,
    Math.min(info.audioBitrate ?? 0, MAX_PASSTHROUGH_AUDIO_BPS),
  );
  const bitsPerSecondAt = (videoBps: number) => videoBps + audioBps + OVERHEAD_BPS;
  const floorBps = Math.min(vidPreset.video.minBps, lightPreset.video.minBps);

  // 3. Segmentation
  const isStatus = vidPreset.id.startsWith('status-');
  let segmentSec: number | undefined;
  let partLength: number;

  if (isStatus) {
    let s = overrides?.segmentDurationSec ?? vidPreset.segmentSec ?? whatsappLimits.maxStatusVideoSec;
    if (!whatsappLimits.allowedStatusVideoSec.includes(s)) {
      s = whatsappLimits.maxStatusVideoSec;
    }
    segmentSec = s;
    partLength = s;
  } else {
    // Chat: a single file when it fits at an acceptable bitrate, otherwise equal parts that do.
    const maxLenAtFloor = Math.floor((budgetBytes * 8) / bitsPerSecondAt(floorBps));
    partLength = duration > maxLenAtFloor ? maxLenAtFloor : Math.max(duration, 1);
    if (duration > maxLenAtFloor) notes.push('split-for-size');
  }

  const segments: Plan['segments'] = [];
  if (duration <= partLength) {
    segments.push({ startSec: 0, endSec: duration, targetBytes: budgetBytes });
  } else {
    // N = ceil(duration / S); a trailing part under 5 s is avoided by splitting evenly.
    const count = Math.ceil(duration / partLength);
    const lastRemainder = duration - (count - 1) * partLength;
    const evenSplit = !isStatus || (lastRemainder > 0 && lastRemainder < 5);
    const effective = evenSplit ? duration / count : partLength;

    for (let i = 0; i < count; i++) {
      const start = i * effective;
      const end = i === count - 1 ? duration : Math.min(duration, (i + 1) * effective);
      segments.push({
        startSec: Math.round(start * 1000) / 1000,
        endSec: Math.round(end * 1000) / 1000,
        targetBytes: budgetBytes,
      });
    }
  }

  // 4. Bitrate — the longest part drives the budget.
  const maxSegmentLen = segments.reduce((max, s) => Math.max(max, s.endSec - s.startSec), 1);
  const maxVideoBps = Math.floor((budgetBytes * 8) / maxSegmentLen) - audioBps - OVERHEAD_BPS;

  const requestedBps = overrides?.targetBps ?? vidPreset.video.targetBps;
  let targetVideoBps = Math.min(requestedBps, maxVideoBps);

  if (isStatus && segmentSec !== undefined && segmentSec > 30 && maxVideoBps < vidPreset.video.targetBps) {
    notes.push('shorter-segments-sharper');
  }

  // 5. Resolution box
  let boxW = overrides?.width ?? vidPreset.video.width;
  let boxH = overrides?.height ?? vidPreset.video.height;
  const lightLong = Math.max(lightPreset.video.width, lightPreset.video.height);

  const budgetTooLow = targetVideoBps < vidPreset.video.minBps;
  if ((budgetTooLow || only720) && Math.max(boxW, boxH) > lightLong) {
    boxW = lightPreset.video.width;
    boxH = lightPreset.video.height;
    if (budgetTooLow) notes.push('resolution-reduced');
  }
  targetVideoBps = Math.max(ABSOLUTE_MIN_VIDEO_BPS, targetVideoBps);

  // 6. Output dimensions
  const crop916 = overrides?.crop916 ?? false;
  let width: number;
  let height: number;
  let fit: 'cover' | 'contain';

  if (crop916) {
    // Full-screen vertical 9:16, cropped from the centre. Never upscale: the output height is
    // bounded by the source height, so a 1920×1080 landscape gives 606×1080 real pixels.
    const boxShort = Math.min(boxW, boxH);
    const boxLong = Math.max(boxW, boxH);
    const srcH = info.height > 0 ? info.height : boxLong;
    height = even(Math.min(boxLong, srcH));
    width = even(Math.min(boxShort, (height * 9) / 16));
    fit = 'cover';
  } else {
    ({ width, height } = fitInBox(info.width, info.height, boxW, boxH));
    // Dimensions already match the source aspect ratio, so 'contain' adds no visible bars.
    fit = 'contain';
  }

  // 7. Frame rate — never above the source
  const targetFps =
    info.fps && info.fps > 0 ? Math.min(info.fps, vidPreset.video.fps) : vidPreset.video.fps;

  // 8. HDR
  const toneMap = info.hdr !== 'none';
  if (toneMap) notes.push('hdr-converted');

  return {
    preset: vidPreset.id,
    engine,
    segments,
    segmentSec,
    video: {
      width,
      height,
      fps: targetFps,
      bitrate: Math.round(targetVideoBps),
      codec: vidPreset.video.codec,
      toneMap,
      keyframeIntervalSec: vidPreset.video.keyframeIntervalSec,
      fit,
    },
    audio: {
      mode: 'passthrough',
      bitrate: audioBps,
    },
    notes,
  };
}
