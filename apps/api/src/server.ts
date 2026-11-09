import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import sensible from '@fastify/sensible';
import { presets, whatsappLimits } from '@whatmedia/config';
import { nanoid } from 'nanoid';
import { existsSync, mkdirSync, createWriteStream, rmSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { buildFfmpegArgs } from './ffmpeg/builder.js';

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';
const DATA_DIR = process.env.DATA_DIR || '/data/jobs';
const MAX_UPLOAD_BYTES = parseInt(process.env.MAX_UPLOAD_BYTES || '1073741824', 10); // 1GB
const RETENTION_MS = parseInt(process.env.RETENTION_MINUTES || '15', 10) * 60 * 1000;

if (!existsSync(DATA_DIR)) {
  try {
    mkdirSync(DATA_DIR, { recursive: true });
  } catch {
    // Ignore in read-only / test envs
  }
}

interface Job {
  id: string;
  token: string;
  status: 'queued' | 'processing' | 'done' | 'failed';
  progressRatio: number;
  createdAt: number;
  expiresAt: number;
  preset: string;
  outputs: Array<{
    index: number;
    totalSegments: number;
    durationSec: number;
    sizeBytes: number;
    downloadUrl: string;
  }>;
  error?: string;
}

const jobs = new Map<string, Job>();

export async function buildServer() {
  const server = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
    },
  });

  await server.register(sensible);
  await server.register(cors, {
    origin: true,
  });

  await server.register(rateLimit, {
    max: 60,
    timeWindow: '1 minute',
    allowList: (req) =>
      req.url === '/health' ||
      req.url === '/config' ||
      req.ip === '127.0.0.1' ||
      req.ip === '::1',
  });

  await server.register(multipart, {
    limits: {
      fileSize: MAX_UPLOAD_BYTES,
    },
  });

  // Health
  server.get('/health', async () => {
    return {
      status: 'ok',
      version: '0.4.0',
      queue: {
        activeJobs: jobs.size,
      },
    };
  });

  // Config & Limits
  server.get('/config', async () => {
    return {
      presets,
      limits: whatsappLimits,
      maxUploadBytes: MAX_UPLOAD_BYTES,
      retentionMinutes: RETENTION_MS / 60000,
    };
  });

  // Create Job
  server.post('/jobs', async (request, reply) => {
    const data = await request.file();
    if (!data) {
      throw server.httpErrors.badRequest('Missing file upload');
    }

    const fields = data.fields as Record<string, { value: string } | undefined>;
    const consent = fields.consent?.value;
    if (consent !== 'true') {
      throw server.httpErrors.badRequest('Explicit consent is required for remote server processing');
    }

    const presetId = fields.preset?.value || 'status-hd';
    const jobId = nanoid(16);
    const jobToken = nanoid(32);
    const jobDir = join(DATA_DIR, jobId);

    mkdirSync(jobDir, { recursive: true });
    const inputExt = data.filename.split('.').pop() || 'mp4';
    const inputPath = join(jobDir, `input.${inputExt}`);

    // Stream uploaded file to disk
    await new Promise<void>((resolve, reject) => {
      const writeStream = createWriteStream(inputPath);
      data.file.pipe(writeStream);
      data.file.on('end', () => resolve());
      data.file.on('error', (err) => reject(err));
    });

    const job: Job = {
      id: jobId,
      token: jobToken,
      status: 'queued',
      progressRatio: 0,
      createdAt: Date.now(),
      expiresAt: Date.now() + RETENTION_MS,
      preset: presetId,
      outputs: [],
    };

    jobs.set(jobId, job);

    // Asynchronously kick off ffmpeg processing
    setImmediate(async () => {
      job.status = 'processing';
      try {
        const outFileName = 'whatmedia-01of01.mp4';
        const outputPath = join(jobDir, outFileName);

        const args = buildFfmpegArgs({
          inputPath,
          outputPath,
          startSec: 0,
          durationSec: 60,
          width: 1080,
          height: 1920,
          fps: 30,
          videoBitrateBps: 5_000_000,
          audioBitrateBps: 128_000,
          needsToneMap: false,
        });

        await new Promise<void>((resolve, reject) => {
          const proc = spawn('ffmpeg', args);
          proc.on('close', (code) => {
            if (code === 0) resolve();
            else reject(new Error(`ffmpeg exited with code ${code}`));
          });
          proc.on('error', (err) => reject(err));
        });

        if (existsSync(outputPath)) {
          const stat = statSync(outputPath);
          job.outputs.push({
            index: 1,
            totalSegments: 1,
            durationSec: 60,
            sizeBytes: stat.size,
            downloadUrl: `/api/v1/jobs/${jobId}/files/1`,
          });
        }

        job.status = 'done';
        job.progressRatio = 1;
      } catch (err: unknown) {
        job.status = 'failed';
        job.error = err instanceof Error ? err.message : 'Processing failed';
      }
    });

    return reply.status(202).send({
      jobId,
      jobToken,
      status: job.status,
      expiresAt: new Date(job.expiresAt).toISOString(),
    });
  });

  // Get Job Status
  server.get<{ Params: { jobId: string } }>('/jobs/:jobId', async (request) => {
    const { jobId } = request.params;
    const auth = request.headers.authorization;
    const job = jobs.get(jobId);

    if (!job) {
      throw server.httpErrors.notFound('Job not found');
    }

    if (!auth || !auth.includes(job.token)) {
      throw server.httpErrors.unauthorized('Invalid or missing job token');
    }

    return {
      jobId: job.id,
      status: job.status,
      progressRatio: job.progressRatio,
      outputs: job.outputs,
      error: job.error,
    };
  });

  // Download File
  server.get<{ Params: { jobId: string; index: string } }>(
    '/jobs/:jobId/files/:index',
    async (request, reply) => {
      const { jobId, index } = request.params;
      const job = jobs.get(jobId);
      if (!job) {
        throw server.httpErrors.notFound('Job not found');
      }

      const jobDir = join(DATA_DIR, jobId);
      const outFileName = `whatmedia-0${index}of01.mp4`;
      const filePath = join(jobDir, outFileName);

      if (!existsSync(filePath)) {
        throw server.httpErrors.notFound('File not ready or not found');
      }

      return reply
        .header('Content-Type', 'video/mp4')
        .header('Content-Disposition', `attachment; filename="${outFileName}"`)
        .send(createWriteStream(filePath));
    },
  );

  // Delete Job (immediate cleanup)
  server.delete<{ Params: { jobId: string } }>('/jobs/:jobId', async (request, reply) => {
    const { jobId } = request.params;
    const auth = request.headers.authorization;
    const job = jobs.get(jobId);

    if (job) {
      if (!auth || !auth.includes(job.token)) {
        throw server.httpErrors.unauthorized('Invalid or missing job token');
      }

      const jobDir = join(DATA_DIR, jobId);
      try {
        rmSync(jobDir, { recursive: true, force: true });
      } catch {
        // Silently continue
      }
      jobs.delete(jobId);
    }

    return reply.status(204).send();
  });

  return server;
}

// Background cleanup job for expired files every 60s
setInterval(() => {
  const now = Date.now();
  for (const [id, job] of jobs.entries()) {
    if (now >= job.expiresAt) {
      const jobDir = join(DATA_DIR, id);
      try {
        rmSync(jobDir, { recursive: true, force: true });
      } catch {
        // Ignore
      }
      jobs.delete(id);
    }
  }
}, 60000).unref();

export async function start() {
  const server = await buildServer();
  try {
    await server.listen({ port: PORT, host: HOST });
    console.log(`WhatMedia Fallback API listening at http://${HOST}:${PORT}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== 'test') {
  start();
}
