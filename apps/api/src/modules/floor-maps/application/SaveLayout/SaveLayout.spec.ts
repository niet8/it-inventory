import { describe, expect, it } from 'vitest';

import { SaveLayout } from '#modules/floor-maps/application/SaveLayout/SaveLayout';
import type { SaveLayoutCommand } from '#modules/floor-maps/application/SaveLayout/SaveLayoutCommand';
import { FloorMap } from '#modules/floor-maps/domain/FloorMap';
import type { IFloorMapRepository } from '#modules/floor-maps/domain/IFloorMapRepository';
import { InMemoryFloorMapRepository } from '#modules/floor-maps/infrastructure/persistence/repositories/InMemoryFloorMapRepository';
import { BusinessRuleViolationError, ConflictError, NotFoundError } from '#shared/domain/DomainError';

const DESK = 'aaaaaaaa-0000-4000-8000-000000000001';
const EMPLOYEE = 'bbbbbbbb-0000-4000-8000-000000000001';

const setup = async () => {
  const floorMaps = new InMemoryFloorMapRepository();
  const map = FloorMap.create({ name: 'Floor 1', cols: 10, rows: 8 });
  await floorMaps.create(map);
  const command = (overrides: Partial<SaveLayoutCommand> = {}): SaveLayoutCommand => ({
    id: map.id,
    version: 0,
    cols: 10,
    rows: 8,
    walls: ['h_0_0'],
    labels: [],
    objects: [{ id: DESK, typeId: 'desk', row: 2, col: 2, rotation: 0 }],
    ...overrides,
  });
  return { floorMaps, map, command, saveLayout: new SaveLayout(floorMaps) };
};

describe('SaveLayout', () => {
  it('saves the structure and bumps the version', async () => {
    const { saveLayout, command } = await setup();

    const saved = await saveLayout.execute(command());

    expect(saved.version).toBe(1);
    expect(saved.walls).toEqual(['h_0_0']);
    expect(saved.objects).toEqual([{ id: DESK, typeId: 'desk', row: 2, col: 2, rotation: 0, employeeId: null }]);
  });

  it('refuses a second save based on the same version', async () => {
    const { saveLayout, command } = await setup();
    await saveLayout.execute(command());

    await expect(saveLayout.execute(command())).rejects.toThrow(ConflictError);
  });

  it('keeps desk assignments that were made after the client loaded the map', async () => {
    const { floorMaps, map, saveLayout, command } = await setup();
    await saveLayout.execute(command());
    await floorMaps.assignDesk(map.id, DESK, EMPLOYEE);

    const moved = await saveLayout.execute(
      command({ version: 1, objects: [{ id: DESK, typeId: 'desk', row: 5, col: 5, rotation: 0 }] }),
    );

    expect(moved.objects[0]).toMatchObject({ row: 5, col: 5, employeeId: EMPLOYEE });
  });

  it('reports a version change that happens between the read and the write', async () => {
    const { map, command } = await setup();
    const racing: Pick<IFloorMapRepository, 'findById' | 'saveLayout'> = {
      findById: async () => map,
      saveLayout: async () => null,
    };

    await expect(new SaveLayout(racing as IFloorMapRepository).execute(command())).rejects.toThrow(ConflictError);
  });

  it('fails for an unknown map and for an invalid layout', async () => {
    const { saveLayout, command } = await setup();

    await expect(saveLayout.execute(command({ id: EMPLOYEE }))).rejects.toThrow(NotFoundError);
    const overlapping = command({
      objects: [
        { id: DESK, typeId: 'desk', row: 0, col: 0, rotation: 0 },
        { id: EMPLOYEE, typeId: 'sofa', row: 0, col: 0, rotation: 0 },
      ],
    });
    await expect(saveLayout.execute(overlapping)).rejects.toThrow(BusinessRuleViolationError);
  });
});
