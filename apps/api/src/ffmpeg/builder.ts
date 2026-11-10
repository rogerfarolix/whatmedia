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
  fit?: 'cover' | 'contain';
}

/**
 * Builds safe argument arrays for spawning ffmpeg per segment.
 * NEVER uses shell string execution.
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
    fit,
  } = args;

  const scaleExpr =
    fit === 'cover'
      ? `scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height}`
      : `scale='min(${width},iw)':'min(${height},ih)':force_original_aspect_ratio=decrease:force_divisible_by=2`;

  const videoFilter = needsToneMap
    ? `${scaleExpr},zscale=t=linear:npl=100,format=gbrpf32le,zscale=p=bt709,tonemap=hable:desat=0,zscale=t=bt709:m=bt709:r=tv,format=yuv420p,fps=${fps}`
    : `${scaleExpr},fps=${fps},format=yuv420p`;

  const videoKbp = Math.round(videoBitrateBps / 1000);
  const audioKbp = Math.round(audioBitrateBps / 1000);

  return [
    '-hide_banner',
    '-y',
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
    'high',
    '-level',
    '4.0',
    '-preset',
    'medium',
    '-b:v',
    `${videoKbp}k`,
    '-maxrate',
    `${Math.round(videoKbp * 1.5)}k`,
    '-bufsize',
    `${videoKbp * 2}k`,
    '-g',
    (fps * 2).toString(),
    '-keyint_min',
    fps.toString(),
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
    outputPath,
  ];
}
