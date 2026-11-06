import { Prisma } from '#generated/prisma/client';
import type { FloorMap } from '#modules/floor-maps/domain/FloorMap';
import type { IFloorMapRepository } from '#modules/floor-maps/domain/IFloorMapRepository';
import { ASSIGNABLE_TYPES, isAssignable } from '#modules/floor-maps/domain/ObjectFootprint';
import { FloorMapMapper } from '#modules/floor-maps/infrastructure/persistence/mappers/FloorMapMapper';
import { ConflictError } from '#shared/domain/DomainError';
import type { Database } from '#shared/infrastructure/persistence/prisma-client';

const WITH_OBJECTS = {
  objects: { orderBy: [{ row: 'asc' }, { col: 'asc' }] },
} satisfies Prisma.FloorMapInclude;

const isPrismaError = (error: unknown, code: string) =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === code;

export class PrismaFloorMapRepository implements IFloorMapRepository {
  constructor(private readonly db: Database) {}

  async findAll(): Promise<FloorMap[]> {
    const rows = await this.db.floorMap.findMany({ include: WITH_OBJECTS, orderBy: { name: 'asc' } });
    return rows.map(FloorMapMapper.toDomain);
  }

  async findById(id: string): Promise<FloorMap | null> {
    const row = await this.db.floorMap.findUnique({ where: { id }, include: WITH_OBJECTS });
    return row ? FloorMapMapper.toDomain(row) : null;
  }

  async create(map: FloorMap): Promise<void> {
    await this.db.floorMap.create({ data: FloorMapMapper.toPersistence(map) });
  }

  async updateName(map: FloorMap): Promise<boolean> {
    const { count } = await this.db.floorMap.updateMany({ where: { id: map.id }, data: { name: map.name } });
    return count > 0;
  }

  async saveLayout(map: FloorMap, expectedVersion: number): Promise<FloorMap | null> {
    const { cols, rows, walls, labels } = FloorMapMapper.toPersistence(map);
    try {
      return await this.db.$transaction(async (tx) => {
        // The version filter makes this the lock: a concurrent save that got here first leaves no match.
        const { count } = await tx.floorMap.updateMany({
          where: { id: map.id, version: expectedVersion },
          data: { cols, rows, walls, labels, version: { increment: 1 } },
        });
        if (count === 0) return null;

        const ids = map.objects.map((object) => object.id);
        await tx.floorMapObject.deleteMany({ where: { mapId: map.id, id: { notIn: ids } } });
        const existing = await tx.floorMapObject.findMany({ where: { mapId: map.id }, select: { id: true } });
        const existingIds = new Set(existing.map((object) => object.id));

        for (const object of map.objects.filter((candidate) => existingIds.has(candidate.id))) {
          const { typeId, row, col, rotation } = FloorMapMapper.objectToPersistence(object, map.id);
          // employeeId is untouched, except for an object that stopped being a desk.
          const release = isAssignable(object.typeId) ? {} : { employeeId: null };
          await tx.floorMapObject.update({
            where: { id: object.id },
            data: { typeId, row, col, rotation, ...release },
          });
        }
        await tx.floorMapObject.createMany({
          data: map.objects
            .filter((candidate) => !existingIds.has(candidate.id))
            .map((object) => FloorMapMapper.objectToPersistence(object, map.id)),
        });

        const saved = await tx.floorMap.findUniqueOrThrow({ where: { id: map.id }, include: WITH_OBJECTS });
        return FloorMapMapper.toDomain(saved);
      });
    } catch (error) {
      // An object id that already belongs to another map.
      if (isPrismaError(error, 'P2002')) throw new ConflictError('An object id of the layout is already in use');
      throw error;
    }
  }

  async assignDesk(mapId: string, objectId: string, employeeId: string | null): Promise<boolean> {
    try {
      const { count } = await this.db.floorMapObject.updateMany({
        where: { id: objectId, mapId, typeId: { in: [...ASSIGNABLE_TYPES] } },
        data: { employeeId },
      });
      return count > 0;
    } catch (error) {
      // The employee was deleted after the use case checked it.
      if (isPrismaError(error, 'P2003')) return false;
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    const { count } = await this.db.floorMap.deleteMany({ where: { id } });
    return count > 0;
  }
}
