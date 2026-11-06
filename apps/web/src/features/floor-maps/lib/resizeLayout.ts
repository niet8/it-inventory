import type { FloorMap } from '@it-inventory/contracts';

import { fitsInGrid } from '@/features/floor-maps/lib/collision';
import { resizeWalls, type Side } from '@/features/floor-maps/lib/walls';

export type Layout = Pick<FloorMap, 'cols' | 'rows' | 'walls' | 'labels' | 'objects'>;

export const GRID_MIN = 1;
export const GRID_MAX = 100;

// Adds or removes one row/column on a side. Content keeps its place in the room;
// whatever no longer fits (objects, labels on a removed strip) is dropped. Null when the size is out of range.
export const resizeLayout = (layout: Layout, side: Side, delta: 1 | -1): Layout | null => {
  const horizontal = side === 'left' || side === 'right';
  const cols = horizontal ? layout.cols + delta : layout.cols;
  const rows = horizontal ? layout.rows : layout.rows + delta;
  if (Math.min(cols, rows) < GRID_MIN || Math.max(cols, rows) > GRID_MAX) return null;

  const rowShift = side === 'top' ? delta : 0;
  const colShift = side === 'left' ? delta : 0;

  const objects = layout.objects
    .map((object) => ({ ...object, row: object.row + rowShift, col: object.col + colShift }))
    .filter((object) => fitsInGrid(object, cols, rows));

  const labels = layout.labels
    .map((label) => ({ ...label, row: label.row + rowShift, col: label.col + colShift }))
    .filter((label) => label.row >= 0 && label.row < rows && label.col >= 0 && label.col < cols)
    .map((label) => ({ ...label, width: Math.min(label.width, cols - label.col) }));

  return {
    cols,
    rows,
    walls: resizeWalls(layout.walls, side, delta, layout.cols, layout.rows),
    labels,
    objects,
  };
};
