import { describe, expect, it } from 'vitest';

import { CreateFloorMap } from '#modules/floor-maps/application/CreateFloorMap/CreateFloorMap';
import { ListFloorMaps } from '#modules/floor-maps/application/ListFloorMaps/ListFloorMaps';
import { InMemoryFloorMapRepository } from '#modules/floor-maps/infrastructure/persistence/repositories/InMemoryFloorMapRepository';
import { ValidationError } from '#shared/domain/DomainError';

describe('CreateFloorMap and ListFloorMaps', () => {
  it('stores an empty map and lists maps by name', async () => {
    const floorMaps = new InMemoryFloorMapRepository();
    const create = new CreateFloorMap(floorMaps);

    const created = await create.execute({ name: 'Second floor', cols: 12, rows: 6 });
    await create.execute({ name: 'Basement', cols: 5, rows: 5 });

    expect(created).toEqual({
      id: expect.any(String),
      name: 'Second floor',
      cols: 12,
      rows: 6,
      walls: [],
      labels: [],
      objects: [],
      version: 0,
    });
    const listed = await new ListFloorMaps(floorMaps).execute();
    expect(listed.map((map) => map.name)).toEqual(['Basement', 'Second floor']);
  });

  it('refuses an invalid grid without storing anything', async () => {
    const floorMaps = new InMemoryFloorMapRepository();

    await expect(new CreateFloorMap(floorMaps).execute({ name: 'Huge', cols: 500, rows: 5 })).rejects.toThrow(
      ValidationError,
    );
    expect(await floorMaps.findAll()).toEqual([]);
  });
});
