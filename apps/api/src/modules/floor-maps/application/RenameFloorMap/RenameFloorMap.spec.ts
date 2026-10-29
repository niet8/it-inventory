import { describe, expect, it } from 'vitest';

import { RenameFloorMap } from '#modules/floor-maps/application/RenameFloorMap/RenameFloorMap';
import { FloorMap } from '#modules/floor-maps/domain/FloorMap';
import type { IFloorMapRepository } from '#modules/floor-maps/domain/IFloorMapRepository';
import { InMemoryFloorMapRepository } from '#modules/floor-maps/infrastructure/persistence/repositories/InMemoryFloorMapRepository';
import { NotFoundError } from '#shared/domain/DomainError';

const MISSING = 'cccccccc-0000-4000-8000-000000000001';

describe('RenameFloorMap', () => {
  it('renames an existing map', async () => {
    const floorMaps = new InMemoryFloorMapRepository();
    const map = FloorMap.create({ name: 'Floor 1', cols: 4, rows: 4 });
    await floorMaps.create(map);

    const renamed = await new RenameFloorMap(floorMaps).execute({ id: map.id, name: ' Ground floor ' });

    expect(renamed.name).toBe('Ground floor');
    expect((await floorMaps.findById(map.id))?.name).toBe('Ground floor');
  });

  it('fails when the map does not exist or disappears before the write', async () => {
    const floorMaps = new InMemoryFloorMapRepository();
    await expect(new RenameFloorMap(floorMaps).execute({ id: MISSING, name: 'X' })).rejects.toThrow(NotFoundError);

    const map = FloorMap.create({ name: 'Floor 1', cols: 4, rows: 4 });
    const vanishing: Pick<IFloorMapRepository, 'findById' | 'updateName'> = {
      findById: async () => map,
      updateName: async () => false,
    };
    await expect(
      new RenameFloorMap(vanishing as IFloorMapRepository).execute({ id: map.id, name: 'X' }),
    ).rejects.toThrow(NotFoundError);
  });
});
