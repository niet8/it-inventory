import type { FloorMap } from '#modules/floor-maps/domain/FloorMap';

// Every use case of the module answers with the full map, shaped like the HTTP contract.
export type FloorMapResponse = {
  id: string;
  name: string;
  cols: number;
  rows: number;
  walls: string[];
  labels: { id: string; text: string; row: number; col: number; width: number }[];
  objects: {
    id: string;
    typeId: string;
    row: number;
    col: number;
    rotation: 0 | 90 | 180 | 270;
    employeeId: string | null;
  }[];
  version: number;
};

export const toFloorMapResponse = (map: FloorMap): FloorMapResponse => ({
  id: map.id,
  name: map.name,
  cols: map.cols,
  rows: map.rows,
  walls: [...map.walls],
  labels: map.labels.map((label) => ({ ...label })),
  objects: map.objects.map((object) => ({ ...object })),
  version: map.version,
});
