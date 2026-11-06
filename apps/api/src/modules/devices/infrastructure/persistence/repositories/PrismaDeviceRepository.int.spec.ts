import { randomUUID } from 'node:crypto';

import { afterAll, afterEach, describe, expect, it } from 'vitest';

import { Device } from '#modules/devices/domain/Device';
import { PrismaDeviceRepository } from '#modules/devices/infrastructure/persistence/repositories/PrismaDeviceRepository';
import { PrismaEmployeeLookup } from '#modules/devices/infrastructure/persistence/repositories/PrismaEmployeeLookup';
import { ConflictError, NotFoundError } from '#shared/domain/DomainError';
import { createPrismaClient } from '#shared/infrastructure/persistence/prisma-client';

const database = createPrismaClient(process.env.DATABASE_URL ?? '');
const repository = new PrismaDeviceRepository(database);
const tag = `it${Date.now()}`;
const devices: string[] = [];
const employees: string[] = [];

const employee = async () => {
  const id = randomUUID();
  await database.employee.create({ data: { id, fullName: `Employee ${tag}` } });
  employees.push(id);
  return id;
};

const stock = async (...names: string[]) => {
  const created = names.map((name, index) => Device.create({ name: `${name} ${tag}`, code: `${tag}-${index}` }));
  await repository.createMany(created);
  devices.push(...created.map((d) => d.id));
  return created;
};

afterEach(async () => {
  await database.device.deleteMany({ where: { id: { in: devices.splice(0) } } });
  await database.employee.deleteMany({ where: { id: { in: employees.splice(0) } } });
});

afterAll(async () => {
  await database.$disconnect();
});

describe('PrismaDeviceRepository', () => {
  it('creates a batch and rejects it whole on a code clash', async () => {
    const [laptop] = await stock('Laptop');

    await expect(repository.createMany([Device.create({ name: 'Copy', code: laptop?.code })])).rejects.toThrow(
      ConflictError,
    );
    expect(await repository.findById(laptop?.id ?? '')).toMatchObject({ status: 'available' });
  });

  it('lets only one of two concurrent assignments win', async () => {
    const [laptop] = await stock('Laptop');
    const [first, second] = [await employee(), await employee()];

    const results = await Promise.all([
      repository.assignIfAvailable(laptop?.id ?? '', first),
      repository.assignIfAvailable(laptop?.id ?? '', second),
    ]);

    expect(results.filter(Boolean)).toHaveLength(1);
  });

  it('reports a vanished employee as NotFoundError', async () => {
    const [laptop] = await stock('Laptop');

    await expect(repository.assignIfAvailable(laptop?.id ?? '', randomUUID())).rejects.toThrow(NotFoundError);
  });

  it('frees the device when its employee is deleted', async () => {
    const [laptop] = await stock('Laptop');
    const owner = await employee();
    await repository.assignIfAvailable(laptop?.id ?? '', owner);

    await database.employee.delete({ where: { id: owner } });

    expect(await repository.findById(laptop?.id ?? '')).toMatchObject({ employeeId: null, status: 'available' });
  });

  it('saves transitions and maps missing rows and code clashes', async () => {
    const [laptop, monitor] = await stock('Laptop', 'Monitor');
    if (!laptop || !monitor) throw new Error('fixtures not created');

    await repository.save(laptop.decommission());

    expect(await repository.findById(laptop.id)).toMatchObject({ status: 'decommissioned' });
    await expect(repository.save(monitor.update({ code: laptop.code }))).rejects.toThrow(ConflictError);
    await expect(repository.save(Device.create({ name: 'Ghost' }))).rejects.toThrow(NotFoundError);
  });

  it('filters by derived status, search and employee, and counts by status', async () => {
    const before = await repository.countByStatus();
    const [laptop, monitor, dock] = await stock('Laptop', 'Monitor', 'Dock');
    const owner = await employee();
    await repository.assignIfAvailable(laptop?.id ?? '', owner);
    if (dock) await repository.save(dock.decommission());

    const inUse = await repository.list({ page: 1, limit: 10, status: 'in_use', employeeIds: [owner] });
    const searched = await repository.list({ page: 1, limit: 10, search: `MONITOR ${tag}`, status: 'available' });
    const after = await repository.countByStatus();

    expect(inUse.items.map((d) => d.id)).toEqual([laptop?.id]);
    expect(searched.items.map((d) => d.id)).toEqual([monitor?.id]);
    expect(after.total - before.total).toBe(3);
    expect(after.inUse - before.inUse).toBe(1);
    expect(after.decommissioned - before.decommissioned).toBe(1);
    expect(after.available - before.available).toBe(1);
  });

  it('deletes and reports whether something was deleted; looks employees up', async () => {
    const [laptop] = await stock('Laptop');
    const lookup = new PrismaEmployeeLookup(database);

    expect(await repository.delete(laptop?.id ?? '')).toBe(true);
    expect(await repository.delete(laptop?.id ?? '')).toBe(false);
    expect(await lookup.exists(await employee())).toBe(true);
    expect(await lookup.exists(randomUUID())).toBe(false);
  });
});
