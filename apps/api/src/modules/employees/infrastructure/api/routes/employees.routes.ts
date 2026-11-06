import { CreateEmployeeBodySchema, ListEmployeesQuerySchema, UpdateEmployeeBodySchema } from '@it-inventory/contracts';
import type { FastifyInstance } from 'fastify';

import { CreateEmployee } from '#modules/employees/application/CreateEmployee/CreateEmployee';
import { DeleteEmployee } from '#modules/employees/application/DeleteEmployee/DeleteEmployee';
import { ListEmployees } from '#modules/employees/application/ListEmployees/ListEmployees';
import { UpdateEmployee } from '#modules/employees/application/UpdateEmployee/UpdateEmployee';
import { CreateEmployeeHandler } from '#modules/employees/infrastructure/api/handlers/CreateEmployeeHandler';
import { DeleteEmployeeHandler } from '#modules/employees/infrastructure/api/handlers/DeleteEmployeeHandler';
import { ListEmployeesHandler } from '#modules/employees/infrastructure/api/handlers/ListEmployeesHandler';
import { UpdateEmployeeHandler } from '#modules/employees/infrastructure/api/handlers/UpdateEmployeeHandler';
import {
  type CreateEmployeeBody,
  type EmployeeParams,
  EmployeeParamsSchema,
  type ListEmployeesQuery,
  type UpdateEmployeeBody,
} from '#modules/employees/infrastructure/api/schemas/employee.schema';
import { PrismaEmployeeRepository } from '#modules/employees/infrastructure/persistence/repositories/PrismaEmployeeRepository';
import { validate } from '#shared/infrastructure/api/validate';
import type { Database } from '#shared/infrastructure/persistence/prisma-client';

export type EmployeesHandlers = {
  create: CreateEmployeeHandler;
  update: UpdateEmployeeHandler;
  delete: DeleteEmployeeHandler;
  list: ListEmployeesHandler;
};

// The only `new`s of the module: repositories → use cases → handlers.
export const buildEmployeesHandlers = (database: Database): EmployeesHandlers => {
  const employeeRepository = new PrismaEmployeeRepository(database);
  return {
    create: new CreateEmployeeHandler(new CreateEmployee(employeeRepository)),
    update: new UpdateEmployeeHandler(new UpdateEmployee(employeeRepository)),
    delete: new DeleteEmployeeHandler(new DeleteEmployee(employeeRepository)),
    list: new ListEmployeesHandler(new ListEmployees(employeeRepository)),
  };
};

// Only routes: verb + path + validation + handler.
export const employeesRoutes = (handlers: EmployeesHandlers) => async (fastify: FastifyInstance) => {
  const params = validate(EmployeeParamsSchema, 'params');

  fastify.get<{ Querystring: ListEmployeesQuery }>(
    '/',
    { preHandler: validate(ListEmployeesQuerySchema, 'query') },
    handlers.list.handle,
  );
  fastify.post<{ Body: CreateEmployeeBody }>(
    '/',
    { preHandler: validate(CreateEmployeeBodySchema) },
    handlers.create.handle,
  );
  fastify.patch<{ Params: EmployeeParams; Body: UpdateEmployeeBody }>(
    '/:id',
    { preHandler: [params, validate(UpdateEmployeeBodySchema)] },
    handlers.update.handle,
  );
  fastify.delete<{ Params: EmployeeParams }>('/:id', { preHandler: params }, handlers.delete.handle);
};
