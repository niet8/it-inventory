import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import Fastify, { type FastifyInstance } from 'fastify';

import type { Config } from '#apps/http/config/env';
import { loggerFor } from '#apps/http/config/logger';
import type { Container } from '#apps/http/container';
import { notFoundHandler } from '#apps/http/middlewares/not-found';
import { echoRequestId, generateRequestId, REQUEST_ID_HEADER } from '#apps/http/middlewares/request-id';
import { registerRoutes } from '#apps/http/routes';
import { domainErrorHandler } from '#shared/infrastructure/api/domain-error-handler';

// The public demo has no login: rate limiting is its first line of defence. Autosave of the map is debounced.
const RATE_LIMIT = { max: 300, timeWindow: '1 minute' };

export const createServer = (config: Config, container: Container): FastifyInstance => {
  const server = Fastify({
    logger: loggerFor(config.nodeEnv),
    requestIdHeader: REQUEST_ID_HEADER,
    genReqId: generateRequestId,
    trustProxy: (_address, hop) => hop < config.trustProxyHops,
  });

  server.register(helmet);
  server.register(cors, { origin: config.corsOrigins, methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] });
  server.register(rateLimit, RATE_LIMIT);

  server.addHook('onSend', echoRequestId);
  server.addHook('onClose', container.dispose);
  server.setErrorHandler(domainErrorHandler);
  server.setNotFoundHandler(notFoundHandler);
  server.register(registerRoutes(container));

  return server;
};
