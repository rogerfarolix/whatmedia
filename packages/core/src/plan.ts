import type { PresetId, Preset, VideoPreset, ImagePreset } from '@whatmedia/config';
import { presets, whatsappLimits } from '@whatmedia/config';
import type { MediaInfo, Capabilities, Plan } from './types.js';

export interface PlanOverrides {
  segmentDurationSec?: number;
  targetBps?: number;
  width?: number;
  height?: number;
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

  // Handle Photo Presets
  if (info.kind === 'image' || selectedPreset.kind === 'image') {
    const imgPreset: ImagePreset =
      selectedPreset.kind === 'image'
        ? selectedPreset
        : (presets['status-photo'] as ImagePreset);

    const maxW = imgPreset.image.width;
    const maxH = imgPreset.image.height;

    let targetW = info.width;
    let targetH = info.height;

    // Scale down if larger than preset bounds while preserving aspect ratio
    if (targetW > maxW || targetH > maxH) {
      const scale = Math.min(maxW / targetW, maxH / targetH);
      targetW = Math.round(targetW * scale);
      targetH = Math.round(targetH * scale);
    }

    return {
      preset: presetId,
      engine: 'webcodecs', // Can be performed via OffscreenCanvas
      segments: [
        {
          startSec: 0,
          endSec: 0,
          targetBytes: whatsappLimits.maxMediaBytes - whatsappLimits.safetyMarginBytes,
        },
      ],
      image: {
        width: targetW,
        height: targetH,
        quality: imgPreset.image.quality,
      },
    };
  }

  // Handle Video Presets
  const vidPreset: VideoPreset =
    selectedPreset.kind === 'video'
      ? selectedPreset
      : (presets['status-hd'] as VideoPreset);

  const duration = info.durationSec ?? 0;

  // 1. Determine engine
  let engine: Plan['engine'] = 'webcodecs';
  if (!caps.webcodecs || !caps.avcEncode) {
    if (caps.wasm) {
      engine = 'ffmpeg-wasm';
    } else {
      engine = 'server';
    }
  }

  // 2. Determine Segment Duration S
  // WhatsApp limits: allowedStatusVideoSec = [30, 60, 90]
  let segmentDurationSec = overrides?.segmentDurationSec ?? vidPreset.segmentSec ?? whatsappLimits.maxStatusVideoSec;
  if (!whatsappLimits.allowedStatusVideoSec.includes(segmentDurationSec)) {
    segmentDurationSec = whatsappLimits.maxStatusVideoSec;
  }

  // For chat preset (chat-hd), segmentSec is null (single full video)
  const isSegmented = vidPreset.id !== 'chat-hd';

  const segments: Plan['segments'] = [];
  if (!isSegmented || duration <= segmentDurationSec) {
    segments.push({
      startSec: 0,
      endSec: duration,
      targetBytes: whatsappLimits.maxMediaBytes - whatsappLimits.safetyMarginBytes,
    });
  } else {
    // Splitting logic: N = ceil(duration / S)
    // If the last segment is < 5s, redistribute evenly across segments
    const count = Math.ceil(duration / segmentDurationSec);
    const lastRemainder = duration - (count - 1) * segmentDurationSec;

    let effectiveSegmentSec = segmentDurationSec;
    if (lastRemainder > 0 && lastRemainder < 5 && count > 1) {
      // Redistribute evenly
      effectiveSegmentSec = duration / count;
    }

    for (let i = 0; i < count; i++) {
      const start = i * effectiveSegmentSec;
      const end = Math.min(duration, (i + 1) * effectiveSegmentSec);
      segments.push({
        startSec: Math.round(start * 1000) / 1000,
        endSec: Math.round(end * 1000) / 1000,
        targetBytes: whatsappLimits.maxMediaBytes - whatsappLimits.safetyMarginBytes,
      });
    }
  }

  // 3. Bitrate & Resolution calculation
  const maxSegmentLen = segments.reduce((max, s) => Math.max(max, s.endSec - s.startSec), 1);
  const budgetBytes = whatsappLimits.maxMediaBytes - whatsappLimits.safetyMarginBytes;
  const audioBps = vidPreset.audio.bitrate;

  // Max video bps to stay under WhatsApp 16MB file limit
  const overheadBps = 100_000; // ~100kbps container overhead safety
  const maxVideoBps = Math.floor((budgetBytes * 8) / maxSegmentLen) - audioBps - overheadBps;

  let targetVideoBps = overrides?.targetBps ?? vidPreset.video.targetBps;
  targetVideoBps = Math.min(targetVideoBps, maxVideoBps);

  let targetWidth = vidPreset.video.width;
  let targetHeight = vidPreset.video.height;

  // If video bitrate budget is constrained below preset minBps, fall back to 720p
  if (targetVideoBps < vidPreset.video.minBps && targetWidth > 720) {
    const lightPreset = presets['status-light'] as VideoPreset;
    targetWidth = lightPreset.video.width;
    targetHeight = lightPreset.video.height;
    targetVideoBps = Math.max(lightPreset.video.minBps, targetVideoBps);
  }

  // Never upscale resolution beyond source
  if (info.width > 0 && info.height > 0) {
    if (targetWidth > info.width && targetHeight > info.height) {
      targetWidth = info.width % 2 === 0 ? info.width : info.width - 1;
      targetHeight = info.height % 2 === 0 ? info.height : info.height - 1;
    }
  }

  // Ensure dimensions are even (divisible by 2)
  targetWidth = targetWidth % 2 === 0 ? targetWidth : targetWidth - 1;
  targetHeight = targetHeight % 2 === 0 ? targetHeight : targetHeight - 1;

  // Never upscale fps beyond source
  const targetFps = info.fps ? Math.min(info.fps, vidPreset.video.fps) : vidPreset.video.fps;

  // HDR tone-mapping requirement
  const needsToneMap = info.hdr !== 'none';

  return {
    preset: presetId,
    engine,
    segments,
    video: {
      width: targetWidth,
      height: targetHeight,
      fps: targetFps,
      bitrate: targetVideoBps,
      codec: vidPreset.video.codec,
      toneMap: needsToneMap,
    },
    audio: {
      mode: 'passthrough', // default passthrough for AAC
      bitrate: audioBps,
    },
  };
}
