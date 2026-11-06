import type { Config } from '#apps/http/config/env';
import { buildDevicesHandlers } from '#modules/devices/infrastructure/api/routes/devices.routes';
import { buildEmployeesHandlers } from '#modules/employees/infrastructure/api/routes/employees.routes';
import { buildFloorMapsHandlers } from '#modules/floor-maps/infrastructure/api/routes/floor-maps.routes';
import { createPrismaClient } from '#shared/infrastructure/persistence/prisma-client';

// Composition root: each module builds its own repositories → use cases → handlers.
export const buildContainer = (config: Config) => {
  const database = createPrismaClient(config.databaseUrl);

  return {
    employees: buildEmployeesHandlers(database),
    devices: buildDevicesHandlers(database),
    floorMaps: buildFloorMapsHandlers(database),
    dispose: () => database.$disconnect(),
  };
};

export type Container = ReturnType<typeof buildContainer>;
