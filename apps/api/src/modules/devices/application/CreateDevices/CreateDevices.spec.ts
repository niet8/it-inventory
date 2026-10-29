import { describe, expect, it, vi } from 'vitest';

import { CreateDevices } from '#modules/devices/application/CreateDevices/CreateDevices';
import { ConflictError } from '#shared/domain/DomainError';

const repository = () => ({
  findById: vi.fn(),
  createMany: vi.fn().mockResolvedValue(undefined),
  save: vi.fn(),
  assignIfAvailable: vi.fn(),
  delete: vi.fn(),
  list: vi.fn(),
  countByStatus: vi.fn(),
});

describe('CreateDevices', () => {
  it('creates a batch with sequential codes in a single write', async () => {
    const deviceRepository = repository();

    const views = await new CreateDevices(deviceRepository).execute({ name: 'Laptop', code: 'LAP-009', quantity: 2 });

    expect(views.map((v) => [v.code, v.status])).toEqual([
      ['LAP-009', 'available'],
      ['LAP-010', 'available'],
    ]);
    expect(deviceRepository.createMany).toHaveBeenCalledOnce();
    expect(deviceRepository.createMany.mock.calls[0]?.[0]).toHaveLength(2);
  });

  it('creates devices without code when none is given', async () => {
    const views = await new CreateDevices(repository()).execute({ name: 'Mouse', notes: 'Wireless', quantity: 3 });

    expect(views).toHaveLength(3);
    expect(views.every((v) => v.code === null && v.notes === 'Wireless')).toBe(true);
  });

  it('propagates a code clash from the repository', async () => {
    const deviceRepository = repository();
    deviceRepository.createMany.mockRejectedValue(new ConflictError('Device code already in use'));

    await expect(
      new CreateDevices(deviceRepository).execute({ name: 'Laptop', code: 'LAP-001', quantity: 1 }),
    ).rejects.toThrow(ConflictError);
  });
});
