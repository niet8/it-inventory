import type { FloorMap } from '@it-inventory/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { toast } from 'sonner';

import { floorMapKeys, floorMapsApi } from '@/features/floor-maps/api/floorMapsApi';

const errorMessage = (error: unknown) => (error instanceof Error ? error.message : 'Something went wrong');

// The map list plus the operations that change it. Layout saves and assignments go through their own hooks
// and only patch this cache, so reopening a map shows its latest state.
export function useFloorMaps() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: floorMapKeys.list, queryFn: ({ signal }) => floorMapsApi.list(signal) });

  const patchMap = useCallback(
    (id: string, update: (map: FloorMap) => FloorMap | null) =>
      queryClient.setQueryData<FloorMap[]>(floorMapKeys.list, (maps = []) =>
        maps.flatMap((map) => {
          if (map.id !== id) return [map];
          const next = update(map);
          return next ? [next] : [];
        }),
      ),
    [queryClient],
  );

  const create = useMutation({
    mutationFn: (name: string) => floorMapsApi.create({ name }),
    onSuccess: (map) => {
      queryClient.setQueryData<FloorMap[]>(floorMapKeys.list, (maps = []) => [...maps, map]);
      toast.success(`“${map.name}” created`);
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const rename = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => floorMapsApi.rename(id, name),
    // Renaming doesn't touch the layout: only the name is taken from the answer.
    onSuccess: (renamed) => patchMap(renamed.id, (map) => ({ ...map, name: renamed.name })),
    onError: (error) => toast.error(errorMessage(error)),
  });

  const remove = useMutation({
    mutationFn: (id: string) => floorMapsApi.remove(id),
    onSuccess: (_data, id) => {
      patchMap(id, () => null);
      toast.success('Floor map deleted');
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const fetchFresh = useCallback(
    async (id: string) => {
      const maps = await queryClient.fetchQuery({
        queryKey: floorMapKeys.list,
        queryFn: ({ signal }) => floorMapsApi.list(signal),
        staleTime: 0,
      });
      return maps.find((map) => map.id === id) ?? null;
    },
    [queryClient],
  );

  return { query, maps: query.data ?? [], create, rename, remove, patchMap, fetchFresh };
}
