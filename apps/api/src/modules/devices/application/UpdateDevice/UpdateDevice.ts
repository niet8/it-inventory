import { type DeviceView, requireDevice, toDeviceView } from '#modules/devices/application/DeviceView';
import type { DeviceChanges } from '#modules/devices/domain/Device';
import type { IDeviceRepository } from '#modules/devices/domain/IDeviceRepository';

export type UpdateDeviceCommand = { id: string; changes: DeviceChanges };

export class UpdateDevice {
  constructor(private readonly deviceRepository: IDeviceRepository) {}

  async execute({ id, changes }: UpdateDeviceCommand): Promise<DeviceView> {
    const updated = (await requireDevice(this.deviceRepository, id)).update(changes);
    await this.deviceRepository.save(updated);
    return toDeviceView(updated);
  }
}
