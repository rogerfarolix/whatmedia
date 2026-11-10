import { describe, it, expect } from 'vitest';
import { whatsappLimits } from '@whatmedia/config';
import { plan, fitInBox } from '../src/plan.js';
import { outputBaseName } from '../src/types.js';
import type { MediaInfo, Capabilities } from '../src/types.js';

const mockCaps: Capabilities = {
  webcodecs: true,
  hevcDecode: true,
  avcEncode: true,
  avcEncode720: true,
  aacEncode: true,
  opfs: true,
  webShare: true,
  webShareFiles: true,
  wasm: true,
  sharedArrayBuffer: true,
};

const video = (over: Partial<MediaInfo>): MediaInfo => ({
  kind: 'video',
  container: 'mp4',
  durationSec: 20,
  width: 1080,
  height: 1920,
  rotation: 0,
  fps: 30,
  videoCodec: 'avc1',
  hdr: 'none',
  sizeBytes: 10_000_000,
  ...over,
});

const budgetBits = (whatsappLimits.maxMediaBytes - whatsappLimits.safetyMarginBytes) * 8;

/** Estimated output size of the longest segment, bytes */
function estimatedBytes(p: ReturnType<typeof plan>): number {
  const longest = p.segments.reduce((m, s) => Math.max(m, s.endSec - s.startSec), 0);
  return ((p.video!.bitrate + (p.audio?.bitrate ?? 0)) * longest) / 8;
}

describe('fitInBox()', () => {
  it('keeps portrait sources inside a portrait box', () => {
    expect(fitInBox(2160, 3840, 1080, 1920)).toEqual({ width: 1080, height: 1920 });
  });

  it('matches the long side for landscape sources instead of squeezing them', () => {
    expect(fitInBox(3840, 2160, 1080, 1920)).toEqual({ width: 1920, height: 1080 });
  });

  it('never upscales', () => {
    expect(fitInBox(640, 360, 1080, 1920)).toEqual({ width: 640, height: 360 });
  });

  it('always returns even dimensions', () => {
    const r = fitInBox(1001, 1777, 1080, 1920);
    expect(r.width % 2).toBe(0);
    expect(r.height % 2).toBe(0);
  });
});

