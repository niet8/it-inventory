import type { FloorMapObject } from '@it-inventory/contracts';
import { type Dispatch, useCallback, useRef } from 'react';
import { toast } from 'sonner';

import { floorMapsApi } from '@/features/floor-maps/api/floorMapsApi';
import type { LayoutAction } from '@/features/floor-maps/hooks/useLayoutState';

type DeskAssignmentOptions = {
  mapId: string | null;
  objects: FloorMapObject[];
  dispatch: Dispatch<LayoutAction>;
  // A desk placed a moment ago must reach the server before it can be assigned.
  beforeAssign: () => Promise<void>;
  assign?: typeof floorMapsApi.assignDesk;
};

// Shows the new assignment at once and puts the previous one back if the server refuses it.
export function useDeskAssignment({
  mapId,
  objects,
  dispatch,
  beforeAssign,
  assign = floorMapsApi.assignDesk,
}: DeskAssignmentOptions) {
  const objectsRef = useRef(objects);
  objectsRef.current = objects;

  return useCallback(
    async (objectId: string, employeeId: string | null) => {
      if (!mapId) return;
      const previous = objectsRef.current.find((object) => object.id === objectId)?.employeeId ?? null;
      if (previous === employeeId) return;
      dispatch({ type: 'assign', objectId, employeeId });
      try {
        await beforeAssign();
        await assign(mapId, objectId, employeeId);
      } catch (error) {
        dispatch({ type: 'assign', objectId, employeeId: previous });
        toast.error(error instanceof Error ? error.message : 'The desk could not be assigned');
      }
    },
    [mapId, dispatch, beforeAssign, assign],
  );
}
