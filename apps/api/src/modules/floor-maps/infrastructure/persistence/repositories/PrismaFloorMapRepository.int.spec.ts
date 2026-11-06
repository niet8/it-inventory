import { randomUUID } from 'node:crypto';

import { afterAll, afterEach, describe, expect, it } from 'vitest';

import { FloorMap, type LayoutInput } from '#modules/floor-maps/domain/FloorMap';
import { PrismaFloorMapRepository } from '#modules/floor-maps/infrastructure/persistence/repositories/PrismaFloorMapRepository';
import { ConflictError } from '#shared/domain/DomainError';
import { createPrismaClient } from '#shared/infrastructure/persistence/prisma-client';

const database = createPrismaClient(process.env.DATABASE_URL ?? '');
const repository = new PrismaFloorMapRepository(database);
const maps: string[] = [];
const employees: string[] = [];

const newMap = async () => {
  const map = FloorMap.create({ name: `Floor ${randomUUID().slice(0, 8)}`, cols: 10, rows: 8 });
  await repository.create(map);
  maps.push(map.id);
  return map;
};

const newEmployee = async () => {
  const id = randomUUID();
  await database.employee.create({ data: { id, fullName: 'Integration Example' } });
  employees.push(id);
  return id;
};

const layout = (objects: LayoutInput['objects']): LayoutInput => ({
  cols: 10,
  rows: 8,
  walls: ['h_0_1'],
  labels: [],
  objects,
});
const desk = (id: string, row = 1, col = 1) => ({ id, typeId: 'desk', row, col, rotation: 0 });

afterEach(async () => {
  await database.floorMap.deleteMany({ where: { id: { in: maps.splice(0) } } });
  await database.employee.deleteMany({ where: { id: { in: employees.splice(0) } } });
});

afterAll(async () => {
  await database.$disconnect();
});

describe('PrismaFloorMapRepository', () => {
  it('saves a layout, bumps the version and rejects a stale one', async () => {
    const map = await newMap();
    const next = map.withLayout(layout([desk(randomUUID())]));

    const saved = await repository.saveLayout(next, 0);
    const stale = await repository.saveLayout(next, 0);

    expect(saved).toMatchObject({ version: 1, walls: ['h_0_1'] });
    expect(saved?.objects).toHaveLength(1);
    expect(stale).toBeNull();
  });

  it('lets only one of two concurrent saves of the same version win', async () => {
    const map = await newMap();
    const next = map.withLayout(layout([desk(randomUUID())]));

    const results = await Promise.all([repository.saveLayout(next, 0), repository.saveLayout(next, 0)]);

    expect(results.filter(Boolean)).toHaveLength(1);
    expect((await repository.findById(map.id))?.version).toBe(1);
  });

  it('removes every object when the layout comes back empty', async () => {
    const map = await newMap();
    await repository.saveLayout(map.withLayout(layout([desk(randomUUID()), desk(randomUUID(), 3, 3)])), 0);

    const saved = await repository.saveLayout(map.withLayout(layout([])), 1);

    expect(saved?.objects).toEqual([]);
  });

  it('keeps a desk assignment when the desk moves and releases it when it stops being a desk', async () => {
    const map = await newMap();
    const deskId = randomUUID();
    const employeeId = await newEmployee();
    await repository.saveLayout(map.withLayout(layout([desk(deskId)])), 0);
    await repository.assignDesk(map.id, deskId, employeeId);

    const moved = await repository.saveLayout(map.withLayout(layout([desk(deskId, 4, 5)])), 1);
    const replaced = await repository.saveLayout(
      map.withLayout(layout([{ id: deskId, typeId: 'plant', row: 4, col: 5, rotation: 0 }])),
      2,
    );

    expect(moved?.objects[0]).toMatchObject({ row: 4, col: 5, employeeId });
    expect(replaced?.objects[0]).toMatchObject({ typeId: 'plant', employeeId: null });
  });

  it('rolls the whole save back when an object id belongs to another map', async () => {
    const [first, second] = [await newMap(), await newMap()];
    const sharedId = randomUUID();
    await repository.saveLayout(first.withLayout(layout([desk(sharedId)])), 0);

    await expect(repository.saveLayout(second.withLayout(layout([desk(sharedId)])), 0)).rejects.toThrow(ConflictError);
    expect(await repository.findById(second.id)).toMatchObject({ version: 0, objects: [] });
  });

  it('only assigns desks and frees them when the employee is deleted', async () => {
    const map = await newMap();
    const [deskId, plantId] = [randomUUID(), randomUUID()];
    const employeeId = await newEmployee();
    await repository.saveLayout(
      map.withLayout(layout([desk(deskId), { id: plantId, typeId: 'plant', row: 5, col: 5, rotation: 0 }])),
      0,
    );

    expect(await repository.assignDesk(map.id, plantId, employeeId)).toBe(false);
    expect(await repository.assignDesk(map.id, deskId, randomUUID())).toBe(false);
    expect(await repository.assignDesk(map.id, deskId, employeeId)).toBe(true);

    await database.employee.delete({ where: { id: employeeId } });
    employees.splice(employees.indexOf(employeeId), 1);
    const reloaded = await repository.findById(map.id);
    expect(reloaded?.objects.find((object) => object.id === deskId)?.employeeId).toBeNull();
  });

  it('renames and deletes, reporting maps that no longer exist', async () => {
    const map = await newMap();

    expect(await repository.updateName(map.rename('Ground floor'))).toBe(true);
    expect((await repository.findById(map.id))?.name).toBe('Ground floor');
    expect(await repository.delete(map.id)).toBe(true);
    expect(await repository.delete(map.id)).toBe(false);
    expect(await repository.updateName(map.rename('Gone'))).toBe(false);
  });
});
