import type { FastifyReply, FastifyRequest } from 'fastify';

import type { UnassignDevice } from '#modules/devices/application/UnassignDevice/UnassignDevice';
import type { DeviceParams } from '#modules/devices/infrastructure/api/schemas/device.schema';
import { ok } from '#shared/infrastructure/api/response';

export class UnassignDeviceHandler {
  constructor(private readonly unassignDevice: UnassignDevice) {}

  handle = async (request: FastifyRequest<{ Params: DeviceParams }>, reply: FastifyReply) =>
    reply.send(ok(await this.unassignDevice.execute({ id: request.params.id })));
}
