export interface FfmpegSegmentArgs {
  inputPath: string;
  outputPath: string;
  startSec: number;
  durationSec: number;
  width: number;
  height: number;
  fps: number;
  videoBitrateBps: number;
  audioBitrateBps: number;
  needsToneMap?: boolean;
  /** Source transfer characteristic, used to tag the input of the tone-mapping chain */
  hdrTransfer?: 'hlg' | 'pq';
  fit?: 'cover' | 'contain' | 'fill';
  keyframeIntervalSec?: number;
  profile?: 'high' | 'main' | 'baseline';
  level?: string;
  /** Emit machine-readable progress on stdout (-progress pipe:1) */
  progress?: boolean;
}

export interface FfmpegImageArgs {
  inputPath: string;
  outputPath: string;
  width: number;
  height: number;
  /** JPEG quality 0–1 from presets.json, mapped to ffmpeg's -q:v scale */
  quality: number;
}

/**
 * Orientation-aware "fit inside, never upscale" scale expression: the box's long side is applied
 * to the frame's long side, evaluated on the frame actually decoded (after autorotation).
 */
function containScale(width: number, height: number): string {
  const long = Math.max(width, height);
  const short = Math.min(width, height);
  return (
    `scale=w='min(iw,if(gt(iw,ih),${long},${short}))':h='min(ih,if(gt(iw,ih),${short},${long}))'` +
    `:force_original_aspect_ratio=decrease:force_divisible_by=2:flags=lanczos`
  );
}

/**
 * Builds safe argument arrays for spawning ffmpeg per segment.
 * NEVER uses shell string execution; every value comes from presets.json or plan().
 */
export function buildFfmpegArgs(args: FfmpegSegmentArgs): string[] {
  const {
    inputPath,
    outputPath,
    startSec,
    durationSec,
    width,
    height,
    fps,
    videoBitrateBps,
    audioBitrateBps,
    needsToneMap,
    hdrTransfer = 'hlg',
    fit,
    keyframeIntervalSec = 2,
    profile = 'high',
    level = '4.0',
    progress = false,
  } = args;

  const scaleExpr =
    fit === 'cover'
      ? `scale=${width}:${height}:force_original_aspect_ratio=increase:flags=lanczos,crop=${width}:${height}`
      : containScale(width, height);

  // Reference HDR → SDR conversion (docs/03 §5): linearise, BT.2020 → BT.709, Hable tone curve.
  const tin = hdrTransfer === 'pq' ? 'smpte2084' : 'arib-std-b67';
  const toneMap =
    `zscale=tin=${tin}:pin=bt2020:min=bt2020nc:t=linear:npl=100,format=gbrpf32le,` +
    `zscale=p=bt709,tonemap=hable:desat=0,zscale=t=bt709:m=bt709:r=tv,format=yuv420p`;

  const videoFilter = needsToneMap
    ? `${scaleExpr},${toneMap},fps=${fps},setsar=1`
    : `${scaleExpr},fps=${fps},format=yuv420p,setsar=1`;

  const videoKbp = Math.max(1, Math.round(videoBitrateBps / 1000));
  const audioKbp = Math.max(32, Math.round(audioBitrateBps / 1000));
  const gop = Math.max(1, Math.round(fps * keyframeIntervalSec));

  return [
    '-hide_banner',
    '-nostdin',
    '-y',
    ...(progress ? ['-progress', 'pipe:1', '-nostats'] : []),
    '-ss',
    startSec.toString(),
    '-t',
    durationSec.toString(),
    '-i',
    inputPath,
    '-map',
    '0:v:0',
    '-map',
    '0:a:0?',
    '-vf',
    videoFilter,
    '-c:v',
    'libx264',
    '-profile:v',
    profile,
    '-level',
    level,
    '-preset',
    'medium',
    '-b:v',
    `${videoKbp}k`,
    '-maxrate',
    `${Math.round(videoKbp * 1.5)}k`,
    '-bufsize',
    `${videoKbp * 2}k`,
    '-g',
    gop.toString(),
    '-keyint_min',
    gop.toString(),
    '-sc_threshold',
    '0',
    '-color_primaries',
    'bt709',
    '-color_trc',
    'bt709',
    '-colorspace',
    'bt709',
    '-c:a',
    'aac',
    '-b:a',
    `${audioKbp}k`,
    '-ar',
    '48000',
    '-ac',
    '2',
    '-movflags',
    '+faststart',
    '-map_metadata',
    '-1',
    '-map_chapters',
    '-1',
    outputPath,
  ];
}

/**
 * Photo pipeline (docs/03 §7) on the server: decode (HEIC included), fit inside the preset box
 * without upscaling, flatten transparency on white, strip all metadata, write a JPEG.
 */
export function buildImageArgs(args: FfmpegImageArgs): string[] {
  const { inputPath, outputPath, width, height, quality } = args;
  // -q:v 2 (best) … 31 (worst); 0.9 → 4, 1.0 → 2
  const q = Math.min(31, Math.max(2, Math.round(2 + (1 - quality) * 20)));
  const filter =
    `[0:v]${containScale(width, height)},format=rgba[fg];` +
    `[fg]split[a][b];[b]drawbox=c=white:t=fill[bg];[bg][a]overlay=format=auto,format=yuvj420p[out]`;

  return [
    '-hide_banner',
    '-nostdin',
    '-y',
    '-i',
    inputPath,
    '-filter_complex',
    filter,
    '-map',
    '[out]',
    '-frames:v',
    '1',
    '-q:v',
    q.toString(),
    '-map_metadata',
    '-1',
    outputPath,
  ];
}
