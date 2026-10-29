import { type DeviceView, requireDevice, toDeviceView } from '#modules/devices/application/DeviceView';
import type { IDeviceRepository } from '#modules/devices/domain/IDeviceRepository';
import type { IEmployeeLookup } from '#modules/devices/domain/IEmployeeLookup';
import { BusinessRuleViolationError, NotFoundError } from '#shared/domain/DomainError';

export type AssignDeviceCommand = { deviceId: string; employeeId: string };

export class AssignDevice {
  constructor(
    private readonly deviceRepository: IDeviceRepository,
    private readonly employeeLookup: IEmployeeLookup,
  ) {}

  async execute({ deviceId, employeeId }: AssignDeviceCommand): Promise<DeviceView> {
    const device = await requireDevice(this.deviceRepository, deviceId);
    if (!(await this.employeeLookup.exists(employeeId))) throw new NotFoundError('Employee', employeeId);

    // The aggregate explains why it can't be assigned; the conditional write closes the race with another request.
    const assigned = device.assignTo(employeeId);
    if (!(await this.deviceRepository.assignIfAvailable(deviceId, employeeId))) {
      throw new BusinessRuleViolationError(`Device ${deviceId} is no longer available`);
    }
    return toDeviceView(assigned);
  }
}
