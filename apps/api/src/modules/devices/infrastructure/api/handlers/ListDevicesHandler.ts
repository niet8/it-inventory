import type { FastifyReply, FastifyRequest } from 'fastify';

import type { ListDevices } from '#modules/devices/application/ListDevices/ListDevices';
import type { ListDevicesQuery } from '#modules/devices/infrastructure/api/schemas/device.schema';
import { ok } from '#shared/infrastructure/api/response';

export class ListDevicesHandler {
  constructor(private readonly listDevices: ListDevices) {}

  handle = async (request: FastifyRequest<{ Querystring: ListDevicesQuery }>, reply: FastifyReply) =>
    reply.send(ok(await this.listDevices.execute(request.query)));
}
