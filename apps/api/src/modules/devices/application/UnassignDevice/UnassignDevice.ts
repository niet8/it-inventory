import { type DeviceView, requireDevice, toDeviceView } from '#modules/devices/application/DeviceView';
import type { IDeviceRepository } from '#modules/devices/domain/IDeviceRepository';

export type UnassignDeviceCommand = { id: string };

export class UnassignDevice {
  constructor(private readonly deviceRepository: IDeviceRepository) {}

  async execute({ id }: UnassignDeviceCommand): Promise<DeviceView> {
    const unassigned = (await requireDevice(this.deviceRepository, id)).unassign();
    await this.deviceRepository.save(unassigned);
    return toDeviceView(unassigned);
  }
}
