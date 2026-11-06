import type { Device, Employee } from '@it-inventory/contracts';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as devicesApi from '@/features/devices/api/devicesApi';
import { AssignDeviceDialog } from '@/features/devices/components/AssignDeviceDialog';
import { renderWithQueryClient } from '@/features/devices/testing/renderWithQueryClient';
import * as employeesApi from '@/features/employees/api/employeesApi';

vi.mock('@/features/devices/api/devicesApi');
vi.mock('@/features/employees/api/employeesApi', async (importOriginal) => ({
  ...(await importOriginal<typeof employeesApi>()),
  listEmployees: vi.fn(),
}));

const device: Device = {
  id: '6f1c2b1e-1d2a-4c3b-9a8e-000000000001',
  name: 'Laptop 14"',
  code: 'LAP-003',
  notes: null,
  status: 'available',
  employeeId: null,
  decommissionedAt: null,
};

const employees: Employee[] = [
  { id: 'e0000000-0000-4000-8000-000000000001', fullName: 'Ada Example', email: null, department: 'Design' },
  {
    id: 'e0000000-0000-4000-8000-000000000002',
    fullName: 'Bruno Sample',
    email: 'bruno@example.com',
    department: null,
  },
];

beforeEach(() => {
  vi.mocked(employeesApi.listEmployees).mockImplementation(async ({ search }) => {
    const items = search ? employees.filter((e) => e.fullName.toLowerCase().includes(search.toLowerCase())) : employees;
    return { items, total: items.length, page: 1, limit: 8 };
  });
});

afterEach(() => {
  vi.resetAllMocks();
});

describe('AssignDeviceDialog', () => {
  it('assigns the device to the chosen employee and closes', async () => {
    vi.mocked(devicesApi.assignDevice).mockResolvedValue({ ...device, status: 'in_use' });
    const onClose = vi.fn();
    renderWithQueryClient(<AssignDeviceDialog device={device} onClose={onClose} />);

    const assign = screen.getByRole('button', { name: 'Assign' });
    expect(assign).toBeDisabled();

    await userEvent.click(await screen.findByRole('button', { name: /Bruno Sample/ }));
    await userEvent.click(assign);

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(vi.mocked(devicesApi.assignDevice).mock.calls[0]?.[0]).toEqual({
      id: device.id,
      employeeId: employees[1]?.id,
    });
  });

  it('searches employees through the API', async () => {
    renderWithQueryClient(<AssignDeviceDialog device={device} onClose={vi.fn()} />);
    await screen.findByRole('button', { name: /Ada Example/ });

    await userEvent.type(screen.getByLabelText('Search employees'), 'bru');

    await waitFor(() => expect(screen.queryByRole('button', { name: /Ada Example/ })).not.toBeInTheDocument());
    expect(screen.getByRole('button', { name: /Bruno Sample/ })).toBeInTheDocument();
    expect(employeesApi.listEmployees).toHaveBeenLastCalledWith({ search: 'bru', limit: 8 }, expect.anything());
  });

  it('says so when nobody matches', async () => {
    renderWithQueryClient(<AssignDeviceDialog device={device} onClose={vi.fn()} />);

    await userEvent.type(screen.getByLabelText('Search employees'), 'zzz');

    expect(await screen.findByText('No employees match.')).toBeInTheDocument();
  });
});
