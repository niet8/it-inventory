import { describe, expect, it } from 'vitest';

import { DeleteFloorMap } from '#modules/floor-maps/application/DeleteFloorMap/DeleteFloorMap';
import { FloorMap } from '#modules/floor-maps/domain/FloorMap';
import { InMemoryFloorMapRepository } from '#modules/floor-maps/infrastructure/persistence/repositories/InMemoryFloorMapRepository';
import { NotFoundError } from '#shared/domain/DomainError';

describe('DeleteFloorMap', () => {
  it('deletes the map once and then reports it as missing', async () => {
    const floorMaps = new InMemoryFloorMapRepository();
    const map = FloorMap.create({ name: 'Floor 1', cols: 4, rows: 4 });
    await floorMaps.create(map);
    const deleteMap = new DeleteFloorMap(floorMaps);

    await deleteMap.execute({ id: map.id });

    expect(await floorMaps.findById(map.id)).toBeNull();
    await expect(deleteMap.execute({ id: map.id })).rejects.toThrow(NotFoundError);
  });
});
