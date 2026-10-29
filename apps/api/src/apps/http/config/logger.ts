import type { FastifyServerOptions } from 'fastify';

import type { Config } from '#apps/http/config/env';

type LoggerOptions = NonNullable<FastifyServerOptions['logger']>;

export const loggerFor = (nodeEnv: Config['nodeEnv']): LoggerOptions => {
  if (nodeEnv === 'test') return false;
  if (nodeEnv === 'production') return { level: 'info' };
  return { level: 'debug', transport: { target: 'pino-pretty' } };
};
