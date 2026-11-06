import type { FastifyReply, FastifyRequest } from 'fastify';

import type { ListFloorMaps } from '#modules/floor-maps/application/ListFloorMaps/ListFloorMaps';
import { ok } from '#shared/infrastructure/api/response';

export class ListFloorMapsHandler {
  constructor(private readonly listFloorMaps: ListFloorMaps) {}

  handle = async (_request: FastifyRequest, reply: FastifyReply) => {
    return reply.send(ok(await this.listFloorMaps.execute()));
  };
}
