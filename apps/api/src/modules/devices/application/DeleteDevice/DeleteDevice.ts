import type { IDeviceRepository } from '#modules/devices/domain/IDeviceRepository';
import { NotFoundError } from '#shared/domain/DomainError';

export type DeleteDeviceCommand = { id: string };

export class DeleteDevice {
  constructor(private readonly deviceRepository: IDeviceRepository) {}

  async execute({ id }: DeleteDeviceCommand): Promise<void> {
    const deleted = await this.deviceRepository.delete(id);
    if (!deleted) throw new NotFoundError('Device', id);
  }
}
