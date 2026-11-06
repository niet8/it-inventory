import { describe, expect, it } from 'vitest';

import {
  cellEdgeKey,
  edgeAt,
  isWallInside,
  parseWall,
  removeWall,
  resizeWalls,
  toggleWall,
} from '@/features/floor-maps/lib/walls';

const sorted = (walls: string[]) => [...walls].sort();

describe('wall keys', () => {
  it('maps each cell edge to the shared key of that edge', () => {
    expect(cellEdgeKey(2, 3, 'top')).toBe('h_2_3');
    expect(cellEdgeKey(2, 3, 'bottom')).toBe('h_3_3');
    expect(cellEdgeKey(2, 3, 'left')).toBe('v_2_3');
    expect(cellEdgeKey(2, 3, 'right')).toBe('v_2_4');
    // The bottom edge of one cell is the top edge of the cell below.
    expect(cellEdgeKey(1, 0, 'bottom')).toBe(cellEdgeKey(2, 0, 'top'));
  });

  it('parses valid keys only', () => {
    expect(parseWall('v_4_10')).toEqual({ kind: 'v', row: 4, col: 10 });
    expect(parseWall('x_1_1')).toBeNull();
    expect(parseWall('h_-1_0')).toBeNull();
  });

  it('accepts the outer borders like the API does', () => {
    expect(isWallInside({ kind: 'h', row: 8, col: 9 }, 10, 8)).toBe(true);
    expect(isWallInside({ kind: 'h', row: 8, col: 10 }, 10, 8)).toBe(false);
    expect(isWallInside({ kind: 'v', row: 7, col: 10 }, 10, 8)).toBe(true);
    expect(isWallInside({ kind: 'v', row: 8, col: 0 }, 10, 8)).toBe(false);
  });
});

describe('edgeAt', () => {
  it('returns the closest edge within the threshold', () => {
    expect(edgeAt(20, 3, 40, 10)).toBe('top');
    expect(edgeAt(20, 38, 40, 10)).toBe('bottom');
    expect(edgeAt(2, 20, 40, 10)).toBe('left');
    expect(edgeAt(39, 20, 40, 10)).toBe('right');
  });

  it('returns null in the middle of the cell', () => {
    expect(edgeAt(20, 20, 40, 10)).toBeNull();
  });
});

describe('toggleWall / removeWall', () => {
  it('adds a missing wall and removes an existing one', () => {
    expect(toggleWall(['h_0_0'], 'v_0_0')).toEqual(['h_0_0', 'v_0_0']);
    expect(toggleWall(['h_0_0', 'v_0_0'], 'h_0_0')).toEqual(['v_0_0']);
  });

  it('removing a missing wall is a no-op', () => {
    expect(removeWall(['h_0_0'], 'v_1_1')).toEqual(['h_0_0']);
  });
});

describe('resizeWalls', () => {
  // 3 cols × 2 rows room with every border drawn.
  const border = ['h_0_0', 'h_0_1', 'h_0_2', 'h_2_0', 'h_2_1', 'h_2_2', 'v_0_0', 'v_1_0', 'v_0_3', 'v_1_3'];

  it('adding a row on top shifts every wall down', () => {
    expect(sorted(resizeWalls(['h_0_1', 'v_1_2'], 'top', 1, 3, 2))).toEqual(['h_1_1', 'v_2_2']);
  });

  it('adding on the bottom or right keeps the walls', () => {
    expect(sorted(resizeWalls(border, 'bottom', 1, 3, 2))).toEqual(sorted(border));
    expect(sorted(resizeWalls(border, 'right', 1, 3, 2))).toEqual(sorted(border));
  });

  it('adding a column on the left shifts every wall right', () => {
    expect(sorted(resizeWalls(['h_0_0', 'v_1_3'], 'left', 1, 3, 2))).toEqual(['h_0_1', 'v_1_4']);
  });

  it('removing the top row drops its edges and shifts the rest up', () => {
    const result = resizeWalls([...border, 'h_1_0'], 'top', -1, 3, 2);
    expect(sorted(result)).toEqual(['h_0_0', 'h_1_0', 'h_1_1', 'h_1_2', 'v_0_0', 'v_0_3']);
  });

  it('removing the bottom row keeps the edge above as the new border', () => {
    const result = resizeWalls([...border, 'h_1_2'], 'bottom', -1, 3, 2);
    expect(sorted(result)).toEqual(['h_0_0', 'h_0_1', 'h_0_2', 'h_1_2', 'v_0_0', 'v_0_3']);
  });

  it('removing the left column drops its edges and shifts the rest left', () => {
    const result = resizeWalls(['h_0_0', 'h_0_1', 'v_0_0', 'v_0_1', 'v_1_3'], 'left', -1, 3, 2);
    expect(sorted(result)).toEqual(['h_0_0', 'v_0_0', 'v_1_2']);
  });

  it('removing the right column drops the border and the edges of that column', () => {
    const result = resizeWalls(['h_0_2', 'h_0_1', 'v_0_3', 'v_0_2'], 'right', -1, 3, 2);
    expect(sorted(result)).toEqual(['h_0_1', 'v_0_2']);
  });

  it('every resulting wall is valid for the new grid', () => {
    for (const side of ['top', 'bottom', 'left', 'right'] as const) {
      for (const delta of [1, -1] as const) {
        const cols = side === 'left' || side === 'right' ? 3 + delta : 3;
        const rows = side === 'top' || side === 'bottom' ? 2 + delta : 2;
        for (const key of resizeWalls(border, side, delta, 3, 2)) {
          const wall = parseWall(key);
          expect(wall && isWallInside(wall, cols, rows)).toBe(true);
        }
      }
    }
  });
});
