import type { Capabilities } from './types.js';

/**
 * Probes the runtime environment to detect video/audio hardware acceleration capabilities,
 * storage (OPFS), sharing capabilities, and WebAssembly availability.
 * Always safe: completely wrapped in try/catch.
 */
export async function detectCapabilities(): Promise<Capabilities> {
  const caps: Capabilities = {
    webcodecs: false,
    hevcDecode: false,
    avcEncode: false,
    avcEncode720: false,
    aacEncode: false,
    opfs: false,
    webShare: false,
    webShareFiles: false,
    wasm: false,
    sharedArrayBuffer: false,
  };

  // 1. WebCodecs API check
  if (typeof globalThis !== 'undefined' && 'VideoDecoder' in globalThis && 'VideoEncoder' in globalThis) {
    caps.webcodecs = true;

    // Check HEVC decoding support
    try {
      const decSupport = await VideoDecoder.isConfigSupported({
        codec: 'hvc1.1.6.L93.B0', // HEVC Main Profile Level 3.1
        codedWidth: 1920,
        codedHeight: 1080,
      });
      caps.hevcDecode = decSupport.supported ?? false;
    } catch {
      caps.hevcDecode = false;
    }

    // Check AVC (H.264 High Profile) 1080p encoding support
    try {
      const encSupport = await VideoEncoder.isConfigSupported({
        codec: 'avc1.640028', // H.264 High Profile Level 4.0
        width: 1080,
        height: 1920,
        bitrate: 5_000_000,
        framerate: 30,
      });
      caps.avcEncode = encSupport.supported ?? false;
    } catch {
      caps.avcEncode = false;
    }

    // Check AVC 720p fallback encoding support
    try {
      const encSupport720 = await VideoEncoder.isConfigSupported({
        codec: 'avc1.64001f', // H.264 High Profile Level 3.1
        width: 720,
        height: 1280,
        bitrate: 2_500_000,
        framerate: 30,
      });
      caps.avcEncode720 = encSupport720.supported ?? false;
    } catch {
      caps.avcEncode720 = false;
    }

    // Check AAC audio encoding support
    if ('AudioEncoder' in globalThis) {
      try {
        const audioSupport = await AudioEncoder.isConfigSupported({
          codec: 'mp4a.40.2', // AAC-LC
          sampleRate: 48000,
          numberOfChannels: 2,
          bitrate: 128_000,
        });
        caps.aacEncode = audioSupport.supported ?? false;
      } catch {
        caps.aacEncode = false;
      }
    }
  }

  // 2. OPFS (Origin Private File System) check
  try {
    if (typeof navigator !== 'undefined' && 'storage' in navigator && 'getDirectory' in navigator.storage) {
      const root = await navigator.storage.getDirectory();
      caps.opfs = root !== null && typeof root !== 'undefined';
    }
  } catch {
    caps.opfs = false;
  }

  // 3. Web Share API check
  if (typeof navigator !== 'undefined' && 'share' in navigator) {
    caps.webShare = true;
    if ('canShare' in navigator) {
      try {
        const dummyFile = new File(['test'], 'test.mp4', { type: 'video/mp4' });
        caps.webShareFiles = navigator.canShare({ files: [dummyFile] });
      } catch {
        caps.webShareFiles = false;
      }
    }
  }

  // 4. WebAssembly check
  try {
    caps.wasm = typeof WebAssembly === 'object' && typeof WebAssembly.instantiate === 'function';
  } catch {
    caps.wasm = false;
  }

  // 5. SharedArrayBuffer / crossOriginIsolated check
  try {
    caps.sharedArrayBuffer =
      typeof SharedArrayBuffer !== 'undefined' && Boolean((globalThis as { crossOriginIsolated?: boolean }).crossOriginIsolated);
  } catch {
    caps.sharedArrayBuffer = false;
  }

  return caps;
}

