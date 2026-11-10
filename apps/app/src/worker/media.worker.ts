/// <reference lib="webworker" />
/**
 * Video processing off the main thread (PRD US-04: the UI never freezes).
 * Errors cannot cross the worker boundary with their extra fields, so run() returns a result
 * object instead of throwing.
 */
import * as Comlink from 'comlink';
import { detectCapabilities, run } from '@whatmedia/core';
import type { Capabilities, OutputFile, Plan, Progress } from '@whatmedia/core';

export type WorkerRunResult =
  | { ok: true; outputs: OutputFile[] }
  | { ok: false; code: string; message: string; partialOutputs: OutputFile[] };

let controller: AbortController | null = null;

const api = {
  async capabilities(): Promise<Capabilities> {
    return detectCapabilities();
  },

  async run(
    file: File,
    plan: Plan,
    onProgress: (p: Progress) => void,
    onSegment: (o: OutputFile) => void,
  ): Promise<WorkerRunResult> {
    controller = new AbortController();
    const partials: OutputFile[] = [];
    try {
      const outputs = await run(file, plan, {
        signal: controller.signal,
        onProgress: (p) => void onProgress(p),
        onSegmentComplete: (o) => {
          partials.push(o);
          void onSegment(o);
        },
      });
      return { ok: true, outputs };
    } catch (err: unknown) {
      const e = err as { code?: string; message?: string; partialOutputs?: OutputFile[] };
      return {
        ok: false,
        code: e.code ?? (controller.signal.aborted ? 'E_ABORTED' : 'E_UNKNOWN'),
        message: e.message ?? String(err),
        partialOutputs: e.partialOutputs ?? partials,
      };
    } finally {
      controller = null;
    }
  },

  cancel(): void {
    controller?.abort();
  },
};

export type MediaWorkerApi = typeof api;

Comlink.expose(api);
