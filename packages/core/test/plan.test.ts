import { describe, it, expect } from 'vitest';
import { plan } from '../src/plan.js';
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

describe('plan() pure decision engine', () => {
  it('creates single segment plan for video under maxStatusVideoSec', () => {
    const info: MediaInfo = {
      kind: 'video',
      container: 'mp4',
      durationSec: 42,
      width: 1080,
      height: 1920,
      rotation: 0,
      fps: 30,
      videoCodec: 'hvc1',
      hdr: 'none',
      sizeBytes: 15_000_000,
    };

    const p = plan(info, 'status-hd', mockCaps);

    expect(p.engine).toBe('webcodecs');
    expect(p.segments).toHaveLength(1);
    expect(p.segments[0]?.startSec).toBe(0);
    expect(p.segments[0]?.endSec).toBe(42);
    expect(p.video?.width).toBe(1080);
    expect(p.video?.height).toBe(1920);
    expect(p.video?.fps).toBe(30);
    expect(p.video?.toneMap).toBe(false);
  });

  it('splits long videos into equal segments and prevents tiny trailing segment (<5s)', () => {
    // 63s video: naive 60s split gives [0-60, 60-63], remainder 3s is < 5s
    // splitting logic must redistribute evenly: 63 / 2 = 31.5s each
    const info: MediaInfo = {
      kind: 'video',
      container: 'mov',
      durationSec: 63,
      width: 1080,
      height: 1920,
      rotation: 0,
      fps: 60,
      videoCodec: 'hvc1',
      hdr: 'hlg',
      sizeBytes: 85_000_000,
    };

    const p = plan(info, 'status-hd', mockCaps);

    expect(p.segments).toHaveLength(2);
    expect(p.segments[0]?.startSec).toBe(0);
    expect(p.segments[0]?.endSec).toBe(31.5);
    expect(p.segments[1]?.startSec).toBe(31.5);
    expect(p.segments[1]?.endSec).toBe(63);
    // 60fps should be capped at 30fps preset target
    expect(p.video?.fps).toBe(30);
    // HLG requires tone mapping
    expect(p.video?.toneMap).toBe(true);
  });

  it('falls back to 720p if bitrate budget is constrained below minimum', () => {
    // 120s video with 90s segment duration forced -> high duration per segment
    // budget 15.5MB / 90s = ~1.37 Mbps -> below status-hd minBps (1.5Mbps)
    const info: MediaInfo = {
      kind: 'video',
      container: 'mp4',
      durationSec: 180,
      width: 1080,
      height: 1920,
      rotation: 0,
      fps: 30,
      videoCodec: 'avc1',
      hdr: 'none',
      sizeBytes: 150_000_000,
    };

    const p = plan(info, 'status-hd', mockCaps, { segmentDurationSec: 90 });

    // Must fall back to 720p
    expect(p.video?.width).toBe(720);
    expect(p.video?.height).toBe(1280);
  });

  it('handles image presets with aspect ratio preserved', () => {
    const info: MediaInfo = {
      kind: 'image',
      container: 'heic',
      width: 3000,
      height: 4000,
      rotation: 0,
      hdr: 'none',
      sizeBytes: 5_000_000,
    };

    const p = plan(info, 'status-photo', mockCaps);

    expect(p.image).toBeDefined();
    expect(p.image?.quality).toBe(0.9);
    // Scale down keeping 3:4 ratio bounded by 1440x2560
    expect(p.image!.width).toBeLessThanOrEqual(1440);
    expect(p.image!.height).toBeLessThanOrEqual(2560);
  });

  it('falls back to ffmpeg-wasm or server when WebCodecs is unavailable', () => {
    const info: MediaInfo = {
      kind: 'video',
      container: 'mp4',
      durationSec: 25,
      width: 1080,
      height: 1920,
      rotation: 0,
      fps: 30,
      videoCodec: 'avc1',
      hdr: 'none',
      sizeBytes: 10_000_000,
    };

    const noWebCodecsCaps: Capabilities = {
      ...mockCaps,
      webcodecs: false,
    };

    const p = plan(info, 'status-hd', noWebCodecsCaps);
    expect(p.engine).toBe('ffmpeg-wasm');

    const noWasmCaps: Capabilities = {
      ...noWebCodecsCaps,
      wasm: false,
    };
    const pServer = plan(info, 'status-hd', noWasmCaps);
    expect(pServer.engine).toBe('server');
  });

  it('handles chat-compact preset with single segment and reduced bitrate', () => {
    const info: MediaInfo = {
      kind: 'video',
      container: 'mp4',
      durationSec: 120, // 2 minutes
      width: 1920,
      height: 1080,
      rotation: 0,
      fps: 30,
      videoCodec: 'avc1',
      hdr: 'none',
      sizeBytes: 50_000_000,
    };

    const p = plan(info, 'chat-compact', mockCaps);
    expect(p.preset).toBe('chat-compact');
    expect(p.segments).toHaveLength(1);
    expect(p.segments[0]?.durationSec ?? (p.segments[0]!.endSec - p.segments[0]!.startSec)).toBe(120);
    expect(p.video?.width).toBeLessThanOrEqual(720);
  });

  it('applies crop916 option with fit: cover to full-screen 9:16 vertical target', () => {
    const info: MediaInfo = {
      kind: 'video',
      container: 'mp4',
      durationSec: 20,
      width: 1920,
      height: 1080, // Landscape
      rotation: 0,
      fps: 30,
      videoCodec: 'avc1',
      hdr: 'none',
      sizeBytes: 15_000_000,
    };

    const p = plan(info, 'status-hd', mockCaps, { crop916: true });
    expect(p.video?.fit).toBe('cover');
    expect(p.video?.width).toBe(1080);
    expect(p.video?.height).toBe(1920);
  });
});

