import type { FastifyReply, FastifyRequest } from 'fastify';

import type { DeleteEmployee } from '#modules/employees/application/DeleteEmployee/DeleteEmployee';
import type { EmployeeParams } from '#modules/employees/infrastructure/api/schemas/employee.schema';
import { ok } from '#shared/infrastructure/api/response';

export class DeleteEmployeeHandler {
  constructor(private readonly deleteEmployee: DeleteEmployee) {}

  handle = async (request: FastifyRequest<{ Params: EmployeeParams }>, reply: FastifyReply) => {
    await this.deleteEmployee.execute({ id: request.params.id });
    return reply.send(ok({ id: request.params.id }));
  };
}
