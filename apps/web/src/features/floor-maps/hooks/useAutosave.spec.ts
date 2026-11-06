import type { FloorMap, SaveLayoutBody } from '@it-inventory/contracts';
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AUTOSAVE_DELAY_MS, type AutosaveOptions, useAutosave } from '@/features/floor-maps/hooks/useAutosave';
import type { Layout } from '@/features/floor-maps/lib/resizeLayout';
import { ApiError } from '@/shared/api/httpClient';

const MAP_ID = '00000000-0000-4000-8000-000000000001';

const layout = (cols: number): Layout => ({
  cols,
  rows: 4,
  walls: [],
  labels: [],
  objects: [{ id: 'o1', typeId: 'desk', row: 0, col: 0, rotation: 0, employeeId: 'e1' }],
});

const serverMap = (body: SaveLayoutBody): FloorMap => ({
  id: MAP_ID,
  name: 'Office',
  ...body,
  objects: body.objects.map((object) => ({ ...object, employeeId: null })),
  version: body.version + 1,
});

type Deferred = { body: SaveLayoutBody; resolve: (map: FloorMap) => void; reject: (error: unknown) => void };

const setup = (overrides: Partial<AutosaveOptions> = {}) => {
  const requests: Deferred[] = [];
  const save = vi.fn(
    (_id: string, body: SaveLayoutBody) =>
      new Promise<FloorMap>((resolve, reject) => {
        requests.push({ body, resolve, reject });
      }),
  );
  const callbacks = { onSaved: vi.fn(), onConflict: vi.fn(), onError: vi.fn() };
  const initial: AutosaveOptions = {
    mapId: MAP_ID,
    version: 3,
    layout: layout(4),
    revision: 0,
    save,
    ...callbacks,
    ...overrides,
  };
  const hook = renderHook((props: AutosaveOptions) => useAutosave(props), { initialProps: initial });
  const edit = (patch: Partial<AutosaveOptions>) => hook.rerender({ ...initial, ...patch });
  return { hook, edit, save, requests, ...callbacks };
};

const settle = () => act(async () => {});

describe('useAutosave', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('does not save what was just loaded', () => {
    const { save, hook } = setup();
    act(() => vi.advanceTimersByTime(AUTOSAVE_DELAY_MS * 2));
    expect(save).not.toHaveBeenCalled();
    expect(hook.result.current.status).toBe('idle');
  });

  it('debounces edits and sends the newest layout with the current version, without assignments', async () => {
    const { edit, save, requests, onSaved, hook } = setup();
    edit({ revision: 1, layout: layout(5) });
    act(() => vi.advanceTimersByTime(AUTOSAVE_DELAY_MS - 100));
    edit({ revision: 2, layout: layout(6) });
    expect(hook.result.current.status).toBe('pending');
    act(() => vi.advanceTimersByTime(AUTOSAVE_DELAY_MS - 100));
    expect(save).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(100));
    expect(save).toHaveBeenCalledTimes(1);
    const sent = requests[0]?.body;
    expect(sent).toMatchObject({ version: 3, cols: 6 });
    expect(sent?.objects[0]).not.toHaveProperty('employeeId');
    expect(hook.result.current.status).toBe('saving');

    await act(async () => requests[0]?.resolve(serverMap(requests[0].body)));
    expect(onSaved).toHaveBeenCalledWith(expect.objectContaining({ version: 4 }), true);
    expect(hook.result.current.status).toBe('idle');
  });

  it('marks a response as stale when newer edits happened, then saves them with the new version', async () => {
    const { edit, requests, onSaved } = setup();
    edit({ revision: 1, layout: layout(5) });
    act(() => vi.advanceTimersByTime(AUTOSAVE_DELAY_MS));

    edit({ revision: 2, layout: layout(7) });
    await act(async () => requests[0]?.resolve(serverMap(requests[0].body)));
    expect(onSaved).toHaveBeenLastCalledWith(expect.objectContaining({ cols: 5 }), false);

    act(() => vi.advanceTimersByTime(AUTOSAVE_DELAY_MS));
    await settle();
    expect(requests).toHaveLength(2);
    expect(requests[1]?.body).toMatchObject({ version: 4, cols: 7 });
  });

  it('never has two requests in flight', async () => {
    const { edit, requests, hook } = setup();
    edit({ revision: 1, layout: layout(5) });
    act(() => vi.advanceTimersByTime(AUTOSAVE_DELAY_MS));
    edit({ revision: 2, layout: layout(6) });
    act(() => vi.advanceTimersByTime(AUTOSAVE_DELAY_MS));
    await settle();
    expect(requests).toHaveLength(1);

    await act(async () => requests[0]?.resolve(serverMap(requests[0].body)));
    await settle();
    expect(requests).toHaveLength(2);
    expect(requests[1]?.body.cols).toBe(6);
    await act(async () => requests[1]?.resolve(serverMap(requests[1].body)));
    expect(hook.result.current.status).toBe('idle');
  });

  it('on 409 reports the conflict and drops the local edits', async () => {
    const { edit, requests, onConflict, onError, save, hook } = setup();
    edit({ revision: 1, layout: layout(5) });
    act(() => vi.advanceTimersByTime(AUTOSAVE_DELAY_MS));

    await act(async () => requests[0]?.reject(new ApiError('Stale version', 409)));
    expect(onConflict).toHaveBeenCalledWith(MAP_ID);
    expect(onError).not.toHaveBeenCalled();
    expect(hook.result.current.status).toBe('idle');

    act(() => vi.advanceTimersByTime(AUTOSAVE_DELAY_MS * 2));
    expect(save).toHaveBeenCalledTimes(1);
  });

  it('reports other errors and retries on the next edit', async () => {
    const { edit, requests, onError, hook } = setup();
    edit({ revision: 1, layout: layout(5) });
    act(() => vi.advanceTimersByTime(AUTOSAVE_DELAY_MS));
    await act(async () => requests[0]?.reject(new ApiError('Objects overlap', 422)));
    expect(onError).toHaveBeenCalled();
    expect(hook.result.current.status).toBe('error');

    edit({ revision: 2, layout: layout(6) });
    act(() => vi.advanceTimersByTime(AUTOSAVE_DELAY_MS));
    expect(requests).toHaveLength(2);
  });

  it('ignores a response for a map that is no longer open', async () => {
    const { edit, requests, onSaved } = setup();
    edit({ revision: 1, layout: layout(5) });
    act(() => vi.advanceTimersByTime(AUTOSAVE_DELAY_MS));
    edit({ mapId: '00000000-0000-4000-8000-000000000002', revision: 1, layout: layout(9), version: 0 });

    await act(async () => requests[0]?.resolve(serverMap(requests[0].body)));
    expect(onSaved).not.toHaveBeenCalled();
  });

  it('warns before unloading while a save is pending', () => {
    const { edit } = setup();
    const event = () => {
      const unload = new Event('beforeunload', { cancelable: true });
      window.dispatchEvent(unload);
      return unload.defaultPrevented;
    };
    expect(event()).toBe(false);
    edit({ revision: 1, layout: layout(5) });
    expect(event()).toBe(true);
  });

  it('flush sends pending edits immediately', async () => {
    const { edit, requests, hook } = setup();
    edit({ revision: 1, layout: layout(5) });
    act(() => {
      void hook.result.current.flush();
    });
    await settle();
    expect(requests).toHaveLength(1);
  });
});
