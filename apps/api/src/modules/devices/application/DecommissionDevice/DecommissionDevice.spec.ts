import { describe, expect, it, vi } from 'vitest';

import { DecommissionDevice } from '#modules/devices/application/DecommissionDevice/DecommissionDevice';
import { Device } from '#modules/devices/domain/Device';
import { BusinessRuleViolationError } from '#shared/domain/DomainError';

const device = (decommissionedAt: Date | null) =>
  Device.rehydrate({
    id: 'd-1',
    name: 'Laptop',
    code: null,
    notes: null,
    employeeId: decommissionedAt ? null : 'e-1',
    decommissionedAt,
  });

const repository = (found: Device) => ({
  findById: vi.fn().mockResolvedValue(found),
  createMany: vi.fn(),
  save: vi.fn().mockResolvedValue(undefined),
  assignIfAvailable: vi.fn(),
  delete: vi.fn(),
  list: vi.fn(),
  countByStatus: vi.fn(),
});

describe('DecommissionDevice', () => {
  it('releases the employee and records the decommission date', async () => {
    const deviceRepository = repository(device(null));

    const view = await new DecommissionDevice(deviceRepository).execute({ id: 'd-1' });

    expect(view).toMatchObject({ employeeId: null, status: 'decommissioned', decommissionedAt: expect.any(String) });
    expect(deviceRepository.save).toHaveBeenCalledOnce();
  });

  it('keeps the original date of an already decommissioned device', async () => {
    const deviceRepository = repository(device(new Date('2026-01-01T00:00:00Z')));

    await expect(new DecommissionDevice(deviceRepository).execute({ id: 'd-1' })).rejects.toThrow(
      BusinessRuleViolationError,
    );
    expect(deviceRepository.save).not.toHaveBeenCalled();
  });
});
