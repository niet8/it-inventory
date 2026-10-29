import { describe, expect, it, vi } from 'vitest';

import { ReactivateDevice } from '#modules/devices/application/ReactivateDevice/ReactivateDevice';
import { Device } from '#modules/devices/domain/Device';
import { BusinessRuleViolationError } from '#shared/domain/DomainError';

const device = (decommissionedAt: Date | null) =>
  Device.rehydrate({ id: 'd-1', name: 'Laptop', code: null, notes: null, employeeId: null, decommissionedAt });

const repository = (found: Device) => ({
  findById: vi.fn().mockResolvedValue(found),
  createMany: vi.fn(),
  save: vi.fn().mockResolvedValue(undefined),
  assignIfAvailable: vi.fn(),
  delete: vi.fn(),
  list: vi.fn(),
  countByStatus: vi.fn(),
});

describe('ReactivateDevice', () => {
  it('returns a decommissioned device to stock', async () => {
    const view = await new ReactivateDevice(repository(device(new Date()))).execute({ id: 'd-1' });

    expect(view).toMatchObject({ status: 'available', decommissionedAt: null });
  });

  it('refuses a device that is not decommissioned', async () => {
    await expect(new ReactivateDevice(repository(device(null))).execute({ id: 'd-1' })).rejects.toThrow(
      BusinessRuleViolationError,
    );
  });
});
