import type { FastifyReply, FastifyRequest } from 'fastify';

import type { AssignDevice } from '#modules/devices/application/AssignDevice/AssignDevice';
import type { AssignDeviceBody, DeviceParams } from '#modules/devices/infrastructure/api/schemas/device.schema';
import { ok } from '#shared/infrastructure/api/response';

export class AssignDeviceHandler {
  constructor(private readonly assignDevice: AssignDevice) {}

  handle = async (request: FastifyRequest<{ Params: DeviceParams; Body: AssignDeviceBody }>, reply: FastifyReply) =>
    reply.send(
      ok(await this.assignDevice.execute({ deviceId: request.params.id, employeeId: request.body.employeeId })),
    );
}
