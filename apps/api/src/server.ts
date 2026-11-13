import Fastify, { type FastifyInstance, type FastifyPluginAsync, type FastifyRequest } from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import sensible from '@fastify/sensible';
import { presets, whatsappLimits, type PresetId, type VideoPreset } from '@whatmedia/config';
import { plan, type Capabilities, type Plan } from '@whatmedia/core';
import { nanoid } from 'nanoid';
import { createReadStream, createWriteStream, existsSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs';
import { open } from 'node:fs/promises';
import { join } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { spawn, type ChildProcess } from 'node:child_process';
import { timingSafeEqual } from 'node:crypto';
import { buildFfmpegArgs, buildImageArgs } from './ffmpeg/builder.js';
import { runFfprobe, sniffMediaType, toMediaInfo } from './ffmpeg/probe.js';
import { JobQueue } from './queue.js';
import { StatsStore, type StatKind } from './stats.js';

export const API_VERSION = '1.1.0';

const env = (name: string, fallback: number) => {
  const v = Number.parseInt(process.env[name] ?? '', 10);
  return Number.isFinite(v) && v >= 0 ? v : fallback;
};

const PORT = env('PORT', 3000);
const HOST = process.env.HOST || '0.0.0.0';
const DATA_DIR = process.env.DATA_DIR || '/data/jobs';
const MAX_UPLOAD_BYTES = env('MAX_UPLOAD_BYTES', 1024 * 1024 * 1024);
const MAX_DURATION_SEC = env('MAX_DURATION_SEC', 600);
const RETENTION_MS = env('RETENTION_MINUTES', 15) * 60 * 1000;
const FFMPEG_TIMEOUT_MS = env('FFMPEG_TIMEOUT_SEC', 900) * 1000;
const CONCURRENCY = Math.max(1, env('CONCURRENCY', 2));
const QUEUE_MAX = env('QUEUE_MAX', 20);
const RATE_LIMIT_PER_HOUR = Math.max(1, env('RATE_LIMIT_PER_HOUR', 10));
/** Number of reverse proxies in front of the API (nginx → caddy → api = 2). 0 = trust none. */
const TRUST_PROXY_HOPS = env('TRUST_PROXY_HOPS', 0);
const PUBLIC_ORIGIN = process.env.PUBLIC_ORIGIN;
const STATS_FILE = process.env.STATS_FILE || '/data/stats/stats.json';
/** Totals are only shown publicly once this many files have been prepared */
const STATS_PUBLIC_THRESHOLD = env('STATS_PUBLIC_THRESHOLD', 100);
const MAX_PARTS_PER_EVENT = 60;
export const stats = new StatsStore(STATS_FILE, STATS_PUBLIC_THRESHOLD);
const MAX_SIZE_RETRIES = 2;

/** The server always has ffmpeg: every capability is available. */
const SERVER_CAPS: Capabilities = {
  webcodecs: true,
  hevcDecode: true,
  avcEncode: true,
  avcEncode720: true,
  aacEncode: true,
  opfs: false,
  webShare: false,
  webShareFiles: false,
  wasm: false,
  sharedArrayBuffer: false,
};

interface JobOutput {
  index: number;
  totalSegments: number;
  durationSec: number;
  sizeBytes: number;
  downloadUrl: string;
  path: string;
  contentType: string;
  fileName: string;
}

interface Job {
  id: string;
  token: Buffer;
  status: 'queued' | 'processing' | 'done' | 'failed';
  progressRatio: number;
  createdAt: number;
  expiresAt: number;
  preset: PresetId;
  segmentSec?: number;
  crop916: boolean;
  hint: 'video' | 'image';
  dir: string;
  inputPath: string;
  outputs: JobOutput[];
  error?: string;
  proc?: ChildProcess;
  task?: () => Promise<void>;
  cancelled: boolean;
}

const jobs = new Map<string, Job>();
const queue = new JobQueue(CONCURRENCY, QUEUE_MAX);

function removeJob(job: Job): void {
  job.cancelled = true;
  if (job.task) queue.remove(job.task);
  job.proc?.kill('SIGKILL');
  rmSync(job.dir, { recursive: true, force: true });
  jobs.delete(job.id);
}

/** Wipes leftovers from a previous run (jobs live in memory, so they are orphans now). */
function cleanDataDir(): void {
  try {
    mkdirSync(DATA_DIR, { recursive: true });
    for (const entry of readdirSync(DATA_DIR)) {
      rmSync(join(DATA_DIR, entry), { recursive: true, force: true });
    }
  } catch {
    // read-only / test environments
  }
}

function checkToken(job: Job, req: FastifyRequest): boolean {
  const header = req.headers.authorization ?? '';
  const match = /^Bearer\s+(\S+)$/.exec(header);
  if (!match?.[1]) return false;
  const given = Buffer.from(match[1]);
  return given.length === job.token.length && timingSafeEqual(given, job.token);
}

function runFfmpeg(job: Job, args: string[], onTime?: (sec: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn('ffmpeg', args, { stdio: ['ignore', 'pipe', 'pipe'] });
    job.proc = proc;
    let stderrTail = '';
    let buf = '';
    proc.stdout.on('data', (chunk: Buffer) => {
      buf += chunk.toString('utf8');
      const lines = buf.split('\n');
      buf = lines.pop() ?? '';
      for (const line of lines) {
        if (line.startsWith('out_time_us=')) {
          const us = Number(line.slice('out_time_us='.length));
          if (Number.isFinite(us) && us > 0) onTime?.(us / 1e6);
        }
      }
    });
    proc.stderr.on('data', (chunk: Buffer) => {
      stderrTail = (stderrTail + chunk.toString('utf8')).slice(-2000);
    });
    const timer = setTimeout(() => proc.kill('SIGKILL'), FFMPEG_TIMEOUT_MS);
    proc.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
    proc.on('close', (code, signal) => {
      clearTimeout(timer);
      job.proc = undefined;
      if (code === 0) return resolve();
      if (job.cancelled) return reject(new Error('cancelled'));
      if (signal === 'SIGKILL') return reject(new Error('processing timed out'));
      const last = stderrTail.trim().split('\n').pop() ?? '';
      reject(new Error(`ffmpeg failed (${code}): ${last.slice(0, 200)}`));
    });
  });
}

