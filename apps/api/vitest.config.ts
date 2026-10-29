import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Resolve workspace packages and `#` imports to their TypeScript sources.
  resolve: { conditions: ['source'] },
  ssr: { resolve: { conditions: ['source'] } },
  test: {
    include: ['src/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.spec.ts', 'src/apps/http/main.ts', 'src/generated/**'],
      thresholds: { statements: 85, branches: 85, functions: 85, lines: 85 },
    },
  },
});
