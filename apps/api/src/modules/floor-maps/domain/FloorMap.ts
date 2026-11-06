import { randomUUID } from 'node:crypto';

import {
  assertGridSize,
  assertLabels,
  assertWalls,
  type MapLabel,
  type MapObject,
  type ObjectInput,
  toPlacedObjects,
} from '#modules/floor-maps/domain/LayoutRules';
import { isAssignable } from '#modules/floor-maps/domain/ObjectFootprint';
import { BusinessRuleViolationError, NotFoundError, ValidationError } from '#shared/domain/DomainError';

export type FloorMapData = {
  id: string;
  name: string;
  cols: number;
  rows: number;
  walls: readonly string[];
  labels: readonly MapLabel[];
  objects: readonly MapObject[];
  version: number;
};

export type LayoutInput = {
  cols: number;
  rows: number;
  walls: readonly string[];
  labels: readonly MapLabel[];
  objects: readonly ObjectInput[];
};

const NAME_MAX_LENGTH = 80;

const normalizeName = (name: string): string => {
  const trimmed = name.trim();
  if (!trimmed || trimmed.length > NAME_MAX_LENGTH) {
    throw new ValidationError(`Floor map name must have 1 to ${NAME_MAX_LENGTH} characters`, 'name');
  }
  return trimmed;
};

export class FloorMap {
  private constructor(private readonly data: FloorMapData) {}

  static create(params: { name: string; cols: number; rows: number }): FloorMap {
    assertGridSize(params.cols, params.rows);
    return new FloorMap({
      id: randomUUID(),
      name: normalizeName(params.name),
      cols: params.cols,
      rows: params.rows,
      walls: [],
      labels: [],
      objects: [],
      version: 0,
    });
  }

  static rehydrate(data: FloorMapData): FloorMap {
    return new FloorMap(data);
  }

  get id(): string {
    return this.data.id;
  }
  get name(): string {
    return this.data.name;
  }
  get cols(): number {
    return this.data.cols;
  }
  get rows(): number {
    return this.data.rows;
  }
  get walls(): readonly string[] {
    return this.data.walls;
  }
  get labels(): readonly MapLabel[] {
    return this.data.labels;
  }
  get objects(): readonly MapObject[] {
    return this.data.objects;
  }
  get version(): number {
    return this.data.version;
  }

  rename(name: string): FloorMap {
    return new FloorMap({ ...this.data, name: normalizeName(name) });
  }

  // Replaces the structure of the map. Desk assignments survive by object id; an object that
  // stops being a desk loses its employee.
  withLayout(layout: LayoutInput): FloorMap {
    const { cols, rows } = layout;
    assertGridSize(cols, rows);
    assertWalls(layout.walls, cols, rows);
    assertLabels(layout.labels, cols, rows);

    const assignments = new Map(this.data.objects.map((object) => [object.id, object.employeeId]));
    const objects = toPlacedObjects(layout.objects, cols, rows).map((object) => ({
      ...object,
      employeeId: isAssignable(object.typeId) ? (assignments.get(object.id) ?? null) : null,
    }));

    return new FloorMap({
      ...this.data,
      cols,
      rows,
      walls: [...new Set(layout.walls)],
      labels: layout.labels,
      objects,
    });
  }

  // `null` frees the desk.
  assignDesk(objectId: string, employeeId: string | null): FloorMap {
    const target = this.data.objects.find((object) => object.id === objectId);
    if (!target) throw new NotFoundError('Floor map object', objectId);
    if (!isAssignable(target.typeId)) {
      throw new BusinessRuleViolationError(`Only desks can be assigned; object ${objectId} is a ${target.typeId}`);
    }

    const objects = this.data.objects.map((object) => (object.id === objectId ? { ...object, employeeId } : object));
    return new FloorMap({ ...this.data, objects });
  }
}
