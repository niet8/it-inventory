import { type DeviceView, toDeviceView } from '#modules/devices/application/DeviceView';
import { Device } from '#modules/devices/domain/Device';
import type { IDeviceRepository } from '#modules/devices/domain/IDeviceRepository';
import { sequentialCodes } from '#modules/devices/domain/sequential-codes';

export type CreateDevicesCommand = {
  name: string;
  code?: string | undefined;
  notes?: string | undefined;
  quantity: number;
};

export class CreateDevices {
  constructor(private readonly deviceRepository: IDeviceRepository) {}

  async execute({ name, code, notes, quantity }: CreateDevicesCommand): Promise<DeviceView[]> {
    const codes = code ? sequentialCodes(code, quantity) : Array.from({ length: quantity }, () => null);
    const devices = codes.map((deviceCode) => Device.create({ name, code: deviceCode, notes }));
    await this.deviceRepository.createMany(devices);
    return devices.map(toDeviceView);
  }
}
