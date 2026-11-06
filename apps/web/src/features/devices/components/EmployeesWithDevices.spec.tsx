import type { Device, Employee } from '@it-inventory/contracts';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as devicesApi from '@/features/devices/api/devicesApi';
import { EmployeesWithDevices } from '@/features/devices/components/EmployeesWithDevices';
import { renderWithQueryClient } from '@/features/devices/testing/renderWithQueryClient';
import * as employeesApi from '@/features/employees/api/employeesApi';

vi.mock('@/features/devices/api/devicesApi');
vi.mock('@/features/employees/api/employeesApi', async (importOriginal) => ({
  ...(await importOriginal<typeof employeesApi>()),
  listEmployees: vi.fn(),
  deleteEmployee: vi.fn(),
}));

const ada: Employee = {
  id: 'e0000000-0000-4000-8000-000000000001',
  fullName: 'Ada Example',
  email: null,
  department: 'Design',
};
const bruno: Employee = {
  id: 'e0000000-0000-4000-8000-000000000002',
  fullName: 'Bruno Sample',
  email: null,
  department: null,
};
const laptop: Device = {
  id: 'd0000000-0000-4000-8000-000000000001',
  name: 'Laptop 14"',
  code: 'LAP-001',
  notes: null,
  status: 'in_use',
  employeeId: ada.id,
  decommissionedAt: null,
};

beforeEach(() => {
  vi.mocked(employeesApi.listEmployees).mockResolvedValue({ items: [ada, bruno], total: 2, page: 1, limit: 10 });
  vi.mocked(devicesApi.listDevices).mockResolvedValue({ items: [laptop], total: 1, page: 1, limit: 100 });
});

afterEach(() => {
  vi.resetAllMocks();
});

describe('EmployeesWithDevices', () => {
  it('fetches the devices of the whole page in one request and groups them', async () => {
    renderWithQueryClient(<EmployeesWithDevices />);

    const adaDevices = await screen.findByRole('list', { name: 'Devices of Ada Example' });
    expect(within(adaDevices).getByText('LAP-001')).toBeInTheDocument();
    expect(screen.getByText('No devices assigned.')).toBeInTheDocument();
    expect(devicesApi.listDevices).toHaveBeenCalledTimes(1);
    expect(vi.mocked(devicesApi.listDevices).mock.calls[0]?.[0]).toEqual({
      employeeIds: [ada.id, bruno.id],
      limit: 100,
    });
  });

  it('unassigns a device', async () => {
    vi.mocked(devicesApi.transitionDevice).mockResolvedValue({ ...laptop, status: 'available', employeeId: null });
    renderWithQueryClient(<EmployeesWithDevices />);

    await userEvent.click(await screen.findByRole('button', { name: 'Unassign Laptop 14"' }));

    await waitFor(() =>
      expect(vi.mocked(devicesApi.transitionDevice).mock.calls[0]?.[0]).toEqual({
        id: laptop.id,
        transition: 'unassign',
      }),
    );
  });

  it('deletes an employee only after confirming', async () => {
    vi.mocked(employeesApi.deleteEmployee).mockResolvedValue(null);
    renderWithQueryClient(<EmployeesWithDevices />);

    await userEvent.click(await screen.findByRole('button', { name: 'Delete Bruno Sample' }));
    const dialog = screen.getByRole('alertdialog');
    expect(within(dialog).getByText('Delete Bruno Sample?')).toBeInTheDocument();
    expect(employeesApi.deleteEmployee).not.toHaveBeenCalled();

    await userEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(vi.mocked(employeesApi.deleteEmployee).mock.calls[0]?.[0]).toBe(bruno.id));
  });

  it('shows the empty state', async () => {
    vi.mocked(employeesApi.listEmployees).mockResolvedValue({ items: [], total: 0, page: 1, limit: 10 });
    renderWithQueryClient(<EmployeesWithDevices />);

    expect(await screen.findByText('No employees yet.')).toBeInTheDocument();
    expect(devicesApi.listDevices).not.toHaveBeenCalled();
  });
});
