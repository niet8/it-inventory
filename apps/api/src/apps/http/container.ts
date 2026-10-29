import type { Config } from '#apps/http/config/env';
import { createPrismaClient } from '#shared/infrastructure/persistence/prisma-client';

// The only place where infrastructure is instantiated: repositories → use cases → handlers, per module.
export const buildContainer = (config: Config) => {
  const database = createPrismaClient(config.databaseUrl);

  return {
    database,
    dispose: () => database.$disconnect(),
  };
};

export type Container = ReturnType<typeof buildContainer>;
