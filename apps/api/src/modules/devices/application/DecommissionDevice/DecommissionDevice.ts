import { type DeviceView, requireDevice, toDeviceView } from '#modules/devices/application/DeviceView';
import type { IDeviceRepository } from '#modules/devices/domain/IDeviceRepository';

export type DecommissionDeviceCommand = { id: string };

export class DecommissionDevice {
  constructor(private readonly deviceRepository: IDeviceRepository) {}

  async execute({ id }: DecommissionDeviceCommand): Promise<DeviceView> {
    const decommissioned = (await requireDevice(this.deviceRepository, id)).decommission();
    await this.deviceRepository.save(decommissioned);
    return toDeviceView(decommissioned);
  }
}
