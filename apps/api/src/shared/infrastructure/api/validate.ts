import type { preHandlerAsyncHookHandler } from 'fastify';
import type { ZodType } from 'zod';

import { fail } from '#shared/infrastructure/api/response';

type RequestPart = 'body' | 'params' | 'query';

// Checks the shape of the input and replaces it with the parsed value (trimmed strings, coerced numbers, defaults).
export const validate =
  (schema: ZodType, part: RequestPart = 'body'): preHandlerAsyncHookHandler =>
  async (request, reply) => {
    const result = schema.safeParse(request[part]);
    if (!result.success) {
      const message = result.error.issues
        .map((issue) => `${issue.path.join('.') || part}: ${issue.message}`)
        .join('; ');
      return reply.status(400).send(fail(message));
    }
    (request as unknown as Record<RequestPart, unknown>)[part] = result.data;
  };
