export interface MediaInfo {
  kind: 'video' | 'image';
  container: string;
  durationSec?: number;
  width: number;
  height: number;
  rotation: 0 | 90 | 180 | 270;
  fps?: number;
  videoCodec?: string;
  audioCodec?: string;
  hdr: 'none' | 'hlg' | 'pq' | 'dolby-vision';
  sizeBytes: number;
}

export type EngineType = 'webcodecs' | 'ffmpeg-wasm' | 'server';

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

