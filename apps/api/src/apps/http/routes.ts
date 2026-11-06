import type { FastifyInstance } from 'fastify';

import type { Container } from '#apps/http/container';
import { devicesRoutes } from '#modules/devices/infrastructure/api/routes/devices.routes';
import { employeesRoutes } from '#modules/employees/infrastructure/api/routes/employees.routes';
import { ok } from '#shared/infrastructure/api/response';

// One `register` per module, each with its own prefix.
export const buildRoutes = (container: Container) => async (server: FastifyInstance) => {
  server.get('/health', async () => ok({ status: 'up' }));
  server.register(employeesRoutes(container.employees), { prefix: '/employees' });
  server.register(devicesRoutes(container.devices), { prefix: '/devices' });
};
