import { describe, expect, it, vi } from 'vitest';

import { UpdateDevice } from '#modules/devices/application/UpdateDevice/UpdateDevice';
import { Device } from '#modules/devices/domain/Device';
import { NotFoundError } from '#shared/domain/DomainError';

const stored = Device.rehydrate({
  id: 'd-1',
  name: 'Laptop',
  code: 'LAP-001',
  notes: null,
  employeeId: 'e-1',
  decommissionedAt: null,
});

const repository = (found: Device | null) => ({
  findById: vi.fn().mockResolvedValue(found),
  createMany: vi.fn(),
  save: vi.fn().mockResolvedValue(undefined),
  assignIfAvailable: vi.fn(),
  delete: vi.fn(),
  list: vi.fn(),
  countByStatus: vi.fn(),
});

describe('UpdateDevice', () => {
  it('saves the descriptive changes and keeps the assignment', async () => {
    const deviceRepository = repository(stored);

    const view = await new UpdateDevice(deviceRepository).execute({ id: 'd-1', changes: { notes: 'New battery' } });

    expect(view).toMatchObject({ notes: 'New battery', employeeId: 'e-1', status: 'in_use' });
    expect(deviceRepository.save).toHaveBeenCalledOnce();
  });

  it('fails for an unknown device', async () => {
    await expect(new UpdateDevice(repository(null)).execute({ id: 'x', changes: {} })).rejects.toThrow(NotFoundError);
  });
});
