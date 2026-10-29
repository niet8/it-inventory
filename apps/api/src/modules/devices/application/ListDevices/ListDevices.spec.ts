import { describe, expect, it, vi } from 'vitest';

import { ListDevices } from '#modules/devices/application/ListDevices/ListDevices';
import { Device } from '#modules/devices/domain/Device';

describe('ListDevices', () => {
  it('passes the filters through and returns a page of views', async () => {
    const device = Device.rehydrate({
      id: 'd-1',
      name: 'Laptop',
      code: null,
      notes: null,
      employeeId: null,
      decommissionedAt: new Date('2026-02-03T04:05:06.000Z'),
    });
    const list = vi.fn().mockResolvedValue({ items: [device], total: 1 });
    const query = { page: 1, limit: 20, status: 'decommissioned' as const };

    const page = await new ListDevices({
      findById: vi.fn(),
      createMany: vi.fn(),
      save: vi.fn(),
      assignIfAvailable: vi.fn(),
      delete: vi.fn(),
      list,
      countByStatus: vi.fn(),
    }).execute(query);

    expect(list).toHaveBeenCalledWith(query);
    expect(page).toMatchObject({ total: 1, page: 1, limit: 20 });
    expect(page.items[0]).toMatchObject({ status: 'decommissioned', decommissionedAt: '2026-02-03T04:05:06.000Z' });
  });
});
