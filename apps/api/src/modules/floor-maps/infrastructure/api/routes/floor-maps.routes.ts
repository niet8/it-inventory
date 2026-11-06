import {
  AssignDeskBodySchema,
  CreateFloorMapBodySchema,
  RenameFloorMapBodySchema,
  SaveLayoutBodySchema,
} from '@it-inventory/contracts';
import type { FastifyInstance } from 'fastify';

import { AssignDesk } from '#modules/floor-maps/application/AssignDesk/AssignDesk';
import { CreateFloorMap } from '#modules/floor-maps/application/CreateFloorMap/CreateFloorMap';
import { DeleteFloorMap } from '#modules/floor-maps/application/DeleteFloorMap/DeleteFloorMap';
import { ListFloorMaps } from '#modules/floor-maps/application/ListFloorMaps/ListFloorMaps';
import { RenameFloorMap } from '#modules/floor-maps/application/RenameFloorMap/RenameFloorMap';
import { SaveLayout } from '#modules/floor-maps/application/SaveLayout/SaveLayout';
import type { IEmployeeLookup } from '#modules/floor-maps/domain/IEmployeeLookup';
import type { IFloorMapRepository } from '#modules/floor-maps/domain/IFloorMapRepository';
import {
  AssignDeskHandler,
  type AssignDeskRoute,
} from '#modules/floor-maps/infrastructure/api/handlers/AssignDeskHandler';
import {
  CreateFloorMapHandler,
  type CreateFloorMapRoute,
} from '#modules/floor-maps/infrastructure/api/handlers/CreateFloorMapHandler';
import {
  DeleteFloorMapHandler,
  type DeleteFloorMapRoute,
} from '#modules/floor-maps/infrastructure/api/handlers/DeleteFloorMapHandler';
import { ListFloorMapsHandler } from '#modules/floor-maps/infrastructure/api/handlers/ListFloorMapsHandler';
import {
  RenameFloorMapHandler,
  type RenameFloorMapRoute,
} from '#modules/floor-maps/infrastructure/api/handlers/RenameFloorMapHandler';
import {
  SaveLayoutHandler,
  type SaveLayoutRoute,
} from '#modules/floor-maps/infrastructure/api/handlers/SaveLayoutHandler';
import {
  DeskParamsSchema,
  FloorMapParamsSchema,
} from '#modules/floor-maps/infrastructure/api/schemas/floor-map.schema';
import { PrismaEmployeeLookup } from '#modules/floor-maps/infrastructure/persistence/repositories/PrismaEmployeeLookup';
import { PrismaFloorMapRepository } from '#modules/floor-maps/infrastructure/persistence/repositories/PrismaFloorMapRepository';
import { validate } from '#shared/infrastructure/api/validate';
import type { Database } from '#shared/infrastructure/persistence/prisma-client';

// Builds the module from its ports: use cases → handlers. Specs pass in-memory adapters.
export const createFloorMapsHandlers = (floorMaps: IFloorMapRepository, employees: IEmployeeLookup) => ({
  list: new ListFloorMapsHandler(new ListFloorMaps(floorMaps)),
  create: new CreateFloorMapHandler(new CreateFloorMap(floorMaps)),
  rename: new RenameFloorMapHandler(new RenameFloorMap(floorMaps)),
  saveLayout: new SaveLayoutHandler(new SaveLayout(floorMaps)),
  assignDesk: new AssignDeskHandler(new AssignDesk(floorMaps, employees)),
  delete: new DeleteFloorMapHandler(new DeleteFloorMap(floorMaps)),
});

export const buildFloorMapsHandlers = (database: Database) =>
  createFloorMapsHandlers(new PrismaFloorMapRepository(database), new PrismaEmployeeLookup(database));

export type FloorMapsHandlers = ReturnType<typeof createFloorMapsHandlers>;

const params = validate(FloorMapParamsSchema, 'params');

// Only routes: verb + path + validation + handler.
export const floorMapsRoutes = (handlers: FloorMapsHandlers) => async (fastify: FastifyInstance) => {
  fastify.get('/', handlers.list.handle);
  fastify.post<CreateFloorMapRoute>('/', { preHandler: validate(CreateFloorMapBodySchema) }, handlers.create.handle);
  fastify.patch<RenameFloorMapRoute>(
    '/:id',
    { preHandler: [params, validate(RenameFloorMapBodySchema)] },
    handlers.rename.handle,
  );
  fastify.put<SaveLayoutRoute>(
    '/:id/layout',
    { preHandler: [params, validate(SaveLayoutBodySchema)] },
    handlers.saveLayout.handle,
  );
  fastify.patch<AssignDeskRoute>(
    '/:id/objects/:objectId/assign',
    { preHandler: [validate(DeskParamsSchema, 'params'), validate(AssignDeskBodySchema)] },
    handlers.assignDesk.handle,
  );
  fastify.delete<DeleteFloorMapRoute>('/:id', { preHandler: params }, handlers.delete.handle);
};