async function processJob(job: Job, log: FastifyInstance['log']): Promise<void> {
  if (job.cancelled) return;
  job.status = 'processing';
  const started = Date.now();

  try {
    const sizeBytes = statSync(job.inputPath).size;
    const info = toMediaInfo(await runFfprobe(job.inputPath), sizeBytes, job.hint);

    if (info.kind === 'video' && (info.durationSec ?? 0) > MAX_DURATION_SEC) {
      throw new Error(`video longer than ${MAX_DURATION_SEC} s`);
    }
    if (info.kind === 'video' && !((info.durationSec ?? 0) > 0)) {
      throw new Error('video has no duration');
    }

    const presetId: PresetId = info.kind === 'image' ? 'status-photo' : job.preset;
    const p: Plan = plan(info, presetId, SERVER_CAPS, {
      segmentDurationSec: job.segmentSec,
      crop916: job.crop916,
    });

    if (info.kind === 'image' && p.image) {
      const outPath = join(job.dir, 'out-1.jpg');
      await runFfmpeg(
        job,
        buildImageArgs({
          inputPath: job.inputPath,
          outputPath: outPath,
          width: p.image.width,
          height: p.image.height,
          quality: p.image.quality,
        }),
      );
      job.outputs.push({
        index: 1,
        totalSegments: 1,
        durationSec: 0,
        sizeBytes: statSync(outPath).size,
        downloadUrl: `/api/v1/jobs/${job.id}/files/1`,
        path: outPath,
        contentType: 'image/jpeg',
        fileName: 'whatmedia.jpg',
      });
    } else if (p.video) {
      const preset = presets[presetId] as VideoPreset;
      const total = p.segments.length;

      for (const [i, seg] of p.segments.entries()) {
        const segDur = Math.max(0.1, seg.endSec - seg.startSec);
        const outPath = join(job.dir, `out-${i + 1}.mp4`);
        let bitrate = p.video.bitrate;

        for (let attempt = 0; attempt <= MAX_SIZE_RETRIES; attempt++) {
          await runFfmpeg(
            job,
            buildFfmpegArgs({
              inputPath: job.inputPath,
              outputPath: outPath,
              startSec: seg.startSec,
              durationSec: segDur,
              width: p.video.width,
              height: p.video.height,
              fps: p.video.fps,
              videoBitrateBps: bitrate,
              audioBitrateBps: preset.audio.bitrate,
              needsToneMap: p.video.toneMap,
              hdrTransfer: info.hdr === 'pq' ? 'pq' : 'hlg',
              fit: p.video.fit,
              keyframeIntervalSec: p.video.keyframeIntervalSec,
              profile: preset.video.profile,
              level: preset.video.level,
              progress: true,
            }),
            (sec) => {
              job.progressRatio = Math.min(0.99, (i + Math.min(1, sec / segDur)) / total);
            },
          );
          const size = statSync(outPath).size;
          if (size <= whatsappLimits.maxMediaBytes) break;
          if (attempt === MAX_SIZE_RETRIES) throw new Error('could not stay under the 16 MB limit');
          bitrate = Math.floor(bitrate * (seg.targetBytes / size) * 0.92);
        }

        job.outputs.push({
          index: i + 1,
          totalSegments: total,
          durationSec: Math.round(segDur * 10) / 10,
          sizeBytes: statSync(outPath).size,
          downloadUrl: `/api/v1/jobs/${job.id}/files/${i + 1}`,
          path: outPath,
          contentType: 'video/mp4',
          fileName: total > 1 ? `whatmedia-${i + 1}of${total}.mp4` : 'whatmedia.mp4',
        });
      }
    } else {
      throw new Error('nothing to process');
    }

    job.status = 'done';
    job.progressRatio = 1;
  } catch (err: unknown) {
    if (job.cancelled) return;
    job.status = 'failed';
    job.error = err instanceof Error ? err.message : 'processing failed';
  } finally {
    // The source is no longer needed: delete it right away, keep only the results.
    rmSync(job.inputPath, { force: true });
    job.expiresAt = Date.now() + RETENTION_MS;
    // No file names in logs (docs/04 §1): job id, preset, status and timing only.
    log.info(
      { jobId: job.id, preset: job.preset, status: job.status, ms: Date.now() - started, outputs: job.outputs.length },
      'job finished',
    );
  }
}

