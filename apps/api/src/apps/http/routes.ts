import type { FastifyInstance } from 'fastify';

import { ok } from '#shared/infrastructure/api/response';

// One `register` per module, each with its own prefix.
export const registerRoutes = async (server: FastifyInstance) => {
  server.get('/health', async () => ok({ status: 'up' }));
};
