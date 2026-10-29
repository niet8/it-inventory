import type { FloorMap } from '#modules/floor-maps/domain/FloorMap';

export interface IFloorMapRepository {
  findAll(): Promise<FloorMap[]>;
  findById(id: string): Promise<FloorMap | null>;
  create(map: FloorMap): Promise<void>;
  // Returns false when the map no longer exists.
  updateName(map: FloorMap): Promise<boolean>;
  // Persists walls, labels and objects only if the stored version still equals `expectedVersion`,
  // bumping it by one. Never writes desk assignments. Returns null on a version mismatch.
  saveLayout(map: FloorMap, expectedVersion: number): Promise<FloorMap | null>;
  // Returns false when the object is gone, is no longer a desk, or the employee no longer exists.
  assignDesk(mapId: string, objectId: string, employeeId: string | null): Promise<boolean>;
  delete(id: string): Promise<boolean>;
}
