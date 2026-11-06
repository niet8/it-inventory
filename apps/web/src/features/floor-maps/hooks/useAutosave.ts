import type { FloorMap, SaveLayoutBody } from '@it-inventory/contracts';
import { useCallback, useEffect, useRef, useState } from 'react';

import type { Layout } from '@/features/floor-maps/lib/resizeLayout';
import { ApiError } from '@/shared/api/httpClient';

export type AutosaveStatus = 'idle' | 'pending' | 'saving' | 'error';

export type AutosaveOptions = {
  mapId: string | null;
  version: number;
  layout: Layout;
  // Bumped by every local edit; a save is due whenever it differs from the last saved one.
  revision: number;
  save: (mapId: string, body: SaveLayoutBody) => Promise<FloorMap>;
  // `isLatest` is false when newer edits happened while the request was in flight.
  onSaved: (map: FloorMap, isLatest: boolean) => void;
  onConflict: (mapId: string) => void;
  onError: (error: unknown) => void;
  delay?: number;
};

export const AUTOSAVE_DELAY_MS = 800;

// Assignments are saved on their own endpoint, never with the layout.
export const toSaveBody = (layout: Layout, version: number): SaveLayoutBody => ({
  version,
  cols: layout.cols,
  rows: layout.rows,
  walls: layout.walls,
  labels: layout.labels,
  objects: layout.objects.map(({ id, typeId, row, col, rotation }) => ({ id, typeId, row, col, rotation })),
});

export function useAutosave({ delay = AUTOSAVE_DELAY_MS, ...options }: AutosaveOptions) {
  const { mapId, version, revision } = options;
  const [status, setStatus] = useState<AutosaveStatus>('idle');
  const latest = useRef(options);
  const versionRef = useRef(version);
  const savedRevision = useRef(revision);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const inFlight = useRef<Promise<void> | null>(null);

  useEffect(() => {
    latest.current = options;
  });

  useEffect(() => {
    versionRef.current = version;
  }, [version]);

  // Whatever is on screen right after opening a map is, by definition, saved.
  useEffect(() => {
    if (mapId === null) return;
    savedRevision.current = latest.current.revision;
    clearTimeout(timer.current);
    setStatus('idle');
  }, [mapId]);

  const send = useCallback(async () => {
    const { mapId: id, layout, revision: sent, save } = latest.current;
    if (!id || sent === savedRevision.current) return;
    setStatus('saving');
    try {
      const map = await save(id, toSaveBody(layout, versionRef.current));
      if (latest.current.mapId !== id) return;
      versionRef.current = map.version;
      savedRevision.current = sent;
      const isLatest = latest.current.revision === sent;
      latest.current.onSaved(map, isLatest);
      setStatus(isLatest ? 'idle' : 'pending');
    } catch (error) {
      if (latest.current.mapId !== id) return;
      if (error instanceof ApiError && error.status === 409) {
        // Someone else saved first: local edits are dropped and the caller reloads the map.
        savedRevision.current = latest.current.revision;
        setStatus('idle');
        latest.current.onConflict(id);
      } else {
        setStatus('error');
        latest.current.onError(error);
      }
    }
  }, []);

  // Saves now. Requests never overlap: a new one waits for the one in flight, then sends the newest layout.
  const flush = useCallback(async () => {
    clearTimeout(timer.current);
    while (inFlight.current) await inFlight.current;
    const request = send().finally(() => {
      inFlight.current = null;
    });
    inFlight.current = request;
    await request;
  }, [send]);

  useEffect(() => {
    if (mapId === null || revision === savedRevision.current) return;
    setStatus((current) => (current === 'saving' ? current : 'pending'));
    clearTimeout(timer.current);
    timer.current = setTimeout(() => void flush(), delay);
  }, [mapId, revision, delay, flush]);

  // Leaving the page with unsaved edits sends them right away.
  useEffect(() => () => void flush(), [flush]);

  useEffect(() => {
    if (status === 'idle') return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [status]);

  return { status, flush };
}
