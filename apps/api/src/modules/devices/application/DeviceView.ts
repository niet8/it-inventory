import type { Device, DeviceStatus } from '#modules/devices/domain/Device';
import type { IDeviceRepository } from '#modules/devices/domain/IDeviceRepository';
import { NotFoundError } from '#shared/domain/DomainError';

// Output DTO shared by every devices use case: plain data, never the aggregate.
export type DeviceView = {
  id: string;
  name: string;
  code: string | null;
  notes: string | null;
  status: DeviceStatus;
  employeeId: string | null;
  decommissionedAt: string | null;
};

export type DevicePageView = { items: DeviceView[]; total: number; page: number; limit: number };

export const toDeviceView = (device: Device): DeviceView => ({
  id: device.id,
  name: device.name,
  code: device.code,
  notes: device.notes,
  status: device.status,
  employeeId: device.employeeId,
  decommissionedAt: device.decommissionedAt?.toISOString() ?? null,
});

export const requireDevice = async (deviceRepository: IDeviceRepository, id: string): Promise<Device> => {
  const device = await deviceRepository.findById(id);
  if (!device) throw new NotFoundError('Device', id);
  return device;
};
