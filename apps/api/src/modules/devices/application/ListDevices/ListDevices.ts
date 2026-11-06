import { type DevicePageView, toDeviceView } from '#modules/devices/application/DeviceView';
import type { DeviceListQuery, IDeviceRepository } from '#modules/devices/domain/IDeviceRepository';

export type ListDevicesQuery = DeviceListQuery;

export class ListDevices {
  constructor(private readonly deviceRepository: IDeviceRepository) {}

  async execute(query: ListDevicesQuery): Promise<DevicePageView> {
    const { items, total } = await this.deviceRepository.list(query);
    return { items: items.map(toDeviceView), total, page: query.page, limit: query.limit };
  }
}
