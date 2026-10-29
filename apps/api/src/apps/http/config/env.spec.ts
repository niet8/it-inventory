import { describe, expect, it } from 'vitest';

import { loadConfig } from '#apps/http/config/env';

describe('loadConfig', () => {
  it('applies defaults for local development', () => {
    expect(loadConfig({})).toEqual({
      nodeEnv: 'development',
      host: '0.0.0.0',
      port: 3000,
      corsOrigins: ['http://localhost:5173'],
      trustProxyHops: 0,
    });
  });

  it('parses a comma-separated CORS allowlist and numeric values', () => {
    const config = loadConfig({
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
    expect(() => loadConfig({ CORS_ORIGINS: 'not-a-url' })).toThrow(/CORS_ORIGINS/);
    expect(() => loadConfig({ PORT: 'abc' })).toThrow(/PORT/);
  });
});
