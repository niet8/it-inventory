import {
  AssignDeviceBodySchema,
  CreateDevicesBodySchema,
  ListDevicesQuerySchema,
  UpdateDeviceBodySchema,
} from '@it-inventory/contracts';
import type { FastifyInstance } from 'fastify';

import { AssignDevice } from '#modules/devices/application/AssignDevice/AssignDevice';
import { CreateDevices } from '#modules/devices/application/CreateDevices/CreateDevices';
import { DecommissionDevice } from '#modules/devices/application/DecommissionDevice/DecommissionDevice';
import { DeleteDevice } from '#modules/devices/application/DeleteDevice/DeleteDevice';
import { GetDeviceStats } from '#modules/devices/application/GetDeviceStats/GetDeviceStats';
import { ListDevices } from '#modules/devices/application/ListDevices/ListDevices';
import { ReactivateDevice } from '#modules/devices/application/ReactivateDevice/ReactivateDevice';
import { UnassignDevice } from '#modules/devices/application/UnassignDevice/UnassignDevice';
import { UpdateDevice } from '#modules/devices/application/UpdateDevice/UpdateDevice';
import { AssignDeviceHandler } from '#modules/devices/infrastructure/api/handlers/AssignDeviceHandler';
import { CreateDevicesHandler } from '#modules/devices/infrastructure/api/handlers/CreateDevicesHandler';
import { DecommissionDeviceHandler } from '#modules/devices/infrastructure/api/handlers/DecommissionDeviceHandler';
import { DeleteDeviceHandler } from '#modules/devices/infrastructure/api/handlers/DeleteDeviceHandler';
import { GetDeviceStatsHandler } from '#modules/devices/infrastructure/api/handlers/GetDeviceStatsHandler';
import { ListDevicesHandler } from '#modules/devices/infrastructure/api/handlers/ListDevicesHandler';
import { ReactivateDeviceHandler } from '#modules/devices/infrastructure/api/handlers/ReactivateDeviceHandler';
import { UnassignDeviceHandler } from '#modules/devices/infrastructure/api/handlers/UnassignDeviceHandler';
import { UpdateDeviceHandler } from '#modules/devices/infrastructure/api/handlers/UpdateDeviceHandler';
import {
  type AssignDeviceBody,
  type CreateDevicesBody,
  type DeviceParams,
  DeviceParamsSchema,
  type ListDevicesQuery,
  type UpdateDeviceBody,
} from '#modules/devices/infrastructure/api/schemas/device.schema';
import { PrismaDeviceRepository } from '#modules/devices/infrastructure/persistence/repositories/PrismaDeviceRepository';
import { PrismaEmployeeLookup } from '#modules/devices/infrastructure/persistence/repositories/PrismaEmployeeLookup';
import { validate } from '#shared/infrastructure/api/validate';
import type { Database } from '#shared/infrastructure/persistence/prisma-client';

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

// The only `new`s of the module: repositories → use cases → handlers.
export const buildDevicesHandlers = (database: Database): DevicesHandlers => {
  const deviceRepository = new PrismaDeviceRepository(database);
  const employeeLookup = new PrismaEmployeeLookup(database);
  return {
    create: new CreateDevicesHandler(new CreateDevices(deviceRepository)),
    update: new UpdateDeviceHandler(new UpdateDevice(deviceRepository)),
    delete: new DeleteDeviceHandler(new DeleteDevice(deviceRepository)),
    assign: new AssignDeviceHandler(new AssignDevice(deviceRepository, employeeLookup)),
    unassign: new UnassignDeviceHandler(new UnassignDevice(deviceRepository)),
    decommission: new DecommissionDeviceHandler(new DecommissionDevice(deviceRepository)),
    reactivate: new ReactivateDeviceHandler(new ReactivateDevice(deviceRepository)),
    list: new ListDevicesHandler(new ListDevices(deviceRepository)),
    stats: new GetDeviceStatsHandler(new GetDeviceStats(deviceRepository)),
  };
};

type ById = { Params: DeviceParams };

// Only routes: verb + path + validation + handler.
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
