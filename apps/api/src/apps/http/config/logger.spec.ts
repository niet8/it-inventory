import { describe, expect, it } from 'vitest';

import { loggerFor } from '#apps/http/config/logger';

describe('loggerFor', () => {
  it('silences tests, logs JSON in production and pretty-prints in development', () => {
    expect(loggerFor('test')).toBe(false);
    expect(loggerFor('production')).toEqual({ level: 'info' });
    expect(loggerFor('development')).toEqual({ level: 'debug', transport: { target: 'pino-pretty' } });
  });
});
