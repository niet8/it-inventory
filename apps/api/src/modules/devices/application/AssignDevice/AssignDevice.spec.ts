import { describe, expect, it, vi } from 'vitest';

import { AssignDevice } from '#modules/devices/application/AssignDevice/AssignDevice';
import { Device } from '#modules/devices/domain/Device';
import { BusinessRuleViolationError, NotFoundError } from '#shared/domain/DomainError';

const available = Device.rehydrate({
  id: 'd-1',
  name: 'Laptop',
  code: 'LAP-001',
  notes: null,
  employeeId: null,
  decommissionedAt: null,
});

const setup = ({ device = available as Device | null, employeeExists = true, writeWins = true } = {}) => {
  const deviceRepository = {
    findById: vi.fn().mockResolvedValue(device),
    createMany: vi.fn(),
    save: vi.fn(),
    assignIfAvailable: vi.fn().mockResolvedValue(writeWins),
    delete: vi.fn(),
    list: vi.fn(),
    countByStatus: vi.fn(),
  };
  const employeeLookup = { exists: vi.fn().mockResolvedValue(employeeExists) };
  return { deviceRepository, useCase: new AssignDevice(deviceRepository, employeeLookup) };
};

describe('AssignDevice', () => {
  it('assigns an available device to an existing employee', async () => {
    const { deviceRepository, useCase } = setup();

    const view = await useCase.execute({ deviceId: 'd-1', employeeId: 'e-1' });

    expect(view).toMatchObject({ id: 'd-1', employeeId: 'e-1', status: 'in_use' });
    expect(deviceRepository.assignIfAvailable).toHaveBeenCalledWith('d-1', 'e-1');
  });

  it('fails for an unknown device or employee', async () => {
    await expect(setup({ device: null }).useCase.execute({ deviceId: 'x', employeeId: 'e-1' })).rejects.toThrow(
      NotFoundError,
    );
    await expect(
      setup({ employeeExists: false }).useCase.execute({ deviceId: 'd-1', employeeId: 'x' }),
    ).rejects.toThrow(/Employee x not found/);
  });

  it('refuses a device that is not available without writing', async () => {
    const { deviceRepository, useCase } = setup({ device: available.decommission() });

    await expect(useCase.execute({ deviceId: 'd-1', employeeId: 'e-1' })).rejects.toThrow(BusinessRuleViolationError);
    expect(deviceRepository.assignIfAvailable).not.toHaveBeenCalled();
  });

  it('reports a lost race when another request assigned it first', async () => {
    const { useCase } = setup({ writeWins: false });

    await expect(useCase.execute({ deviceId: 'd-1', employeeId: 'e-1' })).rejects.toThrow(/no longer available/);
  });
});
