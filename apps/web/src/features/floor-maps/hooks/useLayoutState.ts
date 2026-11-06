import type { FloorMapLabel } from '@it-inventory/contracts';
import { useCallback, useReducer } from 'react';

import { checkPlacement, type Placement, type PlacementError } from '@/features/floor-maps/lib/collision';
import { isAssignable, nextRotation } from '@/features/floor-maps/lib/objectTypes';
import { type Layout, resizeLayout } from '@/features/floor-maps/lib/resizeLayout';
import { removeWall, type Side, toggleWall } from '@/features/floor-maps/lib/walls';

export type { Layout } from '@/features/floor-maps/lib/resizeLayout';

// `revision` counts local edits: autosave saves whenever it moves. Loads and server echoes don't move it.
export type LayoutState = { layout: Layout; history: Layout[]; revision: number };

export type LayoutAction =
  | { type: 'load'; layout: Layout }
  | { type: 'sync'; layout: Layout }
  | { type: 'toggleWall'; key: string }
  | { type: 'removeWall'; key: string }
  | { type: 'clearWalls' }
  | { type: 'placeObject'; object: Placement }
  | { type: 'rotateObject'; id: string }
  | { type: 'removeObject'; id: string }
  | { type: 'upsertLabel'; label: FloorMapLabel }
  | { type: 'removeLabel'; id: string }
  | { type: 'resize'; side: Side; delta: 1 | -1 }
  | { type: 'assign'; objectId: string; employeeId: string | null }
  | { type: 'undo' };

export const HISTORY_LIMIT = 50;

export const EMPTY_LAYOUT: Layout = { cols: 10, rows: 8, walls: [], labels: [], objects: [] };

export const initialLayoutState: LayoutState = { layout: EMPTY_LAYOUT, history: [], revision: 0 };

const commit = (state: LayoutState, layout: Layout | null): LayoutState => {
  if (!layout || layout === state.layout) return state;
  return {
    layout,
    history: [...state.history, state.layout].slice(-HISTORY_LIMIT),
    revision: state.revision + 1,
  };
};

// Desk assignments live outside the layout history and are saved on their own, so the local ones win
// when the layout is replaced. A desk brought back by undo was deleted on the server: it comes back free.
const keepAssignments = (next: Layout, current: Layout): Layout => {
  const assigned = new Map(current.objects.map((object) => [object.id, object.employeeId]));
  return {
    ...next,
    objects: next.objects.map((object) => {
      const employeeId = assigned.get(object.id) ?? null;
      return { ...object, employeeId: isAssignable(object.typeId) ? employeeId : null };
    }),
  };
};

const edit = (layout: Layout, action: LayoutAction): Layout | null => {
  const { objects, walls, labels } = layout;
  switch (action.type) {
    case 'toggleWall':
      return { ...layout, walls: toggleWall(walls, action.key) };
    case 'removeWall':
      return walls.includes(action.key) ? { ...layout, walls: removeWall(walls, action.key) } : null;
    case 'clearWalls':
      return walls.length > 0 ? { ...layout, walls: [] } : null;
    case 'placeObject':
      if (checkPlacement(objects, action.object, layout.cols, layout.rows)) return null;
      return { ...layout, objects: [...objects, { ...action.object, employeeId: null }] };
    case 'rotateObject': {
      const target = objects.find((object) => object.id === action.id);
      if (!target) return null;
      const rotated = { ...target, rotation: nextRotation(target.rotation) };
      if (checkPlacement(objects, rotated, layout.cols, layout.rows)) return null;
      return { ...layout, objects: objects.map((object) => (object.id === action.id ? rotated : object)) };
    }
    case 'removeObject':
      return objects.some((object) => object.id === action.id)
        ? { ...layout, objects: objects.filter((object) => object.id !== action.id) }
        : null;
    case 'upsertLabel': {
      const exists = labels.some((label) => label.id === action.label.id);
      const next = exists
        ? labels.map((label) => (label.id === action.label.id ? action.label : label))
        : [...labels, action.label];
      return { ...layout, labels: next };
    }
    case 'removeLabel':
      return labels.some((label) => label.id === action.id)
        ? { ...layout, labels: labels.filter((label) => label.id !== action.id) }
        : null;
    case 'resize':
      return resizeLayout(layout, action.side, action.delta);
    default:
      return null;
  }
};

export const layoutReducer = (state: LayoutState, action: LayoutAction): LayoutState => {
  switch (action.type) {
    case 'load':
      return { layout: action.layout, history: [], revision: state.revision };
    case 'sync':
      return { ...state, layout: keepAssignments(action.layout, state.layout) };
    case 'assign': {
      const objects = state.layout.objects.map((object) =>
        object.id === action.objectId && isAssignable(object.typeId)
          ? { ...object, employeeId: action.employeeId }
          : object,
      );
      return { ...state, layout: { ...state.layout, objects } };
    }
    case 'undo': {
      const previous = state.history.at(-1);
      if (!previous) return state;
      return {
        layout: keepAssignments(previous, state.layout),
        history: state.history.slice(0, -1),
        revision: state.revision + 1,
      };
    }
    default:
      return commit(state, edit(state.layout, action));
  }
};

export function useLayoutState() {
  const [state, dispatch] = useReducer(layoutReducer, initialLayoutState);
  const { layout } = state;

  // Same checks the reducer applies, surfaced so the UI can say why an edit was rejected.
  const placeObject = useCallback(
    (object: Placement): PlacementError | null => {
      const error = checkPlacement(layout.objects, object, layout.cols, layout.rows);
      if (!error) dispatch({ type: 'placeObject', object });
      return error;
    },
    [layout],
  );

  const rotateObject = useCallback(
    (id: string): PlacementError | null => {
      const target = layout.objects.find((object) => object.id === id);
      if (!target) return null;
      const error = checkPlacement(
        layout.objects,
        { ...target, rotation: nextRotation(target.rotation) },
        layout.cols,
        layout.rows,
      );
      if (!error) dispatch({ type: 'rotateObject', id });
      return error;
    },
    [layout],
  );

  return { ...state, canUndo: state.history.length > 0, dispatch, placeObject, rotateObject };
}
