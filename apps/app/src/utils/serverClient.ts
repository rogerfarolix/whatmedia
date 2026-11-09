import type { OutputFile, Progress } from '@whatmedia/core';

export interface ServerProcessOptions {
  apiUrl?: string;
  preset?: string;
  signal?: AbortSignal;
  onProgress?: (p: Progress) => void;
}

/**
 * Uploads a file to the WhatMedia fallback server API and streams back the result
 */
export async function runServerJob(
  file: File,
  options?: ServerProcessOptions,
): Promise<OutputFile[]> {
  const { apiUrl = '/api/v1', preset = 'status-hd', signal, onProgress } = options ?? {};

  const formData = new FormData();
  formData.append('file', file);
  formData.append('consent', 'true');
  formData.append('preset', preset);

  onProgress?.({
    phase: 'encode',
    segmentIndex: 1,
    segmentCount: 1,
    ratio: 0.1,
  });

  const uploadRes = await fetch(`${apiUrl}/jobs`, {
    method: 'POST',
    body: formData,
    signal,
  });

  if (!uploadRes.ok) {
    throw new Error(`Server job creation failed: ${uploadRes.statusText}`);
  }

  const { jobId, jobToken } = await uploadRes.json();

  // Poll for completion
  while (!signal?.aborted) {
    await new Promise((r) => setTimeout(r, 1500));

    const statusRes = await fetch(`${apiUrl}/jobs/${jobId}`, {
      headers: {
        Authorization: `Bearer ${jobToken}`,
      },
      signal,
    });

    if (!statusRes.ok) continue;

    const data = await statusRes.json();
    onProgress?.({
      phase: 'encode',
      segmentIndex: 1,
      segmentCount: 1,
      ratio: Math.min(0.1 + data.progressRatio * 0.8, 0.95),
    });

    if (data.status === 'done') {
      const outputFiles: OutputFile[] = [];

      for (const out of data.outputs) {
        const fileRes = await fetch(`${apiUrl}/jobs/${jobId}/files/${out.index}`, {
          headers: {
            Authorization: `Bearer ${jobToken}`,
          },
          signal,
        });

        const blob = await fileRes.blob();
        const downloadedFile = new File([blob], `whatmedia-part${out.index}.mp4`, {
          type: 'video/mp4',
        });

        outputFiles.push({
          file: downloadedFile,
          index: out.index,
          totalSegments: out.totalSegments,
          durationSec: out.durationSec,
          sizeBytes: blob.size,
        });
      }

      // Cleanup on server immediately
      fetch(`${apiUrl}/jobs/${jobId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${jobToken}`,
        },
      }).catch(() => {});

      onProgress?.({
        phase: 'mux',
        segmentIndex: 1,
        segmentCount: 1,
        ratio: 1,
      });

      return outputFiles;
    }

    if (data.status === 'failed') {
      throw new Error(data.error || 'Server processing failed');
    }
  }

  throw new Error('Processing cancelled');
}
