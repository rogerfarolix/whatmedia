import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { FastifyInstance } from 'fastify';
import { buildServer, API_VERSION } from '../src/server.js';

const hasFfmpeg =
  spawnSync('ffmpeg', ['-version']).status === 0 && spawnSync('ffprobe', ['-version']).status === 0;

function multipart(fields: Record<string, string>, file?: { name: string; type: string; data: Buffer }) {
  const boundary = '----wmtest' + Math.random().toString(16).slice(2);
  const parts: Buffer[] = [];
  for (const [k, v] of Object.entries(fields)) {
    parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${k}"\r\n\r\n${v}\r\n`));
  }
  if (file) {
    parts.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${file.name}"\r\nContent-Type: ${file.type}\r\n\r\n`,
      ),
      file.data,
      Buffer.from('\r\n'),
    );
  }
  parts.push(Buffer.from(`--${boundary}--\r\n`));
  return {
    payload: Buffer.concat(parts),
    headers: { 'content-type': `multipart/form-data; boundary=${boundary}` },
  };
}

type Status = {
  status: string;
  outputs: { index: number; sizeBytes: number; totalSegments: number }[];
  error?: string;
};

async function waitForJob(app: FastifyInstance, jobId: string, auth: Record<string, string>): Promise<Status> {
  for (;;) {
    const s = (await app.inject({ method: 'GET', url: `/api/v1/jobs/${jobId}`, headers: auth })).json() as Status;
    if (s.status === 'done' || s.status === 'failed') return s;
    await new Promise((r) => setTimeout(r, 250));
  }
}

function ffmpeg(args: string[]) {
  spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args]);
}

