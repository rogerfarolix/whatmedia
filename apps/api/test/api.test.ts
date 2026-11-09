import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildServer } from '../src/server.js';
import type { FastifyInstance } from 'fastify';

describe('Fallback API Endpoints', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildServer();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health returns 200 with queue status', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/health',
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.status).toBe('ok');
    expect(body.version).toBe('0.4.0');
    expect(body.queue).toBeDefined();
  });

  it('GET /config returns limits and presets', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/config',
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.limits.maxStatusVideoSec).toBe(60);
    expect(body.presets['status-hd']).toBeDefined();
  });

  it('POST /jobs without multipart body rejects request', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/jobs',
    });

    expect(res.statusCode).toBeGreaterThanOrEqual(400);
  });
});
