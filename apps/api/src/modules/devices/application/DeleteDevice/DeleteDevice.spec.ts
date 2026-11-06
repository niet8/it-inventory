import { describe, expect, it, vi } from 'vitest';

import { DeleteDevice } from '#modules/devices/application/DeleteDevice/DeleteDevice';
import { NotFoundError } from '#shared/domain/DomainError';

const repository = (deleted: boolean) => ({
  findById: vi.fn(),
  createMany: vi.fn(),
  save: vi.fn(),
  assignIfAvailable: vi.fn(),
  delete: vi.fn().mockResolvedValue(deleted),
  list: vi.fn(),
  countByStatus: vi.fn(),
});

describe('DeleteDevice', () => {
  it('deletes an existing device', async () => {
    const deviceRepository = repository(true);

    await new DeleteDevice(deviceRepository).execute({ id: 'd-1' });

    expect(deviceRepository.delete).toHaveBeenCalledWith('d-1');
  });

  it('fails for an unknown device', async () => {
    await expect(new DeleteDevice(repository(false)).execute({ id: 'x' })).rejects.toThrow(NotFoundError);
  });
});
