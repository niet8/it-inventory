import { describe, expect, it, vi } from 'vitest';

import { UnassignDevice } from '#modules/devices/application/UnassignDevice/UnassignDevice';
import { Device } from '#modules/devices/domain/Device';
import { BusinessRuleViolationError } from '#shared/domain/DomainError';

const device = (employeeId: string | null) =>
  Device.rehydrate({ id: 'd-1', name: 'Laptop', code: null, notes: null, employeeId, decommissionedAt: null });

const repository = (found: Device) => ({
  findById: vi.fn().mockResolvedValue(found),
  createMany: vi.fn(),
  save: vi.fn().mockResolvedValue(undefined),
  assignIfAvailable: vi.fn(),
  delete: vi.fn(),
  list: vi.fn(),
  countByStatus: vi.fn(),
});

describe('UnassignDevice', () => {
  it('returns the device to stock', async () => {
    const deviceRepository = repository(device('e-1'));

    const view = await new UnassignDevice(deviceRepository).execute({ id: 'd-1' });

    expect(view).toMatchObject({ employeeId: null, status: 'available' });
    expect(deviceRepository.save).toHaveBeenCalledOnce();
  });

  it('refuses a device that is not assigned', async () => {
    const deviceRepository = repository(device(null));

    await expect(new UnassignDevice(deviceRepository).execute({ id: 'd-1' })).rejects.toThrow(
      BusinessRuleViolationError,
    );
    expect(deviceRepository.save).not.toHaveBeenCalled();
  });
});
