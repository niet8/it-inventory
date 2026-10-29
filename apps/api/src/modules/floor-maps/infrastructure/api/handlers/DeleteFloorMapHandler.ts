import type { FastifyReply, FastifyRequest } from 'fastify';

import type { DeleteFloorMap } from '#modules/floor-maps/application/DeleteFloorMap/DeleteFloorMap';
import type { FloorMapParams } from '#modules/floor-maps/infrastructure/api/schemas/floor-map.schema';
import { ok } from '#shared/infrastructure/api/response';

export type DeleteFloorMapRoute = { Params: FloorMapParams };

export class DeleteFloorMapHandler {
  constructor(private readonly deleteFloorMap: DeleteFloorMap) {}

  handle = async (request: FastifyRequest<DeleteFloorMapRoute>, reply: FastifyReply) => {
    await this.deleteFloorMap.execute({ id: request.params.id });
    return reply.send(ok(null));
  };
}
