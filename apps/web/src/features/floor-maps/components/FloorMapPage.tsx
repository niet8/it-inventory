import { useEffect, useState } from 'react';

import { FloorMapEditor } from '@/features/floor-maps/components/FloorMapEditor';
import { MapSelector } from '@/features/floor-maps/components/MapSelector';
import { useFloorMaps } from '@/features/floor-maps/hooks/useFloorMaps';
import { readLastMapId, writeLastMapId } from '@/features/floor-maps/lib/lastMapStorage';
import { AsyncState } from '@/shared/ui/AsyncState';

export function FloorMapPage() {
  const { query, maps, create, rename, remove, patchMap, fetchFresh } = useFloorMaps();
  const [selectedId, setSelectedId] = useState<string | null>(readLastMapId);
  // A remembered map that no longer exists falls back to the first one.
  const active = maps.find((map) => map.id === selectedId) ?? maps[0] ?? null;

  useEffect(() => {
    if (query.isSuccess) writeLastMapId(active?.id ?? null);
  }, [query.isSuccess, active?.id]);

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Floor maps</h1>
        <MapSelector
          maps={maps}
          activeId={active?.id ?? null}
          onSelect={setSelectedId}
          onCreate={async (name) => setSelectedId((await create.mutateAsync(name)).id)}
          onRename={(id, name) => rename.mutateAsync({ id, name })}
          onDelete={(id) => remove.mutateAsync(id)}
        />
      </header>
      <AsyncState
        isLoading={query.isPending}
        error={query.error}
        onRetry={() => void query.refetch()}
        isEmpty={maps.length === 0}
        emptyMessage="No floor maps yet. Create one to start drawing your office."
      >
        {/* Keyed by map: switching maps flushes pending edits and starts a fresh editor. */}
        {active && <FloorMapEditor key={active.id} map={active} patchMap={patchMap} fetchFresh={fetchFresh} />}
      </AsyncState>
    </div>
  );
}
