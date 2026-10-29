import type { FastifyReply, FastifyRequest } from 'fastify';

import type { UpdateEmployee } from '#modules/employees/application/UpdateEmployee/UpdateEmployee';
import type { EmployeeParams, UpdateEmployeeBody } from '#modules/employees/infrastructure/api/schemas/employee.schema';
import { ok } from '#shared/infrastructure/api/response';

export class UpdateEmployeeHandler {
  constructor(private readonly updateEmployee: UpdateEmployee) {}

  handle = async (request: FastifyRequest<{ Params: EmployeeParams; Body: UpdateEmployeeBody }>, reply: FastifyReply) =>
    reply.send(ok(await this.updateEmployee.execute({ id: request.params.id, changes: request.body })));
}
