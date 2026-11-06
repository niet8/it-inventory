import type { Device } from '@it-inventory/contracts';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as devicesApi from '@/features/devices/api/devicesApi';
import { DeviceFormDialog } from '@/features/devices/components/DeviceFormDialog';
import { renderWithQueryClient } from '@/features/devices/testing/renderWithQueryClient';

vi.mock('@/features/devices/api/devicesApi');

const device: Device = {
  id: '6f1c2b1e-1d2a-4c3b-9a8e-000000000001',
  name: 'Laptop 14"',
  code: 'LAP-003',
  notes: null,
  status: 'available',
  employeeId: null,
  decommissionedAt: null,
};

const renderDialog = (props: { device?: Device } = {}) => {
  const onOpenChange = vi.fn();
  renderWithQueryClient(<DeviceFormDialog open onOpenChange={onOpenChange} {...props} />);
  return { onOpenChange };
};

afterEach(() => {
  vi.resetAllMocks();
});

describe('DeviceFormDialog', () => {
  it('previews the codes of a batch as quantity changes', async () => {
    renderDialog();

    await userEvent.type(screen.getByLabelText('Code'), 'LAP-009');
    expect(screen.queryByText(/Codes:/)).not.toBeInTheDocument();

    const quantity = screen.getByLabelText('Quantity');
    await userEvent.clear(quantity);
    await userEvent.type(quantity, '2');

    expect(screen.getByText('Codes: LAP-009 → LAP-010')).toBeInTheDocument();
  });

  it('creates a batch with the trimmed fields and closes', async () => {
    vi.mocked(devicesApi.createDevices).mockResolvedValue([device, device, device]);
    const { onOpenChange } = renderDialog();

    await userEvent.type(screen.getByLabelText('Name'), '  Monitor 27"  ');
    await userEvent.type(screen.getByLabelText('Code'), 'MON-001');
    await userEvent.clear(screen.getByLabelText('Quantity'));
    await userEvent.type(screen.getByLabelText('Quantity'), '3');
    await userEvent.click(screen.getByRole('button', { name: 'Add' }));

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    expect(vi.mocked(devicesApi.createDevices).mock.calls[0]?.[0]).toEqual({
      name: 'Monitor 27"',
      code: 'MON-001',
      quantity: 3,
    });
  });

  it('blocks submitting without a name or with an out-of-range quantity', async () => {
    renderDialog();
    const submit = screen.getByRole('button', { name: 'Add' });
    expect(submit).toBeDisabled();

    await userEvent.type(screen.getByLabelText('Name'), 'Dock');
    expect(submit).toBeEnabled();

    await userEvent.clear(screen.getByLabelText('Quantity'));
    await userEvent.type(screen.getByLabelText('Quantity'), '51');
    expect(submit).toBeDisabled();
  });

  it('edits a device, sending null for cleared fields', async () => {
    vi.mocked(devicesApi.updateDevice).mockResolvedValue(device);
    const { onOpenChange } = renderDialog({ device });

    expect(screen.queryByLabelText('Quantity')).not.toBeInTheDocument();
    await userEvent.clear(screen.getByLabelText('Code'));
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    expect(vi.mocked(devicesApi.updateDevice).mock.calls[0]?.[0]).toEqual({
      id: device.id,
      body: { name: 'Laptop 14"', code: null, notes: null },
    });
  });

  it('keeps the dialog open when the API rejects', async () => {
    vi.mocked(devicesApi.createDevices).mockRejectedValue(new Error('Code already exists'));
    const { onOpenChange } = renderDialog();

    await userEvent.type(screen.getByLabelText('Name'), 'Dock');
    await userEvent.click(screen.getByRole('button', { name: 'Add' }));

    await waitFor(() => expect(devicesApi.createDevices).toHaveBeenCalled());
    expect(onOpenChange).not.toHaveBeenCalled();
  });
});
