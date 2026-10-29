import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  HOST: z.string().min(1).default('0.0.0.0'),
  PORT: z.coerce.number().int().min(1).max(65_535).default(3000),
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
  // Comma-separated allowlist, e.g. "https://app.example.com,http://localhost:5173".
  CORS_ORIGINS: z
    .string()
    .default('http://localhost:5173')
    .transform((value) => value.split(',').map((origin) => origin.trim()))
    .pipe(z.array(z.url()).min(1)),
  // Proxies in front of the API (1 on Render). Never `true`: a spoofed X-Forwarded-For would bypass the rate limit.
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).default(0),
});

export type Config = {
  nodeEnv: 'development' | 'test' | 'production';
  host: string;
  port: number;
  databaseUrl: string;
  corsOrigins: string[];
  trustProxyHops: number;
};

export const loadConfig = (env: NodeJS.ProcessEnv = process.env): Config => {
  const result = EnvSchema.safeParse(env);
  if (!result.success) throw new Error(`Invalid environment:\n${z.prettifyError(result.error)}`);

  const { NODE_ENV, HOST, PORT, DATABASE_URL, CORS_ORIGINS, TRUST_PROXY_HOPS } = result.data;
  return {
    nodeEnv: NODE_ENV,
    host: HOST,
    port: PORT,
    databaseUrl: DATABASE_URL,
    corsOrigins: CORS_ORIGINS,
    trustProxyHops: TRUST_PROXY_HOPS,
  };
};
