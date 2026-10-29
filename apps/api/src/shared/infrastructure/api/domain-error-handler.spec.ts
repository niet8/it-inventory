import Fastify from 'fastify';
import { describe, expect, it } from 'vitest';

import { BusinessRuleViolationError, ConflictError, NotFoundError, ValidationError } from '#shared/domain/DomainError';
import { domainErrorHandler } from '#shared/infrastructure/api/domain-error-handler';

const respondTo = async (error: Error) => {
  const app = Fastify({ logger: false });
  app.setErrorHandler(domainErrorHandler);
  app.get('/', async () => {
    throw error;
  });
  return app.inject({ method: 'GET', url: '/' });
};

describe('domainErrorHandler', () => {
  it.each([
    [new ValidationError('Name is required', 'name'), 400],
    [new NotFoundError('Device', 'd-1'), 404],
    [new ConflictError('Email already in use'), 409],
    [new BusinessRuleViolationError('Device is decommissioned'), 422],
  ])('maps %s to its HTTP status with the domain message', async (error, status) => {
    const response = await respondTo(error);

    expect(response.statusCode).toBe(status);
    expect(response.json()).toEqual({ status: 'ERROR', message: error.message });
  });

  it("keeps the status of Fastify's own client errors", async () => {
    const tooMany = Object.assign(new Error('Rate limit exceeded'), { statusCode: 429 });

    const response = await respondTo(tooMany);

    expect(response.statusCode).toBe(429);
    expect(response.json()).toEqual({ status: 'ERROR', message: 'Rate limit exceeded' });
  });

  it('hides the details of unexpected errors', async () => {
    const response = await respondTo(new Error('connection string leaked'));

    expect(response.statusCode).toBe(500);
    expect(response.json()).toEqual({ status: 'ERROR', message: 'Internal server error' });
  });

  it('treats a server-side Fastify status as unexpected', async () => {
    const response = await respondTo(Object.assign(new Error('upstream down'), { statusCode: 503 }));

    expect(response.statusCode).toBe(500);
  });
});
