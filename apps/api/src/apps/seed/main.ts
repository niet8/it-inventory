import {
  ASSIGNED_DEVICES,
  buildOfficeLayout,
  DECOMMISSIONED_DEVICES,
  DEVICE_BATCHES,
  EMPLOYEES,
  FLOOR_MAP,
} from '#apps/seed/demo-data';
import { Device } from '#modules/devices/domain/Device';
import { PrismaDeviceRepository } from '#modules/devices/infrastructure/persistence/repositories/PrismaDeviceRepository';
import { Employee } from '#modules/employees/domain/Employee';
import { PrismaEmployeeRepository } from '#modules/employees/infrastructure/persistence/repositories/PrismaEmployeeRepository';
import { FloorMap } from '#modules/floor-maps/domain/FloorMap';
import { PrismaFloorMapRepository } from '#modules/floor-maps/infrastructure/persistence/repositories/PrismaFloorMapRepository';
import { createPrismaClient } from '#shared/infrastructure/persistence/prisma-client';

// Wipes the database and loads the demo data. It also runs as the daily reset of the public demo,
// so it refuses to run unless explicitly allowed.
if (process.env.ALLOW_DATA_RESET !== 'true') {
  console.error('Refusing to wipe the database: set ALLOW_DATA_RESET=true to run the seed.');
  process.exit(1);
}
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set.');
  process.exit(1);
}

const database = createPrismaClient(process.env.DATABASE_URL);
const employeesRepository = new PrismaEmployeeRepository(database);
const devicesRepository = new PrismaDeviceRepository(database);
const floorMapsRepository = new PrismaFloorMapRepository(database);

const codeFor = (prefix: string | null, index: number) =>
  prefix ? `${prefix}-${String(index + 1).padStart(3, '0')}` : null;

try {
  // Objects go with their maps (cascade); devices and desks are released before employees go.
  await database.floorMap.deleteMany();
  await database.device.deleteMany();
  await database.employee.deleteMany();

  const employees = EMPLOYEES.map((employee) => Employee.create(employee));
  for (const employee of employees) await employeesRepository.save(employee);

  const devices = DEVICE_BATCHES.flatMap(({ name, codePrefix, count }) =>
    Array.from({ length: count }, (_, index) => Device.create({ name, code: codeFor(codePrefix, index) })),
  );
  await devicesRepository.createMany(devices);
  for (const [index, device] of devices.slice(0, ASSIGNED_DEVICES).entries()) {
    const owner = employees[index % employees.length];
    if (owner) await devicesRepository.assignIfAvailable(device.id, owner.id);
  }
  for (const device of devices.slice(-DECOMMISSIONED_DEVICES)) await devicesRepository.save(device.decommission());

  const { deskIds, ...layout } = buildOfficeLayout();
  const map = FloorMap.create(FLOOR_MAP);
  await floorMapsRepository.create(map);
  await floorMapsRepository.saveLayout(map.withLayout(layout), map.version);
  for (const [index, employee] of employees.entries()) {
    const deskId = deskIds[index];
    if (deskId) await floorMapsRepository.assignDesk(map.id, deskId, employee.id);
  }

  console.log(`Seeded ${employees.length} employees, ${devices.length} devices and 1 floor map.`);
} finally {
  await database.$disconnect();
}
