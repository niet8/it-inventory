import type { FastifyReply, FastifyRequest } from 'fastify';

import type { CreateEmployee } from '#modules/employees/application/CreateEmployee/CreateEmployee';
import type { CreateEmployeeBody } from '#modules/employees/infrastructure/api/schemas/employee.schema';
import { ok } from '#shared/infrastructure/api/response';

export class CreateEmployeeHandler {
  constructor(private readonly createEmployee: CreateEmployee) {}

  handle = async (request: FastifyRequest<{ Body: CreateEmployeeBody }>, reply: FastifyReply) =>
    reply.status(201).send(ok(await this.createEmployee.execute(request.body)));
}