const routes: FastifyPluginAsync = async (server) => {
  // Anonymous usage counter (docs/04-API.md §stats). logLevel 'warn': these requests are never
  // logged, so not even the technical log keeps an IP address next to a usage event.
  server.post<{ Body: { kind?: unknown; parts?: unknown } }>(
    '/stats/event',
    { logLevel: 'warn', config: { rateLimit: { max: 120, timeWindow: '1 hour' } } },
    async (request, reply) => {
      const body = (request.body ?? {}) as { kind?: unknown; parts?: unknown };
      const kind = body.kind;
      const parts = Number(body.parts ?? 1);
      if ((kind !== 'video' && kind !== 'photo') || !Number.isInteger(parts) || parts < 1 || parts > MAX_PARTS_PER_EVENT) {
        throw server.httpErrors.badRequest('Expected { kind: "video" | "photo", parts: 1..60 }');
      }
      stats.record(kind as StatKind, parts);
      return reply.status(204).send();
    },
  );

  server.get('/stats', { logLevel: 'warn' }, async (_request, reply) => {
    reply.header('Cache-Control', 'public, max-age=300');
    return stats.summary();
  });

  // https://shields.io/badges/endpoint-badge
  server.get<{ Querystring: { lang?: string } }>('/stats/badge', { logLevel: 'warn' }, async (request, reply) => {
    const s = stats.summary();
    const en = request.query.lang === 'en';
    reply.header('Cache-Control', 'public, max-age=3600');
    return {
      schemaVersion: 1,
      label: en ? 'files prepared' : 'fichiers préparés',
      message: s.public ? s.totals.files.toLocaleString(en ? 'en-US' : 'fr-FR') : en ? 'counting' : 'comptage en cours',
      color: 'FF5A1F',
    };
  });

  server.get('/health', { logLevel: 'warn' }, async () => ({
    status: 'ok',
    version: API_VERSION,
    queue: { ...queue.stats, activeJobs: jobs.size },
  }));

  server.get('/config', async () => ({
    presets,
    limits: whatsappLimits,
    maxUploadBytes: MAX_UPLOAD_BYTES,
    maxDurationSec: MAX_DURATION_SEC,
    retentionMinutes: RETENTION_MS / 60000,
  }));

  server.post(
    '/jobs',
    { config: { rateLimit: { max: RATE_LIMIT_PER_HOUR, timeWindow: '1 hour' } } },
    async (request, reply) => {
      if (!request.isMultipart()) throw server.httpErrors.badRequest('multipart/form-data expected');
      const data = await request.file();
      if (!data) throw server.httpErrors.badRequest('Missing file upload');

      const fields = data.fields as Record<string, { value?: unknown } | undefined>;
      const field = (k: string) => {
        const v = fields[k]?.value;
        return typeof v === 'string' ? v : undefined;
      };

      if (field('consent') !== 'true') {
        data.file.resume();
        throw server.httpErrors.badRequest('Explicit consent is required for remote server processing');
      }
      const presetId = (field('preset') ?? 'status-hd') as PresetId;
      if (!(presetId in presets)) {
        data.file.resume();
        throw server.httpErrors.badRequest('Unknown preset');
      }
      const segRaw = field('segmentSec');
      const segmentSec = segRaw ? Number(segRaw) : undefined;
      if (segmentSec !== undefined && !whatsappLimits.allowedStatusVideoSec.includes(segmentSec)) {
        data.file.resume();
        throw server.httpErrors.badRequest('Invalid segmentSec');
      }

      if (queue.stats.waiting >= QUEUE_MAX && queue.stats.running >= CONCURRENCY) {
        data.file.resume();
        throw server.httpErrors.serviceUnavailable('Server busy, try again in a few minutes');
      }

      const id = nanoid(16);
      const dir = join(DATA_DIR, id);
      mkdirSync(dir, { recursive: true });
      const inputPath = join(dir, 'input');

      try {
        await pipeline(data.file, createWriteStream(inputPath));
      } catch {
        rmSync(dir, { recursive: true, force: true });
        throw server.httpErrors.badRequest('Upload interrupted');
      }
      if (data.file.truncated) {
        rmSync(dir, { recursive: true, force: true });
        throw server.httpErrors.payloadTooLarge(`File larger than ${MAX_UPLOAD_BYTES} bytes`);
      }

      const fh = await open(inputPath, 'r');
      const head = Buffer.alloc(32);
      await fh.read(head, 0, 32, 0);
      await fh.close();
      const sniffed = sniffMediaType(head);
      if (!sniffed) {
        rmSync(dir, { recursive: true, force: true });
        throw server.httpErrors.unsupportedMediaType('Unsupported file type');
      }

      const now = Date.now();
      const job: Job = {
        id,
        token: Buffer.from(nanoid(43)),
        status: 'queued',
        progressRatio: 0,
        createdAt: now,
        // Hard cap while queued/processing; reset to completion + retention when done.
        expiresAt: now + RETENTION_MS + FFMPEG_TIMEOUT_MS * 2,
        preset: presetId,
        segmentSec,
        crop916: field('crop916') === 'true',
        hint: sniffed === 'image' || presets[presetId]?.kind === 'image' ? 'image' : 'video',
        dir,
        inputPath,
        outputs: [],
        cancelled: false,
      };
      jobs.set(id, job);

      job.task = () => processJob(job, server.log);
      if (!queue.push(job.task)) {
        removeJob(job);
        throw server.httpErrors.serviceUnavailable('Server busy, try again in a few minutes');
      }

      return reply.status(202).send({
        jobId: id,
        jobToken: job.token.toString(),
        status: job.status,
        expiresAt: new Date(job.expiresAt).toISOString(),
      });
    },
  );

  server.get<{ Params: { jobId: string } }>('/jobs/:jobId', async (request) => {
    const job = jobs.get(request.params.jobId);
    if (!job) throw server.httpErrors.notFound('Job not found');
    if (!checkToken(job, request)) throw server.httpErrors.unauthorized('Invalid or missing job token');

    return {
      jobId: job.id,
      status: job.status,
      progressRatio: job.progressRatio,
      outputs: job.outputs.map(({ index, totalSegments, durationSec, sizeBytes, downloadUrl }) => ({
        index,
        totalSegments,
        durationSec,
        sizeBytes,
        downloadUrl,
      })),
      error: job.error,
    };
  });

  server.get<{ Params: { jobId: string; index: string } }>('/jobs/:jobId/files/:index', async (request, reply) => {
    const job = jobs.get(request.params.jobId);
    if (!job) throw server.httpErrors.notFound('Job not found');
    if (!checkToken(job, request)) throw server.httpErrors.unauthorized('Invalid or missing job token');

    const out = job.outputs.find((o) => String(o.index) === request.params.index);
    if (!out || !existsSync(out.path)) throw server.httpErrors.notFound('File not ready or not found');

    return reply
      .header('Content-Type', out.contentType)
      .header('Content-Length', String(statSync(out.path).size))
      .header('Content-Disposition', `attachment; filename="${out.fileName}"`)
      .header('Cache-Control', 'no-store')
      .send(createReadStream(out.path));
  });

  server.delete<{ Params: { jobId: string } }>('/jobs/:jobId', async (request, reply) => {
    const job = jobs.get(request.params.jobId);
    if (job) {
      if (!checkToken(job, request)) throw server.httpErrors.unauthorized('Invalid or missing job token');
      removeJob(job);
    }
    return reply.status(204).send();
  });
};

