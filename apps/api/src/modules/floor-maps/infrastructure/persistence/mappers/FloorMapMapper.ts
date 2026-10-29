import type { FloorMapObject as FloorMapObjectRow, FloorMap as FloorMapRow, Prisma } from '#generated/prisma/client';
import { FloorMap } from '#modules/floor-maps/domain/FloorMap';
import type { MapLabel, MapObject } from '#modules/floor-maps/domain/LayoutRules';
import type { ObjectType, Rotation } from '#modules/floor-maps/domain/ObjectFootprint';

export type FloorMapWithObjects = FloorMapRow & { objects: FloorMapObjectRow[] };

const objectToDomain = (row: FloorMapObjectRow): MapObject => ({
  id: row.id,
  // The database only ever receives values the aggregate validated.
  typeId: row.typeId as ObjectType,
  row: row.row,
  col: row.col,
  rotation: row.rotation as Rotation,
  employeeId: row.employeeId,
});

export const FloorMapMapper = {
  toDomain(row: FloorMapWithObjects): FloorMap {
    return FloorMap.rehydrate({
      id: row.id,
      name: row.name,
      cols: row.cols,
      rows: row.rows,
      walls: row.walls,
      labels: row.labels as unknown as MapLabel[],
      objects: row.objects.map(objectToDomain),
      version: row.version,
    });
  },

  // Map columns only: objects are written one by one by the repository.
  toPersistence(map: FloorMap) {
    return {
      id: map.id,
      name: map.name,
      cols: map.cols,
      rows: map.rows,
      walls: [...map.walls],
      labels: map.labels.map((label) => ({ ...label })) as Prisma.InputJsonValue,
      version: map.version,
    };
  },

  objectToPersistence(object: MapObject, mapId: string) {
    return {
      id: object.id,
      mapId,
      typeId: object.typeId,
      row: object.row,
      col: object.col,
      rotation: object.rotation,
    };
  },
};