describe('plan() pure decision engine', () => {
  it('creates single segment plan for video under maxStatusVideoSec', () => {
    const p = plan(video({ durationSec: 42, videoCodec: 'hvc1' }), 'status-hd', mockCaps);

    expect(p.engine).toBe('webcodecs');
    expect(p.segments).toHaveLength(1);
    expect(p.segments[0]?.startSec).toBe(0);
    expect(p.segments[0]?.endSec).toBe(42);
    expect(p.video?.width).toBe(1080);
    expect(p.video?.height).toBe(1920);
    expect(p.video?.fps).toBe(30);
    expect(p.video?.toneMap).toBe(false);
  });

  it('always sets a fit mode (Mediabunny requires it when width and height are both set)', () => {
    for (const presetId of ['status-hd', 'status-light', 'chat-hd', 'chat-compact'] as const) {
      const p = plan(video({ width: 1920, height: 1080 }), presetId, mockCaps);
      expect(p.video?.fit, presetId).toBeDefined();
    }
  });

  it('keeps landscape videos landscape at full preset resolution', () => {
    const p = plan(video({ width: 3840, height: 2160 }), 'status-hd', mockCaps);
    expect(p.video?.width).toBe(1920);
    expect(p.video?.height).toBe(1080);
    expect(p.video?.fit).toBe('contain');
  });

  it('splits long videos into equal segments and prevents tiny trailing segment (<5s)', () => {
    const p = plan(video({ durationSec: 63, fps: 60, hdr: 'hlg' }), 'status-hd', mockCaps);

    expect(p.segments).toHaveLength(2);
    expect(p.segments[0]?.endSec).toBe(31.5);
    expect(p.segments[1]?.startSec).toBe(31.5);
    expect(p.segments[1]?.endSec).toBe(63);
    expect(p.video?.fps).toBe(30);
    expect(p.video?.toneMap).toBe(true);
    expect(p.notes).toContain('hdr-converted');
  });

  it('honours the 30 s segment choice and ends exactly at the source duration', () => {
    const p = plan(video({ durationSec: 75 }), 'status-hd', mockCaps, { segmentDurationSec: 30 });
    expect(p.segmentSec).toBe(30);
    expect(p.segments.map((s) => [s.startSec, s.endSec])).toEqual([
      [0, 30],
      [30, 60],
      [60, 75],
    ]);
  });

  it('ignores segment durations not allowed by WhatsApp limits', () => {
    const p = plan(video({ durationSec: 200 }), 'status-hd', mockCaps, { segmentDurationSec: 45 });
    expect(p.segmentSec).toBe(whatsappLimits.maxStatusVideoSec);
  });

  it('keeps every segment within the WhatsApp size budget', () => {
    for (const s of [30, 60, 90]) {
      const p = plan(video({ durationSec: 300, audioBitrate: 256_000 }), 'status-hd', mockCaps, {
        segmentDurationSec: s,
      });
      expect(estimatedBytes(p)).toBeLessThanOrEqual(budgetBits / 8);
    }
  });

  it('reserves the source audio bitrate for passthrough', () => {
    const p = plan(video({ audioBitrate: 256_000 }), 'status-hd', mockCaps);
    expect(p.audio?.bitrate).toBe(256_000);
  });

  it('falls back to 720p if bitrate budget is constrained below minimum', () => {
    const p = plan(video({ durationSec: 180 }), 'status-hd', mockCaps, { segmentDurationSec: 90 });
    expect(p.video?.width).toBe(720);
    expect(p.video?.height).toBe(1280);
    expect(p.notes).toContain('resolution-reduced');
    expect(estimatedBytes(p)).toBeLessThanOrEqual(budgetBits / 8);
  });

  it('suggests shorter segments when 60 s segments are budget-capped', () => {
    const p = plan(video({ durationSec: 120 }), 'status-hd', mockCaps, { segmentDurationSec: 60 });
    expect(p.notes).toContain('shorter-segments-sharper');
  });

  it('handles image presets with aspect ratio preserved', () => {
    const p = plan(
      { kind: 'image', container: 'heic', width: 3000, height: 4000, rotation: 0, hdr: 'none', sizeBytes: 5e6 },
      'status-photo',
      mockCaps,
    );
    expect(p.image?.quality).toBe(0.9);
    expect(p.image!.width).toBeLessThanOrEqual(1440);
    expect(p.image!.height).toBeLessThanOrEqual(2560);
    expect(p.image!.width / p.image!.height).toBeCloseTo(0.75, 2);
  });

  it('uses the server engine when WebCodecs is unavailable (ffmpeg.wasm rejected in spike S3)', () => {
    const p = plan(video({ durationSec: 25 }), 'status-hd', { ...mockCaps, webcodecs: false });
    expect(p.engine).toBe('server');
  });

  it('keeps short chat videos in one file', () => {
    const p = plan(video({ durationSec: 45, width: 1920, height: 1080 }), 'chat-hd', mockCaps);
    expect(p.segments).toHaveLength(1);
    expect(p.video?.width).toBe(1920);
  });

  it('splits chat videos that cannot fit 16 MB at an acceptable bitrate', () => {
    const p = plan(video({ durationSec: 600, width: 1920, height: 1080 }), 'chat-compact', mockCaps);
    expect(p.segments.length).toBeGreaterThan(1);
    expect(p.notes).toContain('split-for-size');
    expect(p.segments.at(-1)?.endSec).toBe(600);
    expect(estimatedBytes(p)).toBeLessThanOrEqual(budgetBits / 8);
    expect(p.video?.width).toBeLessThanOrEqual(1280);
  });

  it('applies crop916 with fit cover and a 9:16 output, without upscaling', () => {
    const p = plan(video({ width: 1920, height: 1080 }), 'status-hd', mockCaps, { crop916: true });
    expect(p.video?.fit).toBe('cover');
    expect(p.video?.height).toBe(1080);
    expect(p.video!.width / p.video!.height).toBeCloseTo(9 / 16, 1);
  });

  it('crops 4K landscape to full 1080×1920', () => {
    const p = plan(video({ width: 3840, height: 2160 }), 'status-hd', mockCaps, { crop916: true });
    expect(p.video?.width).toBe(1080);
    expect(p.video?.height).toBe(1920);
  });
});

describe('landing page example (apps/web HomePage)', () => {
  // The home page shows this table; keep it in sync with plan().
  const iphone = video({ durationSec: 150, width: 2160, height: 3840, hdr: 'hlg' });
  it.each([
    [30, 5, 1080, 3.9],
    [60, 3, 1080, 1.8],
    [90, 2, 720, 1.1],
  ])('%i s parts -> %i parts, %ip wide, %f Mbit/s', (seg, parts, width, mbps) => {
    const p = plan(iphone, 'status-hd', mockCaps, { segmentDurationSec: seg });
    expect(p.segments).toHaveLength(parts);
    expect(p.video?.width).toBe(width);
    expect(Math.floor((p.video!.bitrate / 1e6) * 10) / 10).toBe(mbps);
  });
});

describe('outputBaseName()', () => {
  it('derives a safe name from the source', () => {
    expect(outputBaseName('IMG_1234.MOV')).toBe('whatmedia-IMG_1234');
    expect(outputBaseName('Vacances été 2026!.mp4')).toBe('whatmedia-Vacances-ete-2026');
    expect(outputBaseName(undefined)).toBe('whatmedia');
  });
});
