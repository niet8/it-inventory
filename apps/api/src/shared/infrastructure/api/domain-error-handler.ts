import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';

import {
  BusinessRuleViolationError,
  ConflictError,
  DomainError,
  NotFoundError,
  ValidationError,
} from '#shared/domain/DomainError';
import { fail } from '#shared/infrastructure/api/response';

const statusFor = (error: DomainError): number => {
  if (error instanceof ValidationError) return 400;
  if (error instanceof NotFoundError) return 404;
  if (error instanceof ConflictError) return 409;
  if (error instanceof BusinessRuleViolationError) return 422;
  return 500;
};

export const domainErrorHandler = (error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
  if (error instanceof DomainError) return reply.status(statusFor(error)).send(fail(error.message));

  // Fastify's own client errors (malformed JSON, payload too large, rate limit) keep their status.
  if (error.statusCode !== undefined && error.statusCode < 500) {
    return reply.status(error.statusCode).send(fail(error.message));
  }

  request.log.error({ err: error }, 'Unhandled error');
  return reply.status(500).send(fail('Internal server error'));
};
