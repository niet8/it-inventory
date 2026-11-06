import type { FastifyReply, FastifyRequest } from 'fastify';

import type { GetDeviceStats } from '#modules/devices/application/GetDeviceStats/GetDeviceStats';
import { ok } from '#shared/infrastructure/api/response';

export class GetDeviceStatsHandler {
  constructor(private readonly getDeviceStats: GetDeviceStats) {}

  handle = async (_request: FastifyRequest, reply: FastifyReply) => reply.send(ok(await this.getDeviceStats.execute()));
}
