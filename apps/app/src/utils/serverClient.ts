import type { OutputFile, Progress } from '@whatmedia/core';
import { outputBaseName } from '@whatmedia/core';

export const API_BASE = '/api/v1';

export interface ServerProcessOptions {
  apiUrl?: string;
  preset?: string;
  segmentSec?: number;
  crop916?: boolean;
  signal?: AbortSignal;
  onProgress?: (p: Progress) => void;
}

/** Progress split: upload 0 → 0.45, server processing 0.45 → 0.9, download 0.9 → 1 */
const UPLOAD_END = 0.45;
const PROCESS_END = 0.9;
const POLL_MS = 1500;

export class ServerError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = 'ServerError';
  }
}

/** True when the fallback server answers its health check (it is optional and may be disabled) */
export async function checkServerAvailable(apiUrl = API_BASE, timeoutMs = 4000): Promise<boolean> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${apiUrl}/health`, { signal: ctrl.signal, cache: 'no-store' });
    if (!res.ok) return false;
    const body = (await res.json()) as { status?: string };
    return body.status === 'ok';
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

async function errorMessage(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { message?: string; error?: string };
    return body.message || body.error || res.statusText;
  } catch {
    return res.statusText || `HTTP ${res.status}`;
  }
}

function upload(
  url: string,
  form: FormData,
  signal: AbortSignal | undefined,
  onRatio: (r: number) => void,
): Promise<{ jobId: string; jobToken: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    xhr.responseType = 'json';
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && e.total > 0) onRatio(e.loaded / e.total);
    };
    xhr.onload = () => {
      const body = xhr.response as { jobId?: string; jobToken?: string; message?: string } | null;
      if (xhr.status >= 200 && xhr.status < 300 && body?.jobId && body.jobToken) {
        resolve({ jobId: body.jobId, jobToken: body.jobToken });
      } else {
        reject(new ServerError(body?.message || xhr.statusText || `HTTP ${xhr.status}`, xhr.status));
      }
    };
    xhr.onerror = () => reject(new ServerError('network error'));
    xhr.onabort = () => reject(new DOMException('Aborted', 'AbortError'));
    signal?.addEventListener('abort', () => xhr.abort(), { once: true });
    xhr.send(form);
  });
}

function wait(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        reject(new DOMException('Aborted', 'AbortError'));
      },
      { once: true },
    );
  });
}

/**
 * Uploads a file to the WhatMedia fallback server (only after explicit consent),
 * waits for processing, downloads the results and deletes the job immediately.
 */
export async function runServerJob(file: File, options?: ServerProcessOptions): Promise<OutputFile[]> {
  const { apiUrl = API_BASE, preset = 'status-hd', signal, onProgress } = options ?? {};
  const report = (ratio: number) =>
    onProgress?.({ phase: 'encode', segmentIndex: 1, segmentCount: 1, ratio: Math.min(1, ratio) });

  const form = new FormData();
  form.append('consent', 'true');
  form.append('preset', preset);
  if (options?.segmentSec) form.append('segmentSec', String(options.segmentSec));
  if (options?.crop916) form.append('crop916', 'true');
  // The file goes last so the server can read the fields before streaming the upload.
  form.append('file', file);

  report(0);
  const { jobId, jobToken } = await upload(`${apiUrl}/jobs`, form, signal, (r) => report(r * UPLOAD_END));
  const auth = { Authorization: `Bearer ${jobToken}` };

  const cleanup = () => {
    fetch(`${apiUrl}/jobs/${jobId}`, { method: 'DELETE', headers: auth, keepalive: true }).catch(() => {});
  };

  try {
    for (;;) {
      await wait(POLL_MS, signal);
      const statusRes = await fetch(`${apiUrl}/jobs/${jobId}`, { headers: auth, signal, cache: 'no-store' });
      if (statusRes.status === 404) throw new ServerError('job expired', 404);
      if (!statusRes.ok) continue;

      const data = (await statusRes.json()) as {
        status: string;
        progressRatio: number;
        error?: string;
        outputs: { index: number; totalSegments: number; durationSec: number }[];
      };
      report(UPLOAD_END + (data.progressRatio ?? 0) * (PROCESS_END - UPLOAD_END));

      if (data.status === 'failed') throw new ServerError(data.error || 'processing failed');
      if (data.status !== 'done') continue;

      const base = outputBaseName(file.name);
      const outputs: OutputFile[] = [];
      for (const [n, out] of data.outputs.entries()) {
        const res = await fetch(`${apiUrl}/jobs/${jobId}/files/${out.index}`, { headers: auth, signal });
        if (!res.ok) throw new ServerError(await errorMessage(res), res.status);
        const blob = await res.blob();
        const type = blob.type || res.headers.get('Content-Type') || 'video/mp4';
        const ext = type.startsWith('image/') ? 'jpg' : 'mp4';
        const name =
          out.totalSegments > 1 ? `${base}-${out.index}of${out.totalSegments}.${ext}` : `${base}.${ext}`;
        outputs.push({
          file: new File([blob], name, { type }),
          index: out.index,
          totalSegments: out.totalSegments,
          durationSec: out.durationSec,
          sizeBytes: blob.size,
        });
        report(PROCESS_END + ((n + 1) / data.outputs.length) * (1 - PROCESS_END));
      }
      return outputs;
    }
  } finally {
    cleanup();
  }
}
