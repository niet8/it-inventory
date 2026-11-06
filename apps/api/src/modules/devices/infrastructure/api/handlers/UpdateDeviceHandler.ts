import type { FastifyReply, FastifyRequest } from 'fastify';

import type { UpdateDevice } from '#modules/devices/application/UpdateDevice/UpdateDevice';
import type { DeviceParams, UpdateDeviceBody } from '#modules/devices/infrastructure/api/schemas/device.schema';
import { ok } from '#shared/infrastructure/api/response';

export class UpdateDeviceHandler {
  constructor(private readonly updateDevice: UpdateDevice) {}

  handle = async (request: FastifyRequest<{ Params: DeviceParams; Body: UpdateDeviceBody }>, reply: FastifyReply) =>
    reply.send(ok(await this.updateDevice.execute({ id: request.params.id, changes: request.body })));
}
