import type { Device, DeviceStatus } from '#modules/devices/domain/Device';

export type DeviceListQuery = {
  page: number;
  limit: number;
  status?: DeviceStatus | undefined;
  search?: string | undefined;
  employeeIds?: string[] | undefined;
};

export type DevicePage = { items: Device[]; total: number };

export type DeviceCounts = { total: number; available: number; inUse: number; decommissioned: number };

export interface IDeviceRepository {
  findById(id: string): Promise<Device | null>;
  // All or nothing. ConflictError when one of the codes is already taken.
  createMany(devices: Device[]): Promise<void>;
  // Persists a loaded device. NotFoundError if it was deleted meanwhile, ConflictError on a code clash.
  save(device: Device): Promise<void>;
  // Atomic: assigns only if the device is still available, so two concurrent assignments can't both win.
  // NotFoundError if the employee was deleted meanwhile.
  assignIfAvailable(deviceId: string, employeeId: string): Promise<boolean>;
  delete(id: string): Promise<boolean>;
  list(query: DeviceListQuery): Promise<DevicePage>;
  countByStatus(): Promise<DeviceCounts>;
}
