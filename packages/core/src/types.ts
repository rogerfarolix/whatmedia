export interface MediaInfo {
  kind: 'video' | 'image';
  container: string;
  durationSec?: number;
  /** Display width (rotation already applied) */
  width: number;
  /** Display height (rotation already applied) */
  height: number;
  rotation: 0 | 90 | 180 | 270;
  fps?: number;
  videoCodec?: string;
  audioCodec?: string;
  /** Source audio bitrate in bits/s when known (used to budget audio passthrough) */
  audioBitrate?: number;
  hdr: 'none' | 'hlg' | 'pq' | 'dolby-vision';
  sizeBytes: number;
}

export type EngineType = 'webcodecs' | 'ffmpeg-wasm' | 'server';

/**
 * Machine-readable notes explaining decisions taken by plan(), translated by the UI.
 * - `resolution-reduced`: the bitrate budget was too low for the preset resolution, fell back to 720p
 * - `split-for-size`: a chat video was split so each part stays under the WhatsApp size limit
 * - `shorter-segments-sharper`: shorter status segments would give a higher bitrate
 * - `hdr-converted`: HDR source, colours will be converted to SDR (BT.709)
 */
export type PlanNote =
  | 'resolution-reduced'
  | 'split-for-size'
  | 'shorter-segments-sharper'
  | 'hdr-converted';

export interface Plan {
  preset: string;
  engine: EngineType;
  segments: {
    startSec: number;
    endSec: number;
    targetBytes: number;
  }[];
  video?: {
    width: number;
    height: number;
    fps: number;
    bitrate: number;
    codec: string;
    toneMap: boolean;
    keyframeIntervalSec?: number;
    fit?: 'cover' | 'contain' | 'fill';
  };
  audio?: {
    mode: 'passthrough' | 'encode';
    bitrate?: number;
  };
  image?: {
    width: number;
    height: number;
    quality: number;
  };
  /** Segment duration actually used for statuses (seconds), when segmented */
  segmentSec?: number;
  notes?: PlanNote[];
}

export interface Capabilities {
  webcodecs: boolean;
  hevcDecode: boolean;
  avcEncode: boolean;
  avcEncode720: boolean;
  aacEncode: boolean;
  opfs: boolean;
  webShare: boolean;
  webShareFiles: boolean;
  wasm: boolean;
  sharedArrayBuffer: boolean;
}

export interface Progress {
  phase: 'probe' | 'decode' | 'transform' | 'encode' | 'mux';
  segmentIndex: number;
  segmentCount: number;
  ratio: number;
  estimatedRemainingMs?: number;
}

export interface OutputFile {
  file: File;
  index: number;
  totalSegments: number;
  durationSec: number;
  sizeBytes: number;
}

/** Error codes surfaced by the engines (see docs/03-PIPELINE-MEDIA.md §9) */
export type MediaErrorCode =
  | 'E_ABORTED'
  | 'E_UNSUPPORTED_CODEC'
  | 'E_UNSUPPORTED_IMAGE'
  | 'E_TOO_LARGE'
  | 'E_MUX'
  | 'E_CANVAS'
  | 'E_UNKNOWN';

export class MediaError extends Error {
  readonly code: MediaErrorCode;
  partialOutputs?: OutputFile[];

  constructor(code: MediaErrorCode, message?: string) {
    super(`${code}: ${message ?? code}`);
    this.name = 'MediaError';
    this.code = code;
  }
}

/** Builds a safe, short output base name from a source file name ("IMG_1234.MOV" → "IMG_1234") */
export function outputBaseName(sourceName: string | undefined): string {
  const raw = (sourceName ?? '').replace(/\.[^.]+$/, '');
  const safe = raw
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  return safe ? `whatmedia-${safe}` : 'whatmedia';
}
