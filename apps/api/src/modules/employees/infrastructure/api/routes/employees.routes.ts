import { CreateEmployeeBodySchema, ListEmployeesQuerySchema, UpdateEmployeeBodySchema } from '@it-inventory/contracts';
import type { FastifyInstance } from 'fastify';

import type { CreateEmployeeHandler } from '#modules/employees/infrastructure/api/handlers/CreateEmployeeHandler';
import type { DeleteEmployeeHandler } from '#modules/employees/infrastructure/api/handlers/DeleteEmployeeHandler';
import type { ListEmployeesHandler } from '#modules/employees/infrastructure/api/handlers/ListEmployeesHandler';
import type { UpdateEmployeeHandler } from '#modules/employees/infrastructure/api/handlers/UpdateEmployeeHandler';
import {
  type CreateEmployeeBody,
  type EmployeeParams,
  EmployeeParamsSchema,
  type ListEmployeesQuery,
  type UpdateEmployeeBody,
} from '#modules/employees/infrastructure/api/schemas/employee.schema';
import { validate } from '#shared/infrastructure/api/validate';

export type EmployeesHandlers = {
  create: CreateEmployeeHandler;
  update: UpdateEmployeeHandler;
  delete: DeleteEmployeeHandler;
  list: ListEmployeesHandler;
};

// Only routes: verb + path + validation + handler. The handlers are built in the container.
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
