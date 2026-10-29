import { describe, expect, it } from 'vitest';

import { loadConfig } from '#apps/http/config/env';

const DATABASE_URL = 'postgresql://inventory:inventory@localhost:5433/inventory';

describe('loadConfig', () => {
  it('applies defaults for local development', () => {
    expect(loadConfig({ DATABASE_URL })).toEqual({
      nodeEnv: 'development',
      host: '0.0.0.0',
      port: 3000,
      databaseUrl: DATABASE_URL,
      corsOrigins: ['http://localhost:5173'],
      trustProxyHops: 0,
    });
  });

  it('parses a comma-separated CORS allowlist and numeric values', () => {
    const config = loadConfig({
      DATABASE_URL,
      NODE_ENV: 'production',
      PORT: '8080',
      CORS_ORIGINS: 'https://inventory.example.com, http://localhost:5173',
      TRUST_PROXY_HOPS: '1',
    });

    expect(config.port).toBe(8080);
    expect(config.corsOrigins).toEqual(['https://inventory.example.com', 'http://localhost:5173']);
    expect(config.trustProxyHops).toBe(1);
  });

  it('fails fast with the offending variable', () => {
    expect(() => loadConfig({})).toThrow(/DATABASE_URL/);
    expect(() => loadConfig({ DATABASE_URL: 'mysql://db/inventory' })).toThrow(/DATABASE_URL/);
    expect(() => loadConfig({ DATABASE_URL, CORS_ORIGINS: 'not-a-url' })).toThrow(/CORS_ORIGINS/);
    expect(() => loadConfig({ DATABASE_URL, PORT: 'abc' })).toThrow(/PORT/);
  });
});
