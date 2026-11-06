import {
  footprintOf,
  isObjectType,
  isRotation,
  type ObjectType,
  type Rotation,
} from '#modules/floor-maps/domain/ObjectFootprint';
import { BusinessRuleViolationError, ValidationError } from '#shared/domain/DomainError';

export const GRID_MIN = 1;
export const GRID_MAX = 100;

export type MapLabel = { id: string; text: string; row: number; col: number; width: number };
export type MapObject = {
  id: string;
  typeId: ObjectType;
  row: number;
  col: number;
  rotation: Rotation;
  employeeId: string | null;
};
export type ObjectInput = { id: string; typeId: string; row: number; col: number; rotation: number };

const isIntBetween = (value: number, min: number, max: number) =>
  Number.isInteger(value) && value >= min && value <= max;

export const assertGridSize = (cols: number, rows: number): void => {
  for (const [field, value] of [
    ['cols', cols],
    ['rows', rows],
  ] as const) {
    if (!isIntBetween(value, GRID_MIN, GRID_MAX)) {
      throw new ValidationError(`${field} must be an integer between ${GRID_MIN} and ${GRID_MAX}`, field);
    }
  }
};

// `h_<row>_<col>` is the top edge of a cell (row may equal `rows` for the bottom border);
// `v_<row>_<col>` is its left edge (col may equal `cols` for the right border).
const WALL_KEY = /^([hv])_(\d+)_(\d+)$/;

export const assertWalls = (walls: readonly string[], cols: number, rows: number): void => {
  for (const wall of walls) {
    const match = WALL_KEY.exec(wall);
    const row = Number(match?.[2]);
    const col = Number(match?.[3]);
    const inside = match?.[1] === 'h' ? row <= rows && col < cols : row < rows && col <= cols;
    if (!match || !inside) throw new ValidationError(`Wall ${wall} is not a valid edge of the grid`, 'walls');
  }
};

export const assertLabels = (labels: readonly MapLabel[], cols: number, rows: number): void => {
  const ids = new Set<string>();
  for (const label of labels) {
    if (ids.has(label.id)) throw new ValidationError(`Label ${label.id} is duplicated`, 'labels');
    ids.add(label.id);
    const fits =
      isIntBetween(label.row, 0, rows - 1) &&
      isIntBetween(label.col, 0, cols - 1) &&
      isIntBetween(label.width, 1, cols - label.col);
    if (!fits) throw new ValidationError(`Label ${label.id} is outside the grid`, 'labels');
  }
};

// Validates every object (type, rotation, bounds, overlaps) and narrows its types.
export const toPlacedObjects = (
  inputs: readonly ObjectInput[],
  cols: number,
  rows: number,
): Omit<MapObject, 'employeeId'>[] => {
  const occupiedBy = new Map<string, string>();
  const ids = new Set<string>();

  return inputs.map(({ id, typeId, row, col, rotation }) => {
    if (!isObjectType(typeId)) throw new ValidationError(`Unknown object type ${typeId}`, 'objects');
    if (!isRotation(rotation)) throw new ValidationError(`Rotation ${rotation} is not allowed`, 'objects');
    if (ids.has(id)) throw new ValidationError(`Object ${id} is duplicated`, 'objects');
    ids.add(id);

    const { width, height } = footprintOf(typeId, rotation);
    if (!isIntBetween(row, 0, rows - height) || !isIntBetween(col, 0, cols - width)) {
      throw new ValidationError(`Object ${id} does not fit inside the grid`, 'objects');
    }

    for (let r = row; r < row + height; r++) {
      for (let c = col; c < col + width; c++) {
        const other = occupiedBy.get(`${r}:${c}`);
        if (other) throw new BusinessRuleViolationError(`Objects ${other} and ${id} overlap`);
        occupiedBy.set(`${r}:${c}`, id);
      }
    }
    return { id, typeId, row, col, rotation };
  });
};
