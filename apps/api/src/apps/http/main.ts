import { loadConfig } from '#apps/http/config/env';
import { buildContainer } from '#apps/http/container';
import { createServer } from '#apps/http/server';

const config = loadConfig();
const server = createServer(config, buildContainer(config));

const shutdown = async (signal: NodeJS.Signals) => {
  server.log.info({ signal }, 'Shutting down');
  await server.close();
  process.exit(0);
};

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => void shutdown(signal));
}

await server.listen({ host: config.host, port: config.port });
