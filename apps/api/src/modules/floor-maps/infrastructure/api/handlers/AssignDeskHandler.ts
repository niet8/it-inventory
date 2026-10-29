import type { AssignDeskBody } from '@it-inventory/contracts';
import type { FastifyReply, FastifyRequest } from 'fastify';

import type { AssignDesk } from '#modules/floor-maps/application/AssignDesk/AssignDesk';
import type { DeskParams } from '#modules/floor-maps/infrastructure/api/schemas/floor-map.schema';
import { ok } from '#shared/infrastructure/api/response';

export type AssignDeskRoute = { Params: DeskParams; Body: AssignDeskBody };

export class AssignDeskHandler {
  constructor(private readonly assignDesk: AssignDesk) {}

  handle = async (request: FastifyRequest<AssignDeskRoute>, reply: FastifyReply) => {
    const { id, objectId } = request.params;
    const result = await this.assignDesk.execute({ mapId: id, objectId, employeeId: request.body.employeeId });
    return reply.send(ok(result));
  };
}