describe('Fallback API Endpoints', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildServer();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health returns 200 with queue status, at the root and under /api/v1', async () => {
    for (const url of ['/health', '/api/v1/health']) {
      const res = await app.inject({ method: 'GET', url });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.status).toBe('ok');
      expect(body.version).toBe(API_VERSION);
      expect(body.queue).toMatchObject({ running: 0, waiting: 0 });
    }
  });

  it('GET /config returns limits and presets', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/config' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.limits.maxStatusVideoSec).toBe(60);
    expect(body.presets['status-hd']).toBeDefined();
  });

  it('POST /jobs without multipart body rejects request', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/v1/jobs' });
    expect(res.statusCode).toBe(400);
  });

  it('POST /jobs refuses uploads without explicit consent', async () => {
    const mp = multipart({ preset: 'status-hd' }, { name: 'a.mp4', type: 'video/mp4', data: Buffer.alloc(64) });
    const res = await app.inject({ method: 'POST', url: '/api/v1/jobs', ...mp });
    expect(res.statusCode).toBe(400);
    expect(res.json().message).toMatch(/consent/i);
  });

  it('POST /jobs refuses unknown presets and invalid segment lengths', async () => {
    const bad = multipart(
      { consent: 'true', preset: 'nope' },
      { name: 'a.mp4', type: 'video/mp4', data: Buffer.alloc(64) },
    );
    expect((await app.inject({ method: 'POST', url: '/api/v1/jobs', ...bad })).statusCode).toBe(400);
    const seg = multipart(
      { consent: 'true', preset: 'status-hd', segmentSec: '45' },
      { name: 'a.mp4', type: 'video/mp4', data: Buffer.alloc(64) },
    );
    expect((await app.inject({ method: 'POST', url: '/api/v1/jobs', ...seg })).statusCode).toBe(400);
  });

  it('POST /jobs rejects files whose signature is not a supported media type (415)', async () => {
    const mp = multipart(
      { consent: 'true', preset: 'status-hd' },
      { name: 'evil.mp4', type: 'video/mp4', data: Buffer.from('#!/bin/sh\necho hello world, not a video\n') },
    );
    const res = await app.inject({ method: 'POST', url: '/api/v1/jobs', ...mp });
    expect(res.statusCode).toBe(415);
  });

  it('unknown jobs return 404', async () => {
    expect((await app.inject({ method: 'GET', url: '/api/v1/jobs/unknown' })).statusCode).toBe(404);
    expect((await app.inject({ method: 'GET', url: '/api/v1/jobs/unknown/files/1' })).statusCode).toBe(404);
  });

  it.skipIf(!hasFfmpeg)('processes a real video end to end, segmented, token-protected and under 16 MB', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'wm-src-'));
    const src = join(dir, 'src.mp4');
    ffmpeg([
      '-f', 'lavfi', '-i', 'testsrc2=size=640x360:rate=30',
      '-f', 'lavfi', '-i', 'sine=frequency=440:sample_rate=48000',
      '-t', '35', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac', src,
    ]);
    const mp = multipart(
      { consent: 'true', preset: 'status-hd', segmentSec: '30' },
      { name: 'IMG_0001.mp4', type: 'video/mp4', data: readFileSync(src) },
    );
    const created = await app.inject({ method: 'POST', url: '/api/v1/jobs', ...mp });
    expect(created.statusCode).toBe(202);
    const { jobId, jobToken } = created.json() as { jobId: string; jobToken: string };

    expect((await app.inject({ method: 'GET', url: `/api/v1/jobs/${jobId}` })).statusCode).toBe(401);
    expect(
      (await app.inject({ method: 'GET', url: `/api/v1/jobs/${jobId}`, headers: { authorization: 'Bearer x' } }))
        .statusCode,
    ).toBe(401);

    const auth = { authorization: `Bearer ${jobToken}` };
    const status = await waitForJob(app, jobId, auth);
    expect(status.error).toBeUndefined();
    expect(status.status).toBe('done');
    expect(status.outputs).toHaveLength(2);

    expect((await app.inject({ method: 'GET', url: `/api/v1/jobs/${jobId}/files/1` })).statusCode).toBe(401);
    const file = await app.inject({ method: 'GET', url: `/api/v1/jobs/${jobId}/files/1`, headers: auth });
    expect(file.statusCode).toBe(200);
    expect(file.headers['content-type']).toBe('video/mp4');
    expect(file.rawPayload.length).toBe(status.outputs[0]!.sizeBytes);
    expect(file.rawPayload.length).toBeGreaterThan(1000);
    expect(file.rawPayload.length).toBeLessThanOrEqual(16_000_000);
    expect(file.rawPayload.toString('latin1', 4, 8)).toBe('ftyp');

    // A second download still works (the previous code truncated the file when serving it).
    const again = await app.inject({ method: 'GET', url: `/api/v1/jobs/${jobId}/files/1`, headers: auth });
    expect(again.rawPayload.length).toBe(status.outputs[0]!.sizeBytes);

    expect((await app.inject({ method: 'DELETE', url: `/api/v1/jobs/${jobId}`, headers: auth })).statusCode).toBe(
      204,
    );
    expect((await app.inject({ method: 'GET', url: `/api/v1/jobs/${jobId}`, headers: auth })).statusCode).toBe(404);
    rmSync(dir, { recursive: true, force: true });
  });

  it.skipIf(!hasFfmpeg)('converts a transparent PNG photo to a JPEG', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'wm-src-'));
    const src = join(dir, 'p.png');
    ffmpeg(['-f', 'lavfi', '-i', 'color=c=red@0.0:s=3000x2000,format=rgba', '-frames:v', '1', src]);
    const mp = multipart(
      { consent: 'true', preset: 'status-photo' },
      { name: 'p.png', type: 'image/png', data: readFileSync(src) },
    );
    const created = await app.inject({ method: 'POST', url: '/api/v1/jobs', ...mp });
    expect(created.statusCode).toBe(202);
    const { jobId, jobToken } = created.json() as { jobId: string; jobToken: string };
    const auth = { authorization: `Bearer ${jobToken}` };
    const status = await waitForJob(app, jobId, auth);
    expect(status.error).toBeUndefined();
    const file = await app.inject({ method: 'GET', url: `/api/v1/jobs/${jobId}/files/1`, headers: auth });
    expect(file.headers['content-type']).toBe('image/jpeg');
    expect(file.rawPayload[0]).toBe(0xff);
    expect(file.rawPayload[1]).toBe(0xd8);
    rmSync(dir, { recursive: true, force: true });
  });
});
