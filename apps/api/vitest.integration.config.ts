import { existsSync } from 'node:fs';

import { defineConfig } from 'vitest/config';

if (existsSync('.env')) process.loadEnvFile('.env');

// Runs against the database in DATABASE_URL (`pnpm db:up` locally). Files share it, so they run one at a time.
export default defineConfig({
  resolve: { conditions: ['source'] },
  ssr: { resolve: { conditions: ['source'] } },
  test: {
    include: ['src/**/*.int.spec.ts'],
    fileParallelism: false,
  },
});
