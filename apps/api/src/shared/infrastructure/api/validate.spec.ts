import Fastify from 'fastify';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { validate } from '#shared/infrastructure/api/validate';

const buildApp = () => {
  const app = Fastify();
  const body = z.object({ name: z.string().trim().min(1) });
  const query = z.object({ page: z.coerce.number().int().min(1).default(1) });
  app.post('/items', { preHandler: validate(body) }, async (request) => request.body);
  app.get('/items', { preHandler: validate(query, 'query') }, async (request) => request.query);
  return app;
};

describe('validate', () => {
  it('replaces the input with the parsed value', async () => {
    const app = buildApp();

    const created = await app.inject({ method: 'POST', url: '/items', payload: { name: '  Laptop ' } });
    const listed = await app.inject({ method: 'GET', url: '/items?page=3' });
    const defaulted = await app.inject({ method: 'GET', url: '/items' });

    expect(created.json()).toEqual({ name: 'Laptop' });
    expect(listed.json()).toEqual({ page: 3 });
    expect(defaulted.json()).toEqual({ page: 1 });
  });

  it('answers 400 with every issue and the offending path', async () => {
    const app = buildApp();

    const response = await app.inject({ method: 'POST', url: '/items', payload: { name: '' } });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({ status: 'ERROR', message: expect.stringMatching(/^name: /) });
  });

  it('names the request part when the whole input is invalid', async () => {
    const app = buildApp();

    const response = await app.inject({ method: 'POST', url: '/items', payload: [] });

    expect(response.json().message).toMatch(/^body: /);
  });
});
