import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '#generated/prisma/client';

export type Database = PrismaClient;

// Connects lazily on the first query; the container disconnects it when the server closes.
export const createPrismaClient = (databaseUrl: string): Database =>
  new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
