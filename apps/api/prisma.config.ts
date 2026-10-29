import { existsSync } from 'node:fs';

import { defineConfig } from 'prisma/config';

// The Prisma CLI does not load .env on its own; the app does it with `node --env-file-if-exists`.
if (existsSync('.env')) process.loadEnvFile('.env');

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  // Only migrate/studio need it; `prisma generate` works without a database.
  datasource: { url: process.env.DATABASE_URL ?? '' },
});
