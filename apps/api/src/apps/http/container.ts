import type { Config } from '#apps/http/config/env';
import { AssignDevice } from '#modules/devices/application/AssignDevice/AssignDevice';
import { CreateDevices } from '#modules/devices/application/CreateDevices/CreateDevices';
import { DecommissionDevice } from '#modules/devices/application/DecommissionDevice/DecommissionDevice';
import { DeleteDevice } from '#modules/devices/application/DeleteDevice/DeleteDevice';
import { GetDeviceStats } from '#modules/devices/application/GetDeviceStats/GetDeviceStats';
import { ListDevices } from '#modules/devices/application/ListDevices/ListDevices';
import { ReactivateDevice } from '#modules/devices/application/ReactivateDevice/ReactivateDevice';
import { UnassignDevice } from '#modules/devices/application/UnassignDevice/UnassignDevice';
import { UpdateDevice } from '#modules/devices/application/UpdateDevice/UpdateDevice';
import { AssignDeviceHandler } from '#modules/devices/infrastructure/api/handlers/AssignDeviceHandler';
import { CreateDevicesHandler } from '#modules/devices/infrastructure/api/handlers/CreateDevicesHandler';
import { DecommissionDeviceHandler } from '#modules/devices/infrastructure/api/handlers/DecommissionDeviceHandler';
import { DeleteDeviceHandler } from '#modules/devices/infrastructure/api/handlers/DeleteDeviceHandler';
import { GetDeviceStatsHandler } from '#modules/devices/infrastructure/api/handlers/GetDeviceStatsHandler';
import { ListDevicesHandler } from '#modules/devices/infrastructure/api/handlers/ListDevicesHandler';
import { ReactivateDeviceHandler } from '#modules/devices/infrastructure/api/handlers/ReactivateDeviceHandler';
import { UnassignDeviceHandler } from '#modules/devices/infrastructure/api/handlers/UnassignDeviceHandler';
import { UpdateDeviceHandler } from '#modules/devices/infrastructure/api/handlers/UpdateDeviceHandler';
import type { DevicesHandlers } from '#modules/devices/infrastructure/api/routes/devices.routes';
import { PrismaDeviceRepository } from '#modules/devices/infrastructure/persistence/repositories/PrismaDeviceRepository';
import { PrismaEmployeeLookup } from '#modules/devices/infrastructure/persistence/repositories/PrismaEmployeeLookup';
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

const buildDevices = (database: Database): DevicesHandlers => {
  const deviceRepository = new PrismaDeviceRepository(database);
  const employeeLookup = new PrismaEmployeeLookup(database);
  return {
    create: new CreateDevicesHandler(new CreateDevices(deviceRepository)),
    update: new UpdateDeviceHandler(new UpdateDevice(deviceRepository)),
    delete: new DeleteDeviceHandler(new DeleteDevice(deviceRepository)),
    assign: new AssignDeviceHandler(new AssignDevice(deviceRepository, employeeLookup)),
    unassign: new UnassignDeviceHandler(new UnassignDevice(deviceRepository)),
    decommission: new DecommissionDeviceHandler(new DecommissionDevice(deviceRepository)),
    reactivate: new ReactivateDeviceHandler(new ReactivateDevice(deviceRepository)),
    list: new ListDevicesHandler(new ListDevices(deviceRepository)),
    stats: new GetDeviceStatsHandler(new GetDeviceStats(deviceRepository)),
  };
};

export const buildContainer = (config: Config) => {
  const database = createPrismaClient(config.databaseUrl);

  return {
    employees: buildEmployees(database),
    devices: buildDevices(database),
    dispose: () => database.$disconnect(),
  };
};

export type Container = ReturnType<typeof buildContainer>;
