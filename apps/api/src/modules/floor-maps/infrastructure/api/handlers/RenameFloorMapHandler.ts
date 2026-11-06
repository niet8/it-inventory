import type { RenameFloorMapBody } from '@it-inventory/contracts';
import type { FastifyReply, FastifyRequest } from 'fastify';

import type { RenameFloorMap } from '#modules/floor-maps/application/RenameFloorMap/RenameFloorMap';
import type { FloorMapParams } from '#modules/floor-maps/infrastructure/api/schemas/floor-map.schema';
import { ok } from '#shared/infrastructure/api/response';

export type RenameFloorMapRoute = { Params: FloorMapParams; Body: RenameFloorMapBody };

export class RenameFloorMapHandler {
  constructor(private readonly renameFloorMap: RenameFloorMap) {}

  handle = async (request: FastifyRequest<RenameFloorMapRoute>, reply: FastifyReply) => {
    const result = await this.renameFloorMap.execute({ id: request.params.id, name: request.body.name });
    return reply.send(ok(result));
  };
}
