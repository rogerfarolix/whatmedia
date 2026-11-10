import { spawn } from 'node:child_process';
import type { MediaInfo } from '@whatmedia/core';

interface FfprobeStream {
  codec_type?: string;
  codec_name?: string;
  width?: number;
  height?: number;
  avg_frame_rate?: string;
  r_frame_rate?: string;
  bit_rate?: string;
  color_transfer?: string;
  nb_frames?: string;
  tags?: Record<string, string>;
  side_data_list?: { side_data_type?: string; rotation?: number }[];
}

interface FfprobeOutput {
  streams?: FfprobeStream[];
  format?: { format_name?: string; duration?: string; size?: string };
}

const IMAGE_CODECS = new Set(['mjpeg', 'png', 'webp', 'gif', 'bmp', 'tiff', 'jpegxl', 'av1', 'hevc']);

function parseRate(rate: string | undefined): number | undefined {
  if (!rate) return undefined;
  const [n, d] = rate.split('/').map(Number);
  if (!n || !d) return undefined;
  const v = n / d;
  return Number.isFinite(v) && v > 0 && v < 1000 ? v : undefined;
}

/** Runs ffprobe (spawn, no shell) and returns its parsed JSON output */
export function runFfprobe(inputPath: string, timeoutMs = 30_000): Promise<FfprobeOutput> {
  return new Promise((resolve, reject) => {
    const proc = spawn('ffprobe', [
      '-v',
      'error',
      '-print_format',
      'json',
      '-show_format',
      '-show_streams',
      inputPath,
    ]);
    let out = '';
    proc.stdout.on('data', (c: Buffer) => {
      out += c.toString('utf8');
      if (out.length > 5_000_000) proc.kill('SIGKILL');
    });
    const timer = setTimeout(() => proc.kill('SIGKILL'), timeoutMs);
    proc.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
    proc.on('close', (code) => {
      clearTimeout(timer);
      if (code !== 0) return reject(new Error('unreadable media file'));
      try {
        resolve(JSON.parse(out) as FfprobeOutput);
      } catch {
        reject(new Error('unreadable media file'));
      }
    });
  });
}

/** Maps ffprobe output to the MediaInfo used by @whatmedia/core's plan() */
export function toMediaInfo(data: FfprobeOutput, sizeBytes: number, hintKind: 'video' | 'image'): MediaInfo {
  const streams = data.streams ?? [];
  const video = streams.find((s) => s.codec_type === 'video');
  const audio = streams.find((s) => s.codec_type === 'audio');
  if (!video) throw new Error('no video or image stream found');

  const formatName = data.format?.format_name ?? '';
  const duration = Number(data.format?.duration ?? 0) || 0;
  const looksLikeImage =
    /image2|_pipe|webp|png|jpeg/.test(formatName) ||
    (hintKind === 'image' && IMAGE_CODECS.has(video.codec_name ?? '') && !audio && duration < 0.5);
  const kind: MediaInfo['kind'] = hintKind === 'image' || looksLikeImage ? 'image' : 'video';

  const rotationRaw =
    video.side_data_list?.find((d) => d.side_data_type === 'Display Matrix')?.rotation ??
    Number(video.tags?.rotate ?? 0);
  const rot = (((Math.round(rotationRaw / 90) * 90) % 360) + 360) % 360;
  const rotation = (rot === 90 || rot === 180 || rot === 270 ? rot : 0) as MediaInfo['rotation'];
  const swap = rotation === 90 || rotation === 270;
  const w = video.width ?? 0;
  const h = video.height ?? 0;

  const transfer = video.color_transfer ?? '';
  const hasDolby = video.side_data_list?.some((d) => /DOVI/i.test(d.side_data_type ?? '')) ?? false;
  const hdr: MediaInfo['hdr'] =
    transfer === 'arib-std-b67'
      ? 'hlg'
      : transfer === 'smpte2084'
        ? 'pq'
        : hasDolby
          ? 'dolby-vision'
          : 'none';

  const fps = parseRate(video.avg_frame_rate) ?? parseRate(video.r_frame_rate);
  const audioBitrate = Number(audio?.bit_rate ?? 0) || undefined;

  return {
    kind,
    container: formatName.split(',')[0] || 'unknown',
    durationSec: kind === 'video' ? Math.round(duration * 100) / 100 : undefined,
    width: swap ? h : w,
    height: swap ? w : h,
    rotation,
    fps: fps ? Math.round(fps) : undefined,
    videoCodec: video.codec_name,
    audioCodec: audio?.codec_name,
    audioBitrate,
    hdr,
    sizeBytes,
  };
}

/** Checks the first bytes of an upload against the containers we accept (not the extension). */
export function sniffMediaType(head: Buffer): 'video' | 'image' | null {
  if (head.length < 12) return null;
  if (head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) return 'image'; // JPEG
  if (head.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image'; // PNG
  if (head.toString('latin1', 0, 4) === 'RIFF' && head.toString('latin1', 8, 12) === 'WEBP') return 'image';
  if (head.toString('latin1', 4, 8) === 'ftyp') {
    const brand = head.toString('latin1', 8, 12);
    if (/^(heic|heix|hevc|heim|heis|mif1|msf1|avif)$/.test(brand)) return 'image';
    return 'video'; // isom, mp41, mp42, qt  , M4V , 3gp*…
  }
  if (head.readUInt32BE(0) === 0x1a45dfa3) return 'video'; // Matroska / WebM
  return null;
}
