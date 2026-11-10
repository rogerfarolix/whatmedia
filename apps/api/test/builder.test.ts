import { describe, it, expect } from 'vitest';
import { buildFfmpegArgs } from '../src/ffmpeg/builder.js';

describe('buildFfmpegArgs', () => {
  it('builds standard SDR video conversion arguments with faststart', () => {
    const args = buildFfmpegArgs({
      inputPath: '/data/jobs/job1/input.mp4',
      outputPath: '/data/jobs/job1/output_01.mp4',
      startSec: 0,
      durationSec: 60,
      width: 1080,
      height: 1920,
      fps: 30,
      videoBitrateBps: 5_000_000,
      audioBitrateBps: 128_000,
      needsToneMap: false,
    });

    expect(args).toContain('-i');
    expect(args).toContain('/data/jobs/job1/input.mp4');
    expect(args).toContain('-ss');
    expect(args).toContain('0');
    expect(args).toContain('-t');
    expect(args).toContain('60');
    expect(args).toContain('-c:v');
    expect(args).toContain('libx264');
    expect(args).toContain('-b:v');
    expect(args).toContain('5000k');
    expect(args).toContain('-b:a');
    expect(args).toContain('128k');
    expect(args).toContain('+faststart');
    expect(args[args.length - 1]).toBe('/data/jobs/job1/output_01.mp4');
  });

  it('includes tone mapping filter when needsToneMap is true', () => {
    const args = buildFfmpegArgs({
      inputPath: '/data/jobs/job2/input.mov',
      outputPath: '/data/jobs/job2/output_01.mp4',
      startSec: 0,
      durationSec: 30,
      width: 1080,
      height: 1920,
      fps: 30,
      videoBitrateBps: 4_000_000,
      audioBitrateBps: 128_000,
      needsToneMap: true,
    });

    const vfIndex = args.indexOf('-vf');
    expect(vfIndex).toBeGreaterThan(-1);
    expect(args[vfIndex + 1]).toContain('tonemap=hable');
    expect(args[vfIndex + 1]).toContain('zscale=p=bt709');
  });

  it('includes crop when fit is cover', () => {
    const args = buildFfmpegArgs({
      inputPath: '/data/jobs/job3/input.mp4',
      outputPath: '/data/jobs/job3/output_01.mp4',
      startSec: 0,
      durationSec: 15,
      width: 1080,
      height: 1920,
      fps: 30,
      videoBitrateBps: 4_000_000,
      audioBitrateBps: 128_000,
      fit: 'cover',
    });

    const vfIndex = args.indexOf('-vf');
    expect(args[vfIndex + 1]).toContain('crop=1080:1920');
  });
});

