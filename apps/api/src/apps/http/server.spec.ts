import { afterAll, describe, expect, it } from 'vitest';

import { loadConfig } from '#apps/http/config/env';
import { buildContainer } from '#apps/http/container';
import { createServer } from '#apps/http/server';

// No query runs here: the Prisma client only connects on first use.
const testServer = (env: Record<string, string> = {}) => {
  const config = loadConfig({ NODE_ENV: 'test', DATABASE_URL: 'postgresql://user:pass@localhost:5433/test', ...env });
  return createServer(config, buildContainer(config));
};

const server = testServer({ CORS_ORIGINS: 'https://inventory.example.com' });

afterAll(async () => {
  await server.close();
});

describe('createServer', () => {
  it('answers the health check inside the API envelope', async () => {
    const response = await server.inject({ method: 'GET', url: '/health' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'OK', data: { status: 'up' } });
  });

  it('answers unknown routes with a 404 envelope', async () => {
    const response = await server.inject({ method: 'GET', url: '/nope' });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({ status: 'ERROR', message: 'Route GET /nope not found' });
  });

  it('reuses an incoming request id and generates one otherwise', async () => {
    const reused = await server.inject({ method: 'GET', url: '/health', headers: { 'x-request-id': 'req-42' } });
    const generated = await server.inject({ method: 'GET', url: '/health' });

    expect(reused.headers['x-request-id']).toBe('req-42');
    expect(generated.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('only allows the configured origins', async () => {
    const allowed = await server.inject({
      method: 'GET',
      url: '/health',
      headers: { origin: 'https://inventory.example.com' },
    });
    const denied = await server.inject({ method: 'GET', url: '/health', headers: { origin: 'https://evil.example' } });

    expect(allowed.headers['access-control-allow-origin']).toBe('https://inventory.example.com');
    expect(denied.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('trusts X-Forwarded-For only for the configured proxy hops', async () => {
    const clientIp = async (hops: string) => {
      const proxied = testServer({ TRUST_PROXY_HOPS: hops });
      proxied.get('/ip', async (request) => request.ip);
      const response = await proxied.inject({
        method: 'GET',
        url: '/ip',
        headers: { 'x-forwarded-for': '203.0.113.7' },
      });
      await proxied.close();
      return response.body;
    };

    expect(await clientIp('1')).toBe('203.0.113.7');
    expect(await clientIp('0')).toBe('127.0.0.1');
  });

  it('sends security headers and rate-limit headers', async () => {
    const response = await server.inject({ method: 'GET', url: '/health' });

    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-ratelimit-limit']).toBe('300');
  });
});
