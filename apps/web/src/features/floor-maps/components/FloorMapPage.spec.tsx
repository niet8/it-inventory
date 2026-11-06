import type { FloorMap } from '@it-inventory/contracts';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { QueryProvider } from '@/app/QueryProvider';
import { FloorMapPage } from '@/features/floor-maps/components/FloorMapPage';
import { CELL_SIZE } from '@/features/floor-maps/lib/editor';

const map = (id: string, name: string): FloorMap => ({
  id,
  name,
  cols: 4,
  rows: 3,
  walls: [],
  labels: [],
  objects: [],
  version: 2,
});

const FIRST = map('00000000-0000-4000-8000-000000000001', 'Ground floor');
const SECOND = map('00000000-0000-4000-8000-000000000002', 'First floor');

type Call = { method: string; path: string; body: unknown };

const mockApi = () => {
  const calls: Call[] = [];
  vi.stubGlobal('fetch', async (url: URL, init: RequestInit = {}) => {
    const method = init.method ?? 'GET';
    const body = init.body ? JSON.parse(String(init.body)) : undefined;
    calls.push({ method, path: url.pathname, body });
    const ok = (data: unknown) => Response.json({ status: 'OK', data });
    if (url.pathname === '/floor-maps') return ok([FIRST, SECOND]);
    if (url.pathname.endsWith('/layout')) return ok({ ...SECOND, ...body, version: body.version + 1 });
    return ok({ items: [], total: 0, page: 1, limit: 100 });
  });
  return calls;
};

const renderPage = () =>
  render(
    <QueryProvider>
      <MemoryRouter>
        <FloorMapPage />
      </MemoryRouter>
    </QueryProvider>,
  );

describe('FloorMapPage', () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('opens the last map the user had open', async () => {
    mockApi();
    window.localStorage.setItem('it-inventory:last-floor-map', SECOND.id);
    renderPage();

    expect(await screen.findByRole('application', { name: 'Floor map, 4 by 3 cells' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Floor map' })).toHaveTextContent('First floor');
  });

  it('falls back to the first map when storage is unavailable', async () => {
    mockApi();
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    renderPage();

    await screen.findByRole('application');
    expect(screen.getByRole('combobox', { name: 'Floor map' })).toHaveTextContent('Ground floor');
  });

  it('places a desk and autosaves the layout with the current version', async () => {
    const calls = mockApi();
    window.localStorage.setItem('it-inventory:last-floor-map', SECOND.id);
    renderPage();
    const grid = await screen.findByRole('application');

    await userEvent.click(screen.getByRole('button', { name: /Desk/ }));
    fireEvent.click(grid, { clientX: CELL_SIZE + 20, clientY: CELL_SIZE + 20 });
    expect(within(grid).getByRole('button', { name: 'Desk' })).toBeInTheDocument();

    await waitFor(() => expect(calls.some((call) => call.method === 'PUT')).toBe(true), { timeout: 2000 });
    const save = calls.find((call) => call.method === 'PUT');
    expect(save?.path).toBe(`/floor-maps/${SECOND.id}/layout`);
    expect(save?.body).toMatchObject({ version: 2, objects: [{ typeId: 'desk', row: 1, col: 1, rotation: 0 }] });
    expect(await screen.findByText('All changes saved')).toBeInTheDocument();
  });
});
