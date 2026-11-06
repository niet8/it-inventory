import type { FastifyReply, FastifyRequest } from 'fastify';

import type { ReactivateDevice } from '#modules/devices/application/ReactivateDevice/ReactivateDevice';
import type { DeviceParams } from '#modules/devices/infrastructure/api/schemas/device.schema';
import { ok } from '#shared/infrastructure/api/response';

export class ReactivateDeviceHandler {
  constructor(private readonly reactivateDevice: ReactivateDevice) {}

  handle = async (request: FastifyRequest<{ Params: DeviceParams }>, reply: FastifyReply) =>
    reply.send(ok(await this.reactivateDevice.execute({ id: request.params.id })));
}
