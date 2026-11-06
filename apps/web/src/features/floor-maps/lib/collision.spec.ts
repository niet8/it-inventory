import { describe, expect, it } from 'vitest';

import { cellsOf, checkPlacement, fitsInGrid, overlaps, type Placement } from '@/features/floor-maps/lib/collision';
import { footprintOf, isAssignable, nextRotation, OBJECT_TYPE_IDS } from '@/features/floor-maps/lib/objectTypes';

const place = (overrides: Partial<Placement> = {}): Placement => ({
  id: 'a',
  typeId: 'desk',
  row: 0,
  col: 0,
  rotation: 0,
  ...overrides,
});

describe('objectTypes', () => {
  it('swaps width and height on a quarter turn, like the API', () => {
    expect(footprintOf('ping-pong', 0)).toEqual({ width: 2, height: 3 });
    expect(footprintOf('ping-pong', 180)).toEqual({ width: 2, height: 3 });
    expect(footprintOf('ping-pong', 90)).toEqual({ width: 3, height: 2 });
    expect(footprintOf('sofa', 270)).toEqual({ width: 1, height: 2 });
  });

  it('cycles rotations and only lets desks be assigned', () => {
    expect(nextRotation(0)).toBe(90);
    expect(nextRotation(270)).toBe(0);
    expect(OBJECT_TYPE_IDS.filter(isAssignable)).toEqual(['desk']);
  });
});

describe('cellsOf', () => {
  it('lists every cell covered by the rotated footprint', () => {
    expect(cellsOf(place({ typeId: 'sofa', row: 1, col: 2 }))).toEqual(['1:2', '1:3']);
    expect(cellsOf(place({ typeId: 'sofa', row: 1, col: 2, rotation: 90 }))).toEqual(['1:2', '2:2']);
  });
});

describe('fitsInGrid', () => {
  it('accepts a footprint touching the far borders', () => {
    expect(fitsInGrid(place({ typeId: 'ping-pong', row: 5, col: 8 }), 10, 8)).toBe(true);
  });

  it('rejects a footprint crossing a border', () => {
    expect(fitsInGrid(place({ typeId: 'ping-pong', row: 6, col: 8 }), 10, 8)).toBe(false);
    expect(fitsInGrid(place({ typeId: 'ping-pong', row: 5, col: 9 }), 10, 8)).toBe(false);
    expect(fitsInGrid(place({ row: -1 }), 10, 8)).toBe(false);
  });

  it('takes rotation into account', () => {
    // 2×3 fits at col 8, but rotated it is 3 wide and does not.
    expect(fitsInGrid(place({ typeId: 'ping-pong', row: 0, col: 8 }), 10, 8)).toBe(true);
    expect(fitsInGrid(place({ typeId: 'ping-pong', row: 0, col: 8, rotation: 90 }), 10, 8)).toBe(false);
    expect(fitsInGrid(place({ typeId: 'ping-pong', row: 6, col: 7, rotation: 270 }), 10, 8)).toBe(true);
  });
});

describe('overlaps', () => {
  it('detects shared cells only', () => {
    const table = place({ id: 't', typeId: 'ping-pong', row: 0, col: 0 });
    expect(overlaps(table, place({ id: 'd', row: 2, col: 1 }))).toBe(true);
    expect(overlaps(table, place({ id: 'd', row: 3, col: 1 }))).toBe(false);
    expect(overlaps(table, place({ id: 'd', row: 0, col: 2 }))).toBe(false);
  });

  it('detects overlaps introduced by rotation', () => {
    const desk = place({ id: 'd', row: 0, col: 2 });
    expect(overlaps(place({ id: 's', typeId: 'sofa', row: 0, col: 1, rotation: 90 }), desk)).toBe(false);
    expect(overlaps(place({ id: 's', typeId: 'sofa', row: 0, col: 1 }), desk)).toBe(true);
  });
});

describe('checkPlacement', () => {
  const others = [place({ id: 'desk-1', row: 1, col: 1 })];

  it('returns null for a free spot', () => {
    expect(checkPlacement(others, place({ id: 'new', row: 3, col: 3 }), 10, 8)).toBeNull();
  });

  it('reports bounds before overlaps', () => {
    expect(checkPlacement(others, place({ id: 'new', typeId: 'sofa', row: 0, col: 9 }), 10, 8)).toBe('out-of-bounds');
    expect(checkPlacement(others, place({ id: 'new', typeId: 'sofa', row: 1, col: 0 }), 10, 8)).toBe('overlap');
  });

  it('ignores the candidate itself when it is being rotated in place', () => {
    const sofa = place({ id: 'sofa', typeId: 'sofa', row: 3, col: 3 });
    expect(checkPlacement([sofa], { ...sofa, rotation: 90 }, 10, 8)).toBeNull();
    expect(checkPlacement([sofa, place({ id: 'd', row: 4, col: 3 })], { ...sofa, rotation: 90 }, 10, 8)).toBe(
      'overlap',
    );
  });
});
