import type { Config } from '#apps/http/config/env';
import { buildFloorMapsHandlers } from '#modules/floor-maps/infrastructure/api/routes/floor-maps.routes';
import { createPrismaClient } from '#shared/infrastructure/persistence/prisma-client';

// The only place where infrastructure is instantiated: repositories → use cases → handlers, per module.
export const buildContainer = (config: Config) => {
  const database = createPrismaClient(config.databaseUrl);

  return {
    database,
    floorMaps: buildFloorMapsHandlers(database),
    dispose: () => database.$disconnect(),
  };
};

export type Container = ReturnType<typeof buildContainer>;
