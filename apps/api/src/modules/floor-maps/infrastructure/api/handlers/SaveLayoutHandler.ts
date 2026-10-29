import type { SaveLayoutBody } from '@it-inventory/contracts';
import type { FastifyReply, FastifyRequest } from 'fastify';

import type { SaveLayout } from '#modules/floor-maps/application/SaveLayout/SaveLayout';
import type { FloorMapParams } from '#modules/floor-maps/infrastructure/api/schemas/floor-map.schema';
import { ok } from '#shared/infrastructure/api/response';

export type SaveLayoutRoute = { Params: FloorMapParams; Body: SaveLayoutBody };

export class SaveLayoutHandler {
  constructor(private readonly saveLayout: SaveLayout) {}

  handle = async (request: FastifyRequest<SaveLayoutRoute>, reply: FastifyReply) => {
    const result = await this.saveLayout.execute({ id: request.params.id, ...request.body });
    return reply.send(ok(result));
  };
}
