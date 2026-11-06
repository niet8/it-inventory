import type { FloorMap } from '@it-inventory/contracts';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

import { floorMapsApi } from '@/features/floor-maps/api/floorMapsApi';
import { useAutosave } from '@/features/floor-maps/hooks/useAutosave';
import { useDeskAssignment } from '@/features/floor-maps/hooks/useDeskAssignment';
import { useLayoutState } from '@/features/floor-maps/hooks/useLayoutState';

type EditorOptions = {
  map: FloorMap;
  patchMap: (id: string, update: (map: FloorMap) => FloorMap | null) => void;
  fetchFresh: (id: string) => Promise<FloorMap | null>;
};

const toLayout = ({ cols, rows, walls, labels, objects }: FloorMap) => ({ cols, rows, walls, labels, objects });

// Wires one open map: local layout state, its autosave and desk assignments, all kept in the list cache.
export function useFloorMapEditor({ map, patchMap, fetchFresh }: EditorOptions) {
  const layoutState = useLayoutState(toLayout(map));
  const { layout, revision, dispatch } = layoutState;
  const [version, setVersion] = useState(map.version);

  const onSaved = useCallback(
    (saved: FloorMap, isLatest: boolean) => {
      setVersion(saved.version);
      patchMap(saved.id, () => saved);
      // Newer local edits win over an older echo; they are saved next.
      if (isLatest) dispatch({ type: 'sync', layout: toLayout(saved) });
    },
    [patchMap, dispatch],
  );

  const onConflict = useCallback(
    async (id: string) => {
      toast.error('This map was changed somewhere else. The latest version has been loaded.');
      try {
        const fresh = await fetchFresh(id);
        if (!fresh) return;
        setVersion(fresh.version);
        dispatch({ type: 'load', layout: toLayout(fresh) });
      } catch {
        toast.error('The latest version could not be loaded. Reload the page.');
      }
    },
    [fetchFresh, dispatch],
  );

  const autosave = useAutosave({
    mapId: map.id,
    version,
    layout,
    revision,
    save: floorMapsApi.saveLayout,
    onSaved,
    onConflict: (id) => void onConflict(id),
    onError: (error) => toast.error(`Changes not saved: ${error instanceof Error ? error.message : 'unknown error'}`),
  });

  const assignDesk = useCallback(
    async (objectId: string, employeeId: string | null) => {
      const result = await floorMapsApi.assignDesk(map.id, objectId, employeeId);
      patchMap(map.id, (cached) => ({
        ...cached,
        objects: cached.objects.map((object) => (object.id === objectId ? { ...object, employeeId } : object)),
      }));
      return result;
    },
    [map.id, patchMap],
  );

  const assign = useDeskAssignment({
    mapId: map.id,
    objects: layout.objects,
    dispatch,
    beforeAssign: autosave.flush,
    assign: (_mapId, objectId, employeeId) => assignDesk(objectId, employeeId),
  });

  return { ...layoutState, autosave, assign };
}