export async function buildServer(): Promise<FastifyInstance> {
  const server = Fastify({
    logger: { level: process.env.LOG_LEVEL || 'info' },
    // Trust exactly N proxy hops so a client cannot spoof its IP with its own X-Forwarded-For.
    trustProxy: TRUST_PROXY_HOPS > 0 ? (_addr: string, hop: number) => hop < TRUST_PROXY_HOPS : false,
  });

  await server.register(sensible);
  // The app calls the API from the same origin; cross-origin access only if explicitly configured.
  await server.register(cors, { origin: PUBLIC_ORIGIN ? [PUBLIC_ORIGIN] : false });

  await server.register(rateLimit, {
    max: 120,
    timeWindow: '1 minute',
    allowList: (req) => req.url.endsWith('/health'),
  });

  await server.register(multipart, {
    limits: { fileSize: MAX_UPLOAD_BYTES, files: 1, fields: 10, fieldSize: 1024 },
  });

  // Served both at the root (when a proxy strips the prefix) and under /api/v1.
  await server.register(routes);
  await server.register(routes, { prefix: '/api/v1' });

  return server;
}

// Purge expired jobs every 60 s
setInterval(() => {
  const now = Date.now();
  for (const job of jobs.values()) {
    if (now >= job.expiresAt) removeJob(job);
  }
}, 60_000).unref();

export async function start(): Promise<void> {
  cleanDataDir();
  const server = await buildServer();
  const shutdown = async () => {
    stats.flush();
    for (const job of jobs.values()) removeJob(job);
    await server.close();
    process.exit(0);
  };
  process.on('SIGTERM', () => void shutdown());
  process.on('SIGINT', () => void shutdown());
  try {
    await server.listen({ port: PORT, host: HOST });
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== 'test') {
  void start();
}
