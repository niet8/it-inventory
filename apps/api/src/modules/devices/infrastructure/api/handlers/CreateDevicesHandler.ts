import type { FastifyReply, FastifyRequest } from 'fastify';

import type { CreateDevices } from '#modules/devices/application/CreateDevices/CreateDevices';
import type { CreateDevicesBody } from '#modules/devices/infrastructure/api/schemas/device.schema';
import { ok } from '#shared/infrastructure/api/response';

export class CreateDevicesHandler {
  constructor(private readonly createDevices: CreateDevices) {}

  handle = async (request: FastifyRequest<{ Body: CreateDevicesBody }>, reply: FastifyReply) =>
    reply.status(201).send(ok(await this.createDevices.execute(request.body)));
}
