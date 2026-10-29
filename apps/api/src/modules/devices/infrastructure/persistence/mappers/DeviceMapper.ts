import type { Device as DeviceRow } from '#generated/prisma/client';
import { Device } from '#modules/devices/domain/Device';

export type DeviceRecord = Pick<DeviceRow, 'id' | 'name' | 'code' | 'notes' | 'employeeId' | 'decommissionedAt'>;

// Status is not persisted: it is derived by the aggregate from employeeId and decommissionedAt.
export const DeviceMapper = {
  toDomain: (row: DeviceRecord): Device =>
    Device.rehydrate({
      id: row.id,
      name: row.name,
      code: row.code,
      notes: row.notes,
      employeeId: row.employeeId,
      decommissionedAt: row.decommissionedAt,
    }),

  toPersistence: (device: Device): DeviceRecord => ({
    id: device.id,
    name: device.name,
    code: device.code,
    notes: device.notes,
    employeeId: device.employeeId,
    decommissionedAt: device.decommissionedAt,
  }),
};
