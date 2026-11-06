import { type DeviceView, requireDevice, toDeviceView } from '#modules/devices/application/DeviceView';
import type { IDeviceRepository } from '#modules/devices/domain/IDeviceRepository';

export type ReactivateDeviceCommand = { id: string };

export class ReactivateDevice {
  constructor(private readonly deviceRepository: IDeviceRepository) {}

  async execute({ id }: ReactivateDeviceCommand): Promise<DeviceView> {
    const reactivated = (await requireDevice(this.deviceRepository, id)).reactivate();
    await this.deviceRepository.save(reactivated);
    return toDeviceView(reactivated);
  }
}
