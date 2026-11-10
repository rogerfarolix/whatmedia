import { Input, BlobSource, ALL_FORMATS, InputVideoTrack } from 'mediabunny';
import type { MediaInfo } from './types.js';

/**
 * Analyzes an input File or Blob to extract container, codec, resolution,
 * rotation, fps, duration, and HDR characteristics.
 */
export async function probe(file: File | Blob): Promise<MediaInfo> {
  const isImage = file.type.startsWith('image/');
  const fileName = 'name' in file ? file.name.toLowerCase() : '';
  const container = file.type.split('/')[1] || fileName.split('.').pop() || 'unknown';

  // Handle Photo probing
  if (isImage) {
    let width = 0;
    let height = 0;

    if (typeof createImageBitmap === 'function') {
      try {
        const bitmap = await createImageBitmap(file);
        width = bitmap.width;
        height = bitmap.height;
        bitmap.close();
      } catch {
        // Fallback
      }
    }

    return {
      kind: 'image',
      container,
      width,
      height,
      rotation: 0,
      hdr: 'none',
      sizeBytes: file.size,
    };
  }

  // Handle Video probing using Mediabunny demuxer
  let durationSec = 0;
  let width = 0;
  let height = 0;
  let rotation: 0 | 90 | 180 | 270 = 0;
  let fps = 30;
  let videoCodec: string | undefined;
  let audioCodec: string | undefined;
  let audioBitrate: number | undefined;
  let hdr: MediaInfo['hdr'] = 'none';

  try {
    const source = new BlobSource(file);
    const input = new Input({ source, formats: ALL_FORMATS });

    const tracks = await input.getTracks();
    const videoTrack = tracks.find((t) => t.isVideoTrack()) as InputVideoTrack | undefined;
    const audioTrack = tracks.find((t) => t.isAudioTrack());

    if (videoTrack) {
      width = videoTrack.displayWidth ?? videoTrack.codedWidth ?? 0;
      height = videoTrack.displayHeight ?? videoTrack.codedHeight ?? 0;
      videoCodec = (await videoTrack.getCodec()) ?? undefined;
      durationSec = (await videoTrack.computeDuration()) ?? (await input.computeDuration()) ?? 0;

      // Extract rotation if encoded in track metadata
      const rawRotation = videoTrack.rotation ?? 0;
      if (rawRotation === 90 || rawRotation === 180 || rawRotation === 270) {
        rotation = rawRotation;
      }

      // Detect HDR from the colour transfer characteristics (HLG vs PQ), then Dolby Vision
      try {
        const colorSpace = await videoTrack.getColorSpace();
        const transfer = String(colorSpace.transfer ?? '');
        if (transfer === 'hlg' || transfer === 'arib-std-b67') hdr = 'hlg';
        else if (transfer === 'pq' || transfer === 'smpte2084') hdr = 'pq';
        else if (await videoTrack.hasHighDynamicRange()) hdr = 'hlg';
      } catch {
        // Colour metadata unavailable: assume SDR
      }
      if (videoCodec?.startsWith('dvh1') || videoCodec?.startsWith('dvhe')) {
        hdr = 'dolby-vision';
      }

      // Frame rate metrics
      try {
        const metrics = await videoTrack.computeFrameRateMetrics();
        if (metrics && metrics.averageFrameRate > 0) {
          fps = Math.round(metrics.averageFrameRate);
        }
      } catch {
        // Keep default 30
      }
    }

    if (audioTrack) {
      const aCodec = await audioTrack.getCodec();
      audioCodec = aCodec ?? undefined;
      try {
        const bps = await audioTrack.getBitrate();
        if (bps && bps > 0) audioBitrate = Math.round(bps);
      } catch {
        // Unknown bitrate: plan() budgets the preset's audio bitrate
      }
    }
  } catch {
    // If mediabunny demuxing fails on special containers, fallback to HTMLVideoElement
    if (typeof document !== 'undefined') {
      try {
        const url = URL.createObjectURL(file);
        const video = document.createElement('video');
        video.preload = 'metadata';

        await new Promise<void>((resolve, reject) => {
          video.onloadedmetadata = () => resolve();
          video.onerror = () => reject(new Error('Video probe failed'));
          video.src = url;
        });

        width = video.videoWidth;
        height = video.videoHeight;
        durationSec = video.duration;
        URL.revokeObjectURL(url);
      } catch {
        // Proceed with fallback values
      }
    }
  }

  return {
    kind: 'video',
    container,
    durationSec: Math.round(durationSec * 100) / 100,
    width,
    height,
    rotation,
    fps,
    videoCodec,
    audioCodec,
    audioBitrate,
    hdr,
    sizeBytes: file.size,
  };
}
