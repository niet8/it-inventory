import type { FloorMapObject } from '@it-inventory/contracts';
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  HISTORY_LIMIT,
  initialLayoutState,
  type Layout,
  type LayoutAction,
  type LayoutState,
  layoutReducer,
  useLayoutState,
} from '@/features/floor-maps/hooks/useLayoutState';

const desk = (id: string, row: number, col: number, employeeId: string | null = null): FloorMapObject => ({
  id,
  typeId: 'desk',
  row,
  col,
  rotation: 0,
  employeeId,
});

const layout = (overrides: Partial<Layout> = {}): Layout => ({
  cols: 4,
  rows: 3,
  walls: [],
  labels: [],
  objects: [],
  ...overrides,
});

const run = (start: Layout, ...actions: LayoutAction[]): LayoutState =>
  actions.reduce(layoutReducer, layoutReducer(initialLayoutState, { type: 'load', layout: start }));

describe('layoutReducer', () => {
  it('load replaces the layout and clears history without counting as an edit', () => {
    const state = run(layout(), { type: 'toggleWall', key: 'h_0_0' }, { type: 'load', layout: layout({ cols: 9 }) });

    expect(state.layout.cols).toBe(9);
    expect(state.history).toEqual([]);
    expect(state.revision).toBe(1);
  });

  it('toggles, removes and clears walls, each as an undoable edit', () => {
    const state = run(
      layout(),
      { type: 'toggleWall', key: 'h_0_0' },
      { type: 'toggleWall', key: 'v_0_0' },
      { type: 'toggleWall', key: 'h_0_0' },
    );
    expect(state.layout.walls).toEqual(['v_0_0']);
    expect(state.revision).toBe(3);

    const cleared = layoutReducer(state, { type: 'clearWalls' });
    expect(cleared.layout.walls).toEqual([]);
    expect(layoutReducer(cleared, { type: 'clearWalls' })).toBe(cleared);
    expect(layoutReducer(cleared, { type: 'removeWall', key: 'h_9_9' })).toBe(cleared);
  });

  it('places objects only where they fit and nothing else is', () => {
    const start = run(layout({ objects: [desk('a', 0, 0)] }));
    const placed = layoutReducer(start, {
      type: 'placeObject',
      object: { id: 'sofa', typeId: 'sofa', row: 1, col: 0, rotation: 0 },
    });
    expect(placed.layout.objects).toHaveLength(2);
    expect(placed.layout.objects[1]?.employeeId).toBeNull();

    const overlapping = { id: 'b', typeId: 'desk', row: 0, col: 0, rotation: 0 } as const;
    expect(layoutReducer(placed, { type: 'placeObject', object: overlapping })).toBe(placed);
    const outside = { id: 'c', typeId: 'sofa', row: 2, col: 3, rotation: 0 } as const;
    expect(layoutReducer(placed, { type: 'placeObject', object: outside })).toBe(placed);
  });

  it('rotates in place unless the new footprint overlaps or leaves the grid', () => {
    const sofa: FloorMapObject = { ...desk('s', 0, 0), typeId: 'sofa' };
    const free = run(layout({ objects: [sofa] }), { type: 'rotateObject', id: 's' });
    expect(free.layout.objects[0]?.rotation).toBe(90);

    const blocked = run(layout({ objects: [sofa, desk('d', 1, 0)] }));
    expect(layoutReducer(blocked, { type: 'rotateObject', id: 's' })).toBe(blocked);

    const atBottom = run(layout({ objects: [{ ...sofa, row: 2 }] }));
    expect(layoutReducer(atBottom, { type: 'rotateObject', id: 's' })).toBe(atBottom);
  });

  it('removes objects and labels, and edits labels in place', () => {
    const label = { id: 'l', text: 'Kitchen', row: 0, col: 0, width: 3 };
    const state = run(
      layout({ objects: [desk('a', 0, 0)] }),
      { type: 'removeObject', id: 'a' },
      { type: 'upsertLabel', label },
      { type: 'upsertLabel', label: { ...label, text: 'Lounge' } },
    );
    expect(state.layout.objects).toEqual([]);
    expect(state.layout.labels).toEqual([{ ...label, text: 'Lounge' }]);
    expect(layoutReducer(state, { type: 'removeLabel', id: 'l' }).layout.labels).toEqual([]);
  });

  it('resizes from the top, shifting content and dropping what falls off', () => {
    const state = run(layout({ walls: ['h_0_0'], objects: [desk('a', 0, 0), desk('b', 2, 1)], labels: [] }), {
      type: 'resize',
      side: 'top',
      delta: -1,
    });
    expect(state.layout.rows).toBe(2);
    expect(state.layout.walls).toEqual([]);
    expect(state.layout.objects).toEqual([desk('b', 1, 1)]);
  });

  it('shrinks labels that would cross the new right border and refuses to go below one cell', () => {
    const label = { id: 'l', text: 'Kitchen', row: 0, col: 1, width: 3 };
    const state = run(layout({ labels: [label] }), { type: 'resize', side: 'right', delta: -1 });
    expect(state.layout.labels[0]?.width).toBe(2);

    const tiny = run(layout({ cols: 1 }));
    expect(layoutReducer(tiny, { type: 'resize', side: 'left', delta: -1 })).toBe(tiny);
  });

  it('assigns desks without touching history or revision', () => {
    const start = run(layout({ objects: [desk('a', 0, 0), { ...desk('p', 1, 0), typeId: 'plant' }] }));
    const state = [
      { type: 'assign', objectId: 'a', employeeId: 'e1' },
      { type: 'assign', objectId: 'p', employeeId: 'e1' },
    ].reduce<LayoutState>((current, action) => layoutReducer(current, action as LayoutAction), start);

    expect(state.layout.objects.map((object) => object.employeeId)).toEqual(['e1', null]);
    expect(state.revision).toBe(start.revision);
    expect(state.history).toEqual([]);
  });

  it('undo restores the previous layout but keeps current assignments', () => {
    const state = run(
      layout({ objects: [desk('a', 0, 0)] }),
      { type: 'toggleWall', key: 'h_1_1' },
      { type: 'assign', objectId: 'a', employeeId: 'e1' },
      { type: 'undo' },
    );
    expect(state.layout.walls).toEqual([]);
    expect(state.layout.objects[0]?.employeeId).toBe('e1');
    expect(state.revision).toBe(2);
    expect(layoutReducer(state, { type: 'undo' })).toBe(state);
  });

  it('a desk brought back by undo comes back unassigned', () => {
    const state = run(
      layout({ objects: [desk('a', 0, 0, 'e1')] }),
      { type: 'removeObject', id: 'a' },
      { type: 'undo' },
    );
    expect(state.layout.objects).toEqual([desk('a', 0, 0, null)]);
  });

  it('caps history', () => {
    const toggles = Array.from(
      { length: HISTORY_LIMIT + 5 },
      (): LayoutAction => ({ type: 'toggleWall', key: 'h_0_0' }),
    );
    expect(run(layout(), ...toggles).history).toHaveLength(HISTORY_LIMIT);
  });

  it('sync applies the server layout without bumping revision and keeps local assignments', () => {
    const start = run(layout({ objects: [desk('a', 0, 0)] }), { type: 'assign', objectId: 'a', employeeId: 'e2' });
    const state = layoutReducer(start, {
      type: 'sync',
      layout: layout({ walls: ['h_0_0'], objects: [desk('a', 0, 0, 'e1')] }),
    });
    expect(state.layout.walls).toEqual(['h_0_0']);
    expect(state.layout.objects[0]?.employeeId).toBe('e2');
    expect(state.revision).toBe(start.revision);
  });
});

describe('useLayoutState', () => {
  it('reports why a placement or rotation was rejected', () => {
    const { result } = renderHook(() => useLayoutState());
    act(() => result.current.dispatch({ type: 'load', layout: layout({ objects: [desk('a', 0, 1)] }) }));

    let error: string | null = null;
    act(() => {
      error = result.current.placeObject({ id: 's', typeId: 'sofa', row: 0, col: 0, rotation: 0 });
    });
    expect(error).toBe('overlap');

    act(() => {
      error = result.current.placeObject({ id: 's', typeId: 'sofa', row: 1, col: 0, rotation: 0 });
    });
    expect(error).toBeNull();
    expect(result.current.canUndo).toBe(true);

    act(() => {
      error = result.current.rotateObject('s');
    });
    expect(error).toBeNull();
    expect(result.current.layout.objects[1]?.rotation).toBe(90);
  });
});
