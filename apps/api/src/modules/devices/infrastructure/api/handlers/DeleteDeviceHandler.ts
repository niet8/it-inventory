import type { FastifyReply, FastifyRequest } from 'fastify';

import type { DeleteDevice } from '#modules/devices/application/DeleteDevice/DeleteDevice';
import type { DeviceParams } from '#modules/devices/infrastructure/api/schemas/device.schema';
import { ok } from '#shared/infrastructure/api/response';

export class DeleteDeviceHandler {
  constructor(private readonly deleteDevice: DeleteDevice) {}

  handle = async (request: FastifyRequest<{ Params: DeviceParams }>, reply: FastifyReply) => {
    await this.deleteDevice.execute({ id: request.params.id });
    return reply.send(ok({ id: request.params.id }));
  };
}
