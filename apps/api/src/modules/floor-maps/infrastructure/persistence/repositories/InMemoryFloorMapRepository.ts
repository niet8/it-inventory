import { FloorMap } from '#modules/floor-maps/domain/FloorMap';
import type { IFloorMapRepository } from '#modules/floor-maps/domain/IFloorMapRepository';
import { isAssignable } from '#modules/floor-maps/domain/ObjectFootprint';

// Same semantics as the Prisma repository, without a database. Used by the use case specs.
export class InMemoryFloorMapRepository implements IFloorMapRepository {
  private readonly maps = new Map<string, FloorMap>();

  constructor(private readonly employeeExists: (employeeId: string) => boolean = () => true) {}

  async findAll(): Promise<FloorMap[]> {
    return [...this.maps.values()].sort((a, b) => a.name.localeCompare(b.name));
  }

  async findById(id: string): Promise<FloorMap | null> {
    return this.maps.get(id) ?? null;
  }

  async create(map: FloorMap): Promise<void> {
    this.maps.set(map.id, map);
  }

  async updateName(map: FloorMap): Promise<boolean> {
    const stored = this.maps.get(map.id);
    if (!stored) return false;
    this.maps.set(map.id, stored.rename(map.name));
    return true;
  }

  async saveLayout(map: FloorMap, expectedVersion: number): Promise<FloorMap | null> {
    const stored = this.maps.get(map.id);
    if (!stored || stored.version !== expectedVersion) return null;

    // Assignments come from what is stored, never from the incoming map.
    const merged = stored.withLayout(map);
    const saved = FloorMap.rehydrate({
      id: merged.id,
      name: merged.name,
      cols: merged.cols,
      rows: merged.rows,
      walls: merged.walls,
      labels: merged.labels,
      objects: merged.objects,
      version: expectedVersion + 1,
    });
    this.maps.set(map.id, saved);
    return saved;
  }

  async assignDesk(mapId: string, objectId: string, employeeId: string | null): Promise<boolean> {
    const stored = this.maps.get(mapId);
    const object = stored?.objects.find((candidate) => candidate.id === objectId);
    if (!stored || !object || !isAssignable(object.typeId)) return false;
    if (employeeId !== null && !this.employeeExists(employeeId)) return false;

    this.maps.set(mapId, stored.assignDesk(objectId, employeeId));
    return true;
  }

  async delete(id: string): Promise<boolean> {
    return this.maps.delete(id);
  }
}
