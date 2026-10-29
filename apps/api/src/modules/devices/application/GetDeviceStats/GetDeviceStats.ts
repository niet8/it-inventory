import type { DeviceCounts, IDeviceRepository } from '#modules/devices/domain/IDeviceRepository';

export type GetDeviceStatsResponse = DeviceCounts;

export class GetDeviceStats {
  constructor(private readonly deviceRepository: IDeviceRepository) {}

  execute(): Promise<GetDeviceStatsResponse> {
    return this.deviceRepository.countByStatus();
  }
}
