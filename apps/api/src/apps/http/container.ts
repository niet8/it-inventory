import type { Config } from '#apps/http/config/env';
import { CreateEmployee } from '#modules/employees/application/CreateEmployee/CreateEmployee';
import { DeleteEmployee } from '#modules/employees/application/DeleteEmployee/DeleteEmployee';
import { ListEmployees } from '#modules/employees/application/ListEmployees/ListEmployees';
import { UpdateEmployee } from '#modules/employees/application/UpdateEmployee/UpdateEmployee';
import { CreateEmployeeHandler } from '#modules/employees/infrastructure/api/handlers/CreateEmployeeHandler';
import { DeleteEmployeeHandler } from '#modules/employees/infrastructure/api/handlers/DeleteEmployeeHandler';
import { ListEmployeesHandler } from '#modules/employees/infrastructure/api/handlers/ListEmployeesHandler';
import { UpdateEmployeeHandler } from '#modules/employees/infrastructure/api/handlers/UpdateEmployeeHandler';
import type { EmployeesHandlers } from '#modules/employees/infrastructure/api/routes/employees.routes';
import { PrismaEmployeeRepository } from '#modules/employees/infrastructure/persistence/repositories/PrismaEmployeeRepository';
import { createPrismaClient, type Database } from '#shared/infrastructure/persistence/prisma-client';

// The only place where infrastructure is instantiated: repositories → use cases → handlers, per module.
const buildEmployees = (database: Database): EmployeesHandlers => {
  const employeeRepository = new PrismaEmployeeRepository(database);
  return {
    create: new CreateEmployeeHandler(new CreateEmployee(employeeRepository)),
    update: new UpdateEmployeeHandler(new UpdateEmployee(employeeRepository)),
    delete: new DeleteEmployeeHandler(new DeleteEmployee(employeeRepository)),
    list: new ListEmployeesHandler(new ListEmployees(employeeRepository)),
  };
};

export const buildContainer = (config: Config) => {
  const database = createPrismaClient(config.databaseUrl);

  return {
    employees: buildEmployees(database),
    dispose: () => database.$disconnect(),
  };
};

export type Container = ReturnType<typeof buildContainer>;
