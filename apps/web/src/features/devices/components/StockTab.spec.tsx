import type { Device } from '@it-inventory/contracts';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as devicesApi from '@/features/devices/api/devicesApi';
import { StockTab } from '@/features/devices/components/StockTab';
import { renderWithQueryClient } from '@/features/devices/testing/renderWithQueryClient';

vi.mock('@/features/devices/api/devicesApi');

const makeDevice = (index: number, overrides: Partial<Device> = {}): Device => ({
  id: `d0000000-0000-4000-8000-00000000000${index}`,
  name: `Laptop ${index}`,
  code: `LAP-00${index}`,
  notes: null,
  status: 'available',
  employeeId: null,
  decommissionedAt: null,
  ...overrides,
});

const available = makeDevice(1);
const retired = makeDevice(2, { status: 'decommissioned', decommissionedAt: '2026-01-01T00:00:00.000Z' });
const listCalls = () => vi.mocked(devicesApi.listDevices).mock.calls.map(([query]) => query);

beforeEach(() => {
  vi.mocked(devicesApi.listDevices).mockResolvedValue({ items: [available, retired], total: 2, page: 1, limit: 20 });
});

afterEach(() => {
  vi.resetAllMocks();
});

describe('StockTab', () => {
  it('lists every device with its status', async () => {
    renderWithQueryClient(<StockTab />);

    const table = await screen.findByRole('table', { name: 'Devices' });
    expect(within(table).getByText('LAP-001')).toBeInTheDocument();
    expect(within(table).getByText('Decommissioned')).toBeInTheDocument();
    expect(listCalls()[0]).toEqual({ page: 1, limit: 20 });
  });

  it('filters by status and goes back to "All"', async () => {
    renderWithQueryClient(<StockTab />);
    await screen.findByRole('table');

    await userEvent.click(screen.getByRole('button', { name: 'In use' }));
    await waitFor(() => expect(listCalls().at(-1)).toEqual({ page: 1, limit: 20, status: 'in_use' }));
    expect(screen.getByRole('button', { name: 'In use' })).toHaveAttribute('aria-pressed', 'true');

    await userEvent.click(screen.getByRole('button', { name: 'All' }));
    expect(listCalls().at(-1)).toEqual({ page: 1, limit: 20 });
  });

  it('debounces the search so only the final text reaches the API', async () => {
    renderWithQueryClient(<StockTab />);
    await screen.findByRole('table');

    await userEvent.type(screen.getByLabelText('Search devices'), 'lap');

    await waitFor(() => expect(listCalls().at(-1)).toEqual({ page: 1, limit: 20, search: 'lap' }));
    const searches = listCalls().map((query) => query.search);
    expect(searches).not.toContain('l');
    expect(searches).not.toContain('la');
  });

  it('pages through the results', async () => {
    vi.mocked(devicesApi.listDevices).mockResolvedValue({ items: [available], total: 45, page: 1, limit: 20 });
    renderWithQueryClient(<StockTab />);
    await screen.findByText('Page 1 of 3');

    await userEvent.click(screen.getByRole('button', { name: 'Next page' }));

    await waitFor(() => expect(listCalls().at(-1)).toEqual({ page: 2, limit: 20 }));
  });

  it('shows the filtered empty state', async () => {
    renderWithQueryClient(<StockTab />);
    await screen.findByRole('table');
    vi.mocked(devicesApi.listDevices).mockResolvedValue({ items: [], total: 0, page: 1, limit: 20 });

    await userEvent.click(screen.getByRole('button', { name: 'Available' }));

    expect(await screen.findByText('No devices match these filters.')).toBeInTheDocument();
  });

  it('decommissions an available device and reactivates a decommissioned one', async () => {
    vi.mocked(devicesApi.transitionDevice).mockResolvedValue(available);
    renderWithQueryClient(<StockTab />);

    await userEvent.click(await screen.findByRole('button', { name: 'Decommission Laptop 1' }));
    await userEvent.click(screen.getByRole('button', { name: 'Reactivate Laptop 2' }));

    await waitFor(() => expect(devicesApi.transitionDevice).toHaveBeenCalledTimes(2));
    expect(vi.mocked(devicesApi.transitionDevice).mock.calls.map(([vars]) => vars)).toEqual([
      { id: available.id, transition: 'decommission' },
      { id: retired.id, transition: 'reactivate' },
    ]);
  });

  it('deletes a device after confirming', async () => {
    vi.mocked(devicesApi.deleteDevice).mockResolvedValue(null);
    renderWithQueryClient(<StockTab />);

    await userEvent.click(await screen.findByRole('button', { name: 'Delete Laptop 1' }));
    await userEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(vi.mocked(devicesApi.deleteDevice).mock.calls[0]?.[0]).toBe(available.id));
  });
});
