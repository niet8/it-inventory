import Fastify from 'fastify';
import { describe, expect, it, vi } from 'vitest';

import { CreateEmployee } from '#modules/employees/application/CreateEmployee/CreateEmployee';
import { DeleteEmployee } from '#modules/employees/application/DeleteEmployee/DeleteEmployee';
import { ListEmployees } from '#modules/employees/application/ListEmployees/ListEmployees';
import { UpdateEmployee } from '#modules/employees/application/UpdateEmployee/UpdateEmployee';
import { Employee } from '#modules/employees/domain/Employee';
import { CreateEmployeeHandler } from '#modules/employees/infrastructure/api/handlers/CreateEmployeeHandler';
import { DeleteEmployeeHandler } from '#modules/employees/infrastructure/api/handlers/DeleteEmployeeHandler';
import { ListEmployeesHandler } from '#modules/employees/infrastructure/api/handlers/ListEmployeesHandler';
import { UpdateEmployeeHandler } from '#modules/employees/infrastructure/api/handlers/UpdateEmployeeHandler';
import { employeesRoutes } from '#modules/employees/infrastructure/api/routes/employees.routes';
import { domainErrorHandler } from '#shared/infrastructure/api/domain-error-handler';

const ID = '7d1f3c2a-9b4e-4c6d-8a1f-2e3b4c5d6e7f';
const ana = Employee.rehydrate({ id: ID, fullName: 'Ana Example', email: 'ana@example.com', department: 'IT' });

const buildApp = () => {
  const repository = {
    findById: vi.fn().mockResolvedValue(null),
    save: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(true),
    list: vi.fn().mockResolvedValue({ items: [ana], total: 1 }),
  };
  const app = Fastify();
  app.setErrorHandler(domainErrorHandler);
  app.register(
    employeesRoutes({
      create: new CreateEmployeeHandler(new CreateEmployee(repository)),
      update: new UpdateEmployeeHandler(new UpdateEmployee(repository)),
      delete: new DeleteEmployeeHandler(new DeleteEmployee(repository)),
      list: new ListEmployeesHandler(new ListEmployees(repository)),
    }),
    { prefix: '/employees' },
  );
  return { app, repository };
};

describe('employees routes', () => {
  it('lists employees with parsed paging and filters', async () => {
    const { app, repository } = buildApp();

    const response = await app.inject({ method: 'GET', url: '/employees?page=1&limit=5&search=ana' });

    expect(repository.list).toHaveBeenCalledWith({ page: 1, limit: 5, search: 'ana' });
    expect(response.json()).toEqual({
      status: 'OK',
      data: {
        items: [{ id: ID, fullName: 'Ana Example', email: 'ana@example.com', department: 'IT' }],
        total: 1,
        page: 1,
        limit: 5,
      },
    });
  });

  it('creates an employee with 201', async () => {
    const { app } = buildApp();

    const response = await app.inject({ method: 'POST', url: '/employees', payload: { fullName: 'Bo Example' } });

    expect(response.statusCode).toBe(201);
    expect(response.json().data).toMatchObject({ fullName: 'Bo Example', email: null });
  });

  it('rejects an invalid body before reaching the use case', async () => {
    const { app, repository } = buildApp();

    const response = await app.inject({
      method: 'POST',
      url: '/employees',
      payload: { fullName: 'Bo', email: 'nope' },
    });

    expect(response.statusCode).toBe(400);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('updates an existing employee and 404s an unknown one', async () => {
    const { app, repository } = buildApp();
    repository.findById.mockResolvedValueOnce(ana);

    const updated = await app.inject({ method: 'PATCH', url: `/employees/${ID}`, payload: { department: null } });
    const missing = await app.inject({ method: 'PATCH', url: `/employees/${ID}`, payload: { department: 'HR' } });

    expect(updated.json().data).toMatchObject({ id: ID, department: null });
    expect(missing.statusCode).toBe(404);
  });

  it('deletes by id and validates the id format', async () => {
    const { app } = buildApp();

    const deleted = await app.inject({ method: 'DELETE', url: `/employees/${ID}` });
    const badId = await app.inject({ method: 'DELETE', url: '/employees/not-a-uuid' });

    expect(deleted.json()).toEqual({ status: 'OK', data: { id: ID } });
    expect(badId.statusCode).toBe(400);
  });
});
