import type { CreateFloorMapBodySchema } from '@it-inventory/contracts';
import type { FastifyReply, FastifyRequest } from 'fastify';
import type { z } from 'zod';

import type { CreateFloorMap } from '#modules/floor-maps/application/CreateFloorMap/CreateFloorMap';
import { ok } from '#shared/infrastructure/api/response';

// Parsed body: `validate` already applied the default grid size.
export type CreateFloorMapRoute = { Body: z.infer<typeof CreateFloorMapBodySchema> };

export class CreateFloorMapHandler {
  constructor(private readonly createFloorMap: CreateFloorMap) {}

  handle = async (request: FastifyRequest<CreateFloorMapRoute>, reply: FastifyReply) => {
    return reply.status(201).send(ok(await this.createFloorMap.execute(request.body)));
  };
}
