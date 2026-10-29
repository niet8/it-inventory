import type { FastifyInstance } from 'fastify';

import type { Container } from '#apps/http/container';
import { floorMapsRoutes } from '#modules/floor-maps/infrastructure/api/routes/floor-maps.routes';
import { ok } from '#shared/infrastructure/api/response';

// One `register` per module, each with its own prefix.
export const registerRoutes = (container: Container) => async (server: FastifyInstance) => {
  server.get('/health', async () => ok({ status: 'up' }));
  server.register(floorMapsRoutes(container.floorMaps), { prefix: '/floor-maps' });
};
