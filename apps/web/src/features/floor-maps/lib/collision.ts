import { footprintOf, type ObjectType, type Rotation } from '@/features/floor-maps/lib/objectTypes';

export type Placement = { id: string; typeId: ObjectType; row: number; col: number; rotation: Rotation };
export type PlacementError = 'out-of-bounds' | 'overlap';

export const PLACEMENT_MESSAGES: Record<PlacementError, string> = {
  'out-of-bounds': "It doesn't fit inside the map there",
  overlap: 'It overlaps another object',
};

export const cellsOf = ({ typeId, row, col, rotation }: Placement): string[] => {
  const { width, height } = footprintOf(typeId, rotation);
  const cells: string[] = [];
  for (let r = row; r < row + height; r++) {
    for (let c = col; c < col + width; c++) cells.push(`${r}:${c}`);
  }
  return cells;
};

// Same bounds rule as the API: the whole footprint must lie inside the grid.
export const fitsInGrid = (placement: Placement, cols: number, rows: number): boolean => {
  const { width, height } = footprintOf(placement.typeId, placement.rotation);
  const { row, col } = placement;
  return (
    Number.isInteger(row) &&
    Number.isInteger(col) &&
    row >= 0 &&
    col >= 0 &&
    row + height <= rows &&
    col + width <= cols
  );
};

export const overlaps = (a: Placement, b: Placement): boolean => {
  const taken = new Set(cellsOf(a));
  return cellsOf(b).some((cell) => taken.has(cell));
};

// Checks a new or changed object against the others (its own id is ignored).
export const checkPlacement = (
  others: readonly Placement[],
  candidate: Placement,
  cols: number,
  rows: number,
): PlacementError | null => {
  if (!fitsInGrid(candidate, cols, rows)) return 'out-of-bounds';
  const clash = others.some((other) => other.id !== candidate.id && overlaps(other, candidate));
  return clash ? 'overlap' : null;
};
