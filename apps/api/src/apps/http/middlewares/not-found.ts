import type { FastifyReply, FastifyRequest } from 'fastify';

import { fail } from '#shared/infrastructure/api/response';

export const notFoundHandler = (request: FastifyRequest, reply: FastifyReply) =>
  reply.status(404).send(fail(`Route ${request.method} ${request.url} not found`));
