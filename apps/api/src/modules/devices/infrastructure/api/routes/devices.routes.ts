import {
  AssignDeviceBodySchema,
  CreateDevicesBodySchema,
  ListDevicesQuerySchema,
  UpdateDeviceBodySchema,
} from '@it-inventory/contracts';
import type { FastifyInstance } from 'fastify';

import type { AssignDeviceHandler } from '#modules/devices/infrastructure/api/handlers/AssignDeviceHandler';
import type { CreateDevicesHandler } from '#modules/devices/infrastructure/api/handlers/CreateDevicesHandler';
import type { DecommissionDeviceHandler } from '#modules/devices/infrastructure/api/handlers/DecommissionDeviceHandler';
import type { DeleteDeviceHandler } from '#modules/devices/infrastructure/api/handlers/DeleteDeviceHandler';
import type { GetDeviceStatsHandler } from '#modules/devices/infrastructure/api/handlers/GetDeviceStatsHandler';
import type { ListDevicesHandler } from '#modules/devices/infrastructure/api/handlers/ListDevicesHandler';
import type { ReactivateDeviceHandler } from '#modules/devices/infrastructure/api/handlers/ReactivateDeviceHandler';
import type { UnassignDeviceHandler } from '#modules/devices/infrastructure/api/handlers/UnassignDeviceHandler';
import type { UpdateDeviceHandler } from '#modules/devices/infrastructure/api/handlers/UpdateDeviceHandler';
import {
  type AssignDeviceBody,
  type CreateDevicesBody,
  type DeviceParams,
  DeviceParamsSchema,
  type ListDevicesQuery,
  type UpdateDeviceBody,
} from '#modules/devices/infrastructure/api/schemas/device.schema';
import { validate } from '#shared/infrastructure/api/validate';

export type DevicesHandlers = {
  create: CreateDevicesHandler;
  update: UpdateDeviceHandler;
  delete: DeleteDeviceHandler;
  assign: AssignDeviceHandler;
  unassign: UnassignDeviceHandler;
  decommission: DecommissionDeviceHandler;
  reactivate: ReactivateDeviceHandler;
  list: ListDevicesHandler;
  stats: GetDeviceStatsHandler;
};

type ById = { Params: DeviceParams };

// Only routes: verb + path + validation + handler. The handlers are built in the container.
export const devicesRoutes = (handlers: DevicesHandlers) => async (fastify: FastifyInstance) => {
  const params = validate(DeviceParamsSchema, 'params');

  fastify.get<{ Querystring: ListDevicesQuery }>(
    '/',
    { preHandler: validate(ListDevicesQuerySchema, 'query') },
    handlers.list.handle,
  );
  fastify.get('/stats', handlers.stats.handle);
  fastify.post<{ Body: CreateDevicesBody }>(
    '/',
    { preHandler: validate(CreateDevicesBodySchema) },
    handlers.create.handle,
  );
  fastify.patch<ById & { Body: UpdateDeviceBody }>(
    '/:id',
    { preHandler: [params, validate(UpdateDeviceBodySchema)] },
    handlers.update.handle,
  );
  fastify.delete<ById>('/:id', { preHandler: params }, handlers.delete.handle);

  // Status transitions: each one is a use case with its own business rules.
  fastify.patch<ById & { Body: AssignDeviceBody }>(
    '/:id/assign',
    { preHandler: [params, validate(AssignDeviceBodySchema)] },
    handlers.assign.handle,
  );
  fastify.patch<ById>('/:id/unassign', { preHandler: params }, handlers.unassign.handle);
  fastify.patch<ById>('/:id/decommission', { preHandler: params }, handlers.decommission.handle);
  fastify.patch<ById>('/:id/reactivate', { preHandler: params }, handlers.reactivate.handle);
};
