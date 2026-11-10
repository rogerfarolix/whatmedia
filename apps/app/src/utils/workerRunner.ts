import * as Comlink from 'comlink';
import type { OutputFile, Plan, Progress } from '@whatmedia/core';
import { MediaError } from '@whatmedia/core';
import type { MediaWorkerApi } from '../worker/media.worker';
import { loadEngine } from './loadEngine';

let remote: Comlink.Remote<MediaWorkerApi> | null = null;
let usable: Promise<boolean> | null = null;

/** Starts the worker once and checks that WebCodecs encoding is exposed in worker scope. */
function workerUsable(): Promise<boolean> {
  usable ??= (async () => {
    if (typeof Worker === 'undefined') return false;
    try {
      const worker = new Worker(new URL('../worker/media.worker.ts', import.meta.url), {
        type: 'module',
        name: 'whatmedia-media',
      });
      remote = Comlink.wrap<MediaWorkerApi>(worker);
      const caps = await Promise.race([
        remote.capabilities(),
        new Promise<null>((r) => setTimeout(() => r(null), 5000)),
      ]);
      return !!caps && caps.webcodecs && (caps.avcEncode || caps.avcEncode720);
    } catch {
      return false;
    }
  })();
  return usable;
}

export interface RunInput {
  file: File;
  plan: Plan;
  signal: AbortSignal;
  onProgress: (p: Progress) => void;
  onSegmentComplete: (o: OutputFile) => void;
}

/**
 * Runs the pipeline: videos in the Web Worker when the browser supports WebCodecs there,
 * otherwise (and for photos, which need the main-thread image decoders on some browsers)
 * on the main thread. Throws MediaError like the core engine.
 */
export async function runPipeline({ file, plan, signal, onProgress, onSegmentComplete }: RunInput): Promise<OutputFile[]> {
  const isVideo = !plan.image && !file.type.startsWith('image/');

  if (isVideo && (await workerUsable()) && remote) {
    const worker = remote;
    const onAbort = () => void worker.cancel();
    signal.addEventListener('abort', onAbort, { once: true });
    try {
      const result = await worker.run(file, plan, Comlink.proxy(onProgress), Comlink.proxy(onSegmentComplete));
      if (result.ok) return result.outputs;
      const err = new MediaError(result.code as MediaError['code'], result.message.replace(/^\w+: /, ''));
      err.partialOutputs = result.partialOutputs;
      throw err;
    } finally {
      signal.removeEventListener('abort', onAbort);
    }
  }

  const { run } = await loadEngine();
  return run(file, plan, { signal, onProgress, onSegmentComplete });
}
