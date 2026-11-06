import type { FastifyReply, FastifyRequest } from 'fastify';

import type { DecommissionDevice } from '#modules/devices/application/DecommissionDevice/DecommissionDevice';
import type { DeviceParams } from '#modules/devices/infrastructure/api/schemas/device.schema';
import { ok } from '#shared/infrastructure/api/response';

export class DecommissionDeviceHandler {
  constructor(private readonly decommissionDevice: DecommissionDevice) {}

  handle = async (request: FastifyRequest<{ Params: DeviceParams }>, reply: FastifyReply) =>
    reply.send(ok(await this.decommissionDevice.execute({ id: request.params.id })));
}
