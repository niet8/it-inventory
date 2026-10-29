import { describe, expect, it } from 'vitest';

import { AssignDesk } from '#modules/floor-maps/application/AssignDesk/AssignDesk';
import { FloorMap } from '#modules/floor-maps/domain/FloorMap';
import type { IEmployeeLookup } from '#modules/floor-maps/domain/IEmployeeLookup';
import { InMemoryFloorMapRepository } from '#modules/floor-maps/infrastructure/persistence/repositories/InMemoryFloorMapRepository';
import { BusinessRuleViolationError, ConflictError, NotFoundError } from '#shared/domain/DomainError';

const DESK = 'aaaaaaaa-0000-4000-8000-000000000001';
const PLANT = 'aaaaaaaa-0000-4000-8000-000000000002';
const EMPLOYEE = 'bbbbbbbb-0000-4000-8000-000000000001';
const STRANGER = 'bbbbbbbb-0000-4000-8000-000000000002';

const setup = async (repositoryKnowsEmployee = true) => {
  const floorMaps = new InMemoryFloorMapRepository(() => repositoryKnowsEmployee);
  const map = FloorMap.create({ name: 'Floor 1', cols: 4, rows: 4 }).withLayout({
    cols: 4,
    rows: 4,
    walls: [],
    labels: [],
    objects: [
      { id: DESK, typeId: 'desk', row: 0, col: 0, rotation: 0 },
      { id: PLANT, typeId: 'plant', row: 3, col: 3, rotation: 0 },
    ],
  });
  await floorMaps.create(map);
  const employees: IEmployeeLookup = { exists: async (id) => id === EMPLOYEE };
  return { floorMaps, map, assignDesk: new AssignDesk(floorMaps, employees) };
};

describe('AssignDesk', () => {
  it('assigns a desk to an existing employee and frees it again', async () => {
    const { floorMaps, map, assignDesk } = await setup();

    const assigned = await assignDesk.execute({ mapId: map.id, objectId: DESK, employeeId: EMPLOYEE });
    expect(assigned.objects.find((object) => object.id === DESK)?.employeeId).toBe(EMPLOYEE);

    await assignDesk.execute({ mapId: map.id, objectId: DESK, employeeId: null });
    expect((await floorMaps.findById(map.id))?.objects[0]?.employeeId).toBeNull();
  });

  it('rejects unknown maps, unknown employees and non-desk objects', async () => {
    const { map, assignDesk } = await setup();

    await expect(assignDesk.execute({ mapId: STRANGER, objectId: DESK, employeeId: null })).rejects.toThrow(
      NotFoundError,
    );
    await expect(assignDesk.execute({ mapId: map.id, objectId: DESK, employeeId: STRANGER })).rejects.toThrow(
      /Employee/,
    );
    await expect(assignDesk.execute({ mapId: map.id, objectId: PLANT, employeeId: EMPLOYEE })).rejects.toThrow(
      BusinessRuleViolationError,
    );
  });

  it('reports a conflict when the write loses a race', async () => {
    const { map, assignDesk } = await setup(false);

    await expect(assignDesk.execute({ mapId: map.id, objectId: DESK, employeeId: EMPLOYEE })).rejects.toThrow(
      ConflictError,
    );
  });
});
