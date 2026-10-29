import type { FastifyReply, FastifyRequest } from 'fastify';

import type { ListEmployees } from '#modules/employees/application/ListEmployees/ListEmployees';
import type { ListEmployeesQuery } from '#modules/employees/infrastructure/api/schemas/employee.schema';
import { ok } from '#shared/infrastructure/api/response';

export class ListEmployeesHandler {
  constructor(private readonly listEmployees: ListEmployees) {}

  handle = async (request: FastifyRequest<{ Querystring: ListEmployeesQuery }>, reply: FastifyReply) =>
    reply.send(ok(await this.listEmployees.execute(request.query)));
}
