import { describe, expect, it } from 'vitest';

import {
  FloorMapMapper,
  type FloorMapWithObjects,
} from '#modules/floor-maps/infrastructure/persistence/mappers/FloorMapMapper';

const NOW = new Date('2026-10-29T10:00:00Z');
const MAP_ID = 'aaaaaaaa-0000-4000-8000-000000000010';
const DESK = 'aaaaaaaa-0000-4000-8000-000000000001';
const EMPLOYEE = 'bbbbbbbb-0000-4000-8000-000000000001';

const row: FloorMapWithObjects = {
  id: MAP_ID,
  name: 'Floor 1',
  cols: 10,
  rows: 8,
  walls: ['h_0_0'],
  labels: [{ id: 'l1', text: 'Kitchen', row: 1, col: 1, width: 3 }],
  version: 4,
  createdAt: NOW,
  updatedAt: NOW,
  objects: [{ id: DESK, mapId: MAP_ID, typeId: 'desk', row: 2, col: 3, rotation: 90, employeeId: EMPLOYEE }],
};

describe('FloorMapMapper', () => {
  it('rehydrates a stored map with its objects and assignments', () => {
    const map = FloorMapMapper.toDomain(row);

    expect(map.version).toBe(4);
    expect(map.labels).toEqual([{ id: 'l1', text: 'Kitchen', row: 1, col: 1, width: 3 }]);
    expect(map.objects).toEqual([{ id: DESK, typeId: 'desk', row: 2, col: 3, rotation: 90, employeeId: EMPLOYEE }]);
  });

  it('writes map columns and objects without the assignment', () => {
    const map = FloorMapMapper.toDomain(row);

    expect(FloorMapMapper.toPersistence(map)).toEqual({
      id: MAP_ID,
      name: 'Floor 1',
      cols: 10,
      rows: 8,
      walls: ['h_0_0'],
      labels: [{ id: 'l1', text: 'Kitchen', row: 1, col: 1, width: 3 }],
      version: 4,
    });
    const [desk] = map.objects;
    expect(desk && FloorMapMapper.objectToPersistence(desk, MAP_ID)).toEqual({
      id: DESK,
      mapId: MAP_ID,
      typeId: 'desk',
      row: 2,
      col: 3,
      rotation: 90,
    });
  });
});
