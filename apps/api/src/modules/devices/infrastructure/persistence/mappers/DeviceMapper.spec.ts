import { describe, expect, it } from 'vitest';

import { DeviceMapper } from '#modules/devices/infrastructure/persistence/mappers/DeviceMapper';

describe('DeviceMapper', () => {
  it('round-trips a device and derives its status', () => {
    const record = {
      id: 'd-1',
      name: 'Laptop',
      code: 'LAP-001',
      notes: null,
      employeeId: 'e-1',
      decommissionedAt: null,
    };

    const device = DeviceMapper.toDomain(record);

    expect(device.status).toBe('in_use');
    expect(DeviceMapper.toPersistence(device)).toEqual(record);
  });
});
