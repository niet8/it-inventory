import { describe, expect, it, vi } from 'vitest';

import { GetDeviceStats } from '#modules/devices/application/GetDeviceStats/GetDeviceStats';

describe('GetDeviceStats', () => {
  it('returns the counts by status', async () => {
    const counts = { total: 5, available: 2, inUse: 2, decommissioned: 1 };
    const countByStatus = vi.fn().mockResolvedValue(counts);

    const stats = await new GetDeviceStats({
      findById: vi.fn(),
      createMany: vi.fn(),
      save: vi.fn(),
      assignIfAvailable: vi.fn(),
      delete: vi.fn(),
      list: vi.fn(),
      countByStatus,
    }).execute();

    expect(stats).toEqual(counts);
  });
});
