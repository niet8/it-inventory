// `h_<row>_<col>` is the top edge of a cell (row may equal `rows` for the bottom border);
// `v_<row>_<col>` is its left edge (col may equal `cols` for the right border).
export type WallKind = 'h' | 'v';
export type Side = 'top' | 'bottom' | 'left' | 'right';
export type Wall = { kind: WallKind; row: number; col: number };

const WALL_KEY = /^([hv])_(\d+)_(\d+)$/;

export const wallKey = (kind: WallKind, row: number, col: number): string => `${kind}_${row}_${col}`;

export const parseWall = (key: string): Wall | null => {
  const match = WALL_KEY.exec(key);
  if (!match) return null;
  return { kind: match[1] as WallKind, row: Number(match[2]), col: Number(match[3]) };
};

// Same rule as the API.
export const isWallInside = ({ kind, row, col }: Wall, cols: number, rows: number): boolean =>
  kind === 'h' ? row <= rows && col < cols : row < rows && col <= cols;

export const cellEdgeKey = (row: number, col: number, side: Side): string => {
  switch (side) {
    case 'top':
      return wallKey('h', row, col);
    case 'bottom':
      return wallKey('h', row + 1, col);
    case 'left':
      return wallKey('v', row, col);
    case 'right':
      return wallKey('v', row, col + 1);
  }
};

// Which edge of a square cell a point (relative to its top-left corner) is close to, if any.
export const edgeAt = (x: number, y: number, size: number, threshold: number): Side | null => {
  const distances: [Side, number][] = [
    ['top', y],
    ['bottom', size - y],
    ['left', x],
    ['right', size - x],
  ];
  let best: [Side, number] = ['top', Number.POSITIVE_INFINITY];
  for (const candidate of distances) if (candidate[1] < best[1]) best = candidate;
  return best[1] <= threshold ? best[0] : null;
};

export const toggleWall = (walls: readonly string[], key: string): string[] =>
  walls.includes(key) ? walls.filter((wall) => wall !== key) : [...walls, key];

export const removeWall = (walls: readonly string[], key: string): string[] => walls.filter((wall) => wall !== key);

// Shifts a wall when a strip is added (delta 1) or removed (delta -1) on one side of the grid.
// Returns null when the wall lay on the removed strip.
const moveWall = (wall: Wall, side: Side, delta: 1 | -1, cols: number, rows: number): Wall | null => {
  const { kind, row, col } = wall;
  switch (side) {
    case 'top':
      // Removing row 0 drops its top edge and its side edges; the edge below becomes the border.
      return delta === -1 && row === 0 ? null : { kind, row: row + delta, col };
    case 'left':
      return delta === -1 && col === 0 ? null : { kind, row, col: col + delta };
    case 'bottom':
      if (delta === 1) return wall;
      return (kind === 'h' ? row === rows : row === rows - 1) ? null : wall;
    case 'right':
      if (delta === 1) return wall;
      return (kind === 'v' ? col === cols : col === cols - 1) ? null : wall;
  }
};

export const resizeWalls = (
  walls: readonly string[],
  side: Side,
  delta: 1 | -1,
  cols: number,
  rows: number,
): string[] => {
  const nextCols = side === 'left' || side === 'right' ? cols + delta : cols;
  const nextRows = side === 'top' || side === 'bottom' ? rows + delta : rows;
  const result = new Set<string>();
  for (const key of walls) {
    const wall = parseWall(key);
    const moved = wall && moveWall(wall, side, delta, cols, rows);
    if (moved && isWallInside(moved, nextCols, nextRows)) result.add(wallKey(moved.kind, moved.row, moved.col));
  }
  return [...result];
};
