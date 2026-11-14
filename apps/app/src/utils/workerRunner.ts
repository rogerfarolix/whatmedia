import * as Comlink from 'comlink';
import type { OutputFile, Plan, Progress } from '@whatmedia/core';
import { MediaError } from '@whatmedia/core';
import type { MediaWorkerApi } from '../worker/media.worker';
import { loadEngine } from './loadEngine';

/** No progress for this long while the app is visible: the worker is considered dead */
const STALL_MS = 45_000;
/** Time given to a worker to report again after the app comes back to the foreground */
const RESUME_GRACE_MS = 20_000;
/** Reply time allowed to a worker when the app returns to the foreground */
const PING_MS = 10_000;
/** After a cancel request, wait this long for the partial results before forcing the stop */
const CANCEL_GRACE_MS = 1_500;

let worker: Worker | null = null;
let remote: Comlink.Remote<MediaWorkerApi> | null = null;
let supported: Promise<boolean> | null = null;

function spawn(): Comlink.Remote<MediaWorkerApi> {
  if (!worker || !remote) {
    worker = new Worker(new URL('../worker/media.worker.ts', import.meta.url), {
      type: 'module',
      name: 'whatmedia-media',
    });
    remote = Comlink.wrap<MediaWorkerApi>(worker);
  }
  return remote;
}

/** Kills the worker. iOS can also kill it on its own while the app is in the background. */
function dispose(): void {
  worker?.terminate();
  worker = null;
  remote = null;
}

/** Checks once that WebCodecs encoding is exposed in worker scope. */
function workerSupported(): Promise<boolean> {
  supported ??= (async () => {
    if (typeof Worker === 'undefined') return false;
    try {
      const caps = await Promise.race([
        spawn().capabilities(),
        new Promise<null>((r) => setTimeout(() => r(null), 5000)),
      ]);
      return !!caps && caps.webcodecs && (caps.avcEncode || caps.avcEncode720);
    } catch {
      return false;
    }
  })();
  return supported;
}

export interface RunInput {
  file: File;
  plan: Plan;
  signal: AbortSignal;
  onProgress: (p: Progress) => void;
  onSegmentComplete: (o: OutputFile) => void;
}

class WorkerStalled extends Error {
  constructor() {
    super('worker stalled');
    this.name = 'WorkerStalled';
  }
}

function abortError(partials: OutputFile[]): MediaError {
  const err = new MediaError('E_ABORTED', 'Processing aborted by user');
  err.partialOutputs = partials;
  return err;
}

/** One attempt in a (fresh or reused) worker, with cancellation and stall detection. */
function runInWorker({ file, plan, signal, onProgress, onSegmentComplete }: RunInput): Promise<OutputFile[]> {
  const api = spawn();
  const partials: OutputFile[] = [];
  let lastSign = Date.now();

  return new Promise<OutputFile[]>((resolve, reject) => {
    let settled = false;
    let cancelTimer: number | undefined;

    const cleanup = () => {
      clearInterval(watchdog);
      clearTimeout(cancelTimer);
      document.removeEventListener('visibilitychange', onVisibility);
      signal.removeEventListener('abort', onAbort);
    };
    const settle = (fn: () => void) => {
      if (settled) return;
      settled = true;
      cleanup();
      fn();
    };

    // iOS freezes timers while the app is hidden: after coming back, give the worker time to speak.
    const onVisibility = () => {
      if (document.visibilityState !== 'visible') return;
      lastSign = Date.now() + RESUME_GRACE_MS;
      // Quick check: a live worker answers a ping within moments, a killed one never does.
      void Promise.race([
        api.capabilities().then(() => true),
        new Promise<boolean>((r) => window.setTimeout(() => r(false), PING_MS)),
      ]).then((alive) => {
        if (alive || settled) return;
        settle(() => {
          dispose();
          reject(new WorkerStalled());
        });
      });
    };
    document.addEventListener('visibilitychange', onVisibility);

    const watchdog = window.setInterval(() => {
      if (document.visibilityState === 'visible' && Date.now() - lastSign > STALL_MS) {
        settle(() => {
          dispose();
          reject(new WorkerStalled());
        });
      }
    }, 3000);

    const onAbort = () => {
      void api.cancel().catch(() => undefined);
      // A healthy worker answers with the finished parts; a dead one never does: force the stop.
      cancelTimer = window.setTimeout(
        () =>
          settle(() => {
            dispose();
            reject(abortError(partials));
          }),
        CANCEL_GRACE_MS,
      );
    };
    if (signal.aborted) onAbort();
    else signal.addEventListener('abort', onAbort, { once: true });

    api
      .run(
        file,
        plan,
        Comlink.proxy((p: Progress) => {
          lastSign = Date.now();
          onProgress(p);
        }),
        Comlink.proxy((o: OutputFile) => {
          lastSign = Date.now();
          partials.push(o);
          onSegmentComplete(o);
        }),
      )
      .then((result) => {
        settle(() => {
          if (result.ok) return resolve(result.outputs);
          const err = new MediaError(result.code as MediaError['code'], result.message.replace(/^\w+: /, ''));
          err.partialOutputs = result.partialOutputs;
          reject(err);
        });
      })
      .catch((e: unknown) => settle(() => reject(e)));
  });
}

/**
 * Runs the pipeline: videos in the Web Worker when the browser supports WebCodecs there,
 * otherwise (and for photos) on the main thread. A worker that stops answering (iOS can kill it
 * while the app is in the background) is replaced and the work restarted, first in a new worker,
 * then on the main thread. Cancelling always returns promptly. Throws MediaError like the core.
 */
export async function runPipeline(input: RunInput): Promise<OutputFile[]> {
  const isVideo = !input.plan.image && !input.file.type.startsWith('image/');

  if (isVideo && (await workerSupported())) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        return await runInWorker(input);
      } catch (err) {
        if (!(err instanceof WorkerStalled)) throw err;
        // Fresh worker, from the start (partial parts of a dead run are discarded below).
      }
    }
  }

  const { run } = await loadEngine();
  return run(input.file, input.plan, {
    signal: input.signal,
    onProgress: input.onProgress,
    onSegmentComplete: input.onSegmentComplete,
  });
}
